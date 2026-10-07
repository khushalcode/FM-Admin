/**
 * POST /api/orders/create
 * Create a new order.
 *
 * Body:
 *   { store_id, items: [{product_id, quantity, addons?, note?}], address_id,
 *     payment_method, coupon_id?, note?, scheduled_at? }
 *
 * Flow:
 *   1. Verify cart items belong to one store
 *   2. Compute subtotal, delivery_fee, discount, tax, total
 *   3. Apply coupon if valid
 *   4. Insert order + order_items
 *   5. Decrement product stock
 *   6. Clear cart
 *   7. Send FCM to vendor + admin
 *   8. If payment_method=online → return Razorpay order details
 */
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/server/auth'
import { getSupabaseServer } from '@/lib/server/supabase-server'
import { notifyOrderPlaced } from '@/lib/server/notifications'
import { createRazorpayOrder } from '@/lib/server/payments'

export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseServer()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await req.json()
    const { store_id, items, address_id, payment_method, coupon_id, note, scheduled_at } = body

    if (!store_id || !items || !items.length || !address_id || !payment_method) {
      return NextResponse.json(
        { error: 'Missing: store_id, items, address_id, payment_method' },
        { status: 400 }
      )
    }

    // 1. Get customer ID
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.firebase_uid)
      .single()
    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 })
    }

    // 2. Get store + vendor
    const { data: store } = await supabase
      .from('stores')
      .select('id, name, vendor_id, module_type, minimum_order, delivery_fee, is_open, is_active')
      .eq('id', store_id)
      .single()
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }
    if (!store.is_active || !store.is_open) {
      return NextResponse.json({ error: 'Store is closed' }, { status: 400 })
    }

    // 3. Get address
    const { data: address } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', address_id)
      .eq('customer_id', customer.id)
      .single()
    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    // 4. Validate items + compute subtotal
    let subtotal = 0
    const orderItems = []
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('id, name, price, discount_price, unit, stock, is_available, module_type')
        .eq('id', item.product_id)
        .eq('store_id', store_id)
        .single()
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.product_id} not found in store` },
          { status: 400 }
        )
      }
      if (!product.is_available || product.stock < item.quantity) {
        return NextResponse.json(
          { error: `${product.name} is unavailable or out of stock` },
          { status: 400 }
        )
      }
      const unitPrice = product.discount_price ?? product.price
      subtotal += unitPrice * item.quantity
      orderItems.push({
        product_id: product.id,
        name: product.name,
        image_url: null,  // fetched separately if needed
        unit: product.unit,
        price: unitPrice,
        quantity: item.quantity,
        module_type: product.module_type,
        store_id: store.id,
        store_name: store.name,
        addons: item.addons || [],
      })
    }

    // 5. Check minimum order
    if (subtotal < store.minimum_order) {
      return NextResponse.json(
        { error: `Minimum order is ₹${store.minimum_order}` },
        { status: 400 }
      )
    }

    // 6. Apply coupon
    let discount = 0
    if (coupon_id) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('id', coupon_id)
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .single()
      if (coupon) {
        if (coupon.module_type === store.module_type || coupon.applies_to_all) {
          if (subtotal >= coupon.minimum_order) {
            if (coupon.discount_type === 'percentage') {
              discount = (subtotal * coupon.discount_value) / 100
              if (coupon.maximum_discount && discount > coupon.maximum_discount) {
                discount = coupon.maximum_discount
              }
            } else {
              discount = coupon.discount_value
            }
          }
        }
      }
    }

    // 7. Compute totals
    const deliveryFee = store.delivery_fee
    const tax = Math.round(subtotal * 0.05 * 100) / 100  // 5% GST
    const total = subtotal + deliveryFee - discount + tax
    const deliveryEarnings = Math.round(deliveryFee * 0.7 * 100) / 100  // 70% to delivery, 30% platform

    // 8. Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customer.id,
        store_id: store.id,
        vendor_id: store.vendor_id,
        module_type: store.module_type,
        item_count: items.reduce((s: number, i: any) => s + i.quantity, 0),
        subtotal,
        delivery_fee: deliveryFee,
        discount,
        tax,
        total,
        delivery_earnings: deliveryEarnings,
        payment_method,
        payment_status: payment_method === 'cash' ? 'pending' : 'pending',
        status: 'pending',
        delivery_address: `${address.full_address}${address.landmark ? `, ${address.landmark}` : ''}`,
        delivery_latitude: address.latitude,
        delivery_longitude: address.longitude,
        note,
        scheduled_at: scheduled_at || null,
        coupon_id: coupon_id || null,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('[orders/create] insert failed:', orderError)
      return NextResponse.json({ error: orderError?.message || 'Failed to create order' }, { status: 500 })
    }

    // 9. Insert order items
    const orderItemsInsert = orderItems.map((it) => ({
      ...it,
      order_id: order.id,
    }))
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsInsert)
    if (itemsError) {
      console.error('[orders/create] items insert failed:', itemsError)
    }

    // 10. Decrement stock
    for (const item of items) {
      await supabase.rpc('decrement_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      })
    }

    // 11. Clear cart
    await supabase
      .from('cart_items')
      .delete()
      .eq('customer_id', customer.id)

    // 12. Insert order status history
    await supabase.from('order_status_history').insert({
      order_id: order.id,
      status: 'pending',
      changed_by: user.dbUser?.id,
    })

    // 13. Send notifications (fire and forget)
    notifyOrderPlaced({
      id: order.id,
      order_code: order.order_code,
      store_id: store.id,
      vendor_id: store.vendor_id,
      customer_name: user.dbUser?.full_name || 'Customer',
      total,
      module_type: store.module_type,
    }).catch((e) => console.error('[orders/create] notification failed:', e))

    // 14. If online payment, create Razorpay order
    let payment = null
    if (payment_method === 'online') {
      const rpOrder = await createRazorpayOrder({
        amount: total,
        receipt: order.id,
        notes: { order_code: order.order_code },
      })
      if (rpOrder.success) {
        await supabase.from('payments').insert({
          order_id: order.id,
          customer_id: customer.id,
          provider: 'razorpay',
          provider_order_id: rpOrder.razorpay_order_id,
          amount: total,
          status: 'pending',
        })
        payment = rpOrder
      }
    }

    return NextResponse.json({
      success: true,
      order,
      payment,
    })
  } catch (e: any) {
    console.error('[orders/create] error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

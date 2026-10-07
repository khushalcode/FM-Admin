/**
 * Mock / seed data for the Food Munch admin.
 *
 * Single unified food app — no module_type split.
 *
 * The admin-data layer hydrates from this seed on first load and persists
 * all CRUD operations to localStorage; when Supabase is configured it
 * reads/writes through to the real database instead.
 */
import {
  Banner,
  Category,
  Coupon,
  Customer,
  DashboardStats,
  DeliveryArea,
  DeliveryMan,
  Notification,
  Order,
  OrderStatus,
  Product,
  RevenuePoint,
  Store,
  Vendor,
  WalletTransaction,
  AppSettings,
} from './types'

// ---------- Helpers ----------

const today = new Date()
const iso = (daysAgo: number, hoursAgo = 0) => {
  const d = new Date(today)
  d.setDate(d.getDate() - daysAgo)
  d.setHours(d.getHours() - hoursAgo)
  return d.toISOString()
}

function rid(prefix: string, n: number) {
  return `${prefix}_${n}`
}

// ---------- Stores ----------

export const stores: Store[] = [
  {
    id: 'store_1', name: 'Spice Garden Restaurant', slug: 'spice-garden',
    description: 'Authentic Indian cuisine, freshly prepared.',
    address: '12 MG Road, Bangalore', latitude: 12.9716, longitude: 77.5946,
    phone: '+91 80 1234 5678', email: 'orders@spicegarden.com',
    vendor_id: 'vendor_1', is_active: true, is_open: true,
    rating: 4.6, reviews_count: 1240, minimum_order: 200,
    delivery_fee: 30, delivery_time_minutes: 35, commission_percentage: 12,
    created_at: iso(120),
  },
  {
    id: 'store_2', name: 'FreshMart Grocery', slug: 'freshmart',
    description: 'Daily groceries, farm-fresh produce.',
    address: '88 Brigade Road, Bangalore', latitude: 12.9698, longitude: 77.6056,
    phone: '+91 80 2345 6789', email: 'hello@freshmart.com',
    vendor_id: 'vendor_2', is_active: true, is_open: true,
    rating: 4.4, reviews_count: 856, minimum_order: 300,
    delivery_fee: 25, delivery_time_minutes: 50, commission_percentage: 8,
    created_at: iso(150),
  },
  {
    id: 'store_3', name: 'Pizza Corner', slug: 'pizza-corner',
    description: 'Wood-fired pizzas & Italian classics.',
    address: '45 Indiranagar, Bangalore', latitude: 12.9719, longitude: 77.6412,
    phone: '+91 80 3456 7890', email: 'care@pizzacorner.com',
    vendor_id: 'vendor_3', is_active: true, is_open: true,
    rating: 4.5, reviews_count: 980, minimum_order: 250,
    delivery_fee: 35, delivery_time_minutes: 40, commission_percentage: 15,
    created_at: iso(95),
  },
  {
    id: 'store_4', name: 'DailyNeeds Supermarket', slug: 'dailyneeds',
    description: 'Household essentials & weekly groceries.',
    address: '7 Koramangala, Bangalore', latitude: 12.9352, longitude: 77.6245,
    phone: '+91 80 4567 8901', email: 'support@dailyneeds.com',
    vendor_id: 'vendor_4', is_active: true, is_open: false,
    rating: 4.2, reviews_count: 612, minimum_order: 350,
    delivery_fee: 20, delivery_time_minutes: 60, commission_percentage: 8,
    created_at: iso(180),
  },
  {
    id: 'store_5', name: 'Burger Barn', slug: 'burger-barn',
    description: 'Gourmet burgers, fries & shakes.',
    address: '22 Jayanagar, Bangalore', latitude: 12.9250, longitude: 77.5938,
    phone: '+91 80 5678 9012', email: 'orders@burgerbarn.com',
    vendor_id: 'vendor_5', is_active: true, is_open: true,
    rating: 4.3, reviews_count: 745, minimum_order: 180,
    delivery_fee: 30, delivery_time_minutes: 30, commission_percentage: 14,
    created_at: iso(70),
  },
  {
    id: 'store_6', name: 'Organic Roots', slug: 'organic-roots',
    description: 'Certified organic produce & groceries.',
    address: '9 HSR Layout, Bangalore', latitude: 12.9116, longitude: 77.6474,
    phone: '+91 80 6789 0123', email: 'care@organicroots.com',
    vendor_id: 'vendor_6', is_active: false, is_open: false,
    rating: 4.7, reviews_count: 423, minimum_order: 400,
    delivery_fee: 40, delivery_time_minutes: 45, commission_percentage: 10,
    created_at: iso(60),
  },
]

// ---------- Delivery Areas (pincode-based) ----------

export const deliveryAreas: DeliveryArea[] = [
  { id: 'da_1', store_id: 'store_1', pincode: '560001', delivery_fee: 30, delivery_time_minutes: 35, is_active: true, created_at: iso(100) },
  { id: 'da_2', store_id: 'store_1', pincode: '560002', delivery_fee: 35, delivery_time_minutes: 40, is_active: true, created_at: iso(100) },
  { id: 'da_3', store_id: 'store_1', pincode: '560008', delivery_fee: 40, delivery_time_minutes: 45, is_active: true, created_at: iso(100) },
  { id: 'da_4', store_id: 'store_2', pincode: '560001', delivery_fee: 25, delivery_time_minutes: 50, is_active: true, created_at: iso(140) },
  { id: 'da_5', store_id: 'store_2', pincode: '560034', delivery_fee: 30, delivery_time_minutes: 55, is_active: true, created_at: iso(140) },
  { id: 'da_6', store_id: 'store_3', pincode: '560038', delivery_fee: 35, delivery_time_minutes: 40, is_active: true, created_at: iso(90) },
  { id: 'da_7', store_id: 'store_3', pincode: '560075', delivery_fee: 40, delivery_time_minutes: 45, is_active: true, created_at: iso(90) },
  { id: 'da_8', store_id: 'store_4', pincode: '560095', delivery_fee: 20, delivery_time_minutes: 60, is_active: true, created_at: iso(170) },
  { id: 'da_9', store_id: 'store_5', pincode: '560011', delivery_fee: 30, delivery_time_minutes: 30, is_active: true, created_at: iso(60) },
  { id: 'da_10', store_id: 'store_6', pincode: '560102', delivery_fee: 40, delivery_time_minutes: 45, is_active: false, created_at: iso(50) },
]

// ---------- Categories ----------

export const categories: Category[] = [
  { id: 'cat_1', name: 'Biryani', slug: 'biryani', position: 1, is_active: true, stores_count: 18, items_count: 96 },
  { id: 'cat_2', name: 'Pizza', slug: 'pizza', position: 2, is_active: true, stores_count: 22, items_count: 134 },
  { id: 'cat_3', name: 'Burgers', slug: 'burgers', position: 3, is_active: true, stores_count: 15, items_count: 78 },
  { id: 'cat_4', name: 'North Indian', slug: 'north-indian', position: 4, is_active: true, stores_count: 34, items_count: 245 },
  { id: 'cat_5', name: 'South Indian', slug: 'south-indian', position: 5, is_active: true, stores_count: 28, items_count: 167 },
  { id: 'cat_6', name: 'Chinese', slug: 'chinese', position: 6, is_active: true, stores_count: 19, items_count: 112 },
  { id: 'cat_7', name: 'Desserts', slug: 'desserts', position: 7, is_active: true, stores_count: 14, items_count: 89 },
  { id: 'cat_8', name: 'Beverages', slug: 'beverages', position: 8, is_active: true, stores_count: 11, items_count: 67 },
  { id: 'cat_9', name: 'Fruits & Vegetables', slug: 'fruits-vegetables', position: 9, is_active: true, stores_count: 25, items_count: 312 },
  { id: 'cat_10', name: 'Dairy & Eggs', slug: 'dairy-eggs', position: 10, is_active: true, stores_count: 18, items_count: 87 },
  { id: 'cat_11', name: 'Atta, Rice & Dal', slug: 'atta-rice-dal', position: 11, is_active: true, stores_count: 22, items_count: 156 },
  { id: 'cat_12', name: 'Snacks & Munchies', slug: 'snacks', position: 12, is_active: true, stores_count: 30, items_count: 234 },
  { id: 'cat_13', name: 'Packaged Beverages', slug: 'packaged-beverages', position: 13, is_active: true, stores_count: 26, items_count: 178 },
  { id: 'cat_14', name: 'Personal Care', slug: 'personal-care', position: 14, is_active: true, stores_count: 16, items_count: 145 },
  { id: 'cat_15', name: 'Household', slug: 'household', position: 15, is_active: true, stores_count: 14, items_count: 92 },
  { id: 'cat_16', name: 'Frozen Foods', slug: 'frozen-foods', position: 16, is_active: true, stores_count: 8, items_count: 64 },
]

// ---------- Products ----------

const productSeeds: Array<Partial<Product> & { name: string; price: number }> = [
  { name: 'Chicken Biryani', price: 220, store_id: 'store_1', category_id: 'cat_1', is_veg: false, prep_time_minutes: 25, unit: 'plate' },
  { name: 'Veg Biryani', price: 180, store_id: 'store_1', category_id: 'cat_1', is_veg: true, prep_time_minutes: 20, unit: 'plate' },
  { name: 'Mutton Biryani', price: 320, store_id: 'store_1', category_id: 'cat_1', is_veg: false, prep_time_minutes: 30, unit: 'plate' },
  { name: 'Margherita Pizza', price: 280, store_id: 'store_3', category_id: 'cat_2', is_veg: true, prep_time_minutes: 18, unit: 'medium' },
  { name: 'Pepperoni Pizza', price: 360, store_id: 'store_3', category_id: 'cat_2', is_veg: false, prep_time_minutes: 18, unit: 'medium' },
  { name: 'Cheese Burger', price: 160, store_id: 'store_5', category_id: 'cat_3', is_veg: false, prep_time_minutes: 12, unit: 'pcs' },
  { name: 'Veg Burger', price: 130, store_id: 'store_5', category_id: 'cat_3', is_veg: true, prep_time_minutes: 10, unit: 'pcs' },
  { name: 'Paneer Butter Masala', price: 240, store_id: 'store_1', category_id: 'cat_4', is_veg: true, prep_time_minutes: 22, unit: 'bowl' },
  { name: 'Butter Naan', price: 50, store_id: 'store_1', category_id: 'cat_4', is_veg: true, prep_time_minutes: 8, unit: 'pcs' },
  { name: 'Masala Dosa', price: 110, store_id: 'store_1', category_id: 'cat_5', is_veg: true, prep_time_minutes: 12, unit: 'plate' },
  { name: 'Gulab Jamun (4 pcs)', price: 90, store_id: 'store_1', category_id: 'cat_7', is_veg: true, prep_time_minutes: 5, unit: 'pack' },
  { name: 'Cold Coffee', price: 120, store_id: 'store_3', category_id: 'cat_8', is_veg: true, prep_time_minutes: 5, unit: 'glass' },
  { name: 'Banana (Robusta)', price: 60, store_id: 'store_2', category_id: 'cat_9', brand: 'FreshMart', unit: 'kg' },
  { name: 'Tomato', price: 40, store_id: 'store_2', category_id: 'cat_9', brand: 'FreshMart', unit: 'kg' },
  { name: 'Onion', price: 35, store_id: 'store_2', category_id: 'cat_9', brand: 'FreshMart', unit: 'kg' },
  { name: 'Apple (Shimla)', price: 180, store_id: 'store_2', category_id: 'cat_9', brand: 'FreshMart', unit: 'kg' },
  { name: 'Amul Milk 1L', price: 64, store_id: 'store_2', category_id: 'cat_10', brand: 'Amul', unit: 'liter' },
  { name: 'Brown Eggs (6 pcs)', price: 75, store_id: 'store_2', category_id: 'cat_10', brand: 'FarmFresh', unit: 'pack' },
  { name: 'Aashirvaad Atta 5kg', price: 290, store_id: 'store_2', category_id: 'cat_11', brand: 'Aashirvaad', unit: 'pack' },
  { name: 'India Gate Basmati 1kg', price: 145, store_id: 'store_2', category_id: 'cat_11', brand: 'India Gate', unit: 'pack' },
  { name: 'Lay\'s Classic 52g', price: 20, store_id: 'store_2', category_id: 'cat_12', brand: "Lay's", unit: 'pack' },
  { name: 'Kurkure Masala 90g', price: 30, store_id: 'store_2', category_id: 'cat_12', brand: 'Kurkure', unit: 'pack' },
  { name: 'Coca-Cola 750ml', price: 38, store_id: 'store_2', category_id: 'cat_13', brand: 'Coca-Cola', unit: 'bottle' },
  { name: 'Red Label Tea 250g', price: 145, store_id: 'store_2', category_id: 'cat_13', brand: 'Red Label', unit: 'pack' },
  { name: 'Colgate Toothpaste 200g', price: 105, store_id: 'store_2', category_id: 'cat_14', brand: 'Colgate', unit: 'pack' },
  { name: 'Surf Excel 1kg', price: 175, store_id: 'store_2', category_id: 'cat_15', brand: 'Surf Excel', unit: 'pack' },
  { name: 'McCain French Fries 500g', price: 145, store_id: 'store_2', category_id: 'cat_16', brand: 'McCain', unit: 'pack' },
]

export const products: Product[] = productSeeds.map((p, i) => ({
  id: rid('prod', i + 1),
  store_id: p.store_id!,
  category_id: p.category_id!,
  name: p.name,
  slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  description: `${p.name} — top quality, sourced fresh.`,
  image_url: undefined,
  images: [],
  price: p.price,
  discount_price: i % 4 === 0 ? Math.round(p.price * 0.85) : null,
  unit: p.unit,
  stock: 50 + (i * 7) % 100,
  is_available: i % 10 !== 0,
  is_featured: i % 5 === 0,
  rating: 4 + ((i * 13) % 10) / 10,
  reviews_count: 20 + (i * 17) % 200,
  tags: ['food'],
  is_veg: p.is_veg,
  prep_time_minutes: p.prep_time_minutes,
  brand: p.brand,
  barcode: p.brand ? `890${1000000 + i * 137}` : undefined,
  created_at: iso(60 - (i % 60)),
}))

// ---------- Customers ----------

const customerNames = [
  'Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Reddy', 'Vikram Singh',
  'Anjali Iyer', 'Rohan Mehta', 'Pooja Nair', 'Karan Malhotra', 'Divya Gupta',
  'Arjun Verma', 'Meera Joshi', 'Sanjay Rao', 'Nisha Agarwal', 'Aditya Shah',
  'Kavya Krishnan', 'Manish Tiwari', 'Ritu Bansal', 'Saurabh Sinha', 'Isha Kapoor',
]
export const customers: Customer[] = customerNames.map((name, i) => ({
  id: rid('cust', i + 1),
  firebase_uid: `mock_uid_${i + 1}`,
  full_name: name,
  email: name.toLowerCase().replace(/[^a-z]+/g, '.') + '@example.com',
  phone: `+91 9${8000000000 + i * 111111}`,
  avatar_url: undefined,
  is_active: i % 12 !== 0,
  is_blocked: i % 12 === 0,
  total_orders: 1 + (i * 7) % 60,
  total_spent: 500 + (i * 487) % 25000,
  wallet_balance: (i * 73) % 1500,
  loyalty_points: (i * 47) % 2400,
  created_at: iso((i * 11) % 200),
}))

// ---------- Vendors ----------

const vendorNames = [
  'Spice Garden Owner', 'FreshMart Owner', 'Pizza Corner Owner',
  'DailyNeeds Owner', 'Burger Barn Owner', 'Organic Roots Owner',
]
export const vendors: Vendor[] = vendorNames.map((name, i) => ({
  id: rid('vendor', i + 1),
  firebase_uid: `mock_vendor_${i + 1}`,
  full_name: name,
  email: name.toLowerCase().replace(/[^a-z]+/g, '.') + '@example.com',
  phone: `+91 9${8100000000 + i * 222222}`,
  avatar_url: undefined,
  store_id: `store_${i + 1}`,
  is_active: i % 5 !== 0,
  is_approved: i % 5 !== 0,
  total_sales: 5000 + (i * 8743) % 95000,
  total_orders: 50 + (i * 73) % 800,
  rating: 4 + ((i * 17) % 8) / 10,
  wallet_balance: 1500 + (i * 421) % 8000,
  created_at: iso(150 - (i * 12) % 100),
}))

// ---------- Delivery Men ----------

const deliveryNames = [
  'Ramesh Kumar', 'Suresh Yadav', 'Mahesh Pandey', 'Ganesh Shetty',
  'Lakshman Rao', 'Anand Iyengar', 'Devesh Bhat', 'Naveen Gowda',
  'Prakash Pillai', 'Mohan Das',
]
export const deliveryMen: DeliveryMan[] = deliveryNames.map((name, i) => ({
  id: rid('dm', i + 1),
  firebase_uid: `mock_dm_${i + 1}`,
  full_name: name,
  email: name.toLowerCase().replace(/[^a-z]+/g, '.') + '@delivery.com',
  phone: `+91 9${8200000000 + i * 333333}`,
  avatar_url: undefined,
  vehicle_type: (['bike', 'scooter', 'cycle', 'car'] as const)[i % 4],
  is_online: i % 3 !== 0,
  is_active: i % 7 !== 0,
  is_approved: i % 7 !== 0,
  rating: 4 + ((i * 19) % 9) / 10,
  total_deliveries: 50 + (i * 137) % 1500,
  current_order_id: i % 4 === 0 ? rid('order', i + 1) : null,
  latitude: 12.97 + (i * 0.005),
  longitude: 77.59 + (i * 0.005),
  wallet_balance: 300 + (i * 217) % 4000,
  created_at: iso(120 - (i * 9) % 80),
}))

// ---------- Orders ----------

const orderStatuses: OrderStatus[] = [
  'pending', 'accepted', 'preparing', 'ready', 'picked_up',
  'on_the_way', 'delivered', 'delivered', 'delivered', 'cancelled',
]

export const orders: Order[] = Array.from({ length: 80 }, (_, i) => {
  const idx = i + 1
  const customer = customers[i % customers.length]
  const store = stores[i % stores.length]
  const status = orderStatuses[i % orderStatuses.length]
  const itemCount = 1 + (i % 5)
  const subtotal = 150 + (i * 87) % 1800
  const deliveryFee = store.delivery_fee
  const discount = i % 4 === 0 ? Math.round(subtotal * 0.1) : 0
  const tax = Math.round(subtotal * 0.05)
  const total = subtotal + deliveryFee - discount + tax
  const items = Array.from({ length: Math.min(itemCount, 3) }, (_, j) => {
    const p = products[(i + j) % products.length]
    return {
      product_id: p.id,
      name: p.name,
      image_url: p.image_url,
      unit: p.unit,
      price: p.discount_price ?? p.price,
      quantity: 1 + (j % 3),
      store_id: store.id,
      store_name: store.name,
    }
  })

  return {
    id: rid('order', idx),
    order_code: `ORD-${1000 + idx}`,
    customer_id: customer.id,
    customer_name: customer.full_name,
    customer_phone: customer.phone,
    store_id: store.id,
    store_name: store.name,
    vendor_id: store.vendor_id,
    delivery_man_id: status !== 'pending' && status !== 'accepted' && status !== 'cancelled'
      ? deliveryMen[i % deliveryMen.length].id : null,
    delivery_man_name: status !== 'pending' && status !== 'accepted' && status !== 'cancelled'
      ? deliveryMen[i % deliveryMen.length].full_name : undefined,
    items,
    item_count: items.reduce((s, it) => s + it.quantity, 0),
    subtotal,
    delivery_fee: deliveryFee,
    discount,
    tax,
    total,
    payment_method: (['cash', 'card', 'wallet', 'online'] as const)[i % 4],
    payment_status: status === 'delivered'
      ? 'paid'
      : status === 'cancelled' || status === 'rejected'
      ? 'failed'
      : 'pending',
    status,
    delivery_address: `${customer.full_name}'s address, ${['MG Road', 'Brigade Road', 'Indiranagar', 'Koramangala', 'Jayanagar'][i % 5]}, Bangalore`,
    delivery_latitude: 12.97 + (i * 0.003),
    delivery_longitude: 77.59 + (i * 0.003),
    note: i % 5 === 0 ? 'Please call before delivery' : undefined,
    scheduled_at: i % 6 === 0 ? iso(-1) : null,
    accepted_at: status !== 'pending' ? iso(0, 1) : null,
    picked_up_at: ['picked_up', 'on_the_way', 'delivered'].includes(status) ? iso(0, 0.5) : null,
    delivered_at: status === 'delivered' ? iso(0, 0.2) : null,
    rating: status === 'delivered' ? 4 + (i % 2) : undefined,
    created_at: iso((i * 3) % 30, (i * 2) % 24),
  }
})

// ---------- Coupons ----------

export const coupons: Coupon[] = [
  { id: 'cpn_1', code: 'WELCOME50', title: '50% off first order', description: 'New users only', discount_type: 'percentage', discount_value: 50, minimum_order: 200, maximum_discount: 150, usage_limit: 1000, used_count: 423, start_date: iso(30), end_date: iso(-60), is_active: true },
  { id: 'cpn_2', code: 'FOOD30', title: '30% off food orders', discount_type: 'percentage', discount_value: 30, minimum_order: 300, maximum_discount: 100, usage_limit: 500, used_count: 187, start_date: iso(20), end_date: iso(-30), is_active: true },
  { id: 'cpn_3', code: 'GROCERY20', title: '20% off grocery', discount_type: 'percentage', discount_value: 20, minimum_order: 500, maximum_discount: 120, usage_limit: 800, used_count: 312, start_date: iso(15), end_date: iso(-45), is_active: true },
  { id: 'cpn_4', code: 'FLAT100', title: 'Flat ₹100 off', discount_type: 'fixed', discount_value: 100, minimum_order: 400, usage_limit: 300, used_count: 156, start_date: iso(10), end_date: iso(-20), is_active: true },
  { id: 'cpn_5', code: 'WEEKEND15', title: 'Weekend special 15%', discount_type: 'percentage', discount_value: 15, minimum_order: 250, maximum_discount: 80, usage_limit: 600, used_count: 0, start_date: iso(5), end_date: iso(-15), is_active: false },
]

// ---------- Banners ----------

export const banners: Banner[] = [
  { id: 'bnr_1', title: 'Order from Spice Garden today!', image_url: '', redirect_type: 'store', redirect_id: 'store_1', position: 1, is_active: true, start_date: iso(10), end_date: iso(-30) },
  { id: 'bnr_2', title: 'Fresh groceries at FreshMart', image_url: '', redirect_type: 'store', redirect_id: 'store_2', position: 2, is_active: true, start_date: iso(7), end_date: iso(-25) },
  { id: 'bnr_3', title: '50% off your first order', image_url: '', redirect_type: 'url', redirect_url: '/coupons', position: 3, is_active: true, start_date: iso(5), end_date: iso(-40) },
  { id: 'bnr_4', title: 'Pizza Corner — Wood-fired classics', image_url: '', redirect_type: 'store', redirect_id: 'store_3', position: 4, is_active: false, start_date: iso(20), end_date: iso(-10) },
]

// ---------- Notifications ----------

export const notifications: Notification[] = [
  { id: 'ntf_1', user_role: 'admin', title: 'New order received', body: 'Order ORD-1080 placed by Rahul Sharma — ₹845', type: 'order', is_read: false, created_at: iso(0, 0.2) },
  { id: 'ntf_2', user_role: 'admin', title: 'Vendor registration', body: 'New vendor "Organic Roots" pending approval', type: 'system', is_read: false, created_at: iso(0, 1) },
  { id: 'ntf_3', user_role: 'admin', title: 'Order cancelled', body: 'Order ORD-1072 was cancelled by customer', type: 'order', is_read: false, created_at: iso(0, 2) },
  { id: 'ntf_4', user_role: 'admin', title: 'Low stock alert', body: '5 products in FreshMart below threshold', type: 'system', is_read: true, created_at: iso(0, 4) },
  { id: 'ntf_5', user_role: 'admin', title: 'Payment failed', body: 'Order ORD-1065 payment failed — investigate', type: 'order', is_read: true, created_at: iso(1, 2) },
  { id: 'ntf_6', user_role: 'admin', title: 'Weekend promo live', body: 'WEEKEND15 coupon is now active', type: 'promo', is_read: true, created_at: iso(2, 0) },
]

// ---------- Wallet transactions ----------

export const walletTransactions: WalletTransaction[] = Array.from({ length: 30 }, (_, i) => {
  const isCustomer = i % 3 === 0
  const isVendor = i % 3 === 1
  const user = isCustomer
    ? customers[i % customers.length]
    : isVendor
    ? vendors[i % vendors.length]
    : deliveryMen[i % deliveryMen.length]
  const isCredit = i % 2 === 0
  return {
    id: rid('wtx', i + 1),
    user_id: user.id,
    user_role: isCustomer ? 'customer' : isVendor ? 'vendor' : 'delivery',
    user_name: user.full_name,
    type: isCredit ? 'credit' : 'debit',
    source: (['topup', 'order', 'refund', 'payout', 'cashback', 'adjustment'] as const)[i % 6],
    amount: 100 + (i * 53) % 1500,
    balance_after: 200 + (i * 89) % 3000,
    description: isCredit ? 'Wallet top-up' : 'Order payment',
    created_at: iso((i * 2) % 60, (i * 3) % 24),
  }
})

// ---------- Dashboard stats ----------

export const dashboardStats: DashboardStats = {
  total_revenue: orders.reduce((s, o) => s + (o.status === 'delivered' ? o.total : 0), 0),
  total_orders: orders.length,
  total_customers: customers.length,
  total_stores: stores.length,
  total_products: products.length,
  total_vendors: vendors.length,
  total_delivery_men: deliveryMen.length,
  pending_orders: orders.filter(o => o.status === 'pending').length,
  active_orders: orders.filter(o => ['accepted', 'preparing', 'ready', 'picked_up', 'on_the_way'].includes(o.status)).length,
  cancelled_orders: orders.filter(o => ['cancelled', 'rejected'].includes(o.status)).length,
  pending_approvals:
    vendors.filter(v => !v.is_approved).length +
    deliveryMen.filter(d => !d.is_approved).length,
  revenue_change_pct: 12.4,
  orders_change_pct: 8.7,
  customers_change_pct: 15.2,
}

// ---------- Revenue chart (last 30 days) ----------

export const revenueChart: RevenuePoint[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(today)
  d.setDate(d.getDate() - (29 - i))
  const seed = i * 17
  const total = 14000 + (seed * 73) % 28000
  return {
    date: d.toISOString().slice(0, 10),
    total,
  }
})

// ---------- Customer growth (cumulative, 30 days) ----------

export const customerGrowth: Array<{ date: string; total: number }> = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(today)
  d.setDate(d.getDate() - (29 - i))
  return {
    date: d.toISOString().slice(0, 10),
    total: 1200 + i * 8 + Math.round(Math.sin(i / 4) * 12),
  }
})

// ---------- AOV trend (30 days) ----------

export const aovTrend: Array<{ date: string; aov: number }> = revenueChart.map((r) => ({
  date: r.date,
  aov: 280 + Math.round(Math.random() * 120),
}))

// ---------- Order status breakdown ----------

export const orderStatusBreakdown = ((): Array<{
  status: OrderStatus
  label: string
  count: number
  color: string
}> => {
  const labels: Record<OrderStatus, { label: string; color: string }> = {
    pending: { label: 'Pending', color: '#f59e0b' },
    accepted: { label: 'Accepted', color: '#3b82f6' },
    preparing: { label: 'Preparing', color: '#8b5cf6' },
    ready: { label: 'Ready', color: '#06b6d4' },
    picked_up: { label: 'Picked Up', color: '#0ea5e9' },
    on_the_way: { label: 'On The Way', color: '#6366f1' },
    delivered: { label: 'Delivered', color: '#10b981' },
    cancelled: { label: 'Cancelled', color: '#ef4444' },
    rejected: { label: 'Rejected', color: '#dc2626' },
  }
  return (Object.keys(labels) as OrderStatus[]).map((status) => ({
    status,
    label: labels[status].label,
    count: orders.filter(o => o.status === status).length,
    color: labels[status].color,
  }))
})()

// ---------- Default settings ----------

export const defaultSettings: AppSettings = {
  appName: 'Food Munch',
  supportEmail: 'support@foodmunch.com',
  supportPhone: '+91 80 1234 5678',
  currency: 'INR',
  currencySymbol: '₹',
  timezone: 'Asia/Kolkata',
  language: 'en',
  defaultCity: 'Bangalore',
  minOrderValue: '200',
  maxDeliveryRadius: '10',
  deliveryFee: '30',
  taxRate: '5',
  newOrder: true,
  orderStatusUpdate: true,
  lowStock: true,
  vendorRegistration: true,
  payoutRequest: true,
  paymentFailure: true,
  dailySummary: false,
  weeklyReport: true,
  pushChannel: true,
  emailChannel: true,
  smsChannel: false,
  emailVerification: true,
  phoneVerification: true,
  twoFactor: false,
  googleSignIn: true,
  autoApproveVendors: false,
  autoApproveDelivery: false,
  autoApproveProducts: true,
  defaultCommission: '10',
  vendorSubscriptionPlan: 'standard',
}

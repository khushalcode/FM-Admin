/**
 * POST /api/upload
 * Upload a file to Supabase Storage.
 *
 * Multipart form data:
 *   - file: the file to upload
 *   - bucket: target bucket (product_images, store_logos, etc.)
 *   - prefix?: optional path prefix
 *
 * Returns:
 *   { success, url, path }
 */
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/server/auth'
import { uploadFile, type StorageBucket } from '@/lib/server/storage'

export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const bucket = formData.get('bucket') as StorageBucket | null
    const prefix = formData.get('prefix') as string | null

    if (!file || !bucket) {
      return NextResponse.json(
        { error: 'Missing file or bucket' },
        { status: 400 }
      )
    }

    // Validate bucket access permissions
    const validBuckets: StorageBucket[] = [
      'product_images', 'store_logos', 'store_covers',
      'banner_images', 'user_avatars', 'category_icons',
      'chat_attachments', 'review_images', 'documents',
    ]
    if (!validBuckets.includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
    }

    // Admin-only buckets
    if (['banner_images', 'category_icons'].includes(bucket)) {
      if (user.dbUser?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden — admin only' },
          { status: 403 }
        )
      }
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await uploadFile({
      bucket,
      file: {
        buffer,
        name: file.name,
        type: file.type,
        size: file.size,
      },
      prefix: prefix || undefined,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (e: any) {
    console.error('[upload] error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

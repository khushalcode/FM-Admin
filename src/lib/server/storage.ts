/**
 * Supabase Storage image upload helpers.
 *
 * Buckets (created by the SQL migration):
 *   - product_images   (public)
 *   - store_logos      (public)
 *   - store_covers     (public)
 *   - banner_images    (admin only)
 *   - user_avatars     (own only)
 *   - category_icons   (admin only)
 *   - chat_attachments (authenticated)
 *   - review_images    (authenticated)
 *   - documents        (private — own only)
 *
 * Server-side (uses service role key — bypasses RLS).
 * Use from API routes only.
 */
import { getSupabaseServer } from './supabase-server'

export type StorageBucket =
  | 'product_images'
  | 'store_logos'
  | 'store_covers'
  | 'banner_images'
  | 'user_avatars'
  | 'category_icons'
  | 'chat_attachments'
  | 'review_images'
  | 'documents'

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'application/pdf',  // for documents bucket
]

const MAX_FILE_SIZE = 5 * 1024 * 1024  // 5MB

const BUCKET_MAX_SIZES: Record<StorageBucket, number> = {
  product_images: 5 * 1024 * 1024,
  store_logos: 2 * 1024 * 1024,
  store_covers: 5 * 1024 * 1024,
  banner_images: 5 * 1024 * 1024,
  user_avatars: 2 * 1024 * 1024,
  category_icons: 1 * 1024 * 1024,
  chat_attachments: 10 * 1024 * 1024,
  review_images: 5 * 1024 * 1024,
  documents: 10 * 1024 * 1024,
}

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

/**
 * Validate a file before upload.
 */
function validateFile(file: {
  name: string
  type: string
  size: number
}, bucket: StorageBucket): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `File type ${file.type} not allowed. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
  }
  const maxSize = BUCKET_MAX_SIZES[bucket]
  if (file.size > maxSize) {
    return `File too large. Max size: ${maxSize / 1024 / 1024}MB`
  }
  return null
}

/**
 * Generate a unique file path for an upload.
 */
function generatePath(bucket: StorageBucket, fileName: string, prefix?: string): string {
  const ext = fileName.split('.').pop() || 'jpg'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 10)
  const baseName = `${timestamp}-${random}.${ext}`
  if (prefix) {
    return `${prefix}/${baseName}`
  }
  return baseName
}

/**
 * Upload a file to Supabase Storage (server-side).
 *
 * @param bucket   Target bucket
 * @param file     File object (Buffer + name + type)
 * @param prefix   Optional path prefix (e.g. user ID for user_avatars)
 */
export async function uploadFile(params: {
  bucket: StorageBucket
  file: {
    buffer: Buffer
    name: string
    type: string
    size: number
  }
  prefix?: string
  makePublic?: boolean
}): Promise<UploadResult> {
  const supabase = getSupabaseServer()
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  // Validate
  const validationError = validateFile(params.file, params.bucket)
  if (validationError) {
    return { success: false, error: validationError }
  }

  // Generate path
  const path = generatePath(params.bucket, params.file.name, params.prefix)

  try {
    const { data, error } = await supabase.storage
      .from(params.bucket)
      .upload(path, params.file.buffer, {
        contentType: params.file.type,
        upsert: false,
      })

    if (error) {
      console.error('[storage] upload failed:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(params.bucket)
      .getPublicUrl(path)

    return {
      success: true,
      url: urlData.publicUrl,
      path,
    }
  } catch (e: any) {
    console.error('[storage] upload exception:', e)
    return { success: false, error: e?.message || 'Upload failed' }
  }
}

/**
 * Upload multiple files in parallel.
 */
export async function uploadFiles(params: {
  bucket: StorageBucket
  files: Array<{
    buffer: Buffer
    name: string
    type: string
    size: number
  }>
  prefix?: string
}): Promise<UploadResult[]> {
  return Promise.all(
    params.files.map((file) =>
      uploadFile({
        bucket: params.bucket,
        file,
        prefix: params.prefix,
      })
    )
  )
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServer()
  if (!supabase) return { success: false, error: 'Supabase not configured' }

  try {
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e?.message }
  }
}

/**
 * List files in a bucket (with optional path prefix).
 */
export async function listFiles(
  bucket: StorageBucket,
  prefix?: string,
  limit: number = 100
): Promise<{
  success: boolean
  files?: Array<{ name: string; id: string; size: number; lastModified: string }>
  error?: string
}> {
  const supabase = getSupabaseServer()
  if (!supabase) return { success: false, error: 'Supabase not configured' }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix || '', { limit, sortBy: { column: 'created_at', order: 'desc' } })

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      files: (data || []).map((f) => ({
        name: f.name,
        id: f.id,
        size: f.metadata?.size || 0,
        lastModified: f.updated_at || f.created_at,
      })),
    }
  } catch (e: any) {
    return { success: false, error: e?.message }
  }
}

/**
 * Generate a signed URL for a private file (e.g. documents bucket).
 */
export async function createSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 3600
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = getSupabaseServer()
  if (!supabase) return { success: false, error: 'Supabase not configured' }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, url: data.signedUrl }
  } catch (e: any) {
    return { success: false, error: e?.message }
  }
}

/* ------------------------------------------------------------------ */
/*  Convenience helpers for common upload patterns                     */
/* ------------------------------------------------------------------ */

export async function uploadProductImage(file: {
  buffer: Buffer
  name: string
  type: string
  size: number
}): Promise<UploadResult> {
  return uploadFile({ bucket: 'product_images', file })
}

export async function uploadStoreLogo(file: {
  buffer: Buffer
  name: string
  type: string
  size: number
}): Promise<UploadResult> {
  return uploadFile({ bucket: 'store_logos', file })
}

export async function uploadStoreCover(file: {
  buffer: Buffer
  name: string
  type: string
  size: number
}): Promise<UploadResult> {
  return uploadFile({ bucket: 'store_covers', file })
}

export async function uploadBannerImage(file: {
  buffer: Buffer
  name: string
  type: string
  size: number
}): Promise<UploadResult> {
  return uploadFile({ bucket: 'banner_images', file })
}

export async function uploadUserAvatar(
  userId: string,
  file: {
    buffer: Buffer
    name: string
    type: string
    size: number
  }
): Promise<UploadResult> {
  return uploadFile({ bucket: 'user_avatars', file, prefix: userId })
}

export async function uploadCategoryIcon(file: {
  buffer: Buffer
  name: string
  type: string
  size: number
}): Promise<UploadResult> {
  return uploadFile({ bucket: 'category_icons', file })
}

export async function uploadChatAttachment(
  userId: string,
  file: {
    buffer: Buffer
    name: string
    type: string
    size: number
  }
): Promise<UploadResult> {
  return uploadFile({ bucket: 'chat_attachments', file, prefix: userId })
}

export async function uploadReviewImage(file: {
  buffer: Buffer
  name: string
  type: string
  size: number
}): Promise<UploadResult> {
  return uploadFile({ bucket: 'review_images', file })
}

export async function uploadDocument(
  userId: string,
  file: {
    buffer: Buffer
    name: string
    type: string
    size: number
  }
): Promise<UploadResult> {
  return uploadFile({ bucket: 'documents', file, prefix: userId })
}

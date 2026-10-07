/**
 * Firebase Admin SDK — server-side Firebase operations.
 *
 * Used for:
 *   - Verifying Firebase ID tokens (auth middleware)
 *   - Sending FCM push notifications
 *   - Custom token minting (optional)
 *
 * Initialize with service account JSON. Until credentials are provided,
 * all functions return null/false gracefully so the app keeps working
 * in mock mode.
 */
import admin, { ServiceAccount } from 'firebase-admin'

let initialized = false
let app: admin.app.App | null = null

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

export const isFirebaseAdminConfigured =
  !!serviceAccountJson || !!serviceAccountPath

function getServiceAccount(): ServiceAccount | null {
  // Try JSON env var first (recommended for Vercel/Netlify)
  if (serviceAccountJson) {
    try {
      return JSON.parse(serviceAccountJson) as ServiceAccount
    } catch (e) {
      console.error('[firebase-admin] invalid FIREBASE_SERVICE_ACCOUNT_JSON:', e)
      return null
    }
  }
  // Try file path (for local dev)
  if (serviceAccountPath) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require(serviceAccountPath) as ServiceAccount
    } catch (e) {
      console.error('[firebase-admin] cannot read service account file:', e)
      return null
    }
  }
  return null
}

function ensureInit(): admin.app.App | null {
  if (initialized) return app
  initialized = true

  const sa = getServiceAccount()
  if (!sa) {
    if (projectId) {
      // Init without service account (limited functionality — auth verify will fail)
      try {
        app = admin.initializeApp({ projectId })
        console.warn('[firebase-admin] initialized WITHOUT service account — token verification will fail until FIREBASE_SERVICE_ACCOUNT_JSON is set')
      } catch (e) {
        console.warn('[firebase-admin] init failed:', e)
      }
    } else {
      console.warn('[firebase-admin] not configured — running in mock mode')
    }
    return app
  }

  try {
    app = admin.initializeApp({
      credential: admin.credential.cert(sa),
      projectId: sa.projectId,
    })
    console.log('[firebase-admin] initialized with service account')
  } catch (e) {
    // App may already be initialized in dev (HMR)
    try {
      app = admin.app()
    } catch {
      console.error('[firebase-admin] init failed:', e)
    }
  }
  return app
}

// Initialize on module load (only on server)
if (typeof window === 'undefined') {
  ensureInit()
}

/**
 * Verify a Firebase ID token sent from the client.
 * Returns the decoded token (with uid, email, etc.) or null.
 */
export async function verifyIdToken(
  idToken: string
): Promise<admin.auth.DecodedIdToken | null> {
  const a = ensureInit()
  if (!a) {
    // Mock mode: return a fake token for testing
    console.warn('[firebase-admin] verifyIdToken called in mock mode — returning mock token')
    return {
      uid: 'mock-uid',
      email: 'admin@foodmunch.com',
      email_verified: true,
      phone_number: undefined,
      name: 'Admin User',
      picture: undefined,
      iss: '',
      aud: '',
      auth_time: 0,
      user_id: 'mock-uid',
      sub: 'mock-uid',
      iat: 0,
      exp: 0,
      firebase: { identities: {}, sign_in_provider: 'password' },
    } as admin.auth.DecodedIdToken
  }

  try {
    return await admin.auth().verifyIdToken(idToken)
  } catch (e) {
    console.error('[firebase-admin] token verification failed:', e)
    return null
  }
}

/**
 * Send an FCM push notification to one or more tokens.
 */
export async function sendFcmMessage(params: {
  token?: string
  tokens?: string[]
  title: string
  body: string
  data?: Record<string, string>
  imageUrl?: string
}): Promise<{ successCount: number; failureCount: number; responses: any[] }> {
  const a = ensureInit()
  if (!a) {
    console.warn('[firebase-admin] sendFcmMessage called in mock mode — would send:', params)
    return { successCount: 0, failureCount: 0, responses: [] }
  }

  const payload: admin.messaging.Message | admin.messaging.MulticastMessage = {
    notification: {
      title: params.title,
      body: params.body,
      ...(params.imageUrl ? { imageUrl: params.imageUrl } : {}),
    },
    data: params.data || {},
    android: {
      notification: {
        channelId: 'foodmunch_orders',
        priority: 'high',
        sound: 'default',
        ...(params.imageUrl ? { imageUrl: params.imageUrl } : {}),
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  }

  try {
    if (params.tokens && params.tokens.length > 1) {
      const message: admin.messaging.MulticastMessage = {
        ...payload,
        tokens: params.tokens,
      } as admin.messaging.MulticastMessage
      const response = await admin.messaging().sendEachForMulticast(message)
      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      }
    } else {
      const token = params.token || params.tokens?.[0]
      if (!token) {
        return { successCount: 0, failureCount: 0, responses: [] }
      }
      const message: admin.messaging.Message = {
        ...payload,
        token,
      } as admin.messaging.Message
      const messageId = await admin.messaging().send(message)
      return {
        successCount: 1,
        failureCount: 0,
        responses: [{ messageId, success: true }],
      }
    }
  } catch (e) {
    console.error('[firebase-admin] FCM send failed:', e)
    return { successCount: 0, failureCount: 1, responses: [{ success: false, error: e }] }
  }
}

/**
 * Send an FCM message to a topic (e.g. all vendors, all delivery men).
 */
export async function sendFcmToTopic(params: {
  topic: string
  title: string
  body: string
  data?: Record<string, string>
  imageUrl?: string
}): Promise<string | null> {
  const a = ensureInit()
  if (!a) {
    console.warn('[firebase-admin] sendFcmToTopic called in mock mode — topic:', params.topic)
    return null
  }

  try {
    const message: admin.messaging.Message = {
      notification: {
        title: params.title,
        body: params.body,
        ...(params.imageUrl ? { imageUrl: params.imageUrl } : {}),
      },
      data: params.data || {},
      android: {
        notification: {
          channelId: 'foodmunch_orders',
          priority: 'high',
          sound: 'default',
        },
      },
      topic: params.topic,
    }
    return await admin.messaging().send(message)
  } catch (e) {
    console.error('[firebase-admin] FCM topic send failed:', e)
    return null
  }
}

/**
 * Subscribe tokens to a topic.
 */
export async function subscribeToTopic(
  tokens: string[],
  topic: string
): Promise<void> {
  const a = ensureInit()
  if (!a) return
  try {
    await admin.messaging().subscribeToTopic(tokens, topic)
  } catch (e) {
    console.error('[firebase-admin] subscribe failed:', e)
  }
}

/**
 * Unsubscribe tokens from a topic.
 */
export async function unsubscribeFromTopic(
  tokens: string[],
  topic: string
): Promise<void> {
  const a = ensureInit()
  if (!a) return
  try {
    await admin.messaging().unsubscribeFromTopic(tokens, topic)
  } catch (e) {
    console.error('[firebase-admin] unsubscribe failed:', e)
  }
}

/**
 * Get a user by their Firebase UID.
 */
export async function getUserByUid(
  uid: string
): Promise<admin.auth.UserRecord | null> {
  const a = ensureInit()
  if (!a) return null
  try {
    return await admin.auth().getUser(uid)
  } catch (e) {
    console.error('[firebase-admin] getUser failed:', e)
    return null
  }
}

/**
 * Set custom claims on a user (e.g. role: admin/vendor/delivery).
 */
export async function setUserClaims(
  uid: string,
  claims: Record<string, any>
): Promise<boolean> {
  const a = ensureInit()
  if (!a) return false
  try {
    await admin.auth().setCustomUserClaims(uid, claims)
    return true
  } catch (e) {
    console.error('[firebase-admin] setCustomUserClaims failed:', e)
    return false
  }
}

export { admin }

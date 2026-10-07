/**
 * Firebase client config — Food Munch
 * Project: food-munch-2bcfb
 * Used for FCM push notifications (admin receives order updates).
 */
import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getMessaging, Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCHdCYxDmmxT_8oHSEtz9QwHit-xchK9GI',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'food-munch-2bcfb.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'food-munch-2bcfb',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'food-munch-2bcfb.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '229260810980',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:229260810980:web:a3dfcfe1ae6e76f71daaf1',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-FY8FYYGJ5K',
}

export const isFirebaseConfigured = true

let app: FirebaseApp
let auth: Auth
let messaging: Messaging | null = null

if (typeof window !== 'undefined') {
  // Client-side initialization
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }
  auth = getAuth(app)
  // Messaging only works in browser
  try {
    messaging = getMessaging(app)
  } catch (e) {
    console.warn('[firebase] messaging not available:', e)
  }
} else {
  // Server-side — just init app (no auth/messaging)
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }
  auth = null as any
}

export { app as firebaseApp, auth as firebaseAuth, messaging as firebaseMessaging }

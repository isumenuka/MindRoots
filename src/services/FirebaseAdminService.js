/**
 * FirebaseAdminService.js
 * Server-side only Firebase Admin SDK — bypasses Firestore security rules
 * using Application Default Credentials (Cloud Run) or FIREBASE_SERVICE_ACCOUNT env var locally.
 *
 * HOW TO USE LOCALLY:
 * 1. Go to Firebase Console → Project Settings → Service Accounts → Generate new private key
 * 2. Save the JSON file somewhere safe (e.g. backend/serviceAccount.json — already in .gitignore)
 * 3. In .env.local add:
 *    FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"mindroots",...}
 *    (paste the entire JSON as a single line)
 *
 * On Cloud Run: uses Application Default Credentials automatically (no extra config needed).
 */

import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

let _db = null

function getAdminDb() {
  if (_db) return _db

  if (getApps().length === 0) {
    // Try service account JSON from env var first (local dev)
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT
    if (serviceAccountJson) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson)
        initializeApp({ credential: cert(serviceAccount) })
      } catch (e) {
        console.error('[FirebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT:', e.message)
        initializeApp({ credential: applicationDefault() })
      }
    } else {
      // Cloud Run — Application Default Credentials
      initializeApp({ credential: applicationDefault() })
    }
  }

  _db = getFirestore()
  return _db
}

export { getAdminDb }

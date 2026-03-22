'use client'

import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, updateDoc, deleteDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)
const db = getFirestore(app)
const googleProvider = new GoogleAuthProvider()

// Force the account selection prompt every time the user signs in
googleProvider.setCustomParameters({
  prompt: 'select_account'
})

// Auth helpers
async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    // Create or update user doc
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        created_at: serverTimestamp(),
        onboarding_complete: false,
      })
    }
    return user
  } catch (error) {
    console.error('Sign in error:', error)
    throw error
  }
}

async function signOut() {
  await firebaseSignOut(auth)
}

// Session helpers
async function createSession(uid) {
  const sessionRef = await addDoc(collection(db, 'users', uid, 'sessions'), {
    created_at: serverTimestamp(),
    status: 'interviewing',
    dominant_theme: '',
    total_beliefs: 0,
    narration_url: '',
    pdf_url: '',
    share_token: '',
  })
  return sessionRef.id
}

async function updateSessionStatus(uid, sessionId, status, extra = {}) {
  const sessionRef = doc(db, 'users', uid, 'sessions', sessionId)
  await updateDoc(sessionRef, { status, ...extra })
}

async function saveBelief(uid, sessionId, beliefData) {
  const beliefRef = await addDoc(collection(db, 'users', uid, 'sessions', sessionId, 'beliefs'), {
    ...beliefData,
    created_at: serverTimestamp(),
  })
  return beliefRef.id
}

async function updateBelief(uid, sessionId, beliefId, updates) {
  const beliefRef = doc(db, 'users', uid, 'sessions', sessionId, 'beliefs', beliefId)
  await updateDoc(beliefRef, updates)
}

async function saveBeliefTree(uid, sessionId, beliefTree) {
  const treeRef = doc(db, 'users', uid, 'sessions', sessionId, 'belief_tree', 'data')
  await setDoc(treeRef, beliefTree)
}

async function getBeliefTree(uid, sessionId) {
  const treeRef = doc(db, 'users', uid, 'sessions', sessionId, 'belief_tree', 'data')
  const snap = await getDoc(treeRef)
  return snap.exists() ? snap.data() : null
}

async function getBeliefs(uid, sessionId) {
  const beliefsRef = collection(db, 'users', uid, 'sessions', sessionId, 'beliefs')
  const snap = await getDocs(beliefsRef)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

async function getSessions(uid) {
  const sessionsRef = collection(db, 'users', uid, 'sessions')
  const snap = await getDocs(sessionsRef)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(s => s.status === 'complete')
    .sort((a, b) => {
      const aT = a.created_at?.toDate?.() || new Date(0)
      const bT = b.created_at?.toDate?.() || new Date(0)
      return bT - aT
    })
}

async function getSession(uid, sessionId) {
  const sessionRef = doc(db, 'users', uid, 'sessions', sessionId)
  const snap = await getDoc(sessionRef)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

async function generateShareToken(uid, sessionId) {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  const sessionRef = doc(db, 'users', uid, 'sessions', sessionId)
  await updateDoc(sessionRef, { share_token: token })
  // Save to share collection for unauthenticated access
  await setDoc(doc(db, 'shares', token), { uid, sessionId })
  return token
}

async function getShareData(token) {
  const shareRef = doc(db, 'shares', token)
  const snap = await getDoc(shareRef)
  return snap.exists() ? snap.data() : null
}

async function deleteAllUserData(uid) {
  // Delete sessions and beliefs
  const sessionsRef = collection(db, 'users', uid, 'sessions')
  const sessionsSnap = await getDocs(sessionsRef)
  for (const sessionDoc of sessionsSnap.docs) {
    const beliefsRef = collection(db, 'users', uid, 'sessions', sessionDoc.id, 'beliefs')
    const beliefsSnap = await getDocs(beliefsRef)
    for (const beliefDoc of beliefsSnap.docs) {
      await deleteDoc(beliefDoc.ref)
    }
    await deleteDoc(sessionDoc.ref)
  }
  // Delete user doc
  await deleteDoc(doc(db, 'users', uid))
}

async function deleteSession(uid, sessionId) {
  // Delete all beliefs in the session first
  const beliefsRef = collection(db, 'users', uid, 'sessions', sessionId, 'beliefs')
  const beliefsSnap = await getDocs(beliefsRef)
  for (const beliefDoc of beliefsSnap.docs) {
    await deleteDoc(beliefDoc.ref)
  }
  // Delete the session document
  await deleteDoc(doc(db, 'users', uid, 'sessions', sessionId))
}

async function markOnboardingComplete(uid) {
  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, { onboarding_complete: true })
}

async function getUserDoc(uid) {
  const userRef = doc(db, 'users', uid)
  const snap = await getDoc(userRef)
  return snap.exists() ? snap.data() : null
}

async function updateUserVoice(uid, voice) {
  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, { preferred_voice: voice })
}

async function updateUserGeminiKey(uid, key) {
  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, { gemini_api_key: key })
}

export {
  auth, db, app,
  signInWithGoogle, signOut,
  createSession, updateSessionStatus, saveBelief, updateBelief,
  saveBeliefTree, getBeliefTree, getBeliefs, getSessions, getSession,
  generateShareToken, getShareData, deleteAllUserData, deleteSession,
  markOnboardingComplete, getUserDoc, updateUserVoice, updateUserGeminiKey,
  onAuthStateChanged,
  onSnapshot, doc, collection,
}

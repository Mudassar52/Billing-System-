// ============================================================
//  firebase.js — Shared Firebase Config & Utilities
//  BillFlow SaaS — Manual Subscription Control
// ============================================================

// ⚠️  صرف یہ VALUES اپنے Firebase Project سے بدلیں
//  Firebase Console → Project Settings → Web App → Config
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCcH6wNSzV7f9PqNijdHrpfRdk3sb5ORBE",
  authDomain:        "chatapp-e560f.firebaseapp.com",
  projectId:         "chatapp-e560f",
  storageBucket:     "chatapp-e560f.firebasestorage.app",
  messagingSenderId: "507250995556",
  appId:             "1:507250995556:web:3794f4831804ab95760a71"
};

// ============================================================
//  Firebase Initialize (ایک بار ہوتا ہے)
// ============================================================
function initFirebase() {
  if (firebase.apps.length) {
    return {
      auth: firebase.auth(),
      db:   firebase.firestore()
    };
  }
  firebase.initializeApp(FIREBASE_CONFIG);
  const db = firebase.firestore();
  db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
  return {
    auth: firebase.auth(),
    db:   db
  };
}

// ============================================================
//  Admin Check — Firestore میں admins collection سے
//  کوئی UID hardcode نہیں — کوئی بھی email کو
//  Firebase Console سے admins میں add کریں
// ============================================================
async function checkIsAdmin(db, uid) {
  try {
    const snap = await db.collection('admins').doc(uid).get();
    return snap.exists;
  } catch(e) {
    return false;
  }
}

// ============================================================
//  ⚠️  FIRESTORE RULES — Firebase Console میں یہ Rules لگائیں
//  Firebase Console → Firestore Database → Rules → Publish
// ============================================================
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Helper: Admin check ──────────────────────────────────
    function isAdmin() {
      return request.auth != null &&
             exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // ── Users collection ─────────────────────────────────────
    match /users/{userId} {
      // User خود لکھ/پڑھ سکتا ہے + Admin سب پڑھ/لکھ سکتا ہے
      allow read,  write: if request.auth != null && request.auth.uid == userId;
      allow read,  write: if isAdmin();
    }

    // ── Admins collection ────────────────────────────────────
    match /admins/{adminId} {
      // صرف وہی admin پڑھ/لکھ سکتا ہے جو پہلے سے admin ہو
      // یا پہلی بار setup کے وقت (collection خالی ہو)
      allow read:  if request.auth != null;
      allow write: if isAdmin() ||
                      !exists(/databases/$(database)/documents/admins/$(adminId));
    }

    // ── User data (sub-collections) ──────────────────────────
    match /users/{userId}/{doc=**} {
      allow read, write: if request.auth.uid == userId || isAdmin();
    }

    // ── App data (customers, products, invoices, settings) ───
    match /{collection}/{docId} {
      allow read, write: if request.auth != null &&
        (collection == 'customers' || collection == 'products' ||
         collection == 'invoices'  || collection == 'settings');
    }
  }
}
*/

// ============================================================
//  Subscription Helpers
// ============================================================
function isSubscriptionActive(userData) {
  if (!userData) return false;
  if (userData.status === 'locked') return false;
  const expiry = userData.expiryDate?.toDate
    ? userData.expiryDate.toDate()
    : new Date(userData.expiryDate);
  return new Date() < expiry;
}

function formatDate(dateVal) {
  if (!dateVal) return '—';
  const d = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal);
  return d.toLocaleDateString('en-PK', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function daysRemaining(dateVal) {
  if (!dateVal) return -999;
  const expiry = dateVal?.toDate
    ? dateVal.toDate()
    : new Date(dateVal);
  return Math.floor((expiry - Date.now()) / 86400000);
}

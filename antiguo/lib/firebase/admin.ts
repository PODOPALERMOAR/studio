// src/lib/firebase/admin.ts
import { initializeApp, getApps, App, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';

let app: App;
let db: Firestore;
let auth: Auth;
let storage: Storage;

try {
  const apps = getApps();
  if (!apps.length) {
    console.log("[admin.ts] Initializing Firebase Admin SDK...");
    // ADC will be used automatically in Google Cloud environments.
    // For local dev, GOOGLE_APPLICATION_CREDENTIALS env var should point to the key file.
    app = initializeApp({
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log("[admin.ts] Firebase Admin SDK initialized successfully.");
  } else {
    app = apps[0];
    console.log("[admin.ts] Existing Firebase Admin SDK app instance retrieved.");
  }
  
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);

} catch (e: any) {
  console.error("🔴 CRITICAL: Firebase Admin SDK initialization failed.", e);
  // Throw a more descriptive error to make debugging easier.
  // This will crash the server on startup if config is wrong, which is intended.
  throw new Error(`
    🔴 Firebase Admin SDK failed to initialize. This is a critical configuration error.
    - Original Error: ${e.message}
    - Common Causes:
      1. (Local Dev) The 'GOOGLE_APPLICATION_CREDENTIALS' environment variable is not set, or points to an invalid/inaccessible JSON key file.
      2. (Cloud Env) The service account used by Application Default Credentials (ADC) lacks the necessary IAM permissions (e.g., 'Cloud Datastore User', 'Firebase Authentication Admin').
      3. The 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET' environment variable is missing or incorrect.
  `);
}

export const adminApp = app;
export const firestoreAdmin = db;
export const authAdmin = auth;
export const storageAdmin = storage;


// src/lib/firebase/client.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore'; // Added Firestore import

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Log the configuration to help debug client-side issues
console.log("[Firebase Client Config Attempting to Load]:", {
  apiKeyExists: firebaseConfig.apiKey ? 'Exists' : 'MISSING or undefined',
  authDomainExists: firebaseConfig.authDomain ? 'Exists' : 'MISSING or undefined',
  projectIdExists: firebaseConfig.projectId ? 'Exists' : 'MISSING or undefined',
  storageBucketExists: firebaseConfig.storageBucket ? 'Exists' : 'OPTIONAL - MISSING or undefined',
  messagingSenderIdExists: firebaseConfig.messagingSenderId ? 'Exists' : 'OPTIONAL - MISSING or undefined',
  appIdExists: firebaseConfig.appId ? 'Exists' : 'OPTIONAL - MISSING or undefined',
});

if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error(
    "🔴 CRITICAL Firebase Client Config Error: One or more required NEXT_PUBLIC_FIREBASE_ environment variables (apiKey, authDomain, projectId) are missing or undefined. Firebase client WILL NOT work correctly. Check your .env file and ensure it's loaded by Next.js (e.g., restart dev server)."
  );
}


let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("✅ [Firebase Client] New Firebase app initialized successfully.");
  } catch (e: any) {
    console.error("🔴 [Firebase Client] Error initializing new Firebase app:", e.message, "Full config used:", firebaseConfig);
    // Rethrow or handle as critical failure; app will be undefined
    throw new Error(`Firebase client initialization failed: ${e.message}. Check browser console for config details used.`);
  }
} else {
  app = getApps()[0];
  console.log("✅ [Firebase Client] Existing Firebase app instance retrieved.");
}

let auth: Auth;
let db: Firestore;

// Initialize Auth
try {
  auth = getAuth(app);
  console.log("✅ [Firebase Client] Firebase Auth instance obtained successfully.");
} catch (e: any) {
  console.error("🔴 [Firebase Client] Error getting Firebase Auth instance:", e.message);
  throw new Error(`Failed to get Firebase Auth instance: ${e.message}. This is critical for authentication features.`);
}

// Initialize Firestore
try {
  db = getFirestore(app);
  console.log("✅ [Firebase Client] Firebase Firestore instance obtained successfully.");
} catch (e: any) {
  console.error("🔴 [Firebase Client] Error getting Firebase Firestore instance:", e.message);
  throw new Error(`Failed to get Firebase Firestore instance: ${e.message}. This is critical for database operations.`);
}

export { app, auth, db }; // Export db

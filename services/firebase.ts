import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile,
    User
} from "firebase/auth";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    onSnapshot,
    updateDoc, 
    arrayUnion,
    collection,
    addDoc,
    serverTimestamp
} from "firebase/firestore";

// Define locally to avoid circular dependency with App.tsx
export type JGVersion = 'v0' | 'v0.1-remastered' | 'v1.0' | 'v1.1' | 'v1.2';

// --- SECURITY & SETUP INSTRUCTIONS ---
/*
    1. FIREBASE CONSOLE SETUP:
       - Go to Project Settings > General.
       - Ensure these keys match your project.

    2. EMAIL AUTOMATION (The "Real" Way):
       - Go to Firebase Console > Extensions.
       - Install "Trigger Email" (by Twilio SendGrid or similar).
       - Configure it to listen to the "mail" collection.
       - This code writes to the "mail" collection automatically.

    3. DATABASE SECURITY:
       - Go to Firestore Database > Rules.
       - Copy the rules from 'firestore.rules' in your project root.
       - This ensures users can only read/write their own data.
*/

const firebaseConfig: any = {
  apiKey: "AIzaSyAtXl2LvN2i2o3CczXRh7Yv1-Ugxfeg8jU",
  authDomain: "july-god-programming-language.firebaseapp.com",
  projectId: "july-god-programming-language",
  storageBucket: "july-god-programming-language.firebasestorage.app",
  messagingSenderId: "1053876813830",
  appId: "1:1053876813830:web:997989cae98fe8bf0b4387",
  measurementId: "G-ZSW5H5BV0F"
};

// Admin Email for notifications
const ADMIN_EMAIL = "Divitbansal016@gmail.com";

let auth: any;
let db: any;
let analytics: any;
let isDemoMode = true;

// Initialize Firebase only if keys are present
if (firebaseConfig.apiKey) {
    try {
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
        auth = getAuth(app);
        db = getFirestore(app);
        
        // Initialize Analytics if supported
        if (typeof window !== 'undefined') {
            try {
                analytics = getAnalytics(app);
                console.log("📊 Firebase: Analytics Active");
            } catch (e) {
                console.warn("Analytics failed to load (ad-blocker maybe?)");
            }
        }

        isDemoMode = false;
        console.log("🔥 Firebase: Connected to Real Database");
    } catch (e) {
        console.error("Firebase Initialization Error:", e);
        isDemoMode = true;
    }
} else {
    console.warn("⚠️ Firebase: Config missing. Running in DEMO MODE (Local Storage).");
}

// --- DEMO MODE EVENT SYSTEM ---
const demoListeners: Array<(user: any) => void> = [];
const notifyListeners = (user: any) => {
    demoListeners.forEach(cb => cb(user));
};

// --- TYPES ---

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    unlockedVersions: JGVersion[];
    pendingRequests: {
        version: JGVersion;
        utr: string;
        date: string;
    }[];
}

// --- API ---

export const authService = {
    isDemo: () => isDemoMode,

    signUp: async (email: string, pass: string, name: string) => {
        if (isDemoMode) {
            const mockUser = { uid: "demo_" + Date.now(), email, displayName: name };
            localStorage.setItem('jg_demo_user', JSON.stringify(mockUser));
            notifyListeners(mockUser);
            return mockUser;
        }
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        if (cred.user) {
            await updateProfile(cred.user, { displayName: name });
            // Initialize User Doc in Real DB
            await setDoc(doc(db, "users", cred.user.uid), {
                email,
                displayName: name,
                unlockedVersions: ['v0.1-remastered'], // Free tier
                createdAt: serverTimestamp()
            });
            if (analytics) logEvent(analytics, 'sign_up', { method: 'email' });
        }
        return cred.user;
    },

    signIn: async (email: string, pass: string) => {
        if (isDemoMode) {
            const mockUser = { uid: "demo_123", email, displayName: "Demo User" };
            localStorage.setItem('jg_demo_user', JSON.stringify(mockUser));
            notifyListeners(mockUser); 
            return mockUser;
        }
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        if (analytics) logEvent(analytics, 'login', { method: 'email' });
        return cred.user;
    },

    signOut: async () => {
        if (isDemoMode) {
            localStorage.removeItem('jg_demo_user');
            notifyListeners(null); 
            return;
        }
        return signOut(auth);
    },

    onStateChange: (callback: (user: User | null) => void) => {
        if (isDemoMode) {
            const stored = localStorage.getItem('jg_demo_user');
            callback(stored ? JSON.parse(stored) : null);
            demoListeners.push(callback);
            return () => {
                const index = demoListeners.indexOf(callback);
                if (index > -1) demoListeners.splice(index, 1);
            };
        }
        return onAuthStateChanged(auth, callback);
    }
};

export const dbService = {
    // Submit a Payment Request to Real Firestore
    submitPayment: async (uid: string, version: JGVersion, utr: string, username: string) => {
        if (isDemoMode) {
            const key = `jg_pending_${uid}`;
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.push({ version, utr, date: new Date().toISOString() });
            localStorage.setItem(key, JSON.stringify(existing));
            return;
        }

        const timestamp = serverTimestamp();

        // 1. Add to global requests collection (For Zapier or Admin Panel)
        await addDoc(collection(db, "payment_requests"), {
            uid,
            username,
            version,
            utr,
            status: 'pending',
            createdAt: timestamp
        });

        // 2. Add to 'mail' collection (For Firebase "Trigger Email" Extension)
        // This is the "Real" email automation. If the extension is installed, 
        // this doc creation will send an email to the admin.
        await addDoc(collection(db, "mail"), {
            to: ADMIN_EMAIL,
            message: {
                subject: `[JulyGod] New Unlock Request: ${username}`,
                html: `
                    <h2>New Payment Verification Needed</h2>
                    <p><strong>User:</strong> ${username} (${uid})</p>
                    <p><strong>Version Requested:</strong> ${version}</p>
                    <p><strong>UTR / Ref ID:</strong> ${utr}</p>
                    <hr/>
                    <p>Please verify the payment in your dashboard or bank account.</p>
                `
            }
        });

        // 3. Add to user profile for Real-time UI updates
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            pendingRequests: arrayUnion({
                version,
                utr,
                date: new Date().toISOString()
            })
        });

        if (analytics) logEvent(analytics, 'unlock_request', { version, utr });
    },

    // Real-time listener
    subscribeToUserProfile: (uid: string, onUpdate: (profile: UserProfile | null) => void) => {
        if (isDemoMode) {
            const check = () => {
                const key = `jg_pending_${uid}`;
                const pending = JSON.parse(localStorage.getItem(key) || '[]');
                onUpdate({
                    uid,
                    email: "demo@julygod.com",
                    displayName: "Demo User",
                    unlockedVersions: ['v0.1-remastered'],
                    pendingRequests: pending
                });
            };
            check();
            const interval = setInterval(check, 2000);
            return () => clearInterval(interval);
        }

        // Real Firestore Listener
        return onSnapshot(doc(db, "users", uid), (doc) => {
            if (doc.exists()) {
                onUpdate({ uid, ...doc.data() } as UserProfile);
            } else {
                onUpdate(null);
            }
        });
    },

    // Legacy fetch
    getUserProfile: async (uid: string): Promise<UserProfile | null> => {
        if (isDemoMode) {
            const key = `jg_pending_${uid}`;
            const pending = JSON.parse(localStorage.getItem(key) || '[]');
            return {
                uid,
                email: "demo@julygod.com",
                displayName: "Demo User",
                unlockedVersions: ['v0.1-remastered'],
                pendingRequests: pending
            };
        }
        
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
            return { uid, ...snap.data() } as UserProfile;
        }
        return null;
    }
};
import { initializeApp, getApps } from "firebase/app";
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
    serverTimestamp,
    DocumentSnapshot,
    FirestoreError,
    deleteField
} from "firebase/firestore";

export type JGVersion = 'v0' | 'v0.1-remastered' | 'v1.0' | 'v1.1' | 'v1.2';

const firebaseConfig: any = {
  apiKey: "AIzaSyAtXl2LvN2i2o3CczXRh7Yv1-Ugxfeg8jU",
  authDomain: "july-god-programming-language.firebaseapp.com",
  projectId: "july-god-programming-language",
  storageBucket: "july-god-programming-language.firebasestorage.app",
  messagingSenderId: "1053876813830",
  appId: "1:1053876813830:web:997989cae98fe8bf0b4387",
  measurementId: "G-ZSW5H5BV0F"
};

let auth: any;
let db: any;
let isDemoMode = true;

if (firebaseConfig.apiKey) {
    try {
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
        auth = getAuth(app);
        db = getFirestore(app);
        isDemoMode = false;
    } catch (e) {
        isDemoMode = true;
    }
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    unlockedVersions: JGVersion[];
    trials: Record<string, string>;
    systemMessage?: string;
    pendingRequests: {
        version: JGVersion;
        utr: string;
        date: string;
        redeemCode: string;
    }[];
}

const generateRedeemCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const part = (len: number) => Array.from({length: len}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    return `JG-${part(4)}-${part(4)}`;
};

export const authService = {
    isDemo: () => isDemoMode,
    signUp: async (email: string, pass: string, name: string) => {
        if (isDemoMode) return null;
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        if (cred.user) {
            await updateProfile(cred.user, { displayName: name });
            await setDoc(doc(db, "users", cred.user.uid), {
                email,
                displayName: name,
                unlockedVersions: ['v0.1-remastered'],
                trials: {},
                createdAt: serverTimestamp()
            });
        }
        return cred.user;
    },
    signIn: async (email: string, pass: string) => {
        if (isDemoMode) return null;
        return await signInWithEmailAndPassword(auth, email, pass);
    },
    signOut: async () => {
        if (isDemoMode) return;
        return signOut(auth);
    },
    onStateChange: (callback: (user: User | null) => void) => {
        if (isDemoMode) return () => {};
        return onAuthStateChanged(auth, callback);
    },
    getCurrentUid: () => auth?.currentUser?.uid || null,
    getCurrentEmail: () => auth?.currentUser?.email || null
};

export const dbService = {
    adminUnlockVersion: async (adminUid: string, targetUid: string, version: JGVersion) => {
        if (isDemoMode) throw new Error("Demo Mode");
        const userRef = doc(db, "users", targetUid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) throw new Error(`User not found.`);
        const userData = userSnap.data();
        const pending = userData.pendingRequests || [];
        const updatedPending = pending.filter((p: any) => p.version !== version);
        const updatedUnlocked = Array.from(new Set([...(userData.unlockedVersions || []), version]));
        await updateDoc(userRef, {
            unlockedVersions: updatedUnlocked,
            pendingRequests: updatedPending,
            systemMessage: deleteField() // Clear any existing rejection messages on success
        });
        return true;
    },

    adminDenyVersion: async (adminUid: string, targetUid: string, version: JGVersion) => {
        if (isDemoMode) throw new Error("Demo Mode");
        const userRef = doc(db, "users", targetUid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) throw new Error(`User not found.`);
        const userData = userSnap.data();
        const pending = userData.pendingRequests || [];
        const updatedPending = pending.filter((p: any) => p.version !== version);
        
        await updateDoc(userRef, {
            pendingRequests: updatedPending,
            systemMessage: `The transaction for ${version.toUpperCase()} was marked as invalid/fake. Please contact divitbansal016@gmail.com for support.`
        });
        return true;
    },

    clearSystemMessage: async (uid: string) => {
        if (isDemoMode) return;
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, { systemMessage: deleteField() });
    },

    startTrial: async (uid: string, version: JGVersion) => {
        if (isDemoMode) return;
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;

        const userData = userSnap.data();
        const trials = userData.trials || {};

        if (trials[version]) throw new Error("Trial already used for this version.");

        const now = new Date();
        let days = 30;
        if (version === 'v0') days = 365;
        else if (version === 'v1.1') days = 90;
        else if (version === 'v1.2') days = 30;

        const expiry = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        
        await setDoc(userRef, {
            trials: {
                ...trials,
                [version]: expiry.toISOString()
            }
        }, { merge: true });
    },

    redeemCode: async (uid: string, code: string) => {
        if (isDemoMode) throw new Error("Demo Mode");
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) throw new Error("User profile missing.");
        
        const userData = userSnap.data();
        const pending = userData.pendingRequests || [];
        const requestToUnlock = pending.find((p: any) => p.redeemCode === code.trim());
        
        if (!requestToUnlock) throw new Error("Invalid or expired Redeem Code.");

        const version = requestToUnlock.version;
        const updatedPending = pending.filter((p: any) => p.redeemCode !== code.trim());
        const updatedUnlocked = Array.from(new Set([...(userData.unlockedVersions || []), version]));

        await updateDoc(userRef, {
            unlockedVersions: updatedUnlocked,
            pendingRequests: updatedPending,
            systemMessage: deleteField()
        });
        return version;
    },

    submitPayment: async (uid: string, version: JGVersion, utr: string, username: string) => {
        if (isDemoMode) return { redeemCode: '' };

        const redeemCode = generateRedeemCode();
        let price = "0";
        switch(version) {
            case 'v0': price = "20"; break;
            case 'v1.0': price = "200"; break;
            case 'v1.1': price = "800"; break;
            case 'v1.2': price = "1400"; break;
        }

        await addDoc(collection(db, "payment_requests"), {
            uid, username, version, utr, price, redeemCode,
            status: 'pending',
            createdAt: serverTimestamp()
        });

        const userRef = doc(db, "users", uid);
        await setDoc(userRef, {
            pendingRequests: arrayUnion({
                version, utr, redeemCode,
                date: new Date().toISOString()
            })
        }, { merge: true });

        return { redeemCode };
    },

    subscribeToUserProfile: (uid: string, onUpdate: (profile: UserProfile | null) => void, onError?: (error: any) => void) => {
        if (isDemoMode) return () => {};
        return onSnapshot(doc(db, "users", uid), (doc: DocumentSnapshot) => {
            if (doc.exists()) onUpdate({ uid, ...doc.data() } as UserProfile);
            else onUpdate(null);
        }, (error: FirestoreError) => { if (onError) onError(error); });
    },

    getUserProfile: async (uid: string): Promise<UserProfile | null> => {
        if (isDemoMode) return null;
        const snap = await getDoc(doc(db, "users", uid));
        return snap.exists() ? { uid, ...snap.data() } as UserProfile : null;
    }
};

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile, UserRole } from '@/types';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName: string, role: UserRole, schoolId?: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user profile from Firestore
    const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                return {
                    uid: userDoc.id,
                    email: data.email,
                    displayName: data.displayName,
                    role: data.role,
                    schoolId: data.schoolId,
                    createdAt: data.createdAt?.toDate(),
                    updatedAt: data.updatedAt?.toDate(),
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                // Query for user profile
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('uid', '==', user.uid));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    // User profile exists
                    const userDoc = querySnapshot.docs[0];
                    setUserProfile({ id: userDoc.id, ...userDoc.data() } as UserProfile);
                } else {
                    // No profile exists - create one with default role
                    console.log('Creating new user profile for:', user.email);

                    const newProfile = {
                        uid: user.uid,
                        email: user.email || '',
                        displayName: user.displayName || user.email?.split('@')[0] || 'User',
                        role: 'clinic_admin', // Default role - change this if needed
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    };

                    try {
                        const docRef = await addDoc(collection(db, 'users'), newProfile);
                        setUserProfile({ id: docRef.id, ...newProfile, createdAt: new Date(), updatedAt: new Date() } as UserProfile);
                        console.log('User profile created successfully');
                    } catch (error) {
                        console.error('Error creating user profile:', error);
                        setUserProfile(null);
                    }
                }
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (
        email: string,
        password: string,
        displayName: string,
        role: UserRole,
        schoolId?: string
    ) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user profile in Firestore
        const userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & {
            createdAt: Date;
            updatedAt: Date;
        } = {
            uid: user.uid,
            email: email,
            displayName,
            role,
            schoolId: role === 'clinic_admin' ? undefined : schoolId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await setDoc(doc(db, 'users', user.uid), userProfile);

        // Note: Custom claims (for role) need to be set via Cloud Function
        // We'll create that function later - for now, role is stored in Firestore
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // Note: New Google users will need profile creation flow
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
    };

    const value = {
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

import { auth, db } from '@/firebaseConfig';
import type { UserSignup } from '@/types/user';
import { createUserWithEmailAndPassword, type AuthError } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export async function signup(userInfo: Omit<UserSignup, 'id' | 'created_at' | 'updated_at' | 'token' | 'email_verified'>) {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, userInfo.email, userInfo.password);
    const user = userCredential.user;

    // Prepare user data for Firestore
    const userData: UserSignup = {
      id: user.uid,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      email: userInfo.email,
      password: userInfo.password,
      phone: userInfo.phone,
      email_verified: user.emailVerified,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      token: user.refreshToken || '',
    };

    // Save user data to Firestore
    await setDoc(doc(db, 'users', user.uid), userData);

    return {
      success: true,
      user: userData,
    };
  } catch (error: any) {
    const authError = error as AuthError;
    if (authError.code === 'auth/email-already-in-use') {
      console.error('Email already in use');
      // Provide feedback to the user
    } else {
      console.error('Signup error:', authError.message);
    }
  }
}

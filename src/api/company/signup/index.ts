import { auth, db } from '@/firebaseConfig';
import type { CompanySignup } from '@/types/company';

import { createUserWithEmailAndPassword, type AuthError } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export async function company_signup(userInfo: Omit<CompanySignup, 'id' | 'created_at' | 'updated_at' | 'token' | 'email_verified'>) {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, userInfo.email, userInfo.password);
    const company = userCredential.user;

    // Prepare user data for Firestore
    const userData: CompanySignup = {
      id: company.uid,
      name: userInfo.name,
      description: userInfo.description,
      email: userInfo.email,
      password: userInfo.password,
      phone: userInfo.phone,
      email_verified: company.emailVerified,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      token: company.refreshToken || '',
    };

    // Save user data to Firestore
    await setDoc(doc(db, 'company', company.uid), userData);

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

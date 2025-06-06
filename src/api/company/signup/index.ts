import { auth, db } from '@/firebaseConfig';
import type { CompanySignup } from '@/types/company'; // Assuming this type can accommodate the changes or will be updated.
import { createUserWithEmailAndPassword, updateProfile, type AuthError } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Ensure userInfo type reflects that it will have name and description for company details
export async function company_signup(userInfo: Omit<CompanySignup, 'id' | 'created_at' | 'updated_at' | 'token' | 'email_verified' | 'accountType'> & { name: string; description: string; email: string; password: string; phone?: string }) {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, userInfo.email, userInfo.password);
    const companyAuthUser = userCredential.user;

    // Update Firebase Auth profile displayName
    await updateProfile(companyAuthUser, {
      displayName: userInfo.name // Set company name as displayName in Auth
    });

    // Prepare user data for Firestore 'users' collection
    // The CompanySignup type might need to be adjusted if it's strict, or use a new type here.
    // For this change, we are defining the structure to be saved.
    const firestoreUserData = {
      id: companyAuthUser.uid, // Using 'id' to be consistent with developer signup data structure
      companyName: userInfo.name,
      companyDescription: userInfo.description,
      email: userInfo.email,
      // Storing raw password in Firestore is generally not recommended for security.
      // This was in the original code for both signup types.
      // password: userInfo.password, // Consider removing if not strictly needed post-signup.
      phone: userInfo.phone || '',
      accountType: 'company',
      email_verified: companyAuthUser.emailVerified,
      displayName: userInfo.name, // Store displayName in Firestore for consistency and easier access
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Storing refreshToken is generally not recommended for security reasons.
      // token: companyAuthUser.refreshToken || '', // Consider removing
    };

    // Save user data to Firestore 'users' collection
    await setDoc(doc(db, 'users', companyAuthUser.uid), firestoreUserData);

    return {
      success: true,
      user: firestoreUserData, // Return the data structure that was saved
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

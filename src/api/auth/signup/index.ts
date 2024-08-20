import { auth, db } from '@/firebaseConfig';
import type { User, Role, EmploymentStatus } from '@/types/user'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export async function signup(userInfo: Omit<User, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'token'>) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, userInfo.email, userInfo.password);
    const user = userCredential.user;

    const userData: User = {
      id: user.uid,
      name: userInfo.name,
      email: userInfo.email,
      phone: userInfo.phone,
      address: userInfo.address || '',
      role: userInfo.role as Role,
      email_verified: user.emailVerified,
      password: userInfo.password,
      country: userInfo.country || '',
      status: userInfo.status || 'active',
      profileImage: userInfo.profileImage || '',
      employmentStatus: userInfo.employmentStatus as EmploymentStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: '',
      token: user.refreshToken || '',
    };

    // Save user data to Firestore
    await setDoc(doc(db, 'users', user.uid), userData);

    return {
      success: true,
      user: userData,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

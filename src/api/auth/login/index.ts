import { auth } from "@/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

export const login = async (email: string, password: string) => {
    try{
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        return {
            success: true,
            user: {
                id: user.uid,
                email: user.email,
                email_verified: user.emailVerified,
                token: user.refreshToken || '',
            },
        };
    }catch(error: any){
        console.error('Error logging in:', error);
    }    
}
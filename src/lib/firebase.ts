import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0118447009",
  appId: "1:648418647947:web:6a47b11be1c91ffc06198e",
  apiKey: "AIzaSyBodbEZrro6y13lAifCSPoWNaATEFXgciM",
  authDomain: "gen-lang-client-0118447009.firebaseapp.com",
  storageBucket: "gen-lang-client-0118447009.firebasestorage.app",
  messagingSenderId: "648418647947",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBK5wZT8xeSclSadPwWqD5t2Gp6uZ5OWyU",
    authDomain: "testfirebase-80be9.firebaseapp.com",
    projectId: "testfirebase-80be9",
    storageBucket: "testfirebase-80be9.firebasestorage.app",
    messagingSenderId: "507617350642",
    appId: "1:507617350642:web:f809202fd2412b681e516b",
    measurementId: "G-D0DFMN0YR9"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userRef = doc(firestore, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        name: user.displayName,
        email: user.email,
        photo: user.photoURL
      });
    }
    return user;
  } catch (error) {
    console.error("Error signing in with Google: ", error);
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
  }
};

export const fetchClassrooms = async (uid) => {
  const classroomRef = collection(firestore, `users/${uid}/classroom`);
  const snapshot = await getDocs(classroomRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

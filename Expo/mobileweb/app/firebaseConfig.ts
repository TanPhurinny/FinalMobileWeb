import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

// 🔥 ใส่ค่าจริงจาก Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyAsEANU9p5dXhUIgITl-k5W3Wzh4K-7wfM",
    authDomain: "finalmobileweb.firebaseapp.com",
    projectId: "finalmobileweb",
    storageBucket: "finalmobileweb.firebasestorage.app",
    messagingSenderId: "763318502667",
    appId: "1:763318502667:web:8aa0a7f919c3df79be0e0e",
    measurementId: "G-LSNZG1BMNT"
  };

  

// ✅ เริ่มต้น Firebase App
const app = initializeApp(firebaseConfig);

// ✅ ใช้ getAuth() ตรงๆ ไม่ต้องใช้ initializeAuth
export const auth = getAuth(app);

// ✅ เพิ่ม Default Export
export default app;

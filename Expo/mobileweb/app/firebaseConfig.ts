import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // นำเข้า Firestore แบบใหม่

// 🔥 ใส่ค่าจริงจาก Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBK5wZT8xeSclSadPwWqD5t2Gp6uZ5OWyU",
  authDomain: "testfirebase-80be9.firebaseapp.com",
  projectId: "testfirebase-80be9",
  storageBucket: "testfirebase-80be9.firebasestorage.app",
  messagingSenderId: "507617350642",
  appId: "1:507617350642:web:f809202fd2412b681e516b",
  measurementId: "G-D0DFMN0YR9"
};

// ✅ เริ่มต้น Firebase App
const app = initializeApp(firebaseConfig);

// ✅ ใช้ getAuth() ตรงๆ ไม่ต้องใช้ initializeAuth
export const auth = getAuth(app);

// ✅ ใช้ getFirestore() เพื่อเชื่อมต่อกับ Firestore
export const firestore = getFirestore(app);  // เพิ่มการเชื่อมต่อกับ Firestore

// ✅ เพิ่ม Default Export
export default app;

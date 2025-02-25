import { useState } from "react";
import { View, Text, TextInput, Button, Alert, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebaseConfig"; // ตรวจสอบ path ให้ถูกต้อง
import { getFirestore, doc, setDoc } from "firebase/firestore";

// กำหนดการเชื่อมต่อ Firestore
const db = getFirestore();

export default function RegisterScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>(""); // สร้าง state สำหรับชื่อผู้ใช้
  const [studentId, setStudentId] = useState<string>(""); // สร้าง state สำหรับรหัสนักศึกษา
  const router = useRouter();

  const handleRegister = async () => {
    try {
      // ตรวจสอบว่าชื่ออีเมลและรหัสผ่านถูกกรอกหรือไม่
      if (!name || !email || !password || !studentId) {
        Alert.alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
      }

      // สร้างผู้ใช้ใหม่ใน Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // เพิ่มข้อมูลผู้ใช้ลงใน Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: email,
        name: name, // เก็บชื่อผู้ใช้ลงใน Firestore
        studentId: studentId, // เก็บรหัสนักศึกษาลงใน Firestore
        photo: "", // สามารถเพิ่ม URL รูปภาพได้
      });

      Alert.alert("สมัครสำเร็จ", "บัญชีของคุณถูกสร้างแล้ว กรุณาเข้าสู่ระบบ");
      router.replace("/login"); // ไปหน้า Login
    } catch (error: any) {
      Alert.alert("สมัครบัญชีล้มเหลว", "ไม่สามารถสร้างบัญชีได้ บัญชีมีอยู่ในระบบแล้ว");
      console.error("เกิดข้อผิดพลาดในการสมัครบัญชี", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>สมัครบัญชีใหม่</Text>

      {/* ช่องกรอกชื่อ */}
      <TextInput
        style={styles.input}
        placeholder="กรอกชื่อ"
        placeholderTextColor="gray"
        value={name}
        onChangeText={setName}
      />

      {/* ช่องกรอกอีเมล */}
      <TextInput
        style={styles.input}
        placeholder="อีเมล"
        placeholderTextColor="gray"
        value={email}
        onChangeText={setEmail}
      />

      {/* ช่องกรอกรหัสผ่าน */}
      <TextInput
        style={styles.input}
        placeholder="รหัสผ่าน"
        secureTextEntry
        placeholderTextColor="gray"
        value={password}
        onChangeText={setPassword}
      />

      {/* ช่องกรอกรหัสนักศึกษา */}
      <TextInput
        style={styles.input}
        placeholder="กรอกรหัสนักศึกษา"
        placeholderTextColor="gray"
        value={studentId}
        onChangeText={setStudentId}
      />

      {/* ปุ่มสมัครบัญชี */}
      <TouchableOpacity
        style={[styles.button, styles.registerButton]}
        onPress={handleRegister}
      >
        <Text style={styles.buttonText}>สมัครบัญชี</Text>
      </TouchableOpacity>

      {/* ปุ่มกลับไปหน้าเข้าสู่ระบบ */}
      <TouchableOpacity
        style={[styles.button, styles.loginButton]}
        onPress={() => router.replace("/login")}
      >
        <Text style={styles.buttonText}>กลับไปหน้าเข้าสู่ระบบ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    maxWidth: 300,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  registerButton: {
    backgroundColor: '#007bff', // ปุ่มสมัครบัญชี
  },
  loginButton: {
    backgroundColor: '#6c757d', // ปุ่มกลับไปหน้าเข้าสู่ระบบ
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

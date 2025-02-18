import { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
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
  const router = useRouter();

  const handleRegister = async () => {
    try {
      // ตรวจสอบว่าชื่ออีเมลและรหัสผ่านถูกกรอกหรือไม่
      if (!name || !email || !password) {
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
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>สมัครบัญชีใหม่</Text>

      <TextInput
        style={{
          borderWidth: 1,
          width: 200,
          marginVertical: 10,
          padding: 10,
          borderRadius: 5,
        }}
        placeholder="กรอกชื่อ"
        placeholderTextColor="gray"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={{
          borderWidth: 1,
          width: 200,
          marginVertical: 10,
          padding: 10,
          borderRadius: 5,
        }}
        placeholder="อีเมล"
        placeholderTextColor="gray"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={{
          borderWidth: 1,
          width: 200,
          marginVertical: 10,
          padding: 10,
          borderRadius: 5,
        }}
        placeholder="รหัสผ่าน"
        secureTextEntry
        placeholderTextColor="gray"
        value={password}
        onChangeText={setPassword}
      />

      <Button title="สมัครบัญชี" onPress={handleRegister} />
      <Button title="กลับไปหน้าเข้าสู่ระบบ" onPress={() => router.replace("/login")} color="gray" />
    </View>
  );
}

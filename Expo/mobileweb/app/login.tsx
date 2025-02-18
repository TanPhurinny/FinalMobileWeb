import { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebaseConfig"; // ตรวจสอบ path ให้ถูกต้อง

export default function LoginScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("สำเร็จ", "เข้าสู่ระบบสำเร็จ!");
      router.replace("/"); // ไปหน้า Home
    } catch (error: any) {
      console.log("Firebase Error:", error.code); // แสดง error code ใน console
      Alert.alert("เกิดข้อผิดพลาด", `รหัสข้อผิดพลาด: กรุณากรอกอีเมลหรือรหัสผ่านให้ถูกต้อง`);
      
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>เข้าสู่ระบบ</Text>
      <TextInput
      
        style={{ borderWidth: 1, width: 200, marginVertical: 10, padding: 5 }}
        placeholder="อีเมล"
        placeholderTextColor="gray"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={{ borderWidth: 1, width: 200, marginVertical: 10, padding: 5 }}
        placeholder="รหัสผ่าน"
        placeholderTextColor="gray"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="เข้าสู่ระบบ" onPress={handleLogin} />
      <Button title="สมัครบัญชีใหม่" onPress={() => router.push("/register")} color="green" />
    </View>
  );
}

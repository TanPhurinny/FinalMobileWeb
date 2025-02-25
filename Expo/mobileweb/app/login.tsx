import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity,Alert } from 'react-native';
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
    <View style={styles.container}>
      <Text style={styles.title}>เข้าสู่ระบบ</Text>

      {/* ช่องกรอกอีเมล */}
      <TextInput
        style={styles.input}
        placeholder="อีเมล"
        placeholderTextColor="gray"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      {/* ช่องกรอกรหัสผ่าน */}
      <TextInput
        style={styles.input}
        placeholder="รหัสผ่าน"
        placeholderTextColor="gray"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* ปุ่มเข้าสู่ระบบ */}
      <TouchableOpacity
        onPress={handleLogin}
        style={[styles.button, { backgroundColor: '#007bff' }]} // ปุ่มเข้าสู่ระบบสีฟ้า
      >
        <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
      </TouchableOpacity>

      {/* ปุ่มสมัครบัญชีใหม่ */}
      <TouchableOpacity
        onPress={() => router.push("/register")}
        style={[styles.button, { backgroundColor: 'green' }]} // ปุ่มสมัครบัญชีใหม่สีเขียว
      >
        <Text style={styles.buttonText}>สมัครบัญชีใหม่</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
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
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
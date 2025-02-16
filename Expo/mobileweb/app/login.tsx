import { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebaseConfig";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/"); // กลับไปที่หน้า Home
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", JSON.stringify(error));
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>เข้าสู่ระบบ</Text>
      <TextInput
        style={{ borderWidth: 1, width: 200, marginVertical: 10, padding: 5 }}
        placeholder="อีเมล"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={{ borderWidth: 1, width: 200, marginVertical: 10, padding: 5 }}
        placeholder="รหัสผ่าน"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="เข้าสู่ระบบ" onPress={handleLogin} />
    </View>
  );
}

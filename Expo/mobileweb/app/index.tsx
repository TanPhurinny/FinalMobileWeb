import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "./authContext";
import { signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login"); // กลับไปหน้า Login
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>ยินดีต้อนรับ</Text>
      {user ? <Text>อีเมล: {user.email}</Text> : <Text>ไม่พบข้อมูลผู้ใช้</Text>}
      
      <Button title="ดูรายวิชา" onPress={() => router.push("/add-subject")} />
      <Button title="สแกน QR Code" onPress={() => router.push("/scan-qr")} />
      <Button title="ออกจากระบบ" onPress={handleLogout} color="red" />
    </View>
  );
}

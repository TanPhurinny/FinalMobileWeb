import { View, Text, Button,StyleSheet, TouchableOpacity } from "react-native";
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
    <View style={styles.container}>
      <Text style={styles.title}>ยินดีต้อนรับ</Text>

      {/* แสดงข้อมูลผู้ใช้ */}
      {user ? (
        <Text style={styles.userText}>อีเมล: {user.email}</Text>
      ) : (
        <Text style={styles.userText}>ไม่พบข้อมูลผู้ใช้</Text>
      )}

      {/* ปุ่มดูรายวิชา */}
      <TouchableOpacity
        style={[styles.button, styles.viewSubjectsButton]}
        onPress={() => router.push("/add-subject")}
      >
        <Text style={styles.buttonText}>ดูรายวิชา</Text>
      </TouchableOpacity>

      {/* ปุ่มออกจากระบบ */}
      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>ออกจากระบบ</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  userText: {
    fontSize: 18,
    marginBottom: 30,
    color: '#555',
  },
  button: {
    width: '100%',
    maxWidth: 300,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  viewSubjectsButton: {
    backgroundColor: '#007bff',
  },
  logoutButton: {
    backgroundColor: 'red',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

import { Stack, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "./authContext";
import { View, ActivityIndicator } from "react-native";
import { useEffect } from "react";

export default function Layout() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

const AuthGate = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login"); // ✅ ถ้ายังไม่ล็อกอิน ให้ไปหน้า login
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="blue" />
      </View>
    );
  }

  return <Stack />;
};

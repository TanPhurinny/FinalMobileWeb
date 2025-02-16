import { useState, useEffect } from "react";
import { View, Text, Button, Alert, StyleSheet } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ScanQR() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (!permission) {
        await requestPermission();
      }
    })();
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    Alert.alert(`QR Code: ${data}`);

    // บันทึกข้อมูลวิชา
    await AsyncStorage.setItem(`class_${data}`, JSON.stringify({ cid: data }));

    router.push("/");
  };

  if (!permission) {
    return <Text>กำลังขอสิทธิ์เข้าถึงกล้อง...</Text>;
  }
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>ไม่ได้รับอนุญาตให้ใช้กล้อง</Text>
        <Button title="ให้สิทธิ์เข้าถึงกล้อง" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text>สแกน QR Code ห้องเรียน</Text>
      <CameraView
        style={styles.camera}
        facing="back" 
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      {scanned && <Button title="สแกนใหม่" onPress={() => setScanned(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  camera: { width: "100%", height: "80%" },
});

import { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function CheckIn() {
  const [cid, setCid] = useState("");
  const [cno, setCno] = useState("");
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleCheckIn = async () => {
    if (!cid || !cno || !code) {
      Alert.alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    const checkInData = {
      cid,
      cno,
      code,
      date: new Date().toISOString(),
    };

    // บันทึกข้อมูลเช็คชื่อใน Local Storage
    await AsyncStorage.setItem(`checkin_${cid}_${cno}`, JSON.stringify(checkInData));

    Alert.alert("เช็คชื่อสำเร็จ!");
    router.push("/");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>รหัสวิชา:</Text>
      <TextInput style={{ borderWidth: 1, width: 200, padding: 5 }} onChangeText={setCid} />

      <Text>ลำดับที่ (cno):</Text>
      <TextInput style={{ borderWidth: 1, width: 200, padding: 5 }} onChangeText={setCno} />

      <Text>รหัสเข้าเรียน:</Text>
      <TextInput style={{ borderWidth: 1, width: 200, padding: 5 }} onChangeText={setCode} />

      <Button title="เช็คชื่อ" onPress={handleCheckIn} />
    </View>
  );
}

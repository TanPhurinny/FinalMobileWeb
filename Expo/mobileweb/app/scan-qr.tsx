import { useState, useEffect } from "react";
import { StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { firestore } from "./firebaseConfig"; // นำเข้า firestore
import { addDoc, collection, getDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Alert } from "react-native";
import { FlatList, Text, View, TextInput, Button, TouchableOpacity } from "react-native";

type Classroom = {
  id: string;
  code: string;
  name: string;
  owner: string;
  classroomId: string;
};

type User = {
  id: string;
  email: string;
  name: string;
  studentID: string;
  classrooms: Classroom[];
};

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

  // ฟังก์ชันเพิ่มวิชาจาก QR Code
  const addClassroomFromQR = async (classroomData: Classroom) => {
    const user = await getCurrentUser();
    if (!user) return; // ถ้าไม่ได้ล็อกอิน ให้หยุดการทำงาน

    const userId = user.id;

    // ตรวจสอบว่ามีวิชานี้ใน subjClassrooms หรือไม่
    const isClassroomExists = user.classrooms.some((subj: Classroom) => subj.code === classroomData.code);

    if (isClassroomExists) {
      Alert.alert("วิชานี้ถูกเพิ่มไปแล้ว", "คุณไม่สามารถเพิ่มวิชานี้ซ้ำได้");
      return; // หากมีวิชานี้อยู่แล้ว ให้หยุดการทำงาน
    }

    try {
      // เพิ่มข้อมูลวิชาใน Firestore
      await addDoc(collection(firestore, "users", userId, "subj"), {
        code: classroomData.code,
        name: classroomData.name,
        owner: classroomData.owner,
        classroomid: classroomData.classroomId,
      });

      // เพิ่มข้อมูลในคอลเล็กชัน "students" สำหรับวิชานี้
      await addDoc(collection(firestore, "users", classroomData.owner, "classroom", classroomData.classroomId, "students"), {
        std_name: user.name,
        email: user.email,
        uID: user.id,
        std_id: user.studentID,
        status: 2,
      });

      Alert.alert("เพิ่มวิชาเรียบร้อย", `วิชา ${classroomData.name} ถูกเพิ่มแล้ว`);
      router.push("/add-subject");

    } catch (error) {
      console.error("Error adding classroom from QR: ", error);
      Alert.alert("ไม่สามารถเพิ่มวิชาได้");
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true); // เปลี่ยนสถานะเมื่อมีการสแกน QR
    const classroomData = JSON.parse(data); // แปลงข้อมูลจาก QR ให้เป็นอ็อบเจ็กต์
    // เพิ่มวิชาจากข้อมูล QR
    await addClassroomFromQR({
      id: classroomData.classroomId,
      code: classroomData.classCode,
      name: classroomData.className,
      owner: classroomData.owner, // คุณสามารถปรับให้เป็นเจ้าของตามที่ต้องการ
      classroomId: classroomData.classroomId,
    });

    router.push("/add-subject");
  };

  const getCurrentUser = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      try {
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          return {
            name: userData?.name || "ไม่ระบุชื่อ",
            email: user.email || "ไม่ระบุอีเมล",
            id: user.uid,
            studentID: userData?.studentId || "ไม่ระบุรหัสนักศึกษา",
            classrooms: userData?.classrooms || [],
          };
        } else {
          console.log("ไม่พบข้อมูลผู้ใช้ใน Firestore");
          return null;
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้จาก Firestore", error);
        return null;
      }
    } else {
      console.log("ผู้ใช้งานไม่ได้ล็อกอิน");
      return null;
    }
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

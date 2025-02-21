import { useState, useEffect } from "react";
import { View, Text, Button, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, collection, setDoc, getDoc ,getDocs} from "firebase/firestore";
import { firestore } from "./firebaseConfig";
import { useAuth } from "./authContext";

// กำหนด Type ของข้อมูลวิชา
interface Subject {
  id: string;
  name: string;
  code: string;
  classroomid: string;
  owner: string;
  checkIn?: string;
}

export default function CheckIn() {
  const router = useRouter();
  const { user } = useAuth();
  const { subjectId, subjectName } = useLocalSearchParams();

  // ✅ ตรวจสอบและแปลง subjectId ให้เป็น string เท่านั้น
  const validSubjectId = typeof subjectId === "string" ? subjectId : String(subjectId?.[0]);

  const [subject, setSubject] = useState<Subject | null>(null);

  useEffect(() => {
    if (!user || !validSubjectId) return;
    fetchSubject(validSubjectId);
  }, [user, validSubjectId]);

  // ดึงข้อมูลเฉพาะวิชาที่ถูกเลือก
  const fetchSubject = async (id: string) => {
    if (!user) return;
    try {
      const subjSnapshot = await getDocs(collection(firestore, "users", user.uid, "subj"));
      const selectedSubject = subjSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Subject))
        .find((subj) => subj.id === id);

      setSubject(selectedSubject || null);
    } catch (error) {
      console.error("Error fetching subject:", error);
    }
  };

  // ฟังก์ชันเช็คอินและอัปเดต Firestore

  const handleCheckIn = async () => {
    if (!user || !subject) return;
    try {
      const checkInTime = new Date().toLocaleString();
    
      const userId = user.uid;
      const { id: subjectId, owner, classroomid, name, code } = subject;
  
      // ✅ ดึงชื่อของผู้ใช้จาก Firestore
      const userDocRef = doc(firestore, "users", userId);
      const userDocSnap = await getDoc(userDocRef);
  
      let userName = "ไม่ระบุชื่อ"; // ค่าเริ่มต้น
      if (userDocSnap.exists()) {
        userName = userDocSnap.data().name || "ไม่ระบุชื่อ"; // ใช้ค่าจาก Firestore
      }
  
      // ✅ อัปเดตเช็คอินของนักเรียนใน `users/{uid}/subj/{subjectId}`
      const subjectRef = doc(firestore, "users", userId, "subj", subjectId);
      await setDoc(subjectRef, { checkIn: checkInTime }, { merge: true });
  
      // ✅ ตรวจสอบว่ามี `checkin` ใน `users/{owner}/classroom/{classroomid}/checkin/{userId}` หรือไม่
      const checkInRef = doc(firestore, "users", owner, "classroom", classroomid, "checkin", userId);
      const checkInSnap = await getDoc(checkInRef);
  
      if (!checkInSnap.exists()) {
        // ✅ ถ้ายังไม่มีข้อมูล, ใช้ `setDoc()` เพื่อสร้างเอกสารใหม่
        await setDoc(checkInRef, {
          studentId: userId,
          studentName: userName, // ✅ ใช้ค่าที่ดึงมาจาก Firestore
          studentEmail: user.email || "ไม่ระบุอีเมล",
          subjectName: name,
          subjectCode: code,
          checkInTime: checkInTime,
        });
      } else {
        // ✅ ถ้ามีข้อมูลอยู่แล้ว, อัปเดตเวลาล่าสุด
        await setDoc(checkInRef, { checkInTime: checkInTime }, { merge: true });
      }
  
      Alert.alert("เช็คอินสำเร็จ!", `เช็คอินสำเร็จที่ ${checkInTime}`);
      router.push("/add-subject");
  
    } catch (error) {
      console.error("Error checking in:", error);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเช็คอินได้");
    }
  };

  
  
  
  
  


  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>เช็คอินวิชา</Text>

      {subject ? (
        <View style={{ marginBottom: 15, padding: 10, borderWidth: 1, borderRadius: 5 }}>
          <Text style={{ fontSize: 18 }}>{subjectName || subject.name} ({subject.code})</Text>
          <Text>เช็คอินล่าสุด: {subject.checkIn ? subject.checkIn : "ยังไม่มีการเช็คอิน"}</Text>
          <Button title="เช็คอิน" onPress={handleCheckIn} />
        </View>
      ) : (
        <Text>ไม่พบข้อมูลวิชา</Text>
      )}

      <Button title="กลับหน้าหลัก" onPress={() => router.push("/add-subject")} />
    </View>
  );
}

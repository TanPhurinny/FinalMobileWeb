import { useState, useEffect } from "react";
import { View, Text, Button, Alert, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, collection, setDoc, getDoc, getDocs, QueryDocumentSnapshot } from "firebase/firestore";
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
  status: number; // เพิ่มสถานะของวิชา
}

export default function CheckIn() {
  const router = useRouter();
  const { user } = useAuth();
  const { subjectId, subjectName } = useLocalSearchParams();

  const validSubjectId = typeof subjectId === "string" ? subjectId : String(subjectId?.[0]);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [enteredCode, setEnteredCode] = useState<string>(""); // สถานะของโค้ดที่กรอก
  const [checkInData, setCheckInData] = useState<any[]>([]); // ข้อมูลการเช็คอิน

  const [studentID, setStudentID] = useState<string>("");

  useEffect(() => {
    if (!user || !validSubjectId) return;
    fetchSubject(validSubjectId);
  }, [user, validSubjectId]);

  const fetchSubject = async (id: string) => {
    if (!user) return;
    try {
      const subjSnapshot = await getDocs(collection(firestore, "users", user.uid, "subj"));
      const selectedSubject = subjSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Subject))
        .find((subj) => subj.id === id);

      setSubject(selectedSubject || null);

      // เมื่อดึงข้อมูลวิชาแล้ว, ดึงข้อมูลเช็คอิน
      if (selectedSubject) {
        fetchCheckInData(selectedSubject.owner, selectedSubject.classroomid);
      }
    } catch (error) {
      console.error("Error fetching subject:", error);
    }
  };

  const findStudentIdByUserId = async (userId:string) => {
    try {
      const checkInRef = doc(firestore, "users", userId);
      const checkInSnap = await getDoc(checkInRef);
      const Id = "";

      if (checkInSnap.exists()) {
        const data = checkInSnap.data().studentId; // ดึงข้อมูลเอกสารออกมา

        setStudentID(data)
        return data; // คืนค่าข้อมูล
      } else {
        console.log("ไม่พบเอกสารของ userId:", userId);
        return null;
      }

    } catch (error) {
      console.error("Error fetching check-in data:", error);
    }
  };












  const fetchCheckInData = async (ownerId: string, classroomId: string) => {
    try {
      const checkInRef = collection(firestore, "users", ownerId, "classroom", classroomId, "checkin");
      const checkInSnap = await getDocs(checkInRef);

      // ดึงข้อมูลจาก checkInSnap.docs และแสดงข้อมูล
      const checkInList = checkInSnap.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.id,
        cno: doc.data().cno, // ค่าของ cno
        code: doc.data().code, // ค่าของ code
        status: doc.data().status, // ค่าของ status
        date: doc.data().date, // ค่าของ date
      }));

      setCheckInData(checkInList); // เก็บข้อมูลทั้งหมด
      console.log("ข้อมูลทั้งหมดใน checkin:", checkInList);
    } catch (error) {
      console.error("Error fetching check-in data:", error);
    }
  };

  const handleCheckIn = async () => {
    if (!user || !subject) return;
  
    // ตรวจสอบว่า checkInData เป็น array ก่อนการใช้งาน find
    if (!Array.isArray(checkInData)) {
      console.error("checkInData is not an array", checkInData);
      return;
    }
  
    try {
      const checkInTime = new Date().toLocaleString();
      const userId = user.uid;
      const { id: subjectId, owner, classroomid, name, code } = subject;
  
      // ใช้ await เพื่อดึง studentID ก่อนจะนำไปใช้
      const studentId = await findStudentIdByUserId(userId);
      if (!studentId) {
        Alert.alert("เกิดข้อผิดพลาด", "ไม่พบรหัสนักเรียน");
        return;
      }
  
      // ค้นหาข้อมูลเช็คอินที่ตรงกับรหัสที่กรอก
      const foundDoc = checkInData.find((doc) => doc.code === enteredCode);
  
      if (foundDoc) {
        // ถ้าพบตรงกัน, ทำการบันทึกข้อมูลเช็คอิน
        const userDocRef = doc(firestore, "users", userId);
        const userDocSnap = await getDoc(userDocRef);
  
        let userName = "ไม่ระบุชื่อ"; // ค่าเริ่มต้น
        if (userDocSnap.exists()) {
          userName = userDocSnap.data().name || "ไม่ระบุชื่อ"; // ใช้ค่าจาก Firestore
        }
  
        await setDoc(doc(firestore, "users", owner, "classroom", classroomid, "checkin", foundDoc.id, "students", userId), {
          uId: userId,
          std_id: studentId, // ใช้ studentId ที่ดึงมา
          std_name: userName,
          std_mark: "----",
          std_score: "10",
          status: 0,
          date: checkInTime,
        });
  
        Alert.alert("เช็คอินสำเร็จ!", `เช็คอินสำเร็จที่ ${checkInTime}`);
        router.push("/add-subject");
      } else {
        Alert.alert("ไม่พบรหัสวิชาที่ตรงกับที่กรอก");
      }
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
          <Text>สถานะ: {subject.status === 0 ? "เปิดเช็คอิน" : "ปิดเช็คอิน"}</Text>
          <Text>เช็คอินล่าสุด: {subject.checkIn ? subject.checkIn : "ยังไม่มีการเช็คอิน"}</Text>

          {/* ช่องกรอกโค้ดวิชา */}
          <TextInput
            style={{
              borderWidth: 1,
              width: 200,
              marginVertical: 10,
              padding: 5,
              borderRadius: 5,
              textAlign: "center",
            }}
            placeholder="กรอกโค้ดเช็คชื่อ"
            value={enteredCode}
            onChangeText={setEnteredCode}
          />
          <Button title="เช็คอิน" onPress={handleCheckIn} />
        </View>
      ) : (
        <Text>ไม่พบข้อมูลวิชา</Text>
      )}

      <Button title="กลับหน้าหลัก" onPress={() => router.push("/add-subject")} />
    </View>
  );
}

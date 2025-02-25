import { useState, useEffect } from "react";
import { View, Text, Button, Alert, TextInput,FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, collection, setDoc, getDoc, getDocs, QueryDocumentSnapshot,updateDoc,onSnapshot  } from "firebase/firestore";
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

interface Question {
  id: string;
  question_no: string;
  question_show: boolean;
  question_text: string;
}

export default function CheckIn() {
  const router = useRouter();
  const { user } = useAuth();
  const { subjectId, subjectName } = useLocalSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const validSubjectId = typeof subjectId === "string" ? subjectId : String(subjectId?.[0]);
  const { ownerId, classroomId } = useLocalSearchParams();
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});

  const [subject, setSubject] = useState<Subject | null>(null);
  const [enteredCode, setEnteredCode] = useState<string>(""); // สถานะของโค้ดที่กรอก
  const [checkInData, setCheckInData] = useState<any[]>([]); // ข้อมูลการเช็คอิน

  const [studentID, setStudentID] = useState<string>("");

  useEffect(() => {
    if (!user || !validSubjectId) return;
    
    // ติดตามข้อมูลวิชาจาก Firestore แบบ real-time
    const subjectRef = collection(firestore, "users", user.uid, "subj");
    const unsubscribeSubject = onSnapshot(subjectRef, (snapshot) => {
      const selectedSubject = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Subject))
        .find((subj) => subj.id === validSubjectId);
      
      setSubject(selectedSubject || null);
  
      // เมื่อดึงข้อมูลวิชาแล้ว, ดึงข้อมูลเช็คอินและคำถาม
      if (selectedSubject) {
        fetchCheckInData(selectedSubject.owner, selectedSubject.classroomid);
        fetchCheckQData(selectedSubject.owner, selectedSubject.classroomid);
      }
    });
  
    // ทำการยกเลิกการติดตามเมื่อ component ถูกทำลาย
    return () => unsubscribeSubject();
  }, [user, validSubjectId]);



  [user, validSubjectId,ownerId, classroomId]
  const fetchSubject = async (id: string) => {
    if (!user) return;
    try {
      const subjSnapshot = await getDocs(collection(firestore, "users", user.uid, "subj"));
      const selectedSubject = subjSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Subject))
        .find((subj) => subj.id === validSubjectId);

      setSubject(selectedSubject || null);

      // เมื่อดึงข้อมูลวิชาแล้ว, ดึงข้อมูลเช็คอิน
      if (selectedSubject) {
        fetchCheckInData(selectedSubject.owner, selectedSubject.classroomid);
        fetchCheckQData(selectedSubject.owner, selectedSubject.classroomid);
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

  const fetchCheckInData = (ownerId: string, classroomId: string) => {
    const checkInRef = collection(firestore, "users", ownerId, "classroom", classroomId, "checkin");
  
    // ติดตามข้อมูลเช็คอินแบบ real-time
    const unsubscribeCheckIn = onSnapshot(checkInRef, (checkInSnap) => {
      const checkInList = checkInSnap.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.id,
        cno: doc.data().cno, // ค่าของ cno
        code: doc.data().code, // ค่าของ code
        status: doc.data().status, // ค่าของ status
        date: doc.data().date, // ค่าของ date
      }));
      setCheckInData(checkInList); // รีเฟรชข้อมูลการเช็คอิน
    });
  
    // คืนค่า unsubscribe เพื่อยกเลิกการติดตามเมื่อ component ถูกทำลาย
    return () => unsubscribeCheckIn();
  };



  const fetchCheckQData = (ownerId: string, classroomId: string) => {
    const checkqRef = collection(firestore, "users", ownerId, "classroom", classroomId, "questions");
    
    // ติดตามข้อมูลคำถามแบบ real-time
    const unsubscribeCheckQ = onSnapshot(checkqRef, (checkqSnap) => {
      const questionList = checkqSnap.docs.map((doc) => ({
        id: doc.id,
        question_no: doc.data().question_no || "",
        question_show: doc.data().question_show || "",
        question_text: doc.data().question_text || "",
      }));
      setQuestions(questionList); // รีเฟรชข้อมูลคำถาม
    });
  
    // คืนค่า unsubscribe เพื่อยกเลิกการติดตามเมื่อ component ถูกทำลาย
    return () => unsubscribeCheckQ();
  };


  const renderQuestionItem = ({ item }: { item: Question }) => {
    // ตรวจสอบว่า question_show เป็น true หรือไม่
    if (!item.question_show) {
      return null; // ถ้าไม่เป็น true จะไม่แสดงคำถามนี้
    }
  
    return (
      <View style={{ marginBottom: 15, padding: 10, borderWidth: 1, borderRadius: 5 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>คำถามหมายเลข: {item.question_no}</Text>
        <Text>คำถาม: {item.question_text}</Text>
  
        {/* ช่องกรอกคำตอบ */}
        <TextInput
          style={{
            borderWidth: 1,
            marginVertical: 10,
            padding: 5,
            borderRadius: 5,
            width: "100%",
          }}
          placeholder="กรอกคำตอบของคุณ"
          value={answers[item.id] || ""}
          onChangeText={(text) => setAnswers((prev) => ({ ...prev, [item.id]: text }))} 
        />
  
        {/* ปุ่มส่งคำตอบ */}
        <Button
          title="ส่งคำตอบ"
          onPress={() => handleSubmitAnswer(item.id, answers[item.id] || "")}
        />
      </View>
    );
  };

  const handleSubmitAnswer = async (questionId: string, answer: string) => {
    try {
      if (!subject) {
        Alert.alert("ข้อผิดพลาด", "ไม่พบข้อมูลวิชา");
        return;

      }
      if (!user) {
        Alert.alert("ข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้");
        return;
      }

      const { id: subjectId, owner, classroomid, name, code } = subject;
      const userId = user.uid;
      if (!answer) {
        Alert.alert("กรุณากรอกคำตอบก่อน");
        return;
      }

      if (!user) {
      Alert.alert("ข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้");
      return;
    }

    const userDocRef = doc(firestore, "users", userId);
    const userDocSnap = await getDoc(userDocRef);
    let userName = "ไม่ระบุชื่อ"; // ค่าเริ่มต้น
        if (userDocSnap.exists()) {
          userName = userDocSnap.data().name || "ไม่ระบุชื่อ"; // ใช้ค่าจาก Firestore
        }

      await setDoc(doc(firestore, "users", owner, "classroom", classroomid, "questions", questionId, "answers", userId), {
        uId: userId,
        std_name: userName,
        text: answer,
        time: new Date().toLocaleString(),
      });

      setAnswers({ ...answers, [questionId]: "" });

      Alert.alert("ส่งคำตอบสำเร็จ!", `คำตอบสำหรับคำถาม ${questionId} ถูกบันทึก`);
    } catch (error) {
      console.error("Error submitting answer:", error);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถส่งคำตอบได้");
    }
  };





















  const handleCheckIn = async () => {
    if (!user || !subject) return;
    
  
    
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

      fetchSubject(userId);
  
      
  
      // ค้นหาข้อมูลเช็คอินที่ตรงกับรหัสที่กรอก
      const foundDoc = checkInData.find((doc) => doc.code === enteredCode);
  
      if (foundDoc) {
        if (foundDoc.status !== 0) {
        Alert.alert("ไม่สามารถเช็คชื่อได้", "อาจารย์ได้ปิดเช็คชื่อไปแล้ว");
        return; // ไม่ให้เช็คอินหากสถานะไม่เป็น 1
      }

      const checkInDocRef = doc(firestore, "users", owner, "classroom", classroomid, "checkin", foundDoc.id, "students", userId);
      const checkInDocSnap = await getDoc(checkInDocRef);

      if (checkInDocSnap.exists()) {
        // ถ้าเอกสารนี้มีอยู่ หมายความว่าผู้ใช้ได้เช็คอินไปแล้วในรอบนี้
        console.log("NO 2 Chcek in")
        Alert.alert("ไม่สามารถเช็คชื่อได้", "คุณได้เช็คชื่อไปแล้วในรอบนี้");
        return;
      }
        
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
        
        await updateDoc(doc(firestore, "users", userId, "subj", validSubjectId), {
          checkIn: checkInTime,
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
    <View style={styles.container}>
      {/* ส่วนเช็คอินวิชา */}
      <Text style={styles.header}>เช็คอินวิชา</Text>

      {subject ? (
        <View style={styles.subjectContainer}>
          <Text style={styles.subjectName}>{subjectName || subject.name} ({subject.code})</Text>
          <Text style={styles.checkInText}>เช็คอินล่าสุด: {subject.checkIn ? subject.checkIn : "ยังไม่มีการเช็คอิน"}</Text>

          {/* ช่องกรอกโค้ดวิชา */}
          <TextInput
            style={styles.input}
            placeholder="กรอกโค้ดเช็คชื่อ"
            value={enteredCode}
            onChangeText={setEnteredCode}
          />

          {/* ปุ่มเช็คอิน */}
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={handleCheckIn}
          >
            <Text style={styles.buttonText}>เช็คอิน</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.noSubjectText}>ไม่พบข้อมูลวิชา</Text>
      )}

      {/* ส่วนคำถามทั้งหมด */}
      <Text style={styles.header}>คำถามทั้งหมด</Text>

      {/* แสดงลิสต์ของคำถาม */}
      {questions.length > 0 ? (
        <FlatList
          data={questions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderQuestionItem}
        />
      ) : (
        <Text style={styles.noQuestionText}>ไม่พบคำถาม</Text>
      )}

      {/* ปุ่มกลับไปหน้าหลัก */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push("/add-subject")}
      >
        <Text style={styles.buttonText}>กลับหน้าหลัก</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  subjectContainer: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  checkInText: {
    fontSize: 16,
    color: '#555',
    marginVertical: 10,
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
    textAlign: 'center',
  },
  checkInButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noSubjectText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  noQuestionText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    marginVertical: 10,
  },
});
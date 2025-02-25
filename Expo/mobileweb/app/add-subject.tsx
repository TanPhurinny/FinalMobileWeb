import { useState, useEffect } from "react";
import { FlatList, Text, View, TextInput, Button, Alert, TouchableOpacity,StyleSheet } from "react-native";
import { firestore } from "./firebaseConfig"; // นำเข้า firestore
import { getDocs, collection, doc, getDoc, addDoc, deleteDoc ,query,where} from "firebase/firestore"; // นำเข้า Firestore API
import { getAuth } from "firebase/auth";
import { useRouter } from "expo-router";

// กำหนดประเภทข้อมูลของ classroom
type Classroom = {
  id: string;
  code: string;
  name: string;
  owner: string;
  ownerName?: string;
  classroomId: string; // เพิ่ม classroomId
};

type User = {
  id: string;
  email: string;
  name: string;
  classrooms: Classroom[];
};


export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]); // สถานะสำหรับเก็บข้อมูลผู้ใช้
  const [classrooms, setClassrooms] = useState<User[]>([]); // สถานะสำหรับเก็บข้อมูลวิชา
  const [subjClassrooms, setSubjClassrooms] = useState<Classroom[]>([]); // สถานะสำหรับวิชาที่เพิ่มไปแล้ว
  const [searchCode, setSearchCode] = useState(""); // รหัสวิชาที่กรอก
  const router = useRouter();
  const [ownerNames, setOwnerNames] = useState<{ [key: string]: string }>({});



  

  const fetchUsersAndClassrooms = async () => {
    try {
      const db = firestore;
      const querySnapshot = await getDocs(collection(db, "users")); // ดึงข้อมูลจากคอลเล็กชัน "users"
      
      const usersList: User[] = [];
      const subjClassroomsList: Classroom[][] = [];
  
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const userId = doc.id; // id ของผู้ใช้
  
        // ดึงข้อมูลจาก "classroom" ที่เชื่อมโยงกับผู้ใช้นั้นๆ
        const classroomSnapshot = await getDocs(collection(db, "users", userId, "classroom"));
        const classroomsList = classroomSnapshot.docs.map(classroomDoc => {
          const classroomData = classroomDoc.data();
          return {
            id: classroomDoc.id, // id ของ classroom
            code: classroomData?.info?.code || "ไม่ระบุรหัสวิชา",
            name: classroomData?.info?.name || "ไม่ระบุชื่อวิชา",
            owner: classroomData?.owner || "ไม่ระบุเจ้าของ",
            classroomId: classroomDoc.id, // เพิ่ม classroomId ในที่นี้
          };
        });
  
        // ดึงข้อมูลจาก "subj" ที่เก็บวิชาที่ผู้ใช้เพิ่ม
        const subjSnapshot = await getDocs(collection(db, "users", userId, "subj"));
        const subjList = subjSnapshot.docs.map((subjDoc) => {
          const subjData = subjDoc.data();
          
          return {
            id: subjDoc.id,
            code: subjData.code,
            name: subjData.name,
            owner: subjData.owner,
            classroomId: subjData.classroomid || "ไม่พบ classroomId" // เพิ่ม classroomId
          };
        });
  
        // เพิ่มข้อมูลผู้ใช้และวิชา
        usersList.push({
          id: userId,
          email: data.email || "ไม่ระบุอีเมล",
          name: data.name || "ไม่ระบุชื่อ",
          classrooms: classroomsList,
        });
  
        // เก็บข้อมูล subjClassrooms ของแต่ละผู้ใช้
        subjClassroomsList.push(subjList);
      }
  
      // ตั้งค่าผลลัพธ์ทั้งหมดที่ได้จาก Firestore
      setUsers(usersList); // ตั้งค่า users
      setSubjClassrooms(subjClassroomsList.flat()); // ตั้งค่า subjClassrooms สำหรับทุกผู้ใช้
      
    } catch (error) {
      console.error("Error fetching users and classrooms: ", error);
      Alert.alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
    }
  };

  // ✅ ฟังก์ชันค้นหาชื่อจากอีเมลใน Firestore
const getUserNameByEmail = async (email: string) => {
  try {
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          return userData.name || "ไม่ระบุชื่อ";
      } else {
          return "ไม่พบผู้ใช้";
      }
  } catch (error) {
      console.error("เกิดข้อผิดพลาดในการค้นหาชื่อ:", error);
      return "ไม่สามารถดึงข้อมูลชื่อได้";
  }
};
  
  

  // ฟังก์ชันนี้จะดึงข้อมูลผู้ใช้ที่กำลังล็อกอิน
  const getCurrentUser = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const userName = await getUserNameByEmail(user.email || "");
      return {
        name: userName || "ไม่ระบุชื่อ",  // ชื่อของผู้ใช้
        email: user.email || "ไม่ระบุอีเมล",    // อีเมลของผู้ใช้งาน
        id: user.uid,                            // UID ของผู้ใช้งาน
      };
    } else {
      console.log("ผู้ใช้งานไม่ได้ล็อกอิน");
      return null;
    }
  };


//ฟังก์ชั่นลบ

const deleteCheckInByUser = async (ownerId: string, classroomId: string, targetStdID: string) => {
  try {
    // ✅ Path ของ `checkin` ที่ต้องการลบ
    const checkInRef = doc(firestore, "users", ownerId, "classroom", classroomId, "checkin", targetStdID);
    
    // ✅ ตรวจสอบว่าเอกสาร `checkin` มีอยู่จริงหรือไม่
    const checkInSnap = await getDoc(checkInRef);
    if (checkInSnap.exists()) {
      await deleteDoc(checkInRef); // ลบ `checkin`
      console.log(`ลบข้อมูลเช็คอินของนักเรียน: ${targetStdID}`);
    } else {
      console.log("ไม่พบข้อมูลเช็คอินของนักเรียน");
    }
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการลบข้อมูลเช็คอิน:", error);
  }
};

const deleteStudentByStdID = async (ownerId: string, classroomId: string, targetStdID: string) => {
  try {
    // ✅ ดึงข้อมูล `students`
    const studentsRef = collection(firestore, "users", ownerId, "classroom", classroomId, "students");
    const studentsSnapshot = await getDocs(studentsRef);

    if (studentsSnapshot.empty) {
      console.log("ไม่พบข้อมูลนักเรียน");
      return;
    }

    // ✅ กรองหาเอกสารของ `targetStdID`
    const studentDocsToDelete = studentsSnapshot.docs.filter(doc => doc.data().uID === targetStdID);

    if (studentDocsToDelete.length === 0) {
      console.log("ไม่พบเอกสารนักเรียนที่ตรงกับ stdID");
      return;
    }

    // ✅ ลบเอกสาร `students`
    for (const docToDelete of studentDocsToDelete) {
      await deleteDoc(docToDelete.ref);
      console.log(`ลบเอกสารนักเรียน: ${docToDelete.id}`);
    }

  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการลบข้อมูลนักเรียน:", error);
  }
};

const deleteSubjectFromUser = async (userId: string, subjectId: string) => {
  try {
    // ✅ ลบข้อมูลจาก `subj`
    const subjDocRef = doc(firestore, "users", userId, "subj", subjectId);
    await deleteDoc(subjDocRef);
    console.log(`ลบวิชา ${subjectId} เสร็จสิ้น`);
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการลบวิชา", error);
  }
};

const deleteClassroomFromSubj = async (userId: string, classroomId: string, ownerId: string, subjId: string) => {
  try {
    // ✅ 1. ลบข้อมูล `checkin` ก่อน
    await deleteCheckInByUser(ownerId, classroomId, userId);

    // ✅ 2. ลบ `students`
    await deleteStudentByStdID(ownerId, classroomId, userId);

    // ✅ 3. ลบ `subj`
    await deleteSubjectFromUser(userId, subjId);

    // ✅ 4. อัปเดตรายการวิชาที่เหลืออยู่
    const subjSnapshot = await getDocs(collection(firestore, "users", userId, "subj"));
    const updatedSubjList = subjSnapshot.docs.map((subjDoc) => {
      const subjData = subjDoc.data();
      return {
        id: subjDoc.id,
        code: subjData.code,
        name: subjData.name,
        owner: subjData.owner,
        classroomId: subjData.classroomid
      };
    });

    setSubjClassrooms(updatedSubjList);

    Alert.alert("ลบข้อมูลสำเร็จ", "วิชาได้ถูกลบออกจากรายการแล้ว");
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการลบวิชา", error);
    Alert.alert("ไม่สามารถลบวิชาได้");
  }
};


  // ฟังก์ชันค้นหาชื่อเจ้าของวิชา
  const getOwnerName = async (ownerId: string) => {
    let ownerName = "กำลังโหลด..."; 
    
    try {
      const userDoc = await getDoc(doc(firestore, "users", ownerId));
      if (userDoc.exists()) {
        ownerName = userDoc.data().name || "ไม่ระบุชื่อเจ้าของ";
      } else {
        ownerName = "ไม่พบชื่อเจ้าของ";
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลชื่อเจ้าของ", error);
      ownerName = "ไม่สามารถดึงชื่อเจ้าของได้";
    }
  
    return ownerName;
  };

  

  // โหลดข้อมูลเมื่อเริ่มต้น
  useEffect(() => {
    fetchUsersAndClassrooms();
    const fetchOwnerNames = async () => {
      const newOwnerNames: { [key: string]: string } = {};
      
      // ดึงชื่อเจ้าของของแต่ละวิชา
      await Promise.all(
        subjClassrooms.map(async (subject) => {
          if (!ownerNames[subject.owner]) {
            newOwnerNames[subject.owner] = await getOwnerName(subject.owner);
          }
        })
      );
  
      setOwnerNames((prev) => ({ ...prev, ...newOwnerNames }));
    };
  
    if (subjClassrooms.length > 0) {
      fetchOwnerNames();
    }
  }, [subjClassrooms]);
  
  
  
  

  return (
    <View style={styles.container}>
      {/* แสดงข้อมูลวิชาที่ผู้ใช้งานเพิ่มไปแล้ว */}
      <Text style={styles.header}>วิชาเรียนของคุณ:</Text>

      {subjClassrooms.length === 0 ? (
        <Text style={styles.noSubjectText}>คุณยังไม่ได้เพิ่มวิชา</Text>
      ) : (
        <FlatList
          data={subjClassrooms}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.subjectItem}>
              <Text style={styles.subjectText}>วิชา: {item.name} (รหัสวิชา: {item.code})</Text>
              <Text style={styles.ownerText}>อาจารย์: {ownerNames[item.owner] || "กำลังโหลด..."}</Text>

              {/* ปุ่มเช็คชื่อและตอบคำถาม */}
              <Button
                title="เช็คชื่อและตอบคำถาม"
                onPress={() =>
                  router.push({
                    pathname: "/check-in",
                    params: { subjectId: item.id, subjectName: item.name },
                  })
                }
                color="#007bff" // ปุ่มสีฟ้า
              />

              {/* ปุ่มลบวิชา */}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={async () => {
                  const currentUser = await getCurrentUser(); // รับข้อมูลผู้ใช้งานที่กำลังล็อกอิน
                  if (currentUser) {
                    console.log("🟢 Checking classroomId before deleting:", item.classroomId);
                    deleteClassroomFromSubj(currentUser.id, item.classroomId, item.owner, item.id); // ส่ง classroomId ไป
                  } else {
                    Alert.alert("ผู้ใช้งานไม่ได้ล็อกอิน");
                  }
                }}
              >
                <Text style={styles.deleteButtonText}>ลบวิชา</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* ปุ่มเพิ่มวิชาเรียน */}
      <TouchableOpacity
        style={[styles.button, styles.addSubjectButton]}
        onPress={() => router.push("/add-sub")}
      >
        <Text style={styles.buttonText}>เพิ่มวิชาเรียน</Text>
      </TouchableOpacity>

      {/* ปุ่มกลับหน้าหลัก */}
      <TouchableOpacity
        style={[styles.button, styles.backButton]}
        onPress={() => router.push("/")}
      >
        <Text style={styles.buttonText}>กลับหน้าหลัก</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  noSubjectText: {
    fontSize: 16,
    color: '#888',
  },
  subjectItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  subjectText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ownerText: {
    fontSize: 14,
    color: '#555',
    marginVertical: 5,
  },
  deleteButton: {
    backgroundColor: 'red',
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginVertical: 10,
    width: '50%',
    maxWidth: 300,
    alignItems: 'center',
  },
  addSubjectButton: {
    backgroundColor: '#007bff',
  },
  backButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
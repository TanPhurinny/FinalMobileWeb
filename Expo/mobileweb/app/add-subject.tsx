import { useState, useEffect } from "react";
import { FlatList, Text, View, TextInput, Button, Alert, TouchableOpacity } from "react-native";
import { firestore } from "./firebaseConfig"; // นำเข้า firestore
import { getDocs, collection, doc, getDoc, addDoc, deleteDoc } from "firebase/firestore"; // นำเข้า Firestore API
import { getAuth } from "firebase/auth";

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
  
  

  // ฟังก์ชันนี้จะดึงข้อมูลผู้ใช้ที่กำลังล็อกอิน
  const getCurrentUser = () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      return {
        name: user.displayName || "ไม่ระบุชื่อ",  // ชื่อของผู้ใช้
        email: user.email || "ไม่ระบุอีเมล",    // อีเมลของผู้ใช้งาน
        id: user.uid,                            // UID ของผู้ใช้งาน
      };
    } else {
      console.log("ผู้ใช้งานไม่ได้ล็อกอิน");
      return null;
    }
  };

  // ฟังก์ชันเพิ่มข้อมูลวิชาใหม่ลงในคอลเล็กชัน "subj" และเพิ่มข้อมูลใน "students"
  const addClassroomToSubj = async (classroom: Classroom) => {
    const user = getCurrentUser(); // ใช้ข้อมูลของผู้ใช้งานที่กำลังล็อกอิน
    if (!user) return; // ถ้าไม่ได้ล็อกอิน ให้หยุดการทำงาน

    const userId = user.id; // ID ของผู้ใช้งานที่กำลังล็อกอิน

    // ตรวจสอบว่ามีวิชานี้ใน subjClassrooms หรือไม่
    const isClassroomExists = subjClassrooms.some((subj) => subj.code === classroom.code);

    if (isClassroomExists) {
      Alert.alert("วิชานี้ถูกเพิ่มไปแล้ว", "คุณไม่สามารถเพิ่มวิชานี้ซ้ำได้");
      return; // หากมีวิชานี้อยู่แล้ว ให้หยุดการทำงาน
    }

    try {
      await addDoc(collection(firestore, "users", userId, "subj"), {
        code: classroom.code,
        name: classroom.name,
        owner: classroom.owner,
        classroomid : classroom.id
      });

      // เพิ่มข้อมูลในคอลเล็กชัน "students" สำหรับวิชานี้ (ภายใต้การจัดการของเจ้าของวิชา)
      await addDoc(collection(firestore, "users", classroom.owner, "classroom", classroom.id, "students"), {
        name: user.name, // ชื่อของผู้ใช้งานที่กำลังล็อกอิน
        email: user.email, // อีเมลของผู้ใช้งานที่กำลังล็อกอิน
        stdID: user.id // ID ของผู้ใช้งานที่กำลังล็อกอิน
      });

      // ดึงข้อมูลล่าสุดจากคอลเล็กชัน "subj" หลังจากเพิ่มเสร็จ
      const subjSnapshot = await getDocs(collection(firestore, "users", userId, "subj"));
      const updatedSubjList = subjSnapshot.docs.map((subjDoc) => {
        const subjData = subjDoc.data();
        return {
          id: subjDoc.id,
          code: subjData.code,
          name: subjData.name,
          owner: subjData.owner,
          classroomId : subjData.classroomid
        };
      });

      // อัปเดตสถานะของวิชาที่เพิ่มไปแล้ว
      setSubjClassrooms(updatedSubjList);

      Alert.alert("เพิ่มข้อมูลสำเร็จ", `วิชา ${classroom.name} ถูกเพิ่มเรียบร้อยแล้ว`);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการเพิ่มวิชา", error);
      Alert.alert("ไม่สามารถเพิ่มวิชาได้");
    }
  };



































  



  const checkStudentID = async (classroomId: string, ownerId: string) => {
    const auth = getAuth();
    const user = auth.currentUser; // ดึงข้อมูลผู้ใช้งานที่กำลังล็อกอิน
  
    if (!user) {
      console.log("ไม่มีผู้ใช้งานที่กำลังล็อกอิน");
      return;
    }
  
    const userID = user.uid; // userID ของผู้ใช้งานที่กำลังล็อกอิน
    const studentRef = doc(firestore, "users",ownerId,"classroom",classroomId,"students","umA4JT2Z1QoeafeBV53F");
    const studentCollectionRef = collection(firestore, "users", ownerId, "classroom", classroomId, "student");
    const getStudents = async () => {
      try {
        const querySnapshot = await getDocs(studentCollectionRef);
        const students = querySnapshot.docs.map(doc => ({
          id: doc.id, 
          ...doc.data()
        }));
    
        console.log("Students:", students); // แสดงข้อมูลนักเรียนทั้งหมด
        return students;
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    
    getStudents();
  
    try {
      const studentDoc = await getDoc(studentRef);
  
      if (studentDoc.exists()) {
        const studentData = studentDoc.data(); // ดึงข้อมูลนักเรียน
  
        // ตรวจสอบว่า stdID ตรงกับ userID หรือไม่
        if (studentData.stdID === userID) {
          console.log("ข้อมูลนักเรียนตรงกับผู้ใช้งานที่กำลังล็อกอิน");
        } else {
          console.log("ข้อมูลนักเรียนไม่ตรงกับผู้ใช้งานที่กำลังล็อกอิน");
        }
      } else {
        console.log("ไม่พบข้อมูลนักเรียนในที่อยู่ที่ระบุ");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการตรวจสอบข้อมูลนักเรียน:", error);
    }
  };
  










  const deleteClassroomFromSubj = async (userId: string, classroomId: string, ownerId: string, subjId:string) => {
  try {
    // ลบวิชาจากคอลเล็กชัน "subj"r

    console.log(userId)
    console.log(classroomId)
    console.log(ownerId)
    console.log(subjId)
    
    // เรียกฟังก์ชัน
    checkStudentID(classroomId,ownerId);

    // ดึงข้อมูลล่าสุดจากคอลเล็กชัน "subj" หลังจากลบเสร็จ
    const subjSnapshot = await getDocs(collection(firestore, "users", userId, "subj"));
    const updatedSubjList = subjSnapshot.docs.map((subjDoc) => {
      const subjData = subjDoc.data();
      return {
        id: subjDoc.id,
        code: subjData.code,
        name: subjData.name,
        owner: subjData.owner,
        classroomId : subjData.classroomid
      };
    });

    // อัปเดตสถานะของวิชาที่เพิ่มไปแล้ว
    setSubjClassrooms(updatedSubjList);

    Alert.alert("ลบข้อมูลสำเร็จ", "วิชาได้ถูกลบออกจากรายการแล้ว");
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการลบวิชา", error);
    Alert.alert("ไม่สามารถลบวิชาได้");
  }
};


  
  
  














  


  // ฟังก์ชันค้นหาวิชาตามรหัสที่กรอก
  const searchClassrooms = async () => {
    const filteredClassrooms: User[] = []; // กำหนดประเภทของ filteredClassrooms

    // ค้นหาวิชาตามรหัสที่กรอก
    for (const user of users) {
      const foundClassrooms = user.classrooms.filter((classroom) => classroom.code === searchCode);
      if (foundClassrooms.length > 0) {
        const classroomsWithOwnerName = await Promise.all(
          foundClassrooms.map(async (classroom) => {
            const ownerName = await getOwnerName(classroom.owner); // เรียกฟังก์ชันเพื่อค้นหาชื่อเจ้าของ
            return {
              ...classroom,
              ownerName, // เพิ่มชื่อเจ้าของเข้าไปในข้อมูลวิชา
            };
          })
        );

        filteredClassrooms.push({
          ...user,
          classrooms: classroomsWithOwnerName,
        });
      }
    }

    if (filteredClassrooms.length === 0) {
      Alert.alert("ไม่พบวิชาที่มีรหัสนี้ในระบบ");
    }

    setClassrooms(filteredClassrooms);
  };

  // ฟังก์ชันค้นหาชื่อเจ้าของวิชา
  const getOwnerName = async (ownerId: string) => {
    try {
      const userDoc = await getDoc(doc(firestore, "users", ownerId)); // แก้ไขเป็น getDoc
      if (userDoc.exists()) {
        return userDoc.data().name || "ไม่ระบุชื่อเจ้าของ";
      } else {
        return "ไม่พบชื่อเจ้าของ";
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลชื่อเจ้าของ", error);
      return "ไม่สามารถดึงชื่อเจ้าของได้";
    }
  };

  

  // โหลดข้อมูลเมื่อเริ่มต้น
  useEffect(() => {
    fetchUsersAndClassrooms();
  }, []); // โหลดข้อมูลใหม่ทุกครั้งที่ subjClassrooms เปลี่ยนแปลง
  

  

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>ค้นหาวิชาจากรหัสวิชา</Text>

      <TextInput
        style={{
          borderWidth: 1,
          width: 200,
          marginVertical: 10,
          padding: 5,
          borderRadius: 5,
          textAlign: "center",
        }}
        placeholder="กรอกรหัสวิชา"
        value={searchCode}
        onChangeText={setSearchCode}
      />
      <Button title="ค้นหา" onPress={searchClassrooms} />

      {/* แสดงข้อมูลวิชาที่ผู้ใช้งานเพิ่มไปแล้ว */}
      <Text style={{ fontSize: 16, marginVertical: 10 }}>วิชาที่คุณเพิ่มไปแล้ว:</Text>
      {subjClassrooms.length === 0 ? (
        <Text>คุณยังไม่ได้เพิ่มวิชา</Text>
      ) : (
        <FlatList
          data={subjClassrooms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ marginVertical: 5 }}>
              <Text>วิชา: {item.name} (รหัสวิชา: {item.code})</Text>
              <Text>เจ้าของ: {item.owner}</Text>
              <TouchableOpacity
  style={{
    backgroundColor: "red", // กำหนดสีแดง
    padding: 10,
    marginTop: 5,
    borderRadius: 5,
  }}
  
  onPress={() => {
    const currentUser = getCurrentUser(); // รับข้อมูลผู้ใช้งานที่กำลังล็อกอิน
    if (currentUser) {
      console.log("🟢 Checking classroomId before deleting:", item.classroomId);
      deleteClassroomFromSubj(currentUser.id, item.classroomId, item.owner, item.id); // ส่ง classroomId ไป
    } else {
      Alert.alert("ผู้ใช้งานไม่ได้ล็อกอิน");
    }
  }}
>
  <Text style={{ color: "white" }}>ลบวิชา</Text>
</TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* แสดงข้อมูลวิชาที่ค้นพบ */}
      <Text style={{ fontSize: 16, marginVertical: 10 }}>วิชาที่ค้นพบ:</Text>
      {classrooms.length === 0 ? (
        <Text style={{ marginVertical: 10, color: "gray" }}>ไม่มีวิชาในระบบที่ตรงกับรหัสที่กรอก</Text>
      ) : (
        <FlatList
          data={classrooms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ marginVertical: 10, width: 250 }}>
              <Text>{item.name} - {item.email}</Text>
              {item.classrooms.map((classroom) => (
                <View key={classroom.id} style={{ marginVertical: 5 }}>
                  <Text>วิชา: {classroom.name} (รหัสวิชา: {classroom.code})</Text>
                  <Text>เจ้าของ: {classroom.ownerName}</Text>
                  <Button
                    title="เพิ่มวิชา"
                    onPress={() => addClassroomToSubj(classroom)}
                  />
                </View>
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
}
import { useState, useEffect } from "react";
import { FlatList, Text, View, TextInput, Button, Alert, TouchableOpacity } from "react-native";
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



  // ฟังก์ชันเพิ่มข้อมูลวิชาใหม่ลงในคอลเล็กชัน "subj" และเพิ่มข้อมูลใน "students"
  const addClassroomToSubj = async (classroom: Classroom) => {
    const user = await getCurrentUser(); // ใช้ข้อมูลของผู้ใช้งานที่กำลังล็อกอิน
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

      
      setSubjClassrooms(updatedSubjList);
      router.push("/add-subject")
      Alert.alert("เพิ่มข้อมูลสำเร็จ", `วิชา ${classroom.name} ถูกเพิ่มเรียบร้อยแล้ว`);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการเพิ่มวิชา", error);
      Alert.alert("ไม่สามารถเพิ่มวิชาได้");
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
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>ค้นหาวิชา</Text>

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

      <Button title="กลับหน้ารายวิชา" onPress={() => router.push("/add-subject")} />
    </View>
  );
}
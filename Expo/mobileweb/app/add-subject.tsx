import { useState, useEffect } from "react";
import { FlatList, Text, View, TextInput, Button, Alert } from "react-native";
import { firestore } from "./firebaseConfig"; // นำเข้า firestore
import { getDocs, collection, doc, getDoc } from "firebase/firestore"; // นำเข้า Firestore API

// กำหนดประเภทข้อมูลของ classroom
type Classroom = {
  id: string;
  code: string;
  name: string;
  owner: string;
  ownerName?: string;
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
  const [searchCode, setSearchCode] = useState(""); // รหัสวิชาที่กรอก

  // ฟังก์ชันโหลดข้อมูลผู้ใช้จาก Firestore
  const fetchUsersAndClassrooms = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "users")); // ดึงข้อมูลจากคอลเลกชัน "users"
      const usersList = querySnapshot.docs.map(async (doc) => {
        const data = doc.data(); // ดึงข้อมูลจากเอกสาร
        const userId = doc.id; // id ของผู้ใช้
        
        // ดึงข้อมูลจาก "classroom" ที่เชื่อมโยงกับผู้ใช้นั้นๆ
        const classroomSnapshot = await getDocs(collection(firestore, "users", userId, "classroom"));
        const classroomsList = classroomSnapshot.docs.map(classroomDoc => {
          const classroomData = classroomDoc.data();
          return {
            id: classroomDoc.id, // เอกสาร ID ของ classroom
            code: classroomData?.info?.code || "ไม่ระบุรหัสวิชา",
            name: classroomData?.info?.name || "ไม่ระบุชื่อวิชา",
            owner: classroomData?.owner || "ไม่ระบุเจ้าของ",
          };
        });

        return {
          id: userId,
          email: data.email || "ไม่ระบุอีเมล",
          name: data.name || "ไม่ระบุชื่อ",
          classrooms: classroomsList, // เก็บข้อมูล classroom ของผู้ใช้
        };
      });

      // เนื่องจาก map ใช้ async, เราต้องใช้ Promise.all เพื่อรอให้ข้อมูลทั้งหมดโหลดเสร็จ
      const resolvedUsers = await Promise.all(usersList);
      setUsers(resolvedUsers); // บันทึกข้อมูลผู้ใช้และข้อมูล classroom ที่ดึงมา
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้หรือวิชา", error);
      Alert.alert("ไม่สามารถดึงข้อมูลผู้ใช้หรือวิชาได้");
    }
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

  // โหลดข้อมูลเมื่อเริ่มต้น
  useEffect(() => {
    fetchUsersAndClassrooms();
  }, []);

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

      {/* แสดงข้อมูลวิชา */}
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
                  <Text>เจ้าของ: {classroom.ownerName}</Text> {/* แสดงชื่อเจ้าของ */}
                </View>
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
}

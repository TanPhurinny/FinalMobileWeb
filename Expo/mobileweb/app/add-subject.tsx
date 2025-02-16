import { useState, useEffect, useCallback } from "react";
import { FlatList, Text, View, TouchableOpacity, TextInput, Button, Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AddSubject() {
    const [cid, setCid] = useState(""); // สำหรับเพิ่มวิชา
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const router = useRouter();
    type Subject = {
        cid: string; // รหัสวิชา
      };

    // ฟังก์ชันโหลดข้อมูลวิชา (ใช้ useCallback เพื่อป้องกัน re-render ไม่จำเป็น)
    const fetchSubjects = useCallback(async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const classKeys = keys.filter((key) => key.startsWith("class_"));
            const subjectData = await AsyncStorage.multiGet(classKeys);
              

            // ป้องกัน error กรณี value เป็น null
            const subjectsList = subjectData
              .map(([key, value]) => (value ? JSON.parse(value) as Subject : null)) // ใช้ `as Subject` 
            .filter((item) => item !== null) as Subject[]; // ใช้ `as Subject[]`

            setSubjects(subjectsList);
            AsyncStorage.getAllKeys().then(keys => console.log(keys));
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลวิชา", error);
        }
    }, []);

    // โหลดข้อมูลเมื่อ Component โหลด
    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    // ฟังก์ชันเพิ่มวิชา
    const handleAddSubject = async () => {
        if (!cid) {
            Alert.alert("กรุณากรอกรหัสวิชา");
            return;
        }

        try {
            await AsyncStorage.setItem(`class_${cid}`, JSON.stringify({ cid }));
            Alert.alert("เพิ่มวิชาเรียบร้อย!");
            setCid(""); // ล้างช่อง input
            fetchSubjects(); // โหลดข้อมูลใหม่
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการบันทึกวิชา", error);
        }
    };

    // ฟังก์ชันลบวิชา
    const handleDeleteSubject = async (cidToDelete: any) => {
        try {
            await AsyncStorage.removeItem(`class_${cidToDelete}`);
            Alert.alert("ลบวิชาเรียบร้อย");
            fetchSubjects(); // โหลดข้อมูลใหม่หลังจากลบ
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการลบวิชา", error);
        }
    };

    // ฟังก์ชันลบวิชาทั้งหมด
    const handleClearAllSubjects = async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const classKeys = keys.filter((key) => key.startsWith("class_"));
            await AsyncStorage.multiRemove(classKeys);
            Alert.alert("ลบวิชาทั้งหมดเรียบร้อย");
            fetchSubjects(); // โหลดข้อมูลใหม่
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการลบข้อมูลทั้งหมด", error);
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>จัดการวิชาเรียน</Text>

            {/* ช่องกรอกรหัสวิชา */}
            <TextInput
                style={{
                    borderWidth: 1,
                    width: 200,
                    marginVertical: 10,
                    padding: 5,
                    borderRadius: 5,
                    textAlign: "center",
                }}
                placeholder="รหัสวิชา"
                value={cid}
                onChangeText={setCid}
            />
            <Button title="เพิ่มวิชา" onPress={handleAddSubject} />

            {/* รายการวิชาที่บันทึกไว้ */}
            <Text style={{ marginTop: 20, fontSize: 16, fontWeight: "bold" }}>รายชื่อวิชา</Text>
            {subjects.length === 0 ? (
                <Text style={{ marginVertical: 10, color: "gray" }}>ไม่มีวิชาในระบบ</Text>
            ) : (
                <FlatList
                    data={subjects}
                    keyExtractor={(item) => item.cid.toString()} // ✅ ป้องกัน key เป็น null
                    renderItem={({ item }) => (
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                width: 250,
                                padding: 10,
                                borderWidth: 1,
                                marginVertical: 5,
                                borderRadius: 5,
                            }}
                        >
                            <Text>รหัสวิชา: {item.cid}</Text>
                            <TouchableOpacity onPress={() => handleDeleteSubject(item.cid)}>
                                <Text style={{ color: "red", fontWeight: "bold" }}>ลบ</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}

            {/* ปุ่มลบข้อมูลทั้งหมด */}
            {subjects.length > 0 && (
                <Button title="ลบวิชาทั้งหมด" color="red" onPress={handleClearAllSubjects} />
            )}
        </View>
    );
}

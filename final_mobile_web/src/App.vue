<template>
  <div id="app">
    <ProfileSection :userName="userName" :userPhoto="userPhoto" @update-profile="updateProfile" />
    <ClassroomForm @create-classroom="createClassroom" />
    <ClassroomList :classrooms="classrooms" @view-classroom="viewClassroom" @edit-classroom="editClassroom" @delete-classroom="deleteClassroom" />
  </div>
</template>

<script>
import ProfileSection from './components/ProfileSection.vue';
import ClassroomForm from './components/ClassroomForm.vue';
import ClassroomList from './components/ClassroomList.vue';
import { signInWithGoogle, signOutUser, fetchClassrooms } from './firebase/firebase.js';

export default {
  components: {
    ProfileSection,
    ClassroomForm,
    ClassroomList
  },
  data() {
    return {
      userName: '',
      userPhoto: '',
      classrooms: []
    };
  },
  methods: {
    updateProfile(name, photo) {
      this.userName = name;
      this.userPhoto = photo;
    },
    async createClassroom(code, name, photo) {
      // Function to create a classroom (call Firestore logic)
      console.log("Creating classroom with", code, name, photo);
    },
    async viewClassroom(id) {
      console.log("Viewing classroom", id);
    },
    async editClassroom(classroom) {
      console.log("Editing classroom", classroom);
    },
    async deleteClassroom(classroom) {
      console.log("Deleting classroom", classroom);
    }
  },
  mounted() {
    signInWithGoogle(); // Sign in when app is mounted
    fetchClassrooms().then(classrooms => {
      this.classrooms = classrooms;
    });
  }
}
</script>

<style scoped>
/* Add some basic styles */
</style>

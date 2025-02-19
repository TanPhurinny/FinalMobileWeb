<template>
    <div class="profile-section">
      <h4 class="mb-3">โปรไฟล์ของฉัน</h4>
      <div class="row">
        <div class="col-md-4 text-center">
          <img :src="userPhoto" class="rounded-circle mb-3" width="150" height="150" v-if="userPhoto">
        </div>
        <div class="col-md-8">
          <div class="mb-3">
            <label class="form-label">ชื่อผู้ใช้</label>
            <input type="text" v-model="userName" class="form-control">
          </div>
          <div class="mb-3">
            <label class="form-label">URL รูปโปรไฟล์</label>
            <input type="text" v-model="userPhoto" class="form-control">
          </div>
          <button class="btn btn-success" @click="updateProfile">
            <i class="fas fa-save"></i> บันทึกข้อมูล
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: ['userName', 'userPhoto'],
    methods: {
      updateProfile() {
        this.$emit('update-profile', this.userName, this.userPhoto);
      }
    }
  }
  </script>
  
  <style scoped>
  .profile-section {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
  }
  </style>
gi
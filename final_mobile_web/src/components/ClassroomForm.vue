<template>
    <div class="create-form card p-4 mb-4">
      <h4 class="text-center mb-3">สร้างห้องเรียนใหม่</h4>
      <div class="mb-3">
        <label class="form-label">รหัสวิชา</label>
        <input type="text" class="form-control" v-model="classCode">
      </div>
      <div class="mb-3">
        <label class="form-label">ชื่อวิชา</label>
        <input type="text" class="form-control" v-model="className">
      </div>
      <div class="mb-3">
        <label class="form-label">URL รูปภาพ</label>
        <input type="text" class="form-control" v-model="classPhoto">
      </div>
      <button class="btn btn-success w-100" @click="createClassroom">
        <i class="fas fa-plus-circle"></i> สร้างห้องเรียน
      </button>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        classCode: '',
        className: '',
        classPhoto: ''
      };
    },
    methods: {
      createClassroom() {
        this.$emit('create-classroom', this.classCode, this.className, this.classPhoto);
        this.classCode = '';
        this.className = '';
        this.classPhoto = '';
      }
    }
  }
  </script>
  
  <style scoped>
  .create-form {
    max-width: 600px;
    margin: 0 auto;
  }
  </style>
  
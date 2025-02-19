<template>
    <div class="row">
      <div v-for="classroom in classrooms" :key="classroom.id" class="col-md-4 mb-4">
        <div class="card">
          <img :src="classroom.info.photo || 'https://via.placeholder.com/400'" class="card-img-top" alt="classroom image" style="height: 200px; object-fit: cover;">
          <div class="card-body">
            <h5 class="card-title">{{ classroom.info.name }}</h5>
            <p class="card-text">รหัสวิชา: {{ classroom.info.code }}</p>
            <div class="btn-group w-100">
              <button class="btn btn-primary" @click="viewClassroom(classroom.id)">
                <i class="fas fa-eye"></i> ดู
              </button>
              <button class="btn btn-warning" @click="editClassroom(classroom)">
                <i class="fas fa-edit"></i> แก้ไข
              </button>
              <button class="btn btn-danger" @click="deleteClassroom(classroom)">
                <i class="fas fa-trash"></i> ลบ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: ['classrooms'],
    methods: {
      viewClassroom(classroomId) {
        this.$emit('view-classroom', classroomId);
      },
      editClassroom(classroom) {
        this.$emit('edit-classroom', classroom);
      },
      deleteClassroom(classroom) {
        this.$emit('delete-classroom', classroom);
      }
    }
  }
  </script>
  
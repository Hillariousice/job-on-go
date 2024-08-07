<!-- eslint-disable vue/multi-word-component-names -->
<!-- <script  lang="ts">

export default {
  data() {
    return {
      msg: 'Hello Vue 3 + Vite',
      status: 'connecting',
      tasks: [
        "Take out the trash",
        "Do the dishes",
        "Mow the lawn",
        "Clean the house",
      ],
      link: 'https://v3.vuejs.org/'
    }
  },
  methods:{
    toggleStatus(){
      if(this.status === 'active'){
        this.status = 'connecting';
    }else if(this.status === 'connecting'){
        this.status = 'inactive';
      }else{
          this.status = 'active';
        }
      }
  }
}
</script> -->

<!-- <template>
 <h1>{{msg}}</h1>
 <p v-if="status === 'active'">user is online </p>
 <p v-else-if="status === 'connecting'">user is connecting </p>
 <p v-else>user is offline </p>
 <h3>Tasks:</h3>
 <ul>
  <li v-for="task in tasks" :key="task">
{{ task }}
  </li>
 </ul> -->
 <!-- <a v-bind:href="link">Click Here For Documentation</a> -->
 <!-- <a :href="link">Click Here For Documentation</a>
<br/> -->
 <!-- <button v-on:click="toggleStatus">Change Status</button> -->
  <!-- <button @click="toggleStatus">Change Status</button> -->
<!-- </template>  -->

<!-- <style scoped>
h1 {
  color: red;
}
</style> -->

<!-- <script setup lang="ts">
import { ref } from 'vue';
import { onMounted } from 'vue';
    const msg = ref('To Do List');
    const status = ref('active');
    const tasks = ref([
      "Take out the trash",
      "Do the dishes",
      "Mow the lawn",
      "Clean the house",
    ]);
    const newTask = ref('');
    const link = ref('https://v3.vuejs.org/');
   const toggleStatus = () => {
      if(status.value === 'active'){
        status.value = 'connecting';
    }else if(status.value === 'connecting'){
        status.value = 'inactive';
      }else{
          statue.value = 'active';
        }
      };
   const addTask = () => {
   if(newTask.value.trim() !== ''){
     tasks.value.push(newTask.value);
     newTask.value = '';
    }
  };
  const  deleteTask = (index: string ) => {
    tasks.value.splice(index, 1);
  };

  onMounted(async ()=>{
    try{
      const res = await fetch('https://jsonplaceholder.typicode.com/todos');
      const data = await res.json();
      tasks.value = data.map((task: any) => task.title);
    }catch(err: any){
      console.log(err);
    }
  })
</script> -->
<!-- 
<template> -->
 <!-- <h1>{{msg}}</h1>
 <p v-if="status === 'active'">user is online </p>
 <p v-else-if="status === 'connecting'">user is connecting </p>
 <p v-else>user is offline </p>
<form @submit.prevent="addTask">
  <label for="task">Add Task:</label>
  <input type="text" id="newTask" v-model="newTask"/>
  <button type="submit">Add Task</button>
</form>

 <h3>Tasks:</h3>
 <ul>
  <li v-for="(task, index) in tasks" :key="task">
<span>{{ task }}</span>
<button @click="deleteTask(index)">Delete Task</button>
  </li>
 </ul> -->
 <!-- <a v-bind:href="link">Click Here For Documentation</a> -->
 <!-- <a :href="link">Click Here For Documentation</a>
<br/> -->
 <!-- <button v-on:click="toggleStatus">Change Status</button> -->
  <!-- <button @click="toggleStatus">Change Status</button> -->
<!-- </template> -->

<!-- <style scoped>
h1 {
  color: red;
}
</style> -->
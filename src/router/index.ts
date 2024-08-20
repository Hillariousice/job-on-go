import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import JobsView from "@/views/jobs/JobsView.vue";
import LoginView from "@/views/auth/LoginView.vue";
import NotFoundView from "@/views/NotFoundView.vue";
import JobView from "@/views/jobs/JobView.vue";
import SingUpView from "@/views/auth/SingUpView.vue";
// import AddJobView from "@/views/jobs/AddJobView.vue";
import EditJobView from "@/views/jobs/EditJobView.vue";

const  router = createRouter({
   history: createWebHistory(import.meta.env.BASE_URL),
   routes: [{
    path: '/',
    name: 'home',
    component: HomeView
   },
   {
    path: '/jobs',
    name: 'jobs',
    component: JobsView
   },
   {
    path: '/signup',
    name: 'signup',
    component: SingUpView
   },
   {
      path: '/login',
      name: 'login',
      component: LoginView
     },
   {
      path: '/jobs/:id',
      name: 'job',
      component: JobView
     },
    //  {
    //   path: '/jobs/add',
    //   name: 'add-job',
    //   component: AddJobView,
    // },
    {
      path: '/jobs/edit/:id',
      name: 'edit-job',
      component: EditJobView,
    },
   {
      path: '/:catchAll(.*)',
      name: 'not-found',
      component: NotFoundView
     },
]
});

export default  router;
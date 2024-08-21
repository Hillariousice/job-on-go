import CompanySignupView from "@/views/company/CompanySingUpView.vue";
import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import JobsView from "@/views/jobs/JobsView.vue";
import LoginView from "@/views/auth/LoginView.vue";
import NotFoundView from "@/views/NotFoundView.vue";
import JobView from "@/views/jobs/JobView.vue";
import SingUpView from "@/views/auth/SingUpView.vue";
import AddJobView from "@/views/jobs/AddJobView.vue";
import UserDashboard from "@/views/DashboardView.vue";
import EditJobView from "@/views/jobs/EditJobView.vue";
import { getAuth } from "firebase/auth";

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
    path: '/company_signup',
    name: 'company_signup',
    component: CompanySignupView  
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
     {
      path: '/jobs/add',
      name: 'add-job',
      component: AddJobView,
    },
    { path: '/dashboard', 
      component: UserDashboard,
       meta: { requiresAuth: true } },
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
router.beforeEach((to, from, next) => {
   const auth = getAuth();
   const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
 
   if (requiresAuth && !auth.currentUser) {
     next('/login');
   } else {
     next();
   }
 });

export default  router;
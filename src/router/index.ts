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
import JobApplicantsView from "@/views/company/JobApplicantsView.vue"; // Import the new view
import ProfileView from "@/views/ProfileView.vue";
import SettingsView from "@/views/SettingsView.vue";
import ChangePasswordView from "@/views/settings/ChangePasswordView.vue";
import HelpView from "@/views/settings/HelpView.vue";
import ManageAccountView from "@/views/settings/ManageAccountView.vue"; // Added ManageAccountView import
import { getAuth } from "firebase/auth";
import ProfileView from "@/views/settings/ProfileView.vue";

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
      meta: { requiresAuth: true } // Assuming add job also requires auth
    },
    {
      path: '/dashboard',
      component: UserDashboard,
<<<<<<< HEAD
       meta: { requiresAuth: true } },

    { path: '/profile', 
        name: 'profile',
        component: ProfileView,
         },
=======
      meta: { requiresAuth: true }
    },
>>>>>>> a1db77320d8685f944bd2748f476587fc7593f36
    {
      path: '/jobs/edit/:id',
      name: 'edit-job',
      component: EditJobView,
      meta: { requiresAuth: true } // Assuming edit job also requires auth
    },
    {
      path: '/jobs/:jobId/applicants', // Route for viewing applicants
      name: 'job-applicants',
      component: JobApplicantsView,
      meta: { requiresAuth: true } // Requires auth, component handles owner check
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/settings/change-password',
      name: 'change-password',
      component: ChangePasswordView,
      meta: { requiresAuth: true }
    },
    {
      path: '/settings/help',
      name: 'settings-help',
      component: HelpView,
      meta: { requiresAuth: true }
    },
    {
      path: '/settings/manage-account',
      name: 'settings-manage-account',
      component: ManageAccountView,
      meta: { requiresAuth: true }
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
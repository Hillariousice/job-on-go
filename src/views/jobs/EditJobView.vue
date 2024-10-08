<script setup lang="ts">
import { reactive, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import router from '@/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

interface Job {
  id: string;
  title: string;
  type: string;
  description: string;
  location: string;
  salary: string;
  company: {
    name: string;
    description: string;
    contactEmail: string;
    contactPhone: string;
  };
  userId: string; // Add userId field to track job ownership
}

const route = useRoute();
const jobId = route.params.id as string;

const form = reactive({
  type: '',
  title: '',
  description: '',
  salary: '',
  location: '',
  company: {
    name: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
  },
});

const state = reactive<{
  job: Job;
  isLoading: boolean;
}>({
  job: {
    id: '',
    title: '',
    type: '',
    description: '',
    location: '',
    salary: '',
    company: {
      name: '',
      description: '',
      contactEmail: '',
      contactPhone: '',
    },
    userId: '', // Initialize userId
  },
  isLoading: true,
});

const toast = useToast();
const isAuthenticated = ref(false);
const isOwner = ref(false); // Add a new ref to check job ownership

const auth = getAuth();

const checkAuth = () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      isAuthenticated.value = true;
      // Check if the logged-in user is the owner of the job
      if (state.job.userId && user.uid === state.job.userId) {
        isOwner.value = true;
      } else {
        isOwner.value = false;
      }
    } else {
      isAuthenticated.value = false;
      router.push('/login'); // Redirect to login if not authenticated
    }
  });
};

// Fetch the job details from Firestore
const fetchJob = async () => {
  try {
    const jobDocRef = doc(db, "jobs", jobId);  // Replace "jobs" with your collection name
    const jobDoc = await getDoc(jobDocRef);

    if (jobDoc.exists()) {
      state.job = jobDoc.data() as Job;
      // Populate inputs
      form.type = state.job.type;
      form.title = state.job.title;
      form.description = state.job.description;
      form.salary = state.job.salary;
      form.location = state.job.location;
      form.company.name = state.job.company.name;
      form.company.description = state.job.company.description;
      form.company.contactEmail = state.job.company.contactEmail;
      form.company.contactPhone = state.job.company.contactPhone;

      // Check if the logged-in user is the owner after fetching job data
      const user = auth.currentUser;
      if (user && user.uid === state.job.userId) {
        isOwner.value = true;
      }
    } else {
      console.error('No such job!');
    }
  } catch (error) {
    console.error('Error fetching job', error);
  } finally {
    state.isLoading = false;
  }
};

// Submit the updated job data to Firestore
const handleSubmit = async () => {
  if (!isOwner.value) {
    toast.error('You are not authorized to update this job.');
    return;
  }

  const updatedJob = {
    title: form.title,
    type: form.type,
    location: form.location,
    description: form.description,
    salary: form.salary,
    company: {
      name: form.company.name,
      description: form.company.description,
      contactEmail: form.company.contactEmail,
      contactPhone: form.company.contactPhone,
    },
  };

  try {
    const jobDocRef = doc(db, "jobs", jobId);  // Replace "jobs" with your collection name
    await updateDoc(jobDocRef, updatedJob);
    toast.success('Job Updated Successfully');
    router.push(`/jobs/${jobId}`);
  } catch (error) {
    console.error('Error updating job', error);
    toast.error('Job Was Not Updated');
  }
};

onMounted(() => {
  fetchJob();
  checkAuth();
});
</script>


<template>
  <section class="bg-green-50">
    <div class="container m-auto max-w-2xl py-24">
      <div
        class="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0"
      >
        <form v-if="isAuthenticated && isOwner" @submit.prevent="handleSubmit">
          <h2 class="text-3xl text-center font-semibold mb-6">Edit Job</h2>

          <div class="mb-4">
            <label for="type" class="block text-gray-700 font-bold mb-2"
              >Job Type</label
            >
            <select
              v-model="form.type"
              id="type"
              name="type"
              class="border rounded w-full py-2 px-3"
              required
            >
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Remote">Remote</option>
              <option value="Internship">Internship</option>
            </select>
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-bold mb-2"
              >Job Listing Name</label
            >
            <input
              type="text"
              v-model="form.title"
              id="name"
              name="name"
              class="border rounded w-full py-2 px-3 mb-2"
              placeholder="eg. Beautiful Apartment In Miami"
              required
            />
          </div>
          <div class="mb-4">
            <label for="description" class="block text-gray-700 font-bold mb-2"
              >Description</label
            >
            <textarea
              id="description"
              v-model="form.description"
              name="description"
              class="border rounded w-full py-2 px-3"
              rows="4"
              placeholder="Add any job duties, expectations, requirements, etc"
            ></textarea>
          </div>

          <div class="mb-4">
            <label for="type" class="block text-gray-700 font-bold mb-2"
              >Salary</label
            >
            <select
              id="salary"
              v-model="form.salary"
              name="salary"
              class="border rounded w-full py-2 px-3"
              required
            >
              <option value="Under $50K">under $50K</option>
              <option value="$50K - $60K">$50 - $60K</option>
              <option value="$60K - $70K">$60 - $70K</option>
              <option value="$70K - $80K">$70 - $80K</option>
              <option value="$80K - $90K">$80 - $90K</option>
              <option value="$90K - $100K">$90 - $100K</option>
              <option value="$100K - $125K">$100 - $125K</option>
              <option value="$125K - $150K">$125 - $150K</option>
              <option value="$150K - $175K">$150 - $175K</option>
              <option value="$175K - $200K">$175 - $200K</option>
              <option value="Over $200K">Over $200K</option>
            </select>
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-bold mb-2"> Location </label>
            <input
              type="text"
              v-model="form.location"
              id="location"
              name="location"
              class="border rounded w-full py-2 px-3 mb-2"
              placeholder="Company Location"
              required
            />
          </div>

          <h3 class="text-2xl mb-5">Company Info</h3>

          <div class="mb-4">
            <label for="company" class="block text-gray-700 font-bold mb-2"
              >Company Name</label
            >
            <input
              type="text"
              v-model="form.company.name"
              id="company"
              name="company"
              class="border rounded w-full py-2 px-3"
              placeholder="Company Name"
            />
          </div>

          <div class="mb-4">
            <label
              for="company_description"
              class="block text-gray-700 font-bold mb-2"
              >Company Description</label
            >
            <textarea
              id="company_description"
              v-model="form.company.description"
              name="company_description"
              class="border rounded w-full py-2 px-3"
              rows="4"
              placeholder="What does your company do?"
            ></textarea>
          </div>

          <div class="mb-4">
            <label
              for="contact_email"
              class="block text-gray-700 font-bold mb-2"
              >Contact Email</label
            >
            <input
              type="email"
              v-model="form.company.contactEmail"
              id="contact_email"
              name="contact_email"
              class="border rounded w-full py-2 px-3"
              placeholder="Email address for applicants"
              required
            />
          </div>
          <div class="mb-4">
            <label
              for="contact_phone"
              class="block text-gray-700 font-bold mb-2"
              >Contact Phone</label
            >
            <input
              type="tel"
              v-model="form.company.contactPhone"
              id="contact_phone"
              name="contact_phone"
              class="border rounded w-full py-2 px-3"
              placeholder="Optional phone for applicants"
            />
          </div>

          <div>
            <button
              class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Update Job
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { auth, storage, db } from "@/firebaseConfig";
import { updateProfile } from "firebase/auth";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { updateDoc, doc } from "firebase/firestore";
import { useToast } from 'vue-toast-notification';

// Form state
const userFirstName = ref("");
const userLastName = ref("");
const userEmail = ref("");
const userNumber = ref("");
const userAddress = ref("");
const userCountry = ref("");
const userStatus = ref("");
const userEmploymentStatus = ref("");
const userPhoto = ref("");
const newPhotoFile = ref<File | undefined>();
const isUploading = ref(false);
const isLoading = ref(false);

// Get authenticated user
const user = auth?.currentUser;
const userId = user?.uid;
const toast = useToast();
// Fetch user's current details
onMounted(() => {
  if (user) {
    userFirstName.value = user?.displayName?.split(" ")[0] || "";
    userLastName.value = user?.displayName?.split(" ")[1] || "";
    userEmail.value = user?.email || "";
    userNumber.value = user?.phoneNumber || "";
  }
});

// Handle new avatar selection
const handleSelectImage = (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (files && files.length > 0) {
    newPhotoFile.value = files[0];
    userPhoto.value = URL.createObjectURL(files[0]);
  }
};

// Upload new photo to Firebase Storage
const handlePhotoUpload = async () => {
  if (userId && newPhotoFile.value) {
    isUploading.value = true;
    try {
      const storageRefPath = storageRef(storage, `${userId}/profile_photo/avatar`);
      const uploadTask = uploadBytesResumable(storageRefPath, newPhotoFile.value);
      
      uploadTask.on(
        "state_changed",
        null,
        error => {
          toast.error(error.message);
          isUploading.value = false;
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await updateProfile(user, { photoURL: downloadURL });
          await updateDoc(doc(db, "users", userId), { photoURL: downloadURL });
          toast.success("Profile picture updated successfully");
          isUploading.value = false;
        }
      );
    } catch (error: any) {
      toast.error(error.message);
      isUploading.value = false;
    }
  }
};

// Handle form submission for updating user details
const handleUpdate = async () => {
  if (!userId) return;

  isLoading.value = true;
  try {
    await updateProfile(user, {
      displayName: `${userFirstName.value} ${userLastName.value}`,
    });

    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      firstName: userFirstName.value,
      lastName: userLastName.value,
      phone: userNumber.value,
      address: userAddress.value,
      country: userCountry.value,
      status: userStatus.value,
      employmentStatus: userEmploymentStatus.value,
    });

    toast.success("Profile updated successfully");
  } catch (error: any) {
    toast.error(error.message);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <section class="max-w-4xl mx-auto p-6">
    <form class="mb-8">
      <label class="block mb-4">
        <span class="text-gray-700 text-bold">Profile</span>
        <div class="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 mt-2">
          <input type="file" accept="image/*" @change="handleSelectImage" class="hidden" />
          <img v-if="userPhoto" :src="userPhoto" alt="Profile" class="w-full h-full object-cover" />
          <i v-else class="pi pi-envelope absolute inset-0 flex justify-center items-center text-gray-500"></i>
        </div>
        <button
          @click.prevent="handlePhotoUpload"
          :disabled="isUploading || !newPhotoFile"
          class="mt-4 px-4 py-2 bg-purple-500 text-white rounded-md"
        >
          {{ isUploading ? 'Uploading...' : 'Change Image' }}
        </button>
      </label>
    </form>

    <form @submit.prevent="handleUpdate">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="mb-4 relative">
        <label for="first-name" class="block text-gray-700">First Name</label>
        <i class="pi pi-user absolute right-2 top-2/3 transform -translate-y-1/2 text-gray-400"></i>
        <input 
          v-model="userFirstName"
          type="text" 
          id="firstName" 
          class="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-purple-600 active:border-purple-600 disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-black dark:focus:border-purple-600" 
          required 
        />
      </div>
      <div class="mb-4 relative">
        <label for="last-name" class="block text-gray-700">Last Name</label>
        <i class="pi pi-user absolute right-2 top-2/3 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              v-model="userLastName"
              class="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-purple-600 active:border-purple-600 disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-black dark:focus:border-purple-600"
              required
            />
          
        </div>
        <div class="mb-4 relative">
        <label for="email" class="block text-gray-700">Email</label>
        <i class="pi pi-envelope absolute right-2 top-2/3 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="email"
              v-model="userEmail"
              class="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-purple-600 active:border-purple-600 disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-black dark:focus:border-purple-600"
             required
            />
         
        </div>
        <div class="mb-4 relative">
        <label for="phone" class="block text-gray-700">Phone</label>
        <i class="pi pi-phone absolute right-2 top-2/3 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="tel"
              v-model="userNumber"
              class="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-purple-600 active:border-purple-600 disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-black dark:focus:border-purple-600"
              required
            />
         
        </div>
        <div class="mb-4 relative">
        <label for="address" class="block text-gray-700">Address</label>
        <i class="pi pi-user absolute right-2 top-2/3 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              v-model="userAddress"
              class="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-purple-600 active:border-purple-600 disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-black dark:focus:border-purple-600"
            />
          
        </div>
        <div class="mb-4 relative">
        <label for="country" class="block text-gray-700">Country</label>
        <i class="pi pi-user absolute right-2 top-2/3 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              v-model="userCountry"
              class="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-purple-600 active:border-purple-600 disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-black dark:focus:border-purple-600"
            />
          
        </div>
        <div class="mb-4 relative">
        <label for="status" class="block text-gray-700">Status</label>
        <i class="pi pi-user absolute right-2 top-2/3 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              v-model="userStatus"
              class="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-purple-600 active:border-purple-600 disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-black dark:focus:border-purple-600"
              required
              />
          
        </div>
        <div class="mb-4 relative">
        <label for="employmentStatus" class="block text-gray-700"> Employment Status</label>
        <i class="pi pi-user absolute right-2 top-2/3 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              v-model="userEmploymentStatus"
              class="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-purple-600 active:border-purple-600 disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-black dark:focus:border-purple-600"
              required
              />
          
        </div>
      </div>

      <div class="mt-8 flex justify-end">
        <button
          type="submit"
          :disabled="isLoading"
          class="px-6 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
        >
          {{ isLoading ? 'Updating...' : 'Update Profile' }}
        </button>
      </div>
    </form>
  </section>
</template>

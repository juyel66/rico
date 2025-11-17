// import axios from "axios";

// const API_BASE_URL = "https://appointment-manager-node.onrender.com/api/v1";

// // Save user & token
// const saveUserToStorage = (data: any) => {
//   localStorage.setItem("user", JSON.stringify(data.user));
//   localStorage.setItem("token", data.token);
// };

// // Remove user
// const removeUserFromStorage = () => {
//   localStorage.removeItem("user");
//   localStorage.removeItem("token");
// };

// // Get current user
// export const getCurrentUser = () => {
//   const user = localStorage.getItem("user");
//   const token = localStorage.getItem("token");
//   return user && token ? { user: JSON.parse(user), token } : null;
// };

// // REGISTER USER
// export const registerUser = async (data: {
//   name: string;
//   email: string;
//   password: string;
//   role: "PATIENT" | "ADMIN";
//   specialization?: string;
//   photo_url?: string;
// }) => {
//   try {
//     const { name, email, password, role, specialization, photo_url } = data;

//     // Choose API based on role
//     const endpoint =
//       role === "PATIENT" ? "/auth/register/patient" : "/auth/register/ADMIN";

//     const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
//       name,
//       email,
//       password,
//       ...(role === "ADMIN" && { specialization }),
//       ...(photo_url && { photo_url }),
//     });

//     if (response.data.success) {
//       return { success: true, user: response.data.data };
//     } else {
//       return { success: false, message: response.data.message };
//     }
//   } catch (error: any) {
//     // FRONTEND CHECK: if already registered with another role
//     if (
//       error.response?.data?.message?.includes("already registered") &&
//       error.response?.data?.existingUser
//     ) {
//       const existingRole = error.response.data.existingUser.role;
//       return {
//         success: false,
//         message: `User already exists with role ${existingRole}, cannot register as ${data.role}`,
//       };
//     }

//     return {
//       success: false,
//       message: error.response?.data?.message || error.message,
//     };
//   }
// };

// // LOGIN USER
// export const loginUser = async (data: {
//   email: string;
//   password: string;
//   role: "PATIENT" | "ADMIN";
// }) => {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/auth/login`, data);

//     if (response.data.success) {
//       const userRole = response.data.data.user.role;

//       // FRONTEND VALIDATION: role match
//       if (userRole !== data.role) {
//         return {
//           success: false,
//           message: `Cannot login from this portal. Your role is ${userRole}`,
//         };
//       }

//       saveUserToStorage(response.data.data);
//       return { success: true, data: response.data.data };
//     } else {
//       return { success: false, message: response.data.message };
//     }
//   } catch (error: any) {
//     return { success: false, message: error.response?.data?.message || error.message };
//   }
// };

// // LOGOUT
// export const logoutUser = () => {
//   removeUserFromStorage();
// };

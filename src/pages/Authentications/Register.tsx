// // src/pages/Register.tsx
// import React, { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import { register, selectAuth } from "@/features/Auth/authSlice";
// import toast from "react-hot-toast";
// import Swal from "sweetalert2";

// // Reusable logo component
// const EastmondVillasLogo = () => (
//   <div className="flex items-center justify-center space-x-4 p-6 bg-white rounded-t-xl">
//     <img
//       className="h-20"
//       src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760303130/hd_svg_logo_1_rfsh4e.png"
//       alt="Eastmond Villas Logo"
//     />
//   </div>
// );

// // Assuming AppDispatch is imported or defined elsewhere
// // type AppDispatch = any; 

// const Register: React.FC = () => {
//   const dispatch = useDispatch<AppDispatch | any>();
//   const authState = useSelector(selectAuth);

//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [phone, setPhone] = useState("");
//   const [password1, setPassword1] = useState("");
//   const [password2, setPassword2] = useState("");

//   const [localError, setLocalError] = useState<string | null>(null);
//   const navigate = useNavigate();

//   const primaryColor = "bg-[#00A597] hover:bg-[#008f82]";

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setLocalError(null);

//     // Client-side validation + toast
//     if (!name.trim() || !email.trim() || !password1 || !password2) {
//       setLocalError("Please fill all required fields.");
//       toast.error("Please fill all required fields.");
//       return;
//     }
//     if (password1 !== password2) {
//       setLocalError("Passwords do not match.");
//       toast.error("Passwords do not match.");
//       return;
//     }

//     const payload = {
//       email: email.trim(),
//       name: name.trim(),
//       phone: phone.trim(),
//       password1: password1,
//       password2: password2,
//     };

//     // Optionally show a loading toast (uncomment if you want)
//     // const loadingToastId = toast.loading("Registering...");

//     const resultAction = await dispatch(register(payload));

//     // dismiss loading toast if used
//     // toast.dismiss(loadingToastId);

//     if (register.fulfilled.match(resultAction)) {
//       console.log("Registration successful:", resultAction.payload);

//     Swal.fire({
//       icon: "success",
//       title: "Registration Successful",
//       text: "Please login",
//     });

//       navigate("/login");
//     } else {
//       console.error("Registration failed:", resultAction.payload || resultAction.error);

//       // Derive a user-friendly message from the payload or error
//       let errorMessage = "Registration failed";
//       if (resultAction.payload && typeof resultAction.payload === "object") {
//         const payloadErr = resultAction.payload as Record<string, any>; // Type assertion for safety
//         const firstKey = Object.keys(payloadErr)[0];
//         const firstMsg = payloadErr[firstKey];
//         errorMessage =
//           typeof firstMsg === "string"
//             ? firstMsg
//             : Array.isArray(firstMsg)
//             ? String(firstMsg[0])
//             : "Registration failed";
//       } else {
//         errorMessage = resultAction.error?.message || "Registration failed";
//       }

//       // 🚩 SweetAlert2 (Swal.fire) কে এখন ডাইনামিক এরর মেসেজ দেখানো হবে
//       Swal.fire({
//         icon: "error",
//         title: "Registration Failed",
//         text: errorMessage, // <-- পরিবর্তিত লাইন
//       });

//       setLocalError(errorMessage);
//       toast.error(errorMessage, 
//         { position: "top-center" });
//     }
//   };

//   return (
//     <div
//       className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 pb-10 rounded-xl shadow-lg border border-gray-200 mx-auto bg-cover bg-center bg-no-repeat"
//       style={{
//         backgroundImage:
//           "url('https://res.cloudinary.com/dqkczdjjs/image/upload/v1760812885/savba_k7kol1.png')",
//       }}
//     >
//       <div className="w-full max-w-md">
//         <EastmondVillasLogo />

//         <div className="bg-white p-8 rounded-b-xl shadow-lg">
//           <div className="mb-6 p-0 rounded">
//             <h2 className="text-xl font-semibold text-gray-800 mb-1">User</h2>
//             <p className="text-sm text-gray-500">Create your new account to access the dashboard</p>
//           </div>

//           <form onSubmit={handleSubmit} className="space-y-4" noValidate>
//             <div>
//               <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
//                 Full Name
//               </label>
//               <input
//                 id="name"
//                 type="text"
//                 placeholder="John Doe"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-gray-700 text-sm"
//                 required
//               />
//             </div>

//             <div>
//               <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
//                 Email
//               </label>
//               <input
//                 id="email"
//                 type="email"
//                 placeholder="user@example.com"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-gray-700 text-sm"
//                 required
//               />
//             </div>

//             <div>
//               <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
//                 Phone
//               </label>
//               <input
//                 id="phone"
//                 type="tel"
//                 placeholder="+1 246 1234567"
//                 value={phone}
//                 onChange={(e) => setPhone(e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-gray-700 text-sm"
//               />
//             </div>

//             <div>
//               <label htmlFor="password1" className="block text-sm font-medium text-gray-700 mb-1">
//                 Password
//               </label>
//               <input
//                 id="password1"
//                 type="password"
//                 placeholder="••••••••"
//                 value={password1}
//                 onChange={(e) => setPassword1(e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-700 text-sm"
//                 required
//               />
//             </div>

//             <div>
//               <label htmlFor="password2" className="block text-sm font-medium text-gray-700 mb-1">
//                 Confirm Password
//               </label>
//               <input
//                 id="password2"
//                 type="password"
//                 placeholder="••••••••"
//                 value={password2}
//                 onChange={(e) => setPassword2(e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-700 text-sm"
//                 required
//               />
//             </div>

//             {localError && <p className="text-sm text-red-600">{localError}</p>}
//             {authState.error && typeof authState.error === "string" && (
//               <p className="text-sm text-red-600">{authState.error}</p>
//             )}

//             <button
//               type="submit"
//               className={`w-full text-white font-medium py-3 rounded-md transition duration-150 ${primaryColor}`}
//               disabled={authState.loading}
//             >
//               {authState.loading ? "Registering..." : "Register Account"}
//             </button>
//           </form>

//           <div className="mt-6 text-center text-sm pt-4 border-t border-gray-200">
//             <p className="text-gray-600">
//               Already have an account?{" "}
//               <Link to="/login" className="font-semibold text-[#00A597] hover:text-[#008f82] transition duration-150">
//                 Login here
//               </Link>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Register;














// src/pages/Register.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register, selectAuth } from "@/features/Auth/authSlice";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

// Reusable logo component
const EastmondVillasLogo = () => (
  <div className="flex items-center justify-center space-x-4 p-6 bg-white rounded-t-xl">
    <img
      className="h-20"
      src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760303130/hd_svg_logo_1_rfsh4e.png"
      alt="Eastmond Villas Logo"
    />
  </div>
);

// Assuming AppDispatch is imported or defined elsewhere
// type AppDispatch = any;

const Register: React.FC = () => {
  const dispatch = useDispatch<AppDispatch | any>();
  const authState = useSelector(selectAuth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");

  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();

  const primaryColor = "bg-[#00A597] hover:bg-[#008f82]";

  // Redirect to home if already authenticated
  useEffect(() => {
    if (authState?.access && authState?.user) {
      // User is logged in — don't allow visiting /register, send to home
      navigate("/", { replace: true });
    }
  }, [authState, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    // Client-side validation + toast
    if (!name.trim() || !email.trim() || !password1 || !password2) {
      setLocalError("Please fill all required fields.");
      toast.error("Please fill all required fields.");
      return;
    }
    if (password1 !== password2) {
      setLocalError("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }

    const payload = {
      email: email.trim(),
      name: name.trim(),
      phone: phone.trim(),
      password1: password1,
      password2: password2,
    };

    // Optionally show a loading toast (uncomment if you want)
    // const loadingToastId = toast.loading("Registering...");

    const resultAction = await dispatch(register(payload));

    // dismiss loading toast if used
    // toast.dismiss(loadingToastId);

    if (register.fulfilled.match(resultAction)) {
      console.log("Registration successful:", resultAction.payload);

      Swal.fire({
        icon: "success",
        title: "Registration Successful",
        text: "Please login",
      });

      navigate("/login", { replace: true });
    } else {
      console.error("Registration failed:", resultAction.payload || resultAction.error);

      // Derive a user-friendly message from the payload or error
      let errorMessage = "Registration failed";
      if (resultAction.payload && typeof resultAction.payload === "object") {
        const payloadErr = resultAction.payload as Record<string, any>;
        const firstKey = Object.keys(payloadErr)[0];
        const firstMsg = payloadErr[firstKey];
        errorMessage =
          typeof firstMsg === "string"
            ? firstMsg
            : Array.isArray(firstMsg)
            ? String(firstMsg[0])
            : "Registration failed";
      } else {
        errorMessage = resultAction.error?.message || "Registration failed";
      }

      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: errorMessage,
      });

      setLocalError(errorMessage);
      toast.error(errorMessage, { position: "top-center" });
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 pb-10 rounded-xl shadow-lg border border-gray-200 mx-auto bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "url('https://res.cloudinary.com/dqkczdjjs/image/upload/v1760812885/savba_k7kol1.png')",
      }}
    >
      <div className="w-full max-w-md">
        <EastmondVillasLogo />

        <div className="bg-white p-8 rounded-b-xl shadow-lg">
          <div className="mb-6 p-0 rounded">
            <h2 className="text-xl font-semibold text-gray-800 mb-1">User</h2>
            <p className="text-sm text-gray-500">Create your new account to access the dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-gray-700 text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-gray-700 text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="+1 246 1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-gray-700 text-sm"
              />
            </div>

            <div>
              <label htmlFor="password1" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password1"
                type="password"
                placeholder="••••••••"
                value={password1}
                onChange={(e) => setPassword1(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-700 text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="password2" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="password2"
                type="password"
                placeholder="••••••••"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-700 text-sm"
                required
              />
            </div>

            {localError && <p className="text-sm text-red-600">{localError}</p>}
            {authState.error && typeof authState.error === "string" && (
              <p className="text-sm text-red-600">{authState.error}</p>
            )}

            <button
              type="submit"
              className={`w-full text-white font-medium py-3 rounded-md transition duration-150 ${primaryColor}`}
              disabled={authState.loading}
            >
              {authState.loading ? "Registering..." : "Register Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm pt-4 border-t border-gray-200">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-[#00A597] hover:text-[#008f82] transition duration-150">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;


// import React, { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import type { AppDispatch } from "@/store";
// import { login, selectAuth } from "@/features/Auth/authSlice";
// import toast from "react-hot-toast";


// // Logo Component (same as before)
// const EastmondVillasLogo = () => (
//   <div className="flex items-center justify-center space-x-4 p-6 bg-white rounded-t-xl">
//     <img
//       className="h-20"
//       src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760303130/hd_svg_logo_1_rfsh4e.png"
//       alt="Eastmond Villas Logo"
//     />
//   </div>
// );

// const Login: React.FC = () => {
//   const dispatch = useDispatch<AppDispatch | any>();
//   const navigate = useNavigate();
//   const auth = useSelector(selectAuth);

//   // form state
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [errorMsg, setErrorMsg] = useState<string | null>(null);

//   const primaryColor = "bg-[#00A597] hover:bg-[#008f82]";

//   // --- handle submit ---
//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setErrorMsg(null);

//     if (!email.trim() || !password.trim()) {
//       setErrorMsg("Please enter both email and password.");
//       return;
//     }

//     // Create API payload to match backend spec
//     const payload = {
//       email: email.trim(),
//       password: password.trim(),
//     };

//     try {
//       // login started (triggers login_started in slice)
//       const resultAction = await dispatch(login(payload));

//       if (login.fulfilled.match(resultAction)) {
//         // login succeeded
//         console.log("Login success:", resultAction.payload.user);
//         toast.success("Login successful!", {
//           position: "top-center",
//         });
//         navigate("/"); 
        
//       } else {
//         // login failed (show API error)
//         console.error("Login failed:", resultAction.payload || resultAction.error);
//         const errorData = resultAction.payload;

//         if (errorData?.non_field_errors) {
//           setErrorMsg(errorData.non_field_errors[0]);
//         } else if (errorData?.detail) {
//           setErrorMsg(errorData.detail);
//         } else {
//           setErrorMsg("Login failed. Please check your credentials.");
//         }
//       }
//     } catch (err: any) {
//       console.error("Unexpected login error:", err);
//       setErrorMsg("Unexpected error. Please try again.");
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
//         {/* Logo */}
//         <EastmondVillasLogo />

//         <div className="bg-white p-8 rounded-b-xl shadow-lg">
//           <div className="mb-6 p-0 rounded">
//             <h2 className="text-xl font-semibold text-gray-800 mb-1">
//               User Login
//             </h2>
//             <p className="text-sm text-gray-500">
//               Access your account to manage properties and agents
//             </p>
//           </div>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             {/* Email */}
//             <div>
//               <label
//                 htmlFor="email"
//                 className="block text-sm font-medium text-gray-700 mb-1"
//               >
//                 Email
//               </label>
//               <input
//                 id="email"
//                 type="email"
//                 placeholder="user@example.com"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-gray-700 text-sm"
//               />
//             </div>

//             {/* Password */}
//             <div>
//               <label
//                 htmlFor="password"
//                 className="block text-sm font-medium text-gray-700 mb-1"
//               >
//                 Password
//               </label>
//               <input
//                 id="password"
//                 type="password"
//                 placeholder="••••••••"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-700 text-sm"
//               />
//             </div>

//             {/* Error */}
//             {errorMsg && (
//               <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
//             )}
//             {auth.error && !errorMsg && typeof auth.error === "string" && (
//               <p className="text-sm text-red-600 font-medium">{auth.error}</p>
//             )}

//             {/* Submit */}
//             <button
//               type="submit"
//               className={`w-full text-white font-medium py-3 rounded-md transition duration-150 ${primaryColor}`}
//               disabled={auth.loading}
//             >
//               {auth.loading ? "Logging in..." : "Login"}
//             </button>
//           </form>

//           {/* Signup link */}
//           <div className="mt-6 text-center text-sm pt-4 border-t border-gray-200">
//             <p className="text-gray-600">
//               Don’t have an account?{" "}
//               <Link
//                 to="/register"
//                 className="font-semibold text-[#00A597] hover:text-[#008f82] transition duration-150"
//               >
//                 Sign up
//               </Link>
//             </p>
//           </div>

//           {/* Note */}
//           <p className="mt-4 text-center text-xs text-gray-500">
//             Login data will be sent securely to your backend API.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;











import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store";
import { login, selectAuth } from "@/features/Auth/authSlice";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

// Logo Component (same as before)
const EastmondVillasLogo = () => (
  <div className="flex items-center justify-center space-x-4 p-6 bg-white rounded-t-xl">
    <img
      className="h-20"
      src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760303130/hd_svg_logo_1_rfsh4e.png"
      alt="Eastmond Villas Logo"
    />
  </div>
);

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch | any>();
  const navigate = useNavigate();
  const auth = useSelector(selectAuth);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (auth?.access && auth?.user) {
      // User is logged in — don't allow visiting /login, send to home
      navigate("/", { replace: true });
    }
  }, [auth, navigate]);

  // form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const primaryColor = "bg-[#00A597] hover:bg-[#008f82]";

  // --- handle submit ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    // Create API payload to match backend spec
    const payload = {
      email: email.trim(),
      password: password.trim(),
    };

    try {
      // login started (triggers login_started in slice)
      const resultAction = await dispatch(login(payload));

      if (login.fulfilled.match(resultAction)) {
        // login succeeded
        console.log("Login success:", resultAction.payload.user);
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Login successful!",
        });
        // After successful login, navigate to home (or you may choose role-based)
        navigate("/", { replace: true });
      } else {
        // login failed (show API error)
        console.error("Login failed:", resultAction.payload || resultAction.error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Login failed. Please check your credentials.",
        });
        const errorData = resultAction.payload;

        if (errorData?.non_field_errors) {
          setErrorMsg(errorData.non_field_errors[0]);
        } else if (errorData?.detail) {
          setErrorMsg(errorData.detail);
        } else {
          setErrorMsg("Login failed. Please check your credentials.");
        }
      }
    } catch (err: any) {
      console.error("Unexpected login error:", err);
      setErrorMsg("Unexpected error. Please try again.");
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
        {/* Logo */}
        <EastmondVillasLogo />

        <div className="bg-white p-8 rounded-b-xl shadow-lg">
          <div className="mb-6 p-0 rounded">
            <h2 className="text-xl font-semibold text-gray-800 mb-1">
              User Login
            </h2>
            <p className="text-sm text-gray-500">
              Access your account to manage properties and agents
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-gray-700 text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-700 text-sm"
              />
            </div>

            {/* Error */}
            {errorMsg && (
              <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
            )}
            {auth.error && !errorMsg && typeof auth.error === "string" && (
              <p className="text-sm text-red-600 font-medium">{auth.error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              className={`w-full text-white font-medium py-3 rounded-md transition duration-150 ${primaryColor}`}
              disabled={auth.loading}
            >
              {auth.loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Signup link */}
          <div className="mt-6 text-center text-sm pt-4 border-t border-gray-200">
            <p className="text-gray-600">
              Don’t have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-[#00A597] hover:text-[#008f82] transition duration-150"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Note */}
          <p className="mt-4 text-center text-xs text-gray-500">
            Login data will be sent securely to your backend API.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

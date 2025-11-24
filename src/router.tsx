
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import "./index.css";

// --- Main Website Pages ---
import Root from "./Component/Root";
import Home from "./pages/Home/Home";
import Rents from "./pages/Rents/Rents";
import Sales from "./pages/Sales/Sales";
import Management from "./pages/Management/Management";
import Concierge from "./pages/Concierge/Concierge";
import ListWithUs from "./pages/ListWithUs/ListWithUs";
import About from "./pages/About/About";
import Contact from "./pages/Contact/Contact";
import RentsDetails from "./pages/Rents/RentsDetails";
import SalesDetails from "./pages/Sales/SalesDetails";

// --- Auth Pages ---
import Login from "./pages/Authentications/Login";
import SignUpPage from "./pages/Authentications/Register";
import SignUp from "./Component/Auth/SignUp";
import SignIn from "./Component/Auth/SignIn";

// --- Dashboard / Admin / Agent Pages ---
import DashboardPage from "./Component/Dashboard/DashboardPage";
import AdminDashboard from "./Component/Admin/AdminDashboard/AdminDashboard";
import AdminPropertiesRentals from "./Component/Admin/PropertiesRentals/AdminPropertiesRentals";
import AdminPropertiesSales from "./Component/Admin/PropertiesRentals/AdminPropertiesSales";
import Agent from "./Component/Admin/Agent/Agent";
import MediaLibrary from "./Component/Admin/MediaLibrary/MediaLibrary";
import Analytics from "./Component/Admin/Analytics/Analytics";
import ActivityLogs from "./Component/Admin/ActivityLogs/ActivityLogs";
import CreatePropertyRentals from "./Component/Admin/PropertiesRentals/CreatePropertyRentals";
import ManageProperties from "./Component/Admin/Agent/ManageProperties";

import PropertiesRentals from "./Component/Agent/PropertiesSales/PropertiesRentals";
import PropertiesSales from "./Component/Agent/PropertiesSales/PropertiesSales";
import Calendars from "./Component/Agent/Calendars/AgentCalendars";
import Resources from "./Component/Agent/Resources/Resources";
import FAQs from "./Component/Agent/FaQs/FAQs";
import Profile from "./Component/Agent/Profile/Profile";
import Announcements from "./Component/Agent/Announcements/Announcements";
// import PropertiesRentalsDetails from "./Component/Agent/PropertiesSales.tsx/PropertiesRentalsDetails";

// --- Patient / Doctor Pages ---
import PatientDashboard from "./Component/Dashboard/Patient/PatientDashboard";
import MyAppointments from "./Component/Dashboard/Patient/MyAppointments";
import PatientProfile from "./Component/Dashboard/Patient/PatientProfile";
import AppointmentList from "./Component/Dashboard/Doctor/AppointmentList";
import Appointments from "./Component/Dashboard/Doctor/Appointments";
import DoctorProfile from "./Component/Dashboard/Doctor/DoctorProfile";
import PropertiesSalesDetails from "./Component/Agent/PropertiesSales/PropertiesSalesDetails";
import CreatePropertiesSales from "./Component/Admin/PropertiesRentals/CreatePropertiesSales";
import PropertiesRentalsDetails from "./Component/Agent/PropertiesSales/PropertiesRentalsDetails";
import AdminAnnouncements from "./Component/Admin/AdminDashboard/AdminAnnouncements";
import AdminResources from "./Component/Admin/AdminDashboard/AdminResources";
import BookingManagement from "./Component/Admin/AdminDashboard/BookingManagement";
import UserManagement from "./Component/Admin/AdminDashboard/UserManagement";
import ErrorPage from "./pages/ErrorPage/ErrorPage";


// --- Protected Route Wrapper ---
const ProtectedRoute = ({ allowedRoles }: { allowedRoles: string[] }) => <Outlet />;

// --- Default Dashboard Redirect ---
const DefaultDashboardRedirect = () => <Navigate to="/" replace />;

export const router = createBrowserRouter([
  // --- Main Website Routes ---
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/rents", element: <Rents /> },
      { path: "/sales", element: <Sales /> },
      { path: "/list-with-us", element: <ListWithUs /> },
      { path: "/management", element: <Management /> },
      { path: "/concierge", element: <Concierge /> },
      { path: "/about", element: <About /> },
      { path: "/contact", element: <Contact /> },
      { path: "/property/:id", element: <RentsDetails /> }, // this field use sale and rent 
      { path: "/salesdetails", element: <SalesDetails /> },
    ],
  },

  // --- Public Auth Routes ---
  { path: "/login", element: <Login /> },
  { path: "/register", element: <SignUpPage /> },
  { path: "/signin", element: <SignIn /> },
  { path: "/signup", element: <SignUp /> },

  // --- Dashboard Routes ---
  {
    path: "/dashboard",
    element: <DashboardPage />,
    children: [
      { index: true, element: <DefaultDashboardRedirect /> },

      // Admin Routes
      {
        element: <ProtectedRoute allowedRoles={["ADMIN"]} />,
        children: [
          { path: "admin-dashboard", element: <AdminDashboard /> },
          { path: "admin-properties-rentals", element: <AdminPropertiesRentals /> },
          { path: "admin-properties-sales", element: <AdminPropertiesSales /> },
          { path: "admin-agent", element: <Agent /> },
          { path: "admin-media-library", element: <MediaLibrary /> },
          { path: "admin-analytics", element: <Analytics /> },
          { path: "admin-activity-logs", element: <ActivityLogs /> },
          { path: "rentals/admin-create-property", element: <CreatePropertyRentals /> },
          { path: "sales/admin-create-property", element: <CreatePropertiesSales /> },
          { path: "admin-manage-property", element: <ManageProperties /> },
          { path: "admin-Announcements", element: <AdminAnnouncements /> },
          { path: "admin-resources", element: <AdminResources /> },
          { path: "admin-booking-management", element: <BookingManagement /> },
          { path: "admin-user-management", element: <UserManagement /> },
            { path: "admin-faqs", element: <FAQs /> },
            { path: "admin-profile", element: <Profile /> },
          
        ],
      },

      // Agent Routes
      {
        element: <ProtectedRoute allowedRoles={["AGENT"]} />,
        children: [
          { path: "agent-properties-rentals", element: <PropertiesRentals /> },
          { path: "agent-properties-sales", element: <PropertiesSales /> },
          { path: "agent-calendars", element: <Calendars /> },
          { path: "agent-announcements", element: <Announcements /> },
          { path: "agent-resources", element: <Resources /> },
          { path: "agent-faqs", element: <FAQs /> },
          { path: "agent-profile", element: <Profile /> },
          { path: "agent-property-rentals-details", element: <PropertiesRentalsDetails /> },
          { path: "agent-property-sales-details", element: <PropertiesSalesDetails /> },
        ],
      },

      // Patient / Doctor Routes
      {
        path: "patient-dashboard",
        element: <PatientDashboard />,
      },
      { path: "my-appointments", element: <MyAppointments /> },
      { path: "patient-profile", element: <PatientProfile /> },
      { path: "appointment-list", element: <AppointmentList /> },
      { path: "appointments", element: <Appointments /> },
      { path: "doctor-profile", element: <DoctorProfile /> },
    ],
  },
]);


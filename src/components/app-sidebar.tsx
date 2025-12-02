import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import { LogOut } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/features/Auth/authSlice"; // adjust path if needed
import { useCallback } from "react";

/* -- static menus -- */
const ADMIN = [
  { title: "Dashboard", url: "/dashboard/admin-dashboard", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760835665/Icon_5_syy9ka.png" },
  { title: "Properties-Rentals", url: "/dashboard/admin-properties-rentals", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760835665/Icon_6_zia1hb.png" },
  { title: "Properties-Sales", url: "/dashboard/admin-properties-sales", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760836092/Icon_13_cnv9is.png" },
  { title: "Agent", url: "/dashboard/admin-agent", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760835907/Icon_12_hrpcfu.png" },
  // { title: "Media Library", url: "/dashboard/admin-media-library", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760835779/Icon_9_v2svx7.png" },
  { title: "Announcements", url: "/dashboard/admin-Announcements", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760835779/Icon_9_v2svx7.png" },
  { title: "Analytics", url: "/dashboard/admin-analytics", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760835778/Icon_10_pwt0qy.png" },
  { title: "Activity Logs", url: "/dashboard/admin-activity-logs", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760835766/Icon_11_w8rapr.png" },
  { title: "User Management", url: "/dashboard/admin-user-management", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1762893337/Icon_2_yt5edq.png" },

  { title: "Booking Management", url: "/dashboard/admin-booking-management", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1762893411/Icon_3_qzhh6y.png" },
  { title: "All Contact", url: "/dashboard/admin-allContact", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1764619370/Vector_3_xhvsh3.png" },
  { title: "All Review", url: "/dashboard/admin-allReview", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1764619370/Vector_4_wmybu2.png" },
  { title: "Resources", url: "/dashboard/admin-resources", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760835779/Icon_9_v2svx7.png" },
  { title: "FAQs", url: "/dashboard/admin-faqs", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760836607/Icon_19_wiysfq.png" },
  { title: "Profile", url: "/dashboard/admin-profile", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760836746/Icon_20_hv1hl4.png" },
];



const AGENT = [
  { title: "Properties-Rentals", url: "/dashboard/agent-properties-rentals", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760835665/Icon_5_syy9ka.png" },
  { title: "Properties-Sales", url: "/dashboard/agent-properties-sales", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760836092/Icon_13_cnv9is.png" },
  { title: "Calendars", url: "/dashboard/agent-calendars", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760836465/Icon_16_yxcamk.png" },
  { title: "Announcements", url: "/dashboard/agent-announcements", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760836463/Icon_17_ar9tl8.png" },
  { title: "Resources", url: "/dashboard/agent-resources", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760836670/Icon_18_duc2wu.png" },
  { title: "FAQs", url: "/dashboard/agent-faqs", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760836607/Icon_19_wiysfq.png" },
  { title: "Profile", url: "/dashboard/agent-profile", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760836746/Icon_20_hv1hl4.png" },
];

const AppSidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // safe selector: may be null while loading
  const currentUser = useSelector((state) => state?.auth?.user);
  const isAuthenticated = useSelector((state) => Boolean(state?.auth?.access && state?.auth?.user));

  // Normalize role string
  const role = (currentUser?.role || "").toString().toLowerCase();

  const showAdmin = role === "admin";
  const showAgent = role === "agent";
  // if not authenticated, show both lists for dev preview
  const showBothIfUnauthenticated = !isAuthenticated;

  const handleLogout = useCallback(async () => {
    try {
      await dispatch(logout());
    } catch (err) {
      // swallow; logout thunk already handles clearing tokens
      console.error("Logout failed", err);
    } finally {
      navigate("/login");
    }
  }, [dispatch, navigate]);

  return (
    <Sidebar>
      <SidebarContent>
        {/* Header: show current user name + role */}
        

        <SidebarMenu>
          {/* ADMIN Section */}
          {(showAdmin || showBothIfUnauthenticated) && (
            <>
              <p className="mt-5 ml-10 text-white mb-5 px-2 text-[24px]">ADMIN</p>
              <div className="h-px bg-gradient-to-r from-transparent via-white to-transparent mb-3" />
              {ADMIN.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink to={item.url}>
                    {({ isActive }) => (
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={`p-0 ${isActive ? "text-black rounded-md" : "text-white hover:bg-gray-800 rounded-md"}`}
                      >
                        <div className="flex items-center gap-2 w-full h-full p-2">
                          <img src={item.img} alt={item.title} className="w-5 h-5" />
                          <span>{item.title}</span>
                        </div>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </>
          )}

          {/* AGENT Section */}
          {(showAgent || showBothIfUnauthenticated) && (
            <>
              <p className="mt-10 ml-10 text-white mb-5 px-2 text-[24px]">AGENT</p>
              <div className="h-px bg-gradient-to-r from-transparent via-white to-transparent mb-3" />
              {AGENT.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink to={item.url}>
                    {({ isActive }) => (
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={`p-0 ${isActive ? "text-black rounded-md" : "text-white hover:bg-gray-800 rounded-md"}`}
                      >
                        <div className="flex items-center gap-2 w-full h-full p-2">
                          <img src={item.img} alt={item.title} className="w-5 h-5" />
                          <span>{item.title}</span>
                        </div>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </>
          )}

          {/* Logout */}
          <div className="my-5 mt-10 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <SidebarMenuItem>
            <SidebarMenuButton
              className="cursor-pointer hover:bg-gray-800 rounded-md"
              onClick={handleLogout}
            >
              <div className="flex items-center gap-2 text-white">
                <LogOut />
                <span>Logout</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;







// import { NavLink } from "react-router-dom";
// import {
//   Sidebar,
//   SidebarContent,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
// } from "./ui/sidebar";
// import { LogOut } from "lucide-react";

// const ADMIN = [
//   { title: "Dashboard", url: "/dashboard/admin-dashboard", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760835665/Icon_5_syy9ka.png" },
//   { title: "Properties-Rentals", url: "/dashboard/admin-properties-rentals", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760835665/Icon_6_zia1hb.png" },
//   { title: "Properties-Sales", url: "/dashboard/admin-properties-sales", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760836092/Icon_13_cnv9is.png" },
//   { title: "Agent", url: "/dashboard/admin-agent", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760835907/Icon_12_hrpcfu.png" },
//   // { title: "Media Library", url: "/dashboard/admin-media-library", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760835779/Icon_9_v2svx7.png" },
//   { title: "Announcements", url: "/dashboard/admin-Announcements", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760835779/Icon_9_v2svx7.png" },
//   { title: "Analytics", url: "/dashboard/admin-analytics", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760835778/Icon_10_pwt0qy.png" },
//   { title: "Activity Logs", url: "/dashboard/admin-activity-logs", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760835766/Icon_11_w8rapr.png" },
//   { title: "User Management", url: "/dashboard/admin-user-management", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1762893337/Icon_2_yt5edq.png" },
//   { title: "Booking Management", url: "/dashboard/admin-booking-management", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1762893411/Icon_3_qzhh6y.png" },
//   { title: "Resources", url: "/dashboard/admin-resources", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760835779/Icon_9_v2svx7.png" },

// ];

// const AGENT = [
//   { title: "Properties-Rentals", url: "/dashboard/agent-properties-rentals", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760835665/Icon_5_syy9ka.png" },
//   { title: "Properties-Sales", url: "/dashboard/agent-properties-sales", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760836092/Icon_13_cnv9is.png" },
//   { title: "Calendars", url: "/dashboard/agent-calendars", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760836465/Icon_16_yxcamk.png" },
//   { title: "Announcements", url: "/dashboard/agent-announcements", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760836463/Icon_17_ar9tl8.png" },
//   { title: "Resources", url: "/dashboard/agent-resources", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760836670/Icon_18_duc2wu.png" },
//   { title: "FAQs", url: "/dashboard/agent-faqs", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760836607/Icon_19_wiysfq.png" },
//   { title: "Profile", url: "/dashboard/agent-profile", img: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760836746/Icon_20_hv1hl4.png" },
// ];

// const AppSidebar = () => {
//   return (
//     <Sidebar>
//       <SidebarContent>
//         <SidebarMenu>
//           {/* ADMIN Section */}
//           <p className="mt-5 ml-10 text-white mb-5 px-2 text-[24px]">ADMIN</p>
//           <div className="h-px bg-gradient-to-r from-transparent via-white to-transparent mb-3" />
//           {ADMIN.map((item) => (
//             <SidebarMenuItem key={item.title}>

              
//               <NavLink to={item.url}>
//                 {({ isActive }) => (
//                   <SidebarMenuButton
//                     asChild
//                     isActive={isActive}
//                     className={`p-0 ${
//                       isActive
//                         ? "text-black rounded-md"
//                         : "text-white hover:bg-gray-800 rounded-md"
//                     }`}
//                   >
//                     <div className="flex items-center gap-2 w-full h-full p-2">
//                       <img src={item.img} alt={item.title} className="w-5 h-5" />
//                       <span>{item.title}</span>
//                     </div>
//                   </SidebarMenuButton>
                  
//                 )}
//               </NavLink>
//             </SidebarMenuItem>
//           ))}

//           {/* AGENT Section */}
//           <p className="mt-10 ml-10 text-white mb-5 px-2 text-[24px]">AGENT</p>
//           <div className="h-px bg-gradient-to-r from-transparent via-white to-transparent mb-3" />
//           {AGENT.map((item) => (
//             <SidebarMenuItem key={item.title}>
//               <NavLink to={item.url}>
//                 {({ isActive }) => (
//                   <SidebarMenuButton
//                     asChild
//                     isActive={isActive}
//                     className={`p-0 ${
//                       isActive
//                         ? "text-black rounded-md"
//                         : "text-white hover:bg-gray-800 rounded-md"
//                     }`}
//                   >
//                     <div className="flex items-center gap-2 w-full h-full p-2">
//                       <img src={item.img} alt={item.title} className="w-5 h-5" />
//                       <span>{item.title}</span>
//                     </div>
//                   </SidebarMenuButton>
//                 )}
//               </NavLink>
//             </SidebarMenuItem>
//           ))}

//           {/* Logout */}
//           <div className="my-5 mt-10 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
//           <SidebarMenuItem>
//             <SidebarMenuButton className="cursor-pointer hover:bg-gray-800 rounded-md">
//               <div className="flex items-center gap-2 text-white">
//                 <LogOut />
//                 <span>Logout</span>
//               </div>
//             </SidebarMenuButton>
//           </SidebarMenuItem>
//         </SidebarMenu>
//       </SidebarContent>
//     </Sidebar>
//   );
// };

// export default AppSidebar;


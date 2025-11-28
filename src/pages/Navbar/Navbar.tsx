// src/pages/Navbar/Navbar.tsx
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IoMdArrowDropdown } from "react-icons/io";

import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/Auth/authSlice"; 
import type { AppDispatch } from "@/store";


const Navbar = () => {
  const [theme] = useState(() => localStorage.getItem("theme") || "yellow");
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dispatch = useDispatch<AppDispatch | any>();

  // ---------- SAFE INLINE SELECTORS (no external selector dependency) ----------
  const isAuthenticated = useSelector((state: any) =>
    Boolean(state?.auth?.access && state?.auth?.user)
  );
  const currentUser = useSelector((state: any) => state?.auth?.user);

  console.log('current user is:' , currentUser);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleLinkClick = () => setIsMobileMenuOpen(false);

  const handleLogout = async () => {
    try {
      await dispatch(logout());
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/");
    }
  };

  const links = (
    <>
      <NavLink
        onClick={handleLinkClick}
        className={({ isActive }) =>
          `px-3 py-2 text-[15px] font-semibold ${
            isActive
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-gray-800"
          } hover:text-teal-600 transition-all`
        }
        to="/"
      >
        Home
      </NavLink>

      {/* Collection Dropdown (shadcn) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 px-3 py-2 text-[15px] font-semibold text-gray-800 hover:text-teal-600 transition-all">
            Collection
            <IoMdArrowDropdown className="text-lg mt-[2px]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-44">
          <DropdownMenuItem
            onClick={() => {
              handleLinkClick();
              navigate("/rents");
            }}
            className={`cursor-pointer font-semibold ${
              location.pathname === "/rents" ? "text-teal-600" : "text-gray-800"
            }`}
          >
            Rentals
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              handleLinkClick();
              navigate("/sales");
            }}
            className={`cursor-pointer font-semibold ${
              location.pathname === "/sales" ? "text-teal-600" : "text-gray-800"
            }`}
          >
            Sales
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <NavLink
        onClick={handleLinkClick}
        className={({ isActive }) =>
          `px-3 py-2 text-[15px] font-semibold ${
            isActive
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-gray-800"
          } hover:text-teal-600 transition-all`
        }
        to="/list-with-us"
      >
        List With Us
      </NavLink>

      <NavLink
        onClick={handleLinkClick}
        className={({ isActive }) =>
          `px-3 py-2 text-[15px] font-semibold ${
            isActive
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-gray-800"
          } hover:text-teal-600 transition-all`
        }
        to="/management"
      >
        Management
      </NavLink>

      <NavLink
        onClick={handleLinkClick}
        className={({ isActive }) =>
          `px-3 py-2 text-[15px] font-semibold ${
            isActive
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-gray-800"
          } hover:text-teal-600 transition-all`
        }
        to="/concierge"
      >
        Concierge
      </NavLink>

      <NavLink
        onClick={handleLinkClick}
        className={({ isActive }) =>
          `px-3 py-2 text-[15px] font-semibold ${
            isActive
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-gray-800"
          } hover:text-teal-600 transition-all`
        }
        to="/about"
      >
        About
      </NavLink>

      {/* <NavLink
        onClick={handleLinkClick}
        className={({ isActive }) =>
          `px-3 py-2 text-[15px] md:hidden font-semibold ${
            isActive
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-gray-800"
          } hover:text-teal-600 transition-all`
        }
        to="https://ricoholder-dashboard.netlify.app/admin-dashboard"
      >
        Dashboard
      </NavLink> */}
    </>
  );

  return (
    <nav className="w-full shadow-md bg-white  top-0 left-0 z-50">
      <div className="px-4 container mx-auto flex justify-between items-center h-20">
        {/* Logo for large devices */}
        <Link to="/" className="hidden xl:flex items-center gap-2">
          <img
            className="h-16"
            src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760303130/hd_svg_logo_1_rfsh4e.png"
            alt="Logo"
          />
        </Link>

        {/* Logo for smaller devices */}
        <Link to="/" className="flex xl:hidden items-center gap-2">
          <img
            className="h-16"
            src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760828543/hd_svg_logo_2_hw4vsa.png"
            alt="Logo"
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-6">{links}</div>

        {/* Contact & Login/Logout Buttons */}
        <div className="hidden lg:flex items-center gap-2">
          <Link
            to="/contact"
            className="px-6 py-2.5 border-2 border-[#009689] text-black font-semibold rounded-lg shadow-md hover:text-white hover:bg-[#007c74] transition-all"
          >
            Contact Us
          </Link>

          

          {/* Keep the same design: show Logout if authenticated, otherwise Login */}
          {isAuthenticated ? (
            // Logout button — same style as original Login button (no design change)
            <button
              onClick={handleLogout}
              className="px-6 py-2.5 bg-[#009689] text-white font-semibold rounded-lg shadow-md hover:bg-[#007c74] transition-all"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="px-6 py-2.5 bg-[#009689] text-white font-semibold rounded-lg shadow-md hover:bg-[#007c74] transition-all"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Icon */}
        <div className="lg:hidden flex items-center">
          <button onClick={toggleMobileMenu} className="text-2xl text-gray-700">
            {isMobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? "max-h-screen py-4" : "max-h-0"
        } bg-white shadow-md border-t border-gray-100`}
      >
        <div className="flex flex-col px-4 space-y-3">{links}</div>
        <div className="flex flex-col px-4 space-y-2 mt-3">
          <Link
            onClick={handleLinkClick}
            to="/contact"
            className="w-full bg-[#009689] text-center text-white px-4 py-2.5 rounded-lg font-semibold shadow-md hover:bg-[#007c74] transition-all"
          >
            Contact Us
          </Link>

          {/* Mobile: Login or Logout — same styles kept */}
          {isAuthenticated ? (
            <button
              onClick={() => {
                handleLinkClick();
                handleLogout();
              }}
              className="w-full cursor-pointer bg-[#009689] text-center text-white px-4 py-2.5 rounded-lg font-semibold shadow-md hover:bg-[#007c74] transition-all"
            >
              Logout
            </button>
          ) : (
            <Link
              onClick={handleLinkClick}
              to="/login"
              className="w-full bg-[#009689] text-center text-white px-4 py-2.5 rounded-lg font-semibold shadow-md hover:bg-[#007c74] transition-all"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
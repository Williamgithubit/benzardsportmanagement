"use client";
import React, { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState, useAppDispatch } from "@/store/store";
import { performLogout } from "@/store/Auth/logoutAction";
import { FaTimes, FaUserCircle } from "react-icons/fa";
import { FaBarsStaggered } from "react-icons/fa6";
import { FiLogIn, FiLogOut } from "react-icons/fi";
import Image from "next/image";
import logo from "../../public/assets/Benzard_Logo.png";
import Link from "next/link";

interface NavigationItem {
  name: string;
  path: string;
}

const Header = () => {
  const { user, role } = useSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    try {
      await dispatch(performLogout());
      router.push("/login");
      router.refresh(); // Ensure the page updates after navigation
    } catch (error) {
      console.error("Logout failed:", error);
      // Still redirect to login even if logout fails
      router.push("/login");
      router.refresh();
    }
  }, [dispatch, router]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const navigation: NavigationItem[] = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Athletes", path: "/athletes" },
    { name: "Events", path: "/events" },
    { name: "Blog", path: "/blog" },
  ];

  return (
    <header className="bg-gradient-to-r from-[#000054] to-[#1a1a6e] fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex-shrink-0 h-10 w-auto relative">
            <Image
              src={logo}
              alt="Benzard Sports Management Logo"
              className="h-full w-auto"
              width={200}
              height={40}
              priority
            />
          </Link>

          <nav className="hidden md:block flex-grow">
            <div className="flex justify-center items-center space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className="px-3 py-2 rounded-md text-sm font-medium  text-white hover:text-[#E32845] hover:bg-gray-50 transition-colors duration-200"
                >
                  {item.name}
                </Link>
              ))}

              {/* Contact Link */}
              <Link
                href="/contact"
                className="px-3 py-2 rounded-md text-sm font-medium text-white hover:text-[#E32845] hover:bg-gray-50 transition-colors duration-200"
              >
                Contact
              </Link>
            </div>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() =>
                    setIsProfileDropdownOpen(!isProfileDropdownOpen)
                  }
                  className="flex items-center space-x-2 text-gray-700 hover:text-[#E32845] focus:outline-none"
                >
                  <FaUserCircle className="h-8 w-8" />
                  <span className="hidden md:inline">
                    {user.displayName || "My Account"}
                  </span>
                </button>
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      href={
                        role === "teacher"
                          ? "/dashboard/teacher/profile"
                          : "/profile"
                      }
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      My Profile
                    </Link>
                    {role === "admin" && (
                      <Link
                        href="/dashboard/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    {role === "teacher" && (
                      <Link
                        href="/dashboard/teacher"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        Teacher Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <FiLogOut className="mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-block bg-[#000054] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#E32845] cursor-pointer transition-colors duration-200"
              >
                <div className="flex items-center justify-center">
                  <FiLogIn className="mr-2" />
                  Login
                </div>
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-[#E32845] bg-gray-50"
            >
              {isMenuOpen ? (
                <FaTimes className="h-6 w-6" />
              ) : (
                <FaBarsStaggered className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#E32845] hover:bg-gray-50"
              >
                {item.name}
              </Link>
            ))}

            {/* Mobile Contact Link */}
            <Link
              href="/contact"
              onClick={() => setIsMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#E32845] hover:bg-gray-50"
            >
              Contact
            </Link>

            <div className="pt-4 pb-2">
              {user ? (
                <>
                  <div className="px-3 py-2">
                    <div className="flex items-center text-sm text-gray-700 mb-2">
                      <FaUserCircle className="mr-2" />
                      <span>
                        Welcome, {user?.name || user?.displayName || "User"}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={
                      role === "teacher"
                        ? "/dashboard/teacher/profile"
                        : "/profile"
                    }
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsProfileDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    My Profile
                  </Link>
                  {role === "admin" && (
                    <Link
                      href="/dashboard/admin"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsProfileDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  {role === "teacher" && (
                    <Link
                      href="/dashboard/teacher"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsProfileDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      Teacher Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <FiLogOut className="mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsProfileDropdownOpen(false);
                  }}
                  className="block w-full bg-[#000054] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#E32845] text-center"
                >
                  <div className="flex items-center justify-center">
                    <FiLogIn className="mr-2" />
                    Login
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

/** @format */

import React, { useState, useMemo, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar_Logo from "../../assets/logo_animation.png";
import Sidebar_Logo_col from "../../assets/HRMS LOGO CON-01.png";
import sidebarData from "./sidebar_data";
import { FiLogOut } from "react-icons/fi";
import usePermissions from "../permissions/permission";

const Sidebar = ({ isOpen = true, toggleSidebar = () => { } }) => {
  const [expandedMenu, setExpandedMenu] = useState({});
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Safely get permissions with fallback
  const permissionsHook = usePermissions();
  const {
    hasPermission = () => false,
    permissions = [],
    isLoading = false,
  } = permissionsHook || {};

  // Filter sidebar data based on user permissions
  const filteredSidebarData = useMemo(() => {
    try {
      if (isLoading || !Array.isArray(permissions) || !sidebarData) {
        return [];
      }

      return sidebarData
        .filter((module) => {
          try {
            if (!module || typeof module !== "object") return false;

            // Check if user has permission for main module
            const hasMainPermission = Array.isArray(
              module.requiredPermissionsformainfeatures
            )
              ? module.requiredPermissionsformainfeatures.some(
                (permission) => hasPermission && hasPermission(permission)
              )
              : true;

            if (!hasMainPermission) {
              return false;
            }

            // If module has submodules, filter them based on permissions
            if (module.subModules && Array.isArray(module.subModules)) {
              const filteredSubModules = module.subModules.filter(
                (subModule) => {
                  try {
                    if (!subModule || typeof subModule !== "object")
                      return false;

                    if (
                      !Array.isArray(
                        subModule.requiredPermissionsforsubfeatures
                      )
                    ) {
                      return true;
                    }

                    return subModule.requiredPermissionsforsubfeatures.some(
                      (permission) => hasPermission && hasPermission(permission)
                    );
                  } catch (error) {
                    console.error("Error filtering submodule:", error);
                    return false;
                  }
                }
              );

              return filteredSubModules.length > 0;
            }

            return true;
          } catch (error) {
            console.error("Error filtering module:", error);
            return false;
          }
        })
        .map((module) => {
          try {
            if (module.subModules && Array.isArray(module.subModules)) {
              const filteredSubModules = module.subModules.filter(
                (subModule) => {
                  try {
                    if (!subModule || typeof subModule !== "object")
                      return false;

                    if (
                      !Array.isArray(
                        subModule.requiredPermissionsforsubfeatures
                      )
                    ) {
                      return true;
                    }

                    return subModule.requiredPermissionsforsubfeatures.some(
                      (permission) => hasPermission && hasPermission(permission)
                    );
                  } catch (error) {
                    console.error("Error filtering submodule in map:", error);
                    return false;
                  }
                }
              );

              return {
                ...module,
                subModules: filteredSubModules,
              };
            }

            return module;
          } catch (error) {
            console.error("Error mapping module:", error);
            return module;
          }
        });
    } catch (error) {
      console.error("Error in filteredSidebarData:", error);
      return [];
    }
  }, [permissions, hasPermission, isLoading]);

  const toggleSubMenu = useCallback((name) => {
    try {
      if (name && typeof name === "string") {
        setExpandedMenu((prev) => ({ ...prev, [name]: !prev[name] }));
      }
    } catch (error) {
      console.error("Error toggling submenu:", error);
    }
  }, []);

  const isSelectedPath = useCallback(
    (path) => {
      try {
        if (!path || !location?.pathname) return false;
        return (
          location.pathname === path || location.pathname.startsWith(`${path}/`)
        );
      } catch (error) {
        console.error("Error checking selected path:", error);
        return false;
      }
    },
    [location?.pathname]
  );

  const renderSubModules = useCallback(
    (subModules, parentPath = "") => {
      try {
        if (!Array.isArray(subModules)) return null;

        return (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={`ml-4 space-y-1 overflow-hidden ${!isOpen && "hidden"}`}
          >
            {subModules.map((subModule, index) => {
              try {
                if (!subModule || !subModule._id) return null;

                const currentPath = `${parentPath}${subModule.url || ""}`;
                const isSelected = isSelectedPath(currentPath);
                return (
                  <motion.li
                    key={subModule._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group"
                  >
                    <Link
                      to={currentPath}
                      className={`flex items-center p-2 rounded-lg text-sm transition-all duration-300 relative overflow-hidden ${isSelected
                        ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-white font-semibold border-l-4 border-cyan-400"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                        }`}
                    >
                      {isSelected && (
                        <motion.span
                          layoutId="activeSubmodule"
                          className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10"
                          transition={{ type: "spring", duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center">
                        {isSelected && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="mr-2 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"
                          />
                        )}
                        {subModule.name || "Unnamed"}
                      </span>
                    </Link>
                  </motion.li>
                );
              } catch (error) {
                console.error("Error rendering submodule:", error);
                return null;
              }
            })}
          </motion.ul>
        );
      } catch (error) {
        console.error("Error rendering submodules:", error);
        return null;
      }
    },
    [isOpen, isSelectedPath]
  );

  const handleLogout = useCallback(() => {
    try {
      setShowLogoutConfirm(true);
    } catch (error) {
      console.error("Error handling logout:", error);
    }
  }, []);

  const confirmLogout = useCallback(() => {
    try {
      // Clear local storage
      localStorage.clear();

      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // Redirect in same tab (no back navigation)
      window.location.replace("https://talexaone.talentfort.live/dashboard");

    } catch (error) {
      console.error("Error during logout:", error);
      window.location.replace("https://talexaone.talentfort.live/dashboard");
    }
  }, []);


  const handleMouseEnter = useCallback(() => {
    try {
      if (!isOpen && toggleSidebar) {
        toggleSidebar();
      }
    } catch (error) {
      console.error("Error in mouse enter:", error);
    }
  }, [isOpen, toggleSidebar]);

  const handleMouseLeave = useCallback(() => {
    try {
      if (isOpen && toggleSidebar) {
        toggleSidebar();
      }
    } catch (error) {
      console.error("Error in mouse leave:", error);
    }
  }, [isOpen, toggleSidebar]);

  const handleNavigation = useCallback(
    (url, hasSubModules, moduleId) => {
      try {
        if (hasSubModules) {
          toggleSubMenu(moduleId);
        } else if (url && navigate) {
          navigate(url);
        }
      } catch (error) {
        console.error("Error in navigation:", error);
      }
    },
    [toggleSubMenu, navigate]
  );

  return (
    <>
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: 0, width: isOpen ? 256 : 80 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="fixed top-0 left-0 h-screen bg-gradient-to-b from-[#001F3F] via-[#002952] to-[#001F3F] p-5 pt-8 shadow-2xl flex flex-col z-50 border-r border-white/10"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

        {/* Logo Section */}
        <motion.div
          className="text-center text-white mb-8 relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.img
                key="expanded"
                src={Sidebar_Logo}
                alt="Logo"
                className="mx-auto w-30 h-30"
                initial={{ opacity: 0, rotate: -10 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 10 }}
                transition={{ duration: 0.3 }}
              />
            ) : (
              <motion.img
                key="collapsed"
                src={Sidebar_Logo_col}
                alt="Collapsed Logo"
                className="mx-auto w-[65px] h-[40px]"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </AnimatePresence>

          {/* Decorative line under logo */}
          <motion.div
            className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mt-4"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </motion.div>

        {/* Menu Items */}
        <div className="overflow-y-auto flex-1 custom-scrollbar relative">
          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.05);
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(37, 149, 254, 0.5);
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(37, 149, 254, 0.8);
            }
          `}</style>

          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-white p-4"
            >
              {isOpen && (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              )}
            </motion.div>
          ) : (
            <ul className="space-y-2">
              {Array.isArray(filteredSidebarData) &&
                filteredSidebarData.map((module, index) => {
                  try {
                    if (!module || !module._id) return null;

                    const isModuleSelected = isSelectedPath(module.url);
                    const hasSubModules =
                      module.subModules &&
                      Array.isArray(module.subModules) &&
                      module.subModules.length > 0;

                    return (
                      <motion.li
                        key={module._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        onMouseEnter={() => setHoveredItem(module._id)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden group ${isModuleSelected
                            ? "bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30"
                            : "hover:bg-white/10"
                            } text-white`}
                          onClick={() =>
                            handleNavigation(
                              module.url,
                              hasSubModules,
                              module._id
                            )
                          }
                        >
                          {/* Hover effect background */}
                          {!isModuleSelected && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-cyan-500/10 to-blue-500/0"
                              initial={{ x: "-100%" }}
                              whileHover={{ x: "100%" }}
                              transition={{ duration: 0.6 }}
                            />
                          )}

                          {/* Icon */}
                          {module.icon && (
                            <motion.span
                              className="relative z-10"
                              animate={{
                                scale: hoveredItem === module._id ? 1.2 : 1,
                                rotate: hoveredItem === module._id ? 5 : 0,
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              {module.icon}
                            </motion.span>
                          )}

                          {/* Module Name */}
                          <AnimatePresence mode="wait">
                            {isOpen && (
                              <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="ml-3 font-medium relative z-10"
                              >
                                {module.name || "Unnamed"}
                              </motion.span>
                            )}
                          </AnimatePresence>

                          {/* Chevron for submodules */}
                          {isOpen && hasSubModules && (
                            <motion.span
                              className="ml-auto relative z-10"
                              animate={{
                                rotate: expandedMenu[module._id] ? 180 : 0,
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              <FaChevronDown />
                            </motion.span>
                          )}

                          {/* Active indicator */}
                          {isModuleSelected && (
                            <motion.div
                              layoutId="activeModule"
                              className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                              transition={{ type: "spring", duration: 0.6 }}
                            />
                          )}
                        </motion.div>

                        {/* Submodules */}
                        <AnimatePresence>
                          {expandedMenu[module._id] &&
                            hasSubModules &&
                            renderSubModules(module.subModules, module.url)}
                        </AnimatePresence>
                      </motion.li>
                    );
                  } catch (error) {
                    console.error("Error rendering module:", error);
                    return null;
                  }
                })}
            </ul>
          )}
        </div>

        {/* Logout Button */}
        <motion.div
          className="mt-auto pt-4 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Decorative line above logout */}
          <div className="h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent mb-4" />

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 text-white group relative overflow-hidden"
            onClick={handleLogout}
          >
            {/* Hover effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6 }}
            />

            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
              <FiLogOut className="text-xl relative z-10" />
            </motion.div>

            <AnimatePresence mode="wait">
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="ml-3 font-medium relative z-10"
                >
                  Leave
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-2xl p-8 w-96 text-center shadow-2xl relative overflow-hidden"
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-pink-500 to-red-500" />

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <FiLogOut className="text-white text-2xl" />
              </motion.div>

              <h2 className="text-2xl font-bold mb-2 text-gray-800">
                Confirm Logout
              </h2>
              <p className="mb-6 text-gray-600">
                Are you sure you want to logout?
              </p>

              <div className="flex justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    try {
                      setShowLogoutConfirm(false);
                    } catch (error) {
                      console.error("Error canceling logout:", error);
                    }
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 font-medium"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmLogout}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-lg shadow-red-500/30"
                >
                  Yes, Leave
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Error boundary wrapper for the sidebar
const SidebarWithErrorBoundary = (props) => {
  try {
    return <Sidebar {...props} />;
  } catch (error) {
    console.error("Sidebar error:", error);
    return (
      <div className="fixed top-0 left-0 h-screen bg-gradient-to-b from-[#001F3F] to-[#002952] w-20 p-5 pt-8 shadow-2xl">
        <div className="text-center text-white text-sm">
          Error loading sidebar
        </div>
      </div>
    );
  }
};

export default SidebarWithErrorBoundary;
/** @format */
import React, { useEffect, useState } from "react";
import { FaRegBell } from "react-icons/fa";
import { HiUserCircle } from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  Bell, 
  X, 
  LogOut, 
  User, 
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
} from "lucide-react";
import logoAnimation from "../../../assets/12356.png";

const SOCKET_URL = process.env.REACT_APP_FRONTEND_URL;
const API_URL = process.env.REACT_APP_FRONTEND_URL;

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
});

const Navbar = () => {
  const [employeeFullname, setEmployeeFullname] = useState("User");
  const [username, setUsername] = useState("");
  const [employeeNo, setEmployeeNo] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();

  // Load user info from cookies
  useEffect(() => {
    const full = Cookies.get("employee_fullname");
    const user = Cookies.get("username");
    const empNo = Cookies.get("employee_no") || Cookies.get("username");
    if (full) setEmployeeFullname(full);
    if (user) setUsername(user);
    if (empNo) setEmployeeNo(empNo);
  }, []);

  useEffect(() => {
    if (!employeeNo) return;
    socket.emit("join", employeeNo);
    
    socket.on("notification", (data) => {
      console.log("📨 Incoming socket notification:", data);
      
      if (data.type === "ATTENDANCE") {
        toast.warning(data.message, {
          position: "top-right",
          autoClose: 2500,
          theme: "colored",
        });
      } else if (data.type === "LEAVE") {
        toast.info(data.message, {
          position: "top-right",
          autoClose: 2500,
          theme: "colored",
        });
      } else {
        toast(data.message, {
          position: "top-right",
          autoClose: 2500,
          theme: "colored",
        });
      }
      
      setUnreadCount((prev) => prev + 1);
      
      if ("Notification" in window && Notification.permission === "granted") {
        const notif = new Notification("Internal HRIS", {
          body: data.message,
          icon: logoAnimation,
        });
        notif.onclick = () => {
          window.focus();
          if (data.type?.toUpperCase() === "LEAVE" && data.leaveId) {
            navigate(`/leave-approve?leaveId=${data.leaveId}`);
          }
          if (data.type?.toUpperCase() === "ATTENDANCE") {
            navigate("/attendance");
          }
        };
      }
    });
    
    return () => {
      socket.off("notification");
    };
  }, [employeeNo, navigate]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const recalcUnread = (list) =>
    setUnreadCount(list.filter((n) => (n.is_read || 0) < 1).length);

  const fetchNotifications = async (pageNo = 1, limit = 8) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}/v1/hris/notifications/get/${employeeNo}?page=${pageNo}&limit=${limit}`
      );
      const json = await res.json();

      if (json.success) {
        const merged =
          pageNo === 1 ? json.data : [...notifications, ...json.data];
        setNotifications(merged);
        setHasMore(pageNo < json.totalPages);
        setTotalPages(json.totalPages);
        recalcUnread(merged);
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const openSidebar = () => {
    setSidebarOpen(true);
    setPage(1);
    if (employeeNo) fetchNotifications(1);
  };

  const loadMore = () => {
    if (!hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };

  const getNotificationRoute = (n) => {
    const t = (n.type || "").toUpperCase();
    if (t === "LEAVE") {
      return n.related_entity_id
        ? `/leave-approve?leaveId=${n.related_entity_id}`
        : "/leave-approve";
    }
    return null;
  };

  const markReadFireAndForget = (id) => {
    fetch(`${API_URL}/v1/hris/notifications/notifications/mark-read`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationIds: [id] }),
    }).catch((e) => console.error("PUT mark-read failed:", e));
  };

  const handleNotificationClick = (n) => {
    setNotifications((prev) => {
      const updated = prev.map((notif) =>
        notif.id === n.id ? { ...notif, is_read: 1 } : notif
      );
      recalcUnread(updated);
      return updated;
    });

    markReadFireAndForget(n.id);
    setSidebarOpen(false);
    const dest = getNotificationRoute(n);
    if (dest) navigate(dest);
  };

  const confirmLogout = () => {
    localStorage.clear();
    Object.keys(Cookies.get()).forEach((cookie) => Cookies.remove(cookie));
    navigate("/login");
  };

  const getNotificationIcon = (type) => {
    switch (type?.toUpperCase()) {
      case "LEAVE":
        return <Info className="text-blue-500" size={20} />;
      case "ATTENDANCE":
        return <AlertCircle className="text-orange-500" size={20} />;
      default:
        return <CheckCircle className="text-green-500" size={20} />;
    }
  };

  return (
    <>
      {/* Modern Navbar */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 font-montserrat mb-6"
      >
        <div className="flex items-center justify-end px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Bell Icon with Badge */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative cursor-pointer"
              onClick={openSidebar}
            >
              <div className="relative p-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all">
                <Bell className="w-6 h-6 text-blue-600" />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold ring-2 ring-white shadow-lg"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* User Info */}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">{employeeFullname}</p>
              <p className="text-xs text-gray-500">{username}</p>
            </div>

            {/* User Menu */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                  {employeeFullname.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <motion.div
                  animate={{ rotate: showUserMenu ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </motion.div>
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden z-50"
                  >
                    <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 border-b border-gray-200">
                      <p className="font-semibold text-sm text-gray-800">{employeeFullname}</p>
                      <p className="text-xs text-gray-500">{username}</p>
                    </div>
                    <motion.button
                      whileHover={{ backgroundColor: "#fee2e2", x: 5 }}
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 text-red-600 hover:bg-red-50 transition-all"
                    >
                      <LogOut size={18} />
                      <span className="font-medium">Logout</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notification Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"
                  >
                    <Bell className="text-white" size={24} />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Notifications</h2>
                    <p className="text-blue-100 text-sm">{notifications.length} total</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-all backdrop-blur-sm"
                >
                  <X className="text-white" size={24} />
                </motion.button>
              </div>

              {/* Notification List */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
                <style jsx>{`
                  div::-webkit-scrollbar {
                    width: 6px;
                  }
                  div::-webkit-scrollbar-track {
                    background: #f1f5f9;
                  }
                  div::-webkit-scrollbar-thumb {
                    background: #94a3b8;
                    border-radius: 10px;
                  }
                `}</style>

                {loading && page === 1 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                    />
                    <p className="text-gray-500 mt-4">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="p-4 bg-blue-50 rounded-full mb-4">
                      <Bell className="text-blue-400" size={48} />
                    </div>
                    <p className="text-gray-500 text-center">No notifications yet</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {notifications.map((n, idx) => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        whileHover={{ scale: 1.02, x: 5 }}
                        onClick={() => handleNotificationClick(n)}
                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all relative overflow-hidden group ${
                          (n.is_read || 0) < 1
                            ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300"
                            : "bg-white border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {/* Shine effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "100%" }}
                          transition={{ duration: 0.6 }}
                        />

                        <div className="relative z-10 flex gap-3">
                          <div className="flex-shrink-0">
                            {getNotificationIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm mb-1 ${
                              (n.is_read || 0) < 1 ? "font-semibold text-gray-800" : "text-gray-600"
                            }`}>
                              {n.message}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span>
                                {n.timestamp
                                  ? new Date(n.timestamp).toLocaleString()
                                  : ""}
                              </span>
                              {(n.is_read || 0) < 1 && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                                  NEW
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Load More Button */}
              {hasMore && !loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-white border-t border-gray-200"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={loadMore}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
                  >
                    Load More
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-3xl p-8 w-96 text-center shadow-2xl relative overflow-hidden"
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-pink-500 to-red-500" />
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <LogOut className="text-white" size={32} />
              </motion.div>

              <h2 className="text-2xl font-bold mb-3 text-gray-800">
                Confirm Logout
              </h2>
              <p className="mb-8 text-gray-600">
                Are you sure you want to logout from your account?
              </p>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmLogout}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all font-semibold shadow-lg"
                >
                  Yes, Logout
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={2500}
        closeOnClick
        pauseOnHover
        theme="colored"
      />
    </>
  );
};

export default Navbar;
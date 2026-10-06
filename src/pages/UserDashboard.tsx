import { useState, useEffect } from "react";
import { Gamepad2, Calendar, Clock, Monitor, Tv, History, CheckCircle2, ChevronRight, MailCheck, Pizza, Coffee, Eye, EyeOff, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Spline from "@splinetool/react-spline";
import { motion } from "framer-motion";
import { stationsApi, bookingsApi, authApi, request } from "../services/api";
import type { Station } from "../types/Station";
import type { Booking, CreateBookingData } from "../types/booking";
import toast from "react-hot-toast";
import Footer from "../components/Footer";
import DashboardNavbar from "../components/DashboardNavbar";

const SNACKS_MENU = [
  { id: "s1", name: "Cold Drink", price: 100, icon: <Coffee size={20} /> },
  { id: "s2", name: "Lays / Chips", price: 50, icon: <Pizza size={20} /> },
  { id: "s3", name: "Red Bull", price: 250, icon: <Coffee size={20} /> },
];

const getLocalDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getNextAvailableBookingSlot = (now = new Date()) => {
  const nextSlot = new Date(now);
  nextSlot.setMinutes(0, 0, 0);
  if (nextSlot <= now) nextSlot.setHours(nextSlot.getHours() + 1);

  return {
    date: getLocalDateValue(nextSlot),
    time: `${String(nextSlot.getHours()).padStart(2, "0")}:00`,
  };
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("gaming_token"));
  const [activeTab, setActiveTab] = useState<"book" | "history" | "profile">(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("tab") === "history") return "history";
    return "book";
  });
  const [stations, setStations] = useState<Station[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  
  // Auth Modal State
  const [authModal, setAuthModal] = useState<"login" | "register" | "verify" | "forgot" | "reset" | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [resendOtpLoading, setResendOtpLoading] = useState(false);
  const [resendOtpCooldown, setResendOtpCooldown] = useState(0);

  // Booking modal state
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingName, setBookingName] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [bookingContactNumber, setBookingContactNumber] = useState("");
  const [bookingStartTime, setBookingStartTime] = useState("12:00");
  const [bookingDuration, setBookingDuration] = useState("1");
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [bookingLoading, setBookingLoading] = useState(false);

  // User Profile
  const [userProfile, setUserProfile] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stRes, gmRes] = await Promise.all([
        stationsApi.getAll(),
        request<any>("/games").catch(() => ({ data: [] }))
      ]);
      setStations(stRes.data || []);
      setGames(gmRes.data || []);
      
      if (isLoggedIn) {
        const [bkRes, meRes] = await Promise.all([
          bookingsApi.getAll({ my: true }),
          authApi.me().catch(() => ({ success: false, user: null }))
        ]);
        setMyBookings(bkRes.data || []);
        setUserProfile(meRes.user);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard data", { id: "dash_data_error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if ((location.state as any)?.tab === "history" || params.get("tab") === "history") {
      setActiveTab("history");
    } else if ((location.state as any)?.tab === "book" || params.get("tab") === "book") {
      setActiveTab("book");
    }
  }, [location]);

  useEffect(() => {
    fetchData();
  }, [isLoggedIn]);

  useEffect(() => {
    if (resendOtpCooldown === 0) return;
    const timer = window.setTimeout(() => setResendOtpCooldown((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendOtpCooldown]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setIsLoggedIn(false);
      setMyBookings([]);
      setUserProfile(null);
      setAuthModal("login");
      toast.error("Session expired, please login again", { id: "session_expired" });
    };
    window.addEventListener("auth_unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth_unauthorized", handleUnauthorized);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const response = await authApi.login(authEmail, authPassword);
      setIsLoggedIn(true);
      setAuthModal(null);
      toast.success(response.message || "Logged in successfully!", { id: "login_success" });
    } catch (err: any) {
      const errorMsg = err.message || "";

      if (errorMsg.toLowerCase().includes("verify") || errorMsg.toLowerCase().includes("otp")) {
        setAuthModal("verify");
        toast.error("Please verify your email first.", { id: "login_error" });
        return;
      }

      if (errorMsg.toLowerCase().includes("password") || errorMsg.toLowerCase().includes("credential") || errorMsg.toLowerCase().includes("invalid")) {
        toast.error("Your password is not correct, please enter a correct password", { id: "login_error" });
      } else {
        toast.error(errorMsg || "Login failed", { id: "login_error" });
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await authApi.register({ name: authName, email: authEmail, password: authPassword });
      toast.success(res.message || "OTP sent to your email!", { duration: 6000 });
      setAuthModal("verify");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await authApi.verifyEmail(authEmail, authOtp);
      toast.success("Account verified! Please login.");
      setAuthOtp("");
      setAuthModal("login");
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResendVerificationOtp = async () => {
    if (!authEmail.trim()) {
      toast.error("Enter your email address to resend the verification code.");
      return;
    }
    setResendOtpLoading(true);
    try {
      const response = await authApi.resendVerificationOtp(authEmail.trim());
      setAuthOtp("");
      setResendOtpCooldown(30);
      toast.success(response.message);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend verification code.");
    } finally {
      setResendOtpLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await authApi.forgotPassword(authEmail);
      toast.success("OTP sent to your email!");
      setAuthOtp("");
      setAuthPassword("");
      setAuthModal("reset");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset OTP");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await authApi.resetPassword({ email: authEmail, otp: authOtp, newPassword: authPassword });
      toast.success("Password reset! Please login.");
      setAuthPassword("");
      setAuthModal("login");
    } catch (err: any) {
      toast.error(err.message || "Password reset failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    setIsLoggedIn(false);
    setActiveTab("book");
    setMyBookings([]);
    setUserProfile(null);
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const openBookingModal = (station: Station) => {
    if (!isLoggedIn) {
      toast.error("Please login to book a slot");
      setAuthModal("login");
      return;
    }
    setSelectedStation(station);
    setCart({});
    setSelectedGame("");
    setBookingName(userProfile?.name || "");
    setBookingEmail(userProfile?.email || "");
    setBookingContactNumber(userProfile?.phone || "");
    
    const nextSlot = getNextAvailableBookingSlot();
    setBookingDate(nextSlot.date);
    setBookingStartTime(nextSlot.time);
    setBookingDuration("1");
  };

  const calculateTotal = () => {
    if (!bookingDate || !selectedStation) return 0;
    
    const hours = parseInt(bookingDuration) || 1;
    // @ts-ignore
    const baseAmount = hours * (selectedStation.hourlyRate || selectedStation.pricePerHour || 500);
    
    const snacksAmount = SNACKS_MENU.reduce((acc, snack) => acc + (snack.price * (cart[snack.id] || 0)), 0);
    return baseAmount + snacksAmount;
  };

  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStation || !bookingDate) return;

    const start = new Date(`${bookingDate}T${bookingStartTime}:00`);
    if (Number.isNaN(start.getTime()) || start <= new Date()) {
      toast.error("Please select a future date and time.");
      return;
    }
    if (!bookingEmail.trim() || !bookingContactNumber.trim()) {
      toast.error("Your account email and contact number are required to book.");
      return;
    }

    setBookingLoading(true);
    try {
      const end = new Date(start.getTime() + parseInt(bookingDuration) * 36e5);
      
      const totalAmount = calculateTotal();
      const addons = SNACKS_MENU
        .filter(s => cart[s.id] > 0)
        .map(s => ({ name: s.name, price: s.price, quantity: cart[s.id] }));
        
      const pointsEarned = Math.floor(totalAmount / 1000) * 50;

      await bookingsApi.create({
        guestName: bookingName,
        customerEmail: bookingEmail.trim(),
        contactNumber: bookingContactNumber.trim(),
        stationId: selectedStation._id || selectedStation.id,
        station: selectedStation._id || selectedStation.id,
        gameId: selectedGame || undefined,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        amount: totalAmount,
        addons,
        pointsEarned
      } satisfies CreateBookingData);
      
      toast.success("Station booked successfully!");
      setSelectedStation(null);
      fetchData();
      setActiveTab("history");
    } catch (err: any) {
      toast.error(err.message || "Failed to book slot");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="user-panel-shell relative isolate flex min-h-screen flex-col overflow-x-hidden bg-[#11121b] font-sans text-white selection:bg-indigo-400/30">
      <div className="user-panel-background" aria-hidden="true">
        <div className="user-panel-grid" />
        <div className="user-panel-particles" />
        <div className="user-panel-glow" />
      </div>
      <DashboardNavbar
        isLoggedIn={isLoggedIn}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={handleLogout}
        onLogin={() => setAuthModal("login")}
      />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div id="home" className="scroll-mt-24">

        {activeTab === "book" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Overview / Stats (Only for Logged In) */}
            {!isLoggedIn ? (
              <div className="relative mb-12 flex flex-col items-center justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#24283b] to-[#1f2335] shadow-2xl md:flex-row md:rounded-[3rem]">
                <div className="relative z-10 w-full p-6 sm:p-8 md:w-1/2 md:p-14">
                  <div className="gaming-float mb-6 inline-flex items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-400/10 p-3">
                    <Gamepad2 className="h-8 w-8 text-indigo-300" />
                  </div>
                  <h2 className="mb-6 text-3xl font-black leading-tight text-white sm:text-4xl md:text-5xl">
                    Step into the <span className="bg-gradient-to-r from-indigo-300 to-rose-300 bg-clip-text text-transparent">Future</span> of Gaming.
                  </h2>
                  <p className="mb-8 max-w-md text-base text-slate-400 leading-relaxed sm:text-lg">
                    Experience high-end rigs, top-tier consoles, and a thriving community. Join us and elevate your game.
                  </p>
                  <button onClick={() => setAuthModal("login")} className="rounded-full bg-white px-6 py-3.5 font-black text-black transition-colors hover:bg-slate-200 shadow-[0_0_40px_rgba(255,255,255,0.3)] sm:px-8">
                    Login to Book
                  </button>
                </div>
                <div className="gaming-float relative h-[300px] w-full pointer-events-auto sm:h-[380px] md:h-[500px] md:w-1/2">
                  <Spline scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" />
                  <div className="absolute inset-0 z-10 hidden bg-gradient-to-l from-transparent to-[#0B0F19] md:block"></div>
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#131A2D] to-transparent md:hidden"></div>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mb-12 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#131A2D] to-[#0B0F19] border border-white/10 shadow-2xl p-8"
              >
                {/* Background Glow Effects */}
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl pointer-events-none"></div>

                <div className="relative z-10">
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="flex items-center gap-4 mb-2"
                  >
                    <div className="p-3 bg-gradient-to-br from-indigo-400/20 to-rose-400/20 border border-indigo-400/30 rounded-2xl shadow-lg shadow-indigo-400/10">
                      <Gamepad2 className="text-indigo-300 w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                        Welcome back, {userProfile?.name?.split(' ')[0] || "Gamer"}! <span className="text-white">👋</span>
                      </h2>
                      <p className="text-slate-400 mt-1 font-medium text-sm">Ready to dominate your next session? Here is your overview.</p>
                    </div>
                  </motion.div>
                  
                  <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {/* Stat 1: Total Bookings */}
                    <div className="group relative overflow-hidden bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-5 border border-white/5 transition-all duration-300 hover:-translate-y-1 shadow-lg">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <History size={64} className="text-indigo-300" />
                      </div>
                      <p className="text-slate-400 text-sm font-medium mb-2 flex items-center gap-2">
                        <History size={16} className="text-indigo-300" /> Total Bookings
                      </p>
                      <p className="text-3xl font-black text-white">{myBookings.length}</p>
                    </div>



                    {/* Stat 3: Upcoming Booking */}
                    <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-500/10 to-rose-500/10 hover:from-indigo-500/20 hover:to-rose-500/20 rounded-2xl p-5 border border-indigo-400/20 transition-all duration-300 hover:-translate-y-1 shadow-lg">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Calendar size={64} className="text-rose-300" />
                      </div>
                      <p className="text-indigo-200 text-sm font-medium mb-2 flex items-center gap-2">
                        <Calendar size={16} /> Upcoming Booking
                      </p>
                      {(() => {
                        const upcoming = myBookings.find((b:any) => new Date(b.startTime) > new Date() && b.status !== "Cancelled");
                        if (upcoming) {
                          return (
                            <div className="relative z-10">
                              <p className="text-xl font-bold text-white mb-1">
                                {new Date(upcoming.startTime).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                              </p>
                              <p className="text-sm font-medium text-rose-300">{upcoming.station?.name || upcoming.stationName || 'Station'}</p>
                            </div>
                          );
                        }
                        return (
                          <div className="mt-2 flex items-center gap-2 relative z-10">
                            <div className="h-2 w-2 rounded-full bg-slate-500 animate-pulse"></div>
                            <p className="text-sm font-bold text-slate-400">No active bookings</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            

            {/* User Panel (Stations) - ONLY SHOW IF LOGGED IN */}
            {isLoggedIn && (
              <>
                <div className="mb-8 flex items-center justify-between gap-4">
                  <h3 className="text-xl font-bold sm:text-2xl">Available Stations</h3>
                  <div className="ml-4 h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-400/30 border-t-indigo-400"></div>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {stations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((station, index) => {
                        const isPC = station.platform?.toLowerCase().includes("pc");
                        return (
                          <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1, type: "spring", stiffness: 100 }}
                            key={station._id || station.id} 
                            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1 transition-all duration-300 hover:scale-[1.02] hover:border-indigo-400/50 hover:bg-white/10 hover:shadow-xl hover:shadow-indigo-400/10"
                          >
                            <div className="h-32 bg-gradient-to-br from-[#131A2D] to-[#0B0F19] rounded-xl mb-2 flex items-center justify-center border border-white/5 group-hover:border-indigo-400/20 transition-all">
                              {isPC ? <Monitor size={48} className="text-rose-300/80" /> : <Tv size={48} className="text-indigo-300/80" />}
                            </div>
                            <div className="p-4">
                              <div className="mb-2 flex items-center justify-between">
                                <h3 className="font-bold text-lg">{station.name}</h3>
                                {(() => {
                                  // @ts-ignore (Assuming activeBooking is populated dynamically by backend)
                                  const activeBooking = station.activeBooking;
                                  if (activeBooking) {
                                    const now = new Date();
                                    const start = new Date(activeBooking.startTime);
                                    const end = new Date(activeBooking.endTime);
                                    
                                    if (start <= now && end > now) {
                                      return (
                                        <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-400">
                                          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                          Booked till {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      );
                                    } else if (start > now) {
                                      return (
                                        <span className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-semibold text-yellow-400">
                                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                                          Free till {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      );
                                    }
                                  }
                                  return (
                                    <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-semibold text-green-400">
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Available Now
                                    </span>
                                  );
                                })()}
                              </div>
                              <div className="mb-4 text-sm space-y-2 bg-[#1f2335] p-3 rounded-xl border border-white/5">
                                <p className="flex items-center gap-2 text-slate-300">
                                  <span className="text-slate-500 font-medium w-24">Gaming type:</span>
                                  <span className="font-semibold text-white flex items-center gap-1.5">
                                    {isPC ? <Monitor size={14} className="text-rose-300"/> : <Gamepad2 size={14} className="text-indigo-300"/>} 
                                    {station.type || "Gaming PC"}
                                  </span>
                                </p>
                                <p className="flex items-center gap-2 text-slate-300">
                                  <span className="text-slate-500 font-medium w-24">Hourly rate:</span>
                                  <span className="font-bold text-green-400">Rs. {station.hourlyRate || 500}/hr</span>
                                </p>
                                <p className="flex items-start gap-2 text-slate-300">
                                  <span className="text-slate-500 font-medium w-24 shrink-0">Specs:</span>
                                  <span className="text-xs font-medium text-slate-300 line-clamp-2" title={station.specs || "Standard Premium Setup"}>
                                    {station.specs || "Standard Premium Setup"}
                                  </span>
                                </p>
                                <p className="flex items-center gap-2 text-slate-300">
                                  <span className="text-slate-500 font-medium w-24">Games:</span>
                                  <span className="font-semibold text-indigo-200">{games.length > 0 ? `${games.length} Available` : 'Various Titles'}</span>
                                </p>
                              </div>
                              <button onClick={() => openBookingModal(station)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500/10 border border-indigo-400/30 py-3 text-sm font-bold text-indigo-300 transition-all hover:bg-indigo-500 hover:text-white hover:shadow-lg hover:shadow-indigo-500/30">
                                Book Now <ChevronRight size={16} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {stations.length > itemsPerPage && (
                      <div className="mt-12 flex items-center justify-center gap-4 border-t border-white/10 pt-8">
                        <button 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white font-medium hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          Previous
                        </button>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-400">Page</span>
                          <span className="rounded-lg bg-indigo-400/20 px-3 py-1 font-bold text-indigo-300">{currentPage}</span>
                          <span className="text-slate-400">of {Math.ceil(stations.length / itemsPerPage)}</span>
                        </div>
                        <button 
                          onClick={() => setCurrentPage(p => Math.min(Math.ceil(stations.length / itemsPerPage), p + 1))}
                          disabled={currentPage === Math.ceil(stations.length / itemsPerPage)}
                          className="px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white font-medium hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "history" && isLoggedIn && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 flex items-center gap-3">
              <div className="p-3 bg-indigo-400/20 rounded-xl"><History className="text-indigo-300" size={24} /></div>
              <div>
                <h2 className="text-2xl font-bold">My Bookings</h2>
                <p className="text-sm text-slate-400">Track all your past and upcoming gaming sessions</p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-400/30 border-t-indigo-400"></div></div>
            ) : myBookings.length === 0 ? (
              <div className="rounded-3xl border border-white/5 bg-white/5 py-20 text-center flex flex-col items-center">
                <div className="w-20 h-20 mb-6 rounded-full bg-white/5 flex items-center justify-center"><Gamepad2 size={40} className="text-slate-500" /></div>
                <h3 className="mb-2 text-xl font-bold text-white">No bookings yet</h3>
                <p className="mb-6 text-slate-400 max-w-sm">You haven't booked any gaming sessions. Time to jump into the action!</p>
                <a href="#home" onClick={() => setActiveTab("book")} className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-3 rounded-full font-medium transition-all">Book Your First Session</a>
              </div>
            ) : (
              <div className="space-y-4">
                {myBookings.map((b: any) => (
                  <div key={b.id || b._id} className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#24283b] p-4 shadow-lg transition-all hover:border-indigo-400/30 sm:p-6 lg:flex-row">
                    <div className="mb-4 flex w-full items-center gap-4 lg:mb-0 lg:w-auto">
                      <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-[#1f2335] border border-white/5">
                        <Monitor className="text-indigo-300" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{b.station?.name || b.stationName || "Premium Station"}</h4>
                        <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                          <span className="flex items-center gap-1.5"><Calendar size={14}/> {new Date(b.startTime).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1.5"><Clock size={14}/> {new Date(b.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-slate-400">
                          {b.contactNumber && <p>Contact: {b.contactNumber}</p>}
                          {(b.customerEmail || b.user?.email) && <p>Email: {b.customerEmail || b.user.email}</p>}
                        </div>
                        {b.game && <p className="text-xs text-indigo-300 mt-1">Game: {b.game.name || b.game}</p>}
                        {b.addons && b.addons.length > 0 && (
                          <p className="text-xs text-orange-400 mt-1">Addons: {b.addons.map((a:any) => `${a.quantity}x ${a.name}`).join(", ")}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex w-full items-center justify-between gap-4 lg:w-auto lg:justify-end">
                      <div className="text-left lg:text-right">
                        <p className="mb-1 text-sm text-slate-400">Total Amount</p>
                        <p className="text-lg font-bold">Rs. {b.amount}</p>
                      </div>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${
                        b.status === "Confirmed" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                        b.status === "Completed" ? "bg-rose-400/10 text-rose-300 border-rose-400/20" :
                        b.status === "Cancelled" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-orange-500/10 text-orange-400 border-orange-500/20"
                      }`}>
                        {b.status === "Confirmed" && <CheckCircle2 size={16}/>}
                        {b.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        </div>
      </main>

      {/* Advanced Booking Modal with Catalog & Addons */}
      {selectedStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto pt-20 pb-8 sm:p-4">
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#24283b] shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-indigo-900/50 to-rose-900/50 p-6 border-b border-white/10 relative">
              <button onClick={() => setSelectedStation(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white">✕</button>
              <h3 className="text-2xl font-black text-white">Book {selectedStation.name}</h3>
              {/* @ts-ignore */}
              <p className="text-slate-300 mt-1">Platform: {selectedStation.platform || "High-end Gaming Rig"} • Rs. {selectedStation.hourlyRate || selectedStation.pricePerHour || 500}/hr</p>
            </div>
            
            <form onSubmit={handleBookSlot} className="space-y-6 p-4 sm:p-8">
              
              {/* 0. Customer Name */}
              <div>
                <h4 className="text-lg font-bold mb-3 flex items-center gap-2"><User size={18} className="text-indigo-300"/> Customer Details</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 text-xs font-semibold text-slate-400">
                    Full name
                    <input type="text" required autoComplete="name" value={bookingName} onChange={(e) => setBookingName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#1f2335] px-4 py-3 text-sm text-white outline-none transition-all focus:border-indigo-400" />
                  </label>
                  <label className="space-y-2 text-xs font-semibold text-slate-400">
                    Account email
                    <input type="email" required readOnly autoComplete="email" value={bookingEmail} className="w-full rounded-xl border border-white/10 bg-[#1f2335] px-4 py-3 text-sm text-white outline-none read-only:cursor-not-allowed read-only:opacity-75" />
                  </label>
                  <label className="space-y-2 text-xs font-semibold text-slate-400 sm:col-span-2">
                    Contact number
                    <input type="tel" required autoComplete="tel" value={bookingContactNumber} onChange={(e) => setBookingContactNumber(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#1f2335] px-4 py-3 text-sm text-white outline-none transition-all focus:border-indigo-400" />
                  </label>
                </div>
              </div>

              {/* 1. Select Game */}
              <div>
                <h4 className="text-lg font-bold mb-3 flex items-center gap-2"><Gamepad2 size={18} className="text-indigo-300"/> Select Game (Optional)</h4>
                {games.length > 0 ? (
                  <select 
                    value={selectedGame || ""} 
                    onChange={(e) => setSelectedGame(e.target.value)} 
                    className="w-full rounded-xl border border-white/10 bg-[#1f2335] px-4 py-3 text-sm text-white outline-none transition-all focus:border-indigo-400 appearance-none"
                  >
                    <option value="">Games Name</option>
                    {games.map(g => (
                      <option key={g._id || g.id} value={g._id || g.id}>{g.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-slate-400 border border-white/10 rounded-xl p-3 text-center bg-white/5">
                    No games loaded in catalog. (Add games from Admin panel)
                  </div>
                )}
              </div>

              {/* 2. Select Time & Live Tracking */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <h4 className="text-lg font-bold flex items-center gap-2"><Clock size={18} className="text-indigo-300"/> Schedule & Live Tracking</h4>
                  {(() => {
                    // @ts-ignore
                    const activeBooking = selectedStation.activeBooking;
                    if (activeBooking) {
                      const now = new Date();
                      const start = new Date(activeBooking.startTime);
                      const end = new Date(activeBooking.endTime);
                      
                      if (start <= now && end > now) {
                        return (
                          <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Live: Booked till {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        );
                      } else if (start > now) {
                        return (
                          <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-yellow-500/10 text-yellow-400 rounded-lg border border-yellow-500/20">
                            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                            Live: Available till {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        );
                      }
                    }
                    return (
                      <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Live: Completely Free
                      </div>
                    );
                  })()}
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="relative group">
                    <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">Date</label>
                    <input
                      type="date"
                      required
                      min={getLocalDateValue(new Date())}
                      value={bookingDate}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        setBookingDate(selectedDate);
                        if (selectedDate === getLocalDateValue(new Date())) {
                          const nextSlot = getNextAvailableBookingSlot();
                          setBookingDate(nextSlot.date);
                          setBookingStartTime(nextSlot.time);
                        }
                      }}
                      className="w-full rounded-xl border border-white/10 bg-[#1f2335] px-4 py-3 text-sm text-white outline-none transition-all focus:border-indigo-400 [color-scheme:dark]"
                    />
                  </div>
                  <div className="relative group">
                    <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">Start Time</label>
                    <select required value={bookingStartTime} onChange={(e) => setBookingStartTime(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#1f2335] px-4 py-3 text-sm text-white outline-none transition-all focus:border-indigo-400 appearance-none">
                      {[...Array(24)].map((_, i) => {
                        const h = i.toString().padStart(2, "0");
                        const slot = new Date(`${bookingDate}T${h}:00:00`);
                        const isPast = !bookingDate || slot <= new Date();
                        return (
                          <option key={`${h}:00`} value={`${h}:00`} disabled={isPast}>
                            {i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="relative group">
                    <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">Duration</label>
                    <select required value={bookingDuration} onChange={(e) => setBookingDuration(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#1f2335] px-4 py-3 text-sm text-white outline-none transition-all focus:border-indigo-400 appearance-none">
                      <option value="1">1 Hour</option>
                      <option value="2">2 Hours</option>
                      <option value="3">3 Hours</option>
                      <option value="4">4 Hours</option>
                      <option value="5">5 Hours</option>
                      <option value="6">6 Hours</option>
                      <option value="8">8 Hours</option>
                      <option value="12">12 Hours</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
                <div className="text-center sm:text-left">
                  <p className="text-sm text-slate-400">Total Amount</p>
                  <p className="text-3xl font-black text-white">Rs. {calculateTotal()}</p>
                </div>
                <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
                  <button type="submit" disabled={bookingLoading} className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-indigo-500 to-rose-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:from-indigo-400 hover:to-rose-400 disabled:opacity-50">
                    {bookingLoading ? "Processing..." : "Confirm Booking"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auth Modals (Using identical code from before) */}
      {authModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#24283b] shadow-2xl animate-in zoom-in-95 duration-300 p-8 relative">
            <button onClick={() => setAuthModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                {authModal === 'verify' ? <MailCheck size={32} /> : <User size={32} />}
              </div>
              <h2 className="text-2xl font-bold">
                {authModal === 'login' ? "Welcome Back" : authModal === 'register' ? "Create Account" : authModal === 'verify' ? "Verify Email" : authModal === 'forgot' ? "Forgot Password" : "Reset Password"}
              </h2>
            </div>
            {authModal === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <input type="email" required placeholder="Email Address" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#1f2335] px-4 py-3.5 text-sm text-white outline-none focus:border-indigo-400" />
                <div>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} required placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#1f2335] px-4 py-3.5 pr-12 text-sm text-white outline-none focus:border-indigo-400" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="text-right mt-2"><button type="button" onClick={() => { setAuthEmail(""); setAuthModal("forgot"); }} className="text-xs text-indigo-300 hover:text-indigo-200 font-semibold">Forgot Password?</button></div>
                </div>
                <button type="submit" disabled={authLoading} className="mt-2 w-full rounded-xl bg-indigo-500 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-400 disabled:opacity-50">{authLoading ? "Signing in..." : "Sign In"}</button>
                <p className="text-center text-sm text-slate-400 mt-4">Don't have an account? <button type="button" onClick={() => setAuthModal("register")} className="text-indigo-300 hover:text-indigo-200 font-semibold">Sign Up</button></p>
              </form>
            )}
            {authModal === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <input type="text" required placeholder="Full Name" value={authName} onChange={(e) => setAuthName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#1f2335] px-4 py-3.5 text-sm text-white outline-none focus:border-indigo-400" />
                <input type="email" required placeholder="Email Address" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#1f2335] px-4 py-3.5 text-sm text-white outline-none focus:border-indigo-400" />
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required minLength={8} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}" title="Use at least 8 characters, including uppercase and lowercase letters, a number, and a special character." placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#1f2335] px-4 py-3.5 pr-12 text-sm text-white outline-none focus:border-indigo-400" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-slate-400">At least 8 characters with uppercase, lowercase, a number, and a special character.</p>
                <button type="submit" disabled={authLoading} className="mt-4 w-full rounded-xl bg-indigo-500 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-400 disabled:opacity-50">{authLoading ? "Creating..." : "Create Account"}</button>
                <p className="text-center text-sm text-slate-400 mt-4">Already have an account? <button type="button" onClick={() => setAuthModal("login")} className="text-indigo-300 hover:text-indigo-200 font-semibold">Sign In</button></p>
              </form>
            )}
            {authModal === 'verify' && (
              <form onSubmit={handleVerify} className="space-y-4">
                <input type="text" required maxLength={6} placeholder="000000" value={authOtp} onChange={(e) => setAuthOtp(e.target.value.replace(/\D/g, ''))} className="w-full text-center tracking-[0.5em] text-2xl font-mono rounded-xl border border-white/10 bg-[#1f2335] px-4 py-4 text-white outline-none focus:border-indigo-400" />
                <button type="submit" disabled={authLoading || authOtp.length < 6} className="mt-4 w-full rounded-xl bg-indigo-500 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-400 disabled:opacity-50">{authLoading ? "Verifying..." : "Verify OTP"}</button>
                <button
                  type="button"
                  onClick={handleResendVerificationOtp}
                  disabled={authLoading || resendOtpLoading || resendOtpCooldown > 0}
                  className="w-full rounded-xl border border-indigo-400/40 py-3 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resendOtpLoading ? "Sending new code..." : resendOtpCooldown > 0 ? `Resend code in ${resendOtpCooldown}s` : "Resend OTP"}
                </button>
              </form>
            )}
            {authModal === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <input type="email" required placeholder="Email Address" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#1f2335] px-4 py-3.5 text-sm text-white outline-none focus:border-indigo-400" />
                <button type="submit" disabled={authLoading} className="mt-4 w-full rounded-xl bg-indigo-500 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-400 disabled:opacity-50">{authLoading ? "Sending OTP..." : "Send Reset OTP"}</button>
                <p className="text-center text-sm text-slate-400 mt-4">Remember your password? <button type="button" onClick={() => setAuthModal("login")} className="text-indigo-300 hover:text-indigo-200 font-semibold">Sign In</button></p>
              </form>
            )}
            {authModal === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <input type="text" required maxLength={6} placeholder="6-digit OTP" value={authOtp} onChange={(e) => setAuthOtp(e.target.value.replace(/\D/g, ''))} className="w-full text-center tracking-[0.5em] text-2xl font-mono rounded-xl border border-white/10 bg-[#1f2335] px-4 py-4 text-white outline-none focus:border-indigo-400" />
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required minLength={8} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}" title="Use at least 8 characters, including uppercase and lowercase letters, a number, and a special character." placeholder="New Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#1f2335] px-4 py-3.5 pr-12 text-sm text-white outline-none focus:border-indigo-400" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-slate-400">At least 8 characters with uppercase, lowercase, a number, and a special character.</p>
                <button type="submit" disabled={authLoading || authOtp.length < 6} className="mt-4 w-full rounded-xl bg-indigo-500 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-400 disabled:opacity-50">{authLoading ? "Resetting..." : "Reset Password"}</button>
              </form>
            )}
          </div>
        </div>
      )}
      <Footer
        variant="dashboard"
        onBookStation={() => setActiveTab("book")}
        onMyBookings={() => setActiveTab("history")}
      />
    </div>
  );
}

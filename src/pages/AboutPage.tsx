import { Gamepad2, Target, Users, Zap, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Spline from "@splinetool/react-spline";
import Footer from "../components/Footer";
import PublicNavbar from "../components/PublicNavbar";

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#1a1b26] text-white font-sans selection:bg-indigo-400/30 flex flex-col overflow-x-hidden">
      <PublicNavbar />

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 md:py-16">
        {/* Hero Section with 3D Model */}
        <div className="mb-16 flex flex-col items-center justify-between gap-8 md:mb-24 md:flex-row md:gap-12">
          <div className="w-full text-left md:w-1/2">
            <div className="mb-6 inline-flex items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-400/10 p-3">
              <Gamepad2 className="h-8 w-8 text-indigo-300" />
            </div>
            <h1 className="mb-6 text-4xl font-black leading-tight sm:text-5xl md:text-7xl">
              Elevating the <br/><span className="bg-gradient-to-r from-indigo-300 to-rose-300 bg-clip-text text-transparent">Gaming Experience</span>
            </h1>
            <p className="mb-8 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
              GameZone was founded with a single mission: to provide the ultimate premium gaming environment for casual players and hardcore esports competitors alike. We bring together cutting-edge hardware, high-speed connectivity, and an unbeatable atmosphere.
            </p>
            <button onClick={() => navigate("/user")} className="rounded-full bg-white px-6 py-3.5 font-black text-black transition-colors hover:bg-slate-200 shadow-[0_0_40px_rgba(255,255,255,0.3)] sm:px-8">
              Book Your Station Now
            </button>
          </div>
          
          <div className="relative h-[300px] w-full overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-indigo-900/10 to-rose-900/10 md:h-[500px] md:w-1/2 md:rounded-[3rem]">
            {/* 3D Spline Animation */}
            <div className="absolute inset-0 z-10 pointer-events-auto">
              <Spline scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" />
            </div>
            <div className="absolute inset-0 bg-indigo-400/5 mix-blend-overlay pointer-events-none z-20"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none z-0"></div>
          </div>
        </div>

        {/* Stats / Features */}
        <div className="grid md:grid-cols-4 gap-6 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          <div className="bg-[#24283b] p-6 rounded-3xl border border-white/5 text-center hover:border-indigo-400/30 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-400/20 text-indigo-300 flex items-center justify-center mx-auto mb-4">
              <Zap size={24} />
            </div>
            <h3 className="text-3xl font-black text-white mb-1">Top Tier</h3>
            <p className="text-slate-400 text-sm font-medium">RTX 4090 Rigs & PS5s</p>
          </div>
          <div className="bg-[#24283b] p-6 rounded-3xl border border-white/5 text-center hover:border-rose-400/30 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-rose-400/20 text-rose-300 flex items-center justify-center mx-auto mb-4">
              <Users size={24} />
            </div>
            <h3 className="text-3xl font-black text-white mb-1">5,000+</h3>
            <p className="text-slate-400 text-sm font-medium">Active Gamers</p>
          </div>
          <div className="bg-[#24283b] p-6 rounded-3xl border border-white/5 text-center hover:border-green-500/30 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-4">
              <Award size={24} />
            </div>
            <h3 className="text-3xl font-black text-white mb-1">#1</h3>
            <p className="text-slate-400 text-sm font-medium">Rated Cafe in City</p>
          </div>
          <div className="bg-[#24283b] p-6 rounded-3xl border border-white/5 text-center hover:border-orange-500/30 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-4">
              <Target size={24} />
            </div>
            <h3 className="text-3xl font-black text-white mb-1">24/7</h3>
            <p className="text-slate-400 text-sm font-medium">Unstoppable Action</p>
          </div>
        </div>

        {/* Vision Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center bg-[#24283b] rounded-3xl p-8 md:p-12 border border-white/10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <div>
            <h2 className="text-3xl font-black mb-4">Our Vision</h2>
            <p className="text-slate-400 leading-relaxed mb-6">
              We believe that gaming is more than just a hobby—it's a community, a sport, and a passion. Our goal is to bridge the gap between home setups and professional esports arenas by offering an accessible yet premium space. 
            </p>
            <p className="text-slate-400 leading-relaxed mb-8">
              From our comfortable ergonomic chairs to our blazing fast 1Gbps fiber internet and fully stocked snack bar, every detail at GameZone is designed around the gamer.
            </p>
            <button onClick={() => navigate("/user")} className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-rose-500 text-white font-bold hover:shadow-lg hover:shadow-indigo-400/30 transition-all">
              Join the Arena Today
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="h-40 rounded-2xl bg-indigo-900/30 border border-indigo-400/20 flex items-center justify-center">
                <span className="font-bold text-indigo-300/50">High-End PCs</span>
              </div>
              <div className="h-48 rounded-2xl bg-rose-900/30 border border-rose-400/20 flex items-center justify-center">
                <span className="font-bold text-rose-300/50">Esports Arena</span>
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="h-48 rounded-2xl bg-pink-900/30 border border-pink-500/20 flex items-center justify-center">
                <span className="font-bold text-pink-400/50">Console Lounge</span>
              </div>
              <div className="h-40 rounded-2xl bg-green-900/30 border border-green-500/20 flex items-center justify-center">
                <span className="font-bold text-green-400/50">Snack Bar</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer
        contactDetails={{
          email: "saadblogger53@gmail.com",
          phone: "+923133184171",
          address: "Hyderabad City Pakistan",
        }}
      />
    </div>
  );
}

import React from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import toast from "react-hot-toast";
import Footer from "../components/Footer";
import PublicNavbar from "../components/PublicNavbar";

export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent! We will get back to you soon.");
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen bg-[#1a1b26] text-white font-sans selection:bg-indigo-400/30 flex flex-col">
      <PublicNavbar />

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-7xl px-6 py-12 w-full">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Get in <span className="text-indigo-400">Touch</span></h1>
          <p className="text-slate-400 max-w-2xl mx-auto">Have questions about our setups, want to book for a large group, or need technical support? We're here to help.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-[#24283b] border border-white/10 rounded-3xl p-8">
              <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-400/20 flex items-center justify-center shrink-0">
                    <MapPin className="text-indigo-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Our Location</h4>
                    <p className="text-slate-400 text-sm">Gaming Street, DHA Phase 6<br />Karachi, Pakistan</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-400/20 flex items-center justify-center shrink-0">
                    <Phone className="text-rose-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Phone Number</h4>
                    <p className="text-slate-400 text-sm">+92 313 3184171<br />+92 318 2614903</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                    <Mail className="text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Email Address</h4>
                    <p className="text-slate-400 text-sm">saadblogger53@gmail.com<br />saadblogger100@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-500/20 to-rose-500/20 border border-indigo-400/30 rounded-3xl p-8 text-center">
              <h3 className="text-xl font-bold mb-2">Opening Hours</h3>
              <p className="text-indigo-200 font-medium">Monday - Sunday</p>
              <p className="text-white font-black text-2xl mt-1">24 / 7</p>
              <p className="text-sm text-slate-400 mt-2">We never sleep, so you don't have to.</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-[#24283b] border border-white/10 rounded-3xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold mb-6">Send us a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
                <input type="text" required className="w-full rounded-xl border border-white/10 bg-[#1f2335] px-4 py-3 text-white outline-none focus:border-indigo-400 transition-colors" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Email Address</label>
                <input type="email" required className="w-full rounded-xl border border-white/10 bg-[#1f2335] px-4 py-3 text-white outline-none focus:border-indigo-400 transition-colors" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Subject</label>
                <input type="text" required className="w-full rounded-xl border border-white/10 bg-[#1f2335] px-4 py-3 text-white outline-none focus:border-indigo-400 transition-colors" placeholder="How can we help?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Message</label>
                <textarea required rows={5} className="w-full rounded-xl border border-white/10 bg-[#1f2335] px-4 py-3 text-white outline-none focus:border-indigo-400 transition-colors resize-none" placeholder="Write your message here..."></textarea>
              </div>
              <button type="submit" className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 font-bold text-white hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/30">
                <Send size={18} /> Send Message
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

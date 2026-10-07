import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import Footer from "../components/Footer";
import PublicNavbar from "../components/PublicNavbar";
import toast from "react-hot-toast";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Thank you! Your message has been sent to our team.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#1a1b26] text-white font-sans selection:bg-indigo-400/30 flex flex-col">
      <PublicNavbar />

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-7xl px-6 py-12 w-full">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Get in <span className="text-indigo-400">Touch</span></h1>
          <p className="text-slate-400 max-w-2xl mx-auto">Have questions about our setups, want to book for a large group, or need technical support? Send us a message.</p>
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
            <h3 className="mb-2 text-2xl font-bold">Send Us a Message</h3>
            <p className="mb-6 text-sm text-slate-400">Fill out the form below and we will get back to you shortly.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">Your Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-white/10 bg-[#16161e] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className="w-full rounded-xl border border-white/10 bg-[#16161e] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Booking Query, Rigs Info"
                  className="w-full rounded-xl border border-white/10 bg-[#16161e] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">Message *</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full rounded-xl border border-white/10 bg-[#16161e] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-400 disabled:opacity-50 cursor-pointer"
              >
                <Send size={18} />
                {submitting ? "Sending..." : "Submit Message"}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

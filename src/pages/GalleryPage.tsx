import Footer from "../components/Footer";
import PublicNavbar from "../components/PublicNavbar";

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-[#1a1b26] text-white font-sans selection:bg-indigo-400/30 flex flex-col overflow-x-hidden">
      <PublicNavbar />

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 md:py-16">
        {/* --- GALLERY SECTION --- */}
        <div id="gallery" className="mt-32 mb-16 scroll-mt-24">
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Our <span className="text-indigo-400">Gallery</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Experience the ultimate gaming atmosphere. Take a look inside our premium arena.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="group relative overflow-hidden rounded-2xl md:col-span-2 md:row-span-2">
              <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80" alt="Esports Arena" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-end p-6">
                <span className="text-white font-bold text-lg">Pro Esports Stage</span>
              </div>
            </div>
            
            <div className="group relative h-48 md:h-auto overflow-hidden rounded-2xl">
              <img src="https://images.unsplash.com/photo-1616514197671-15d99ce7a6f8?auto=format&fit=crop&w=400&q=80" alt="Gaming PC Setup" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-end p-4">
                <span className="text-white font-bold text-sm">RTX 4090 Rigs</span>
              </div>
            </div>
            
            <div className="group relative h-48 md:h-auto overflow-hidden rounded-2xl">
              <img src="https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=400&q=80" alt="Console Lounge" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-end p-4">
                <span className="text-white font-bold text-sm">PS5 Lounge</span>
              </div>
            </div>
            
            <div className="group relative h-48 md:h-auto overflow-hidden rounded-2xl">
              <img src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80" alt="Neon Ambiance" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-end p-4">
                <span className="text-white font-bold text-sm">Retro & Arcade</span>
              </div>
            </div>
            
            <div className="group relative h-48 md:h-auto overflow-hidden rounded-2xl">
              <img src="https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=400&q=80" alt="Gamers Playing" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-end p-4">
                <span className="text-white font-bold text-sm">Community Tournaments</span>
              </div>
            </div>
          </div>
        </div>


        </main>

      <Footer />
    </div>
  );
}

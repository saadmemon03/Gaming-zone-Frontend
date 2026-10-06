const fs = require('node:fs');
const path = require('node:path');

const pagesDirectory = path.resolve(__dirname, '../../src/pages');
const pages = ['UserDashboard.tsx', 'AboutPage.tsx', 'ContactPage.tsx', 'GalleryPage.tsx'];

for (let page of pages) {
  const pagePath = path.join(pagesDirectory, page);
  let content = fs.readFileSync(pagePath, 'utf8');
  
  const desktopNavRegex = /<div className="hidden md:flex rounded-full bg-white\/5 p-1 border border-white\/10">[\s\S]*?<\/div>/;
  const standardNav = `<div className="hidden md:flex rounded-full bg-white/5 p-1 border border-white/10">
              <button onClick={() => navigate("/user")} className={\`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 \${window.location.pathname === '/user' ? 'bg-indigo-500 shadow-md text-white' : 'text-slate-400 hover:text-white'}\`}>Dashboard</button>
              <button onClick={() => navigate("/about")} className={\`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 \${window.location.pathname === '/about' ? 'bg-indigo-500 shadow-md text-white' : 'text-slate-400 hover:text-white'}\`}>About Us</button>
              <button onClick={() => navigate("/gallery")} className={\`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 \${window.location.pathname === '/gallery' ? 'bg-indigo-500 shadow-md text-white' : 'text-slate-400 hover:text-white'}\`}>Gallery</button>
              <button onClick={() => navigate("/contact")} className={\`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 \${window.location.pathname === '/contact' ? 'bg-indigo-500 shadow-md text-white' : 'text-slate-400 hover:text-white'}\`}>Contact</button>
            </div>`;
  content = content.replace(desktopNavRegex, standardNav);
  
  const mobileNavRegex = /<button onClick=\{\(\) => navigate\("\/user"\)\} className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all text-slate-300 hover:bg-white\/5 hover:text-white">Dashboard<\/button>[\s\S]*?(?=<div className="my-1 border-t border-white\/10"><\/div>)/;
  const standardMobileNav = `<button onClick={() => navigate("/user")} className={\`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all \${window.location.pathname === '/user' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}\`}>Dashboard</button>
                    <button onClick={() => navigate("/about")} className={\`w-full flex items-center px-4 py-3 mt-1 rounded-lg text-sm font-medium transition-all \${window.location.pathname === '/about' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}\`}>About Us</button>
                    <button onClick={() => navigate("/gallery")} className={\`w-full flex items-center px-4 py-3 mt-1 rounded-lg text-sm font-medium transition-all \${window.location.pathname === '/gallery' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}\`}>Gallery</button>
                    <button onClick={() => navigate("/contact")} className={\`w-full flex items-center px-4 py-3 mt-1 rounded-lg text-sm font-medium transition-all \${window.location.pathname === '/contact' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}\`}>Contact</button>
                    `;
  content = content.replace(mobileNavRegex, standardMobileNav);
  
  // Replace the anchor links in the footer and main content
  content = content.replace(/<a href="#about".*?>About Us<\/a>/g, '<button onClick={() => navigate(\'/about\')} className="hover:text-indigo-300 transition-colors">About Us</button>');
  content = content.replace(/<a href="#contact".*?>Contact Us<\/a>/g, '<button onClick={() => navigate(\'/contact\')} className="hover:text-indigo-300 transition-colors">Contact Us</button>');
  content = content.replace(/<a href="#gallery".*?>Gallery<\/a>/g, '<button onClick={() => navigate(\'/gallery\')} className="hover:text-indigo-300 transition-colors">Gallery</button>');

  // Also replace any hardcoded active buttons
  content = content.replace(/<button className="px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 bg-indigo-500 shadow-md text-white">\s*About Us\s*<\/button>/g, '<button onClick={() => navigate(\'/about\')} className="px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 bg-indigo-500 shadow-md text-white">About Us</button>');
  content = content.replace(/<button className="px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 bg-indigo-500 shadow-md text-white">\s*Contact\s*<\/button>/g, '<button onClick={() => navigate(\'/contact\')} className="px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 bg-indigo-500 shadow-md text-white">Contact</button>');

  fs.writeFileSync(pagePath, content);
}
console.log("Success");

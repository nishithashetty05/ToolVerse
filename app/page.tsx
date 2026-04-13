import Link from "next/link";
import { ArrowRight, CheckCircle2, Leaf, Shield, Tractor, Users } from "lucide-react";
import { Show } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-white dark:bg-[#0f172a]">
      {/* Navbar Minimal for Landing Page */}
      <nav className="absolute top-0 w-full z-50 px-6 py-4 flex justify-between items-center backdrop-blur-sm bg-black/10 border-b border-white/10 text-white">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg backdrop-blur-md">
            <Tractor className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">ToolVerse</span>
        </div>
        <div className="flex gap-4 items-center">
          <Show when="signed-out">
            <Link href="/sign-in" className="px-4 py-2 rounded-full text-sm font-medium hover:bg-white/10 transition-colors">
              Login
            </Link>
            <Link href="/sign-up" className="px-4 py-2 rounded-full text-sm font-medium bg-primary hover:bg-primary-dark text-white transition-colors shadow-lg shadow-primary/30">
              Register
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard" className="px-4 py-2 rounded-full text-sm font-medium bg-primary hover:bg-primary-dark text-white transition-colors shadow-lg shadow-primary/30">
              Dashboard
            </Link>
          </Show>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
        {/* Background Image Setup */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero-bg.png')" }}
        >
          {/* Default Dark Green Overlay (as per image reference) */}
          <div className="absolute inset-0 bg-[#0f3d1f]/70 mix-blend-multiply"></div>
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a2915]/90 via-[#0a2915]/60 to-transparent"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-white md:w-2/3 lg:w-1/2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium mb-6 animate-fade-in-up">
            <Leaf className="h-4 w-4 text-green-400" />
            <span className="text-green-50">Sustainable Farming Together</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight animate-fade-in-up delay-100">
            Share Agricultural Tools,<br />
            <span className="text-green-400">Grow Together</span>
          </h1>
          
          <p className="text-lg md:text-xl text-green-50/90 mb-10 max-w-2xl leading-relaxed animate-fade-in-up delay-200">
            A community platform for farmers to share, borrow, and manage agricultural tools. Reduce costs, increase efficiency, and build stronger farming communities.
          </p>

          <div className="flex flex-wrap items-center gap-4 animate-fade-in-up delay-300">
            <Show when="signed-out">
              <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-primary rounded-full hover:bg-primary-dark hover:scale-105 transition-all shadow-xl shadow-primary/30">
                Start Sharing Tools
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Show>
            <Show when="signed-in">
              <Link 
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-primary rounded-full hover:bg-primary-dark hover:scale-105 transition-all shadow-xl shadow-primary/30"
              >
                Go to Dashboard
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Show>
            
            <Link 
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all"
            >
              Browse Tools
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <div className="bg-primary-dark text-white relative z-20 shadow-2xl">
        <div className="container mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/10">
            <div className="flex items-center gap-4 pl-4 sm:pl-0">
              <div className="p-3 bg-white/10 rounded-xl"><Tractor className="h-6 w-6 text-green-300" /></div>
              <div>
                <p className="text-2xl font-bold">250+</p>
                <p className="text-sm text-green-200">Active Tools</p>
              </div>
            </div>
            <div className="flex items-center gap-4 pl-8">
              <div className="p-3 bg-white/10 rounded-xl"><Users className="h-6 w-6 text-green-300" /></div>
              <div>
                <p className="text-2xl font-bold">1,200+</p>
                <p className="text-sm text-green-200">Registered Farmers</p>
              </div>
            </div>
            <div className="flex items-center gap-4 pl-8">
              <div className="p-3 bg-white/10 rounded-xl"><CheckCircle2 className="h-6 w-6 text-green-300" /></div>
              <div>
                <p className="text-2xl font-bold">8,500+</p>
                <p className="text-sm text-green-200">Successful Borrows</p>
              </div>
            </div>
            <div className="flex items-center gap-4 pl-8">
              <div className="p-3 bg-white/10 rounded-xl"><Shield className="h-6 w-6 text-green-300" /></div>
              <div>
                 <p className="text-2xl font-bold">100%</p>
                 <p className="text-sm text-green-200">Secure Platform</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

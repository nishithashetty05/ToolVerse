"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, Mail, Tractor, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy navigation for the UI project
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-[#0f172a]">
      {/* Left Decoration / Info Panel */}
      <div className="hidden md:flex md:w-1/2 bg-primary relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-bg.png')] bg-cover bg-center mix-blend-overlay opacity-30"></div>
        <div className="relative z-10 text-white p-12 max-w-lg">
          <Link href="/" className="inline-flex items-center gap-2 mb-12 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
          <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/30">
             <Tractor className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Grow Your Farm with ToolVerse</h1>
          <p className="text-lg text-green-50/80">
            Join the community of modern farmers. Share unused equipment, borrow what you need, and reduce your farming costs significantly.
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white dark:bg-[#1e293b] rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 sm:p-10 transition-all">
          <div className="flex justify-between items-center mb-8 md:hidden">
             <Link href="/" className="text-gray-500 hover:text-primary transition-colors">
               <ArrowLeft className="h-6 w-6" />
             </Link>
             <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Tractor className="h-6 w-6" />
             </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLogin ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              {isLogin ? "Enter your credentials to access your account" : "Sign up to start sharing and borrowing tools"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                {isLogin && (
                  <a href="#" className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors">
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all mt-6"
            >
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              {isLogin ? "Register now" : "Sign in instead"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

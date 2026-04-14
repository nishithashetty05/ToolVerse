"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, Calendar, ShieldCheck, Tractor, Users, Wrench } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#e8f6ed] dark:bg-[#0f172a] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute top-6 left-6 z-10">
        <Link href="/" className="flex items-center text-primary-dark dark:text-gray-300 font-medium hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </div>

      <div className="max-w-5xl w-full bg-white dark:bg-card-bg rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-in fade-in zoom-in-95 duration-500">
        
        {/* Left Pane - Branding */}
        <div className="w-full md:w-5/12 bg-primary p-10 flex flex-col justify-between text-white relative overflow-hidden">
          {/* Subtle background pattern/overlay */}
          <div className="absolute inset-0 bg-black/5 mix-blend-overlay"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
               <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                 <Tractor className="h-6 w-6 text-white" />
               </div>
               <div>
                 <h2 className="font-bold text-xl leading-none">FarmShare</h2>
                 <p className="text-xs text-green-100/80 mt-1">Tool Management System</p>
               </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">Join Our Farming Community</h1>
            <p className="text-green-50 mb-8 text-sm leading-relaxed">
              Create an account to start sharing and borrowing tools safely with verified local farmers.
            </p>

            <ul className="space-y-4 mb-8">
              {[
                { icon: Tractor, text: "Access 250+ farming tools" },
                { icon: Calendar, text: "Easy reservation & scheduling" },
                { icon: Users, text: "Expert consultation network" },
                { icon: Wrench, text: "Maintenance tracking & alerts" }
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm text-green-50">
                  <item.icon className="h-5 w-5 text-green-300 flex-shrink-0" />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Pane - Clerk Form */}
        <div className="w-full md:w-7/12 p-8 sm:p-12 flex flex-col justify-center items-center bg-white dark:bg-card-bg">
          <SignUp 
            routing="path" 
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "w-full max-w-md",
                card: "shadow-none bg-transparent p-0 border-none w-full",
                headerTitle: "text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2",
                headerSubtitle: "text-gray-500 dark:text-gray-400 mb-6",
                formButtonPrimary: "bg-primary hover:bg-primary-dark text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-md mt-2",
                formFieldInput: "rounded-xl border-gray-200 dark:border-card-border bg-gray-50 dark:bg-card-muted py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all",
                formFieldLabel: "text-gray-700 dark:text-gray-300 font-medium",
                footerActionLink: "text-primary hover:text-primary-dark font-semibold",
                socialButtonsBlockButton: "rounded-xl border border-gray-200 dark:border-card-border bg-white dark:bg-card-bg hover:bg-gray-50 dark:hover:bg-card-muted",
              }
            }}
          />
        </div>

      </div>
    </div>
  );
}

"use client";
import React from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";

import SignInForm from "./signin-form";
import FullScreenLoader from "../components/fullscreen.loader";
import Link from "next/link";

const SigIn = () => {
   const session = useSession();
   const users = session.data?.user as any;

   return (
      <div className="bg-gradient-to-b from-blue-50 to-white pt-20 pb-20">
         <div className="max-w-7xl mx-auto px-0 sm:px-2 lg:px-2">
            <div className="flex flex-col lg:flex-row items-center">
               {/* Left side - App showcase */}
               <div className="lg:w-1/2 order-2 lg:order-1">
                  <div className="flex flex-col w-full py-5">
                     <div className="mb-4 leading-9">
                        <h2 className="text-4xl font-bold">
                           Welcome to Albummai!
                        </h2>
                        <p className="text-blue-600 text-md">
                           Create your Digital Album Book with A.I.
                        </p>
                     </div>
                     <h3 className="text-lg font-semibold mb-3">
                        Smart Features
                     </h3>
                     <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                           <svg
                              className="w-4 h-4 mr-2 mt-0.5 text-blue-300"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                           >
                              <path
                                 fillRule="evenodd"
                                 d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                 clipRule="evenodd"
                              />
                           </svg>
                           <span>AI-powered Book Design Generator</span>
                        </li>
                        <li className="flex items-start">
                           <svg
                              className="w-4 h-4 mr-2 mt-0.5 text-blue-300"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                           >
                              <path
                                 fillRule="evenodd"
                                 d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                 clipRule="evenodd"
                              />
                           </svg>
                           <span>Automatic page background generation</span>
                        </li>
                        <li className="flex items-start">
                           <svg
                              className="w-4 h-4 mr-2 mt-0.5 text-blue-300"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                           >
                              <path
                                 fillRule="evenodd"
                                 d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                 clipRule="evenodd"
                              />
                           </svg>
                           <span>Free preview digital album book</span>
                        </li>
                     </ul>

                     <div className="mt-6 mb-10 pt-4 border-t border-blue-400 border-opacity-30">
                        <p className="text-xs text-blue-500 italic">
                           "AlbummAI transformed how I organize my photo
                           collection!" - Sarah K.
                        </p>
                     </div>
                     <Link
                        href="/register"
                        className="box max-w-80 py-4 px-4 rounded-full bg-blue-700 text-center text-white"
                     >
                        Create an Account
                     </Link>
                  </div>
               </div>
               <div className="lg:w-1/2 mb-10 lg:mb-0 order-1 lg:order-2">
                  <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-lg">
                     <div className="flex border-b">
                        <div className="flex-1 py-4 px-6 text-end font-medium text-xl text-gray">
                           <p className="font-bold text-blue-600">Sign in</p>
                        </div>
                     </div>
                     <div className="p-6">
                        <MainContent
                           status={session.status}
                           role={users?.role}
                        />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

type MainContentProps = {
   status: "authenticated" | "unauthenticated" | "loading";
   role: string;
   isLoading?: boolean;
};

const MainContent: React.FC<MainContentProps> = ({
   status,
   role,
   isLoading,
}) => {
   const router = useRouter();
   if (status === "loading" || isLoading) {
      return (
         <div className="w-full flex items-center justify-center">
            <FullScreenLoader />
         </div>
      );
   }

   const page = role === "admin" ? "admin" : "me";

   if (status === "authenticated") {
      router.replace(`/${page}/dashboard`);
   }

   return (
      <div>
         <SignInForm />
      </div>
   );
};

export default SigIn;

//src/app/signin/page.tsx
"use client";
import React from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

import SignInForm from "./signin-form";
import FullScreenLoader from "../components/fullscreen.loader";

const SigIn = () => {
   const session = useSession();
   const users = session.data?.user as any;

   return (
      <>
         <div className="p-6">
            <MainContent status={session.status} role={users?.role} />
         </div>
      </>
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
   if (status === "loading" || isLoading) {
      return (
         <div className="w-full flex items-center justify-center">
            <FullScreenLoader />
         </div>
      );
   }

   const page = role === "admin" ? "admin" : "me";

   if (status === "authenticated") {
      redirect(`/${page}/dashboard`);
   }

   return (
      <div>
         <SignInForm />
      </div>
   );
};

export default SigIn;

"use client";
import { withAuthLayout } from "@/backend/withAuth";
import { withAuth } from "@/backend/withAuth";
import AsideNavigation from "./components/aside.navigation";
import React, { ReactNode } from "react";

type ProtectedLayoutProps = {
   children?: ReactNode;
};

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({
   children,
}: ProtectedLayoutProps) => {
   const { logout } = withAuth({
      role: "user",
      redirectTo: "/signin",
   });

   return (
      <div className="min-h-screen bg-gray-50 flex">
         <AsideNavigation onLogout={logout} />

         <div className="flex-1">
            <main>{children}</main>
         </div>
      </div>
   );
};

export default withAuthLayout({
   role: "user",
   redirectTo: "/signin",
   unauthorizedRedirect: "/admin/forbidden",
})(ProtectedLayout);

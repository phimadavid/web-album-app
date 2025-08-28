"use client";
import { withAuthLayout } from "@/backend/withAuth";
import { withAuth } from "@/backend/withAuth";

import React, { ReactNode } from "react";
import AsideAdminNavigation from "./components/aside.admin.nav";

type ProtectedLayoutProps = {
   children?: ReactNode;
};

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({
   children,
}: ProtectedLayoutProps) => {
   const { logout } = withAuth({
      role: "admin",
      redirectTo: "/signin",
   });

   return (
      <div className="min-h-screen bg-gray-50 flex">
         <AsideAdminNavigation onLogout={logout} />

         <div className="flex-1">
            <main>{children}</main>
         </div>
      </div>
   );
};

export default withAuthLayout({
   role: "admin",
   redirectTo: "/signin",
   unauthorizedRedirect: "/admin/forbidden",
})(ProtectedLayout);

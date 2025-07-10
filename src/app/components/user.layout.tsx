"use client";

import React from "react";
import { useSession } from "next-auth/react";
import Header from "./header";
import Footer from "./footer";

const ClientLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { status } = useSession();
  const showHeader = status !== "authenticated";

  return (
    <div>
      <div>
        <Header />
        {children}
        {showHeader ? <Footer /> : null}
      </div>
    </div>
  );
};

export default ClientLayout;

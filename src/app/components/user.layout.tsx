"use client";

import React from "react";
import { useSession } from "next-auth/react";
import Header from "./header";

const ClientLayout: React.FC<{ children: React.ReactNode }> = ({
   children,
}) => {
   return (
      <div>
         <div>
            <Header />
            {children}
         </div>
      </div>
   );
};

export default ClientLayout;

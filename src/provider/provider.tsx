"use client";
import React, { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "react-query";
import { SessionProvider } from "next-auth/react";

interface ProviderParams {
  children: ReactNode;
}

const queryClient = new QueryClient();

const Provider: React.FC<ProviderParams> = (props) => {
  const { children } = props;

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
};

export default Provider;

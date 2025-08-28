import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useState, useEffect, ComponentType } from "react";
import FullScreenLoader from "@/app/components/fullscreen.loader";

type UserRole = "admin" | "user";

interface UseAuthOptions {
   role?: UserRole;
   redirectTo?: string;
   unauthorizedRedirect?: string;
}

export function withAuth(options?: UseAuthOptions) {
   const session = useSession();
   const router = useRouter();
   const [isLoggingOut, setIsLoggingOut] = useState(false);

   const logout = useCallback(() => {
      setIsLoggingOut(true);
      signOut({ redirect: false })
         .then(() => router.push(options?.redirectTo || "/signin"))
         .finally(() => setIsLoggingOut(false));
   }, [router, options?.redirectTo]);

   const isLoading = session.status === "loading";
   const isAuthenticated = session.status === "authenticated";
   const userRole = (session.data?.user as any)?.role;
   const hasValidRole = options?.role ? userRole === options.role : true;

   return {
      session,
      logout,
      isLoading,
      isLoggingOut,
      isAuthenticated,
      hasValidRole,
      user: session.data?.user,
   };
}

export function withAuthLayout<P extends object>(options?: UseAuthOptions) {
   return function (WrappedLayout: ComponentType<P>) {
      return function AuthLayoutWrapper(props: P) {
         const auth = withAuth(options);
         const router = useRouter();

         useEffect(() => {
            if (auth.isLoading) return;

            if (!auth.isAuthenticated) {
               router.push(options?.redirectTo || "/signin");
            } else if (!auth.hasValidRole) {
               router.push(options?.unauthorizedRedirect || "/unauthorized");
            }
         }, [auth.isLoading, auth.isAuthenticated, auth.hasValidRole, router]);

         if (auth.isLoading) {
            return (
               <div>
                  <FullScreenLoader />
               </div>
            );
         }

         if (auth.isLoggingOut) {
            return <FullScreenLoader />;
         }

         if (!auth.isAuthenticated || !auth.hasValidRole) {
            return null;
         }

         return <WrappedLayout {...props} />;
      };
   };
}

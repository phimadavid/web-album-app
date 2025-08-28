import { options } from "@/backend/utils/authOption";
import NextAuth from "next-auth/next";

const authHandler = NextAuth(options);

export { authHandler as GET, authHandler as POST };

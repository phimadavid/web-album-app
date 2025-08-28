"use client";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import React, { useId, useState } from "react";
import Link from "next/link";

import * as yup from "yup";
import { signIn } from "next-auth/react";
import authschema from "../validation/auth.schema";

type SignInFormData = {
   email: string;
   password: string;
};

const SignInForm: React.FC = () => {
   const ids: SignInFormData = {
      password: useId(),
      email: useId(),
   };

   const [formData, setFormData] = useState<SignInFormData>({
      email: "",
      password: "",
   });
   const [formError, setFormError] = useState<Partial<SignInFormData>>({});
   const [showPassword, setShowPassword] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
   const [errorMessage, setErrorMessage] = useState<string>("");
   const [loginError, setLoginError] = useState<boolean>(false);
   const [isTyping, setIsTyping] = useState(false);

   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
         ...prev,
         [name]: value,
      }));

      const updatedFormData = {
         ...formData,
         [name]: value,
      };

      setIsTyping(
         updatedFormData.email.length > 0 || updatedFormData.password.length > 0
      );

      if (formError[name as keyof SignInFormData]) {
         setFormError(prev => ({
            ...prev,
            [name]: "",
         }));
      }
   };

   const OnSubmit = async (event?: React.FormEvent) => {
      event?.preventDefault();

      if (isSubmitting) {
         return;
      }

      const errors: Partial<SignInFormData> = {};
      if (!formData.email.trim()) {
         errors.email = "Please enter your email";
      }
      if (!formData.password.trim()) {
         errors.password = "Please enter your password";
      }

      if (Object.keys(errors).length > 0) {
         setFormError(errors);
         return;
      }

      setIsSubmitting(true);

      try {
         authschema.validateSync(formData, { abortEarly: false });

         const response = await signIn("credentials", {
            redirect: false,
            ...formData,
         });

         if ((response as any).error) {
            const jsonError = JSON.parse((response as any).error);
            setErrorMessage(jsonError.error);
            setLoginError(true);
            return;
         }

         setLoginError(false);
      } catch (error) {
         if (error instanceof yup.ValidationError) {
            let errors = {};
            error.inner.forEach(result => {
               errors = {
                  ...errors,
                  [result.path as any]: result.message,
               };
            });
            setFormError(errors);
         } else {
            console.log(error);
            console.error(error);
         }
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleGoogleSignIn = async () => {
      try {
         setIsSubmitting(true);
         await signIn("google", {
            callbackUrl: "/me/dashboard",
         });
      } catch (error) {
         console.error("Google sign-in error:", error);
         setErrorMessage("Failed to sign in with Google");
         setLoginError(true);
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <div className="space-y-6">
         <form className="space-y-6" onSubmit={OnSubmit}>
            <div>
               <label className="block text-sm text-end font-medium text-gray-700 mb-1">
                  Email Address
               </label>
               <div className="relative">
                  <input
                     required
                     id={ids.email}
                     type="email"
                     className="w-full pl-10 pr-10 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                     placeholder="email@example.com"
                     name="email"
                     value={formData.email}
                     onChange={handleInputChange}
                     style={{ textAlign: "right" }}
                  />
                  <Mail className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
               </div>
               {formError.email && (
                  <p className="mt-1 text-sm text-red-600">{formError.email}</p>
               )}
            </div>

            <div>
               <label className="block text-sm text-end font-medium text-gray-700 mb-1">
                  Password
               </label>
               <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                     required
                     id={ids.password}
                     type={showPassword ? "text" : "password"}
                     className="w-full pl-10 pr-10 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                     placeholder="••••••••"
                     name="password"
                     value={formData.password}
                     onChange={handleInputChange}
                     style={{ textAlign: "right" }}
                  />
                  <button
                     type="button"
                     className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                     onClick={() => setShowPassword(!showPassword)}
                  >
                     {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                     ) : (
                        <Eye className="h-5 w-5" />
                     )}
                  </button>
               </div>
               {formError.password && (
                  <p className="mt-1 text-sm text-red-600">
                     {formError.password}
                  </p>
               )}
            </div>

            {loginError && (
               <div className="text-sm text-red-600 text-center">
                  {errorMessage}
               </div>
            )}

            <div>
               <button
                  type="submit"
                  className={`w-full py-4 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                     isTyping
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  disabled={!isTyping || isSubmitting}
               >
                  {isSubmitting ? "Signing in..." : "Sign in"}
               </button>

               <div className="flex justify-end gap-1 mt-8 text-sm">
                  <p>Don't have an account?</p>
                  <Link
                     href="/register"
                     className="box text-blue-500 font-bold underline"
                  >
                     Sign up
                  </Link>
               </div>
            </div>

            <div className="text-end text-sm">
               <Link
                  href="/forgot-password"
                  className="text-blue-600 hover:text-blue-500"
               >
                  Forgot your password?
               </Link>
            </div>
         </form>

         {/* Divider */}
         <div className="relative">
            <div className="absolute inset-0 flex items-center">
               <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
               <span className="px-2 bg-white text-gray-500">
                  Or continue with
               </span>
            </div>
         </div>

         {/* Google Sign-In Button */}
         <div>
            <button
               type="button"
               onClick={handleGoogleSignIn}
               disabled={isSubmitting}
               className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
               <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                     fill="#4285F4"
                     d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                     fill="#34A853"
                     d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                     fill="#FBBC05"
                     d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                     fill="#EA4335"
                     d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
               </svg>
               {isSubmitting ? "Signing in..." : "Sign in with Google"}
            </button>
         </div>
      </div>
   );
};

export default SignInForm;

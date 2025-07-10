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
    setFormData((prev) => ({
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
      setFormError((prev) => ({
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
        error.inner.forEach((result) => {
          errors = { ...errors, [result.path as any]: result.message };
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
            <p className="mt-1 text-sm text-red-600">{formError.password}</p>
          )}
        </div>

        {loginError && (
          <div className="text-sm text-red-600 text-center">{errorMessage}</div>
        )}

        <div>
          <button
            type="submit"
            className={`w-full py-4 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isTyping
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            disabled={!isTyping || isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>

          <div className="flex justify-end gap-1 mt-8 text-sm">
            <p>Don't have an account?</p>
            <Link href="/register" className="box text-blue-500 font-bold underline">Sign up</Link>
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
    </div>
  );
};

export default SignInForm;

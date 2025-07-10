"use client";
import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { baseConn } from "@/backend/connection";
import registerSchema from "@/app/validation/register.schema";
import { ValidationError } from "yup";

interface FormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    role: string;
}

const RegisterPage: React.FC = () => {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [validationErrors, setValidationErrors] = useState<
        Record<string, string>
    >({});

    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const validateField = async (
        name: keyof FormData,
        value: string
    ): Promise<void> => {
        try {
            // Only validate fields that exist in the schema
            if (name !== "confirmPassword" && name in registerSchema.fields) {
                await (registerSchema.fields[name] as any).validate(value);
                setValidationErrors((prev) => ({ ...prev, [name]: "" }));
            }
        } catch (err) {
            if (err instanceof Error) {
                setValidationErrors((prev) => ({ ...prev, [name]: err.message }));
            }
        }
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ): void => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        validateField(name as keyof FormData, value);
    };

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ): Promise<void> => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const payload: RegisterPayload = {
                email: formData.email,
                password: formData.password,
                name: formData.name,
                role: "user",
            };

            // Validate entire form data against schema
            await registerSchema.validate(payload, { abortEarly: false });

            await baseConn.post("/api/users", payload);

        } catch (err) {
            if (err instanceof ValidationError) {
                // Yup validation error
                const errors: Record<string, string> = {};
                err.inner.forEach((error) => {
                    if (error.path) {
                        errors[error.path] = error.message;
                    }
                });
                setValidationErrors(errors);
                setError("Please fix the validation errors");
            } else {
                // API or other error
                setError(err instanceof Error ? err.message : "Registration failed");
            }
        } finally {
            setLoading(false);
        }
    };

    const getFieldError = (fieldName: string): string => {
        return validationErrors[fieldName] || "";
    };

    return (
        <>
            <div className="flex flex-row justify-center max-w-5xl mx-auto px-0 sm:px-2 lg:px-0" >
                <div className="w-full bg-white rounded-lg shadow-lg">
                    <div className="p-6">
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-end text-sm font-medium text-gray-700 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${getFieldError("name") ? "border-red-500" : ""
                                        }`}
                                    placeholder="Your name"
                                    style={{ textAlign: "right" }}
                                />
                                {getFieldError("name") && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {getFieldError("name")}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-end text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`w-full pl-10 pr-9 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${getFieldError("email") ? "border-red-500" : ""
                                            }`}
                                        placeholder="email@example.com"
                                        style={{ textAlign: "right" }}
                                    />
                                    <Mail className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                                </div>
                                {getFieldError("email") && (
                                    <div className="border bg-gray-50 p-2 rounded-md mt-1">
                                        <p className="mt-1 text-sm text-gray-500">
                                            {getFieldError("email")}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-end text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={`w-full pl-10 pr-10 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${getFieldError("password") ? "border-red-500" : ""
                                            }`}
                                        placeholder="••••••••"
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
                                {getFieldError("password") && (
                                    <div className="border bg-gray-50 p-2 rounded-md mt-1">
                                        <p className="mt-1 text-sm text-gray-500">
                                            {getFieldError("password")}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-end text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-10 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="••••••••"
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
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-4 px-4 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Creating Account..." : "Create Account"}
                                </button>
                            </div>

                            <div className="text-center text-sm">
                                <p className="text-gray-600">
                                    By registering, you agree to our{" "}
                                    <a href="#" className="text-blue-600 hover:text-blue-500">
                                        Terms
                                    </a>{" "}
                                    and{" "}
                                    <a href="#" className="text-blue-600 hover:text-blue-500">
                                        Privacy Policy
                                    </a>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RegisterPage;

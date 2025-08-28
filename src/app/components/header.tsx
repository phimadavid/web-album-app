"use client";

import React, { useState, useEffect } from "react";
import {
   BookImage,
   BookOpen,
   CircleUser,
   LogOut,
   Menu,
   PencilLine,
   ShoppingCart,
   User,
   X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SigIn from "../signin/signin-component";
import RegisterPage from "../register/register-component";
import { withAuth } from "@/backend/withAuth";
import Cart from "./cart/cart";

const Header: React.FC = () => {
   const { isAuthenticated, logout } = withAuth({
      role: "user",
      redirectTo: "/signin",
   });
   const router = useRouter();

   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
   const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
   const [showCart, setShowCart] = useState(false);
   const [cartItemCount, setCartItemCount] = useState(0);

   const handleAccountNavigation = () => {
      router.push("/me/dashboard");
   };

   const closeAllModals = () => {
      setIsSignInModalOpen(false);
      setIsRegisterModalOpen(false);
      setIsMenuOpen(false);
   };

   // Cart functionality
   const handleCartOpen = () => {
      if (!isAuthenticated) {
         setIsSignInModalOpen(true);
         return;
      }
      setShowCart(true);
   };

   const handleCheckout = () => {
      setShowCart(false);
      router.push("/checkout");
   };

   // Fetch cart count function
   const fetchCartCount = async () => {
      try {
         // Fetch from both cart APIs
         const [cartResponse, aiCartResponse] = await Promise.all([
            fetch("/api/cart"),
            fetch("/api/me/ai-art-cart"),
         ]);

         let totalItems = 0;

         if (cartResponse.ok) {
            const cartData = await cartResponse.json();
            totalItems += cartData.totalItems || 0;
         }

         if (aiCartResponse.ok) {
            const aiCartData = await aiCartResponse.json();
            totalItems += aiCartData.totalItems || 0;
         }

         setCartItemCount(totalItems);
      } catch (error) {
         console.error("Error fetching cart count:", error);
      }
   };

   // Fetch cart count on load
   useEffect(() => {
      if (isAuthenticated) {
         fetchCartCount();
      } else {
         setCartItemCount(0);
      }
   }, [isAuthenticated]);

   // Listen for cart updates
   useEffect(() => {
      const handleCartUpdate = () => {
         if (isAuthenticated) {
            fetchCartCount();
         }
      };

      // Listen for custom cart update events
      window.addEventListener("cartUpdated", handleCartUpdate);

      return () => {
         window.removeEventListener("cartUpdated", handleCartUpdate);
      };
   }, [isAuthenticated]);

   return (
      <>
         <header className="bg-white border-b">
            <div className="max-w-full">
               <div className="flex justify-between items-center ml-3 sm:ml-0">
                  <div className="flex items-center space-x-2 pl-0 sm:pl-5">
                     <BookOpen className="w-8 h-8 text-blue-600" />
                     <Link href="/">
                        <span className="text-xl font-bold">Albummai</span>
                     </Link>
                  </div>
                  <nav className="space-x-8 hidden 1md:flex">
                     <Link
                        href="/photo-wall"
                        className="text-gray-600 hover:text-gray-900"
                     >
                        Photo Wall
                     </Link>
                     <Link
                        href="/price-list"
                        className="text-gray-600 hover:text-gray-900"
                     >
                        Price List
                     </Link>
                  </nav>

                  <div className="flex items-center space-x-4">
                     <div className="hidden 1md:flex space-x-4">
                        {!isAuthenticated ? (
                           // Show Sign In and Register buttons when not authenticated
                           <>
                              <button
                                 onClick={() => setIsSignInModalOpen(true)}
                                 className="flex items-center border rounded-full px-3 py-1 text-gray-600 hover:text-gray-900"
                              >
                                 My Album Photo Book
                                 <BookImage className="w-8 h-8 text-gray-600 pl-2" />
                              </button>
                              <button
                                 onClick={() => setIsRegisterModalOpen(true)}
                                 className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                              >
                                 Create a Album Photo Book
                                 <PencilLine className="w-7 h-7 text-white pl-2" />
                              </button>
                           </>
                        ) : (
                           <>
                              <button
                                 onClick={handleAccountNavigation}
                                 className="flex items-center px-4 py-2 text-black rounded-full hover:border"
                              >
                                 My Account
                                 <CircleUser className="w-5 h-5 text-black ml-2" />
                              </button>
                              <button
                                 onClick={logout}
                                 className="flex items-center px-4 py-2 bg-red-600 text-white rounded-full"
                              >
                                 Log out
                                 <LogOut className="w-5 h-5 text-white ml-2" />
                              </button>
                           </>
                        )}
                     </div>

                     {/* Cart Icon */}
                     <button
                        onClick={handleCartOpen}
                        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                     >
                        <ShoppingCart className="w-6 h-6 text-gray-600 hover:text-gray-900" />
                        {cartItemCount > 0 && (
                           <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                              {cartItemCount}
                           </span>
                        )}
                     </button>

                     <div className="px-4 sm:px-6 lg:px-7 xl:px-0">
                        <div className="flex justify-between items-center py-4">
                           {/* Always visible hamburger button */}
                           <button
                              className="p-2 hover:bg-gray-100 rounded-lg"
                              onClick={() => setIsMenuOpen(true)}
                           >
                              <Menu className="w-7 h-7" />
                           </button>

                           {/* Modal Menu */}
                           {isMenuOpen && (
                              <>
                                 {/* Overlay */}
                                 <div
                                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                                    onClick={() => setIsMenuOpen(false)}
                                 />

                                 {/* Menu Panel */}
                                 <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-50 transform transition-transform duration-300">
                                    {/* Menu Header */}
                                    <div className="flex justify-between items-center p-6 border-b">
                                       <h2 className="text-xl font-semibold">
                                          Menu
                                       </h2>
                                       <button
                                          className="p-2 hover:bg-gray-100 rounded-lg"
                                          onClick={() => setIsMenuOpen(false)}
                                       >
                                          <X className="w-6 h-6" />
                                       </button>
                                    </div>

                                    {/* Menu Items */}
                                    <nav className="p-6">
                                       <ul className="space-y-4">
                                          <li>
                                             <a
                                                href="#features"
                                                className="text-gray-600 hover:text-gray-900 block py-2"
                                                onClick={() =>
                                                   setIsMenuOpen(false)
                                                }
                                             >
                                                Photo Wall
                                             </a>
                                          </li>
                                          <li>
                                             <a
                                                href="#templates"
                                                className="text-gray-600 hover:text-gray-900 block py-2"
                                                onClick={() =>
                                                   setIsMenuOpen(false)
                                                }
                                             >
                                                Photo Album
                                             </a>
                                          </li>
                                       </ul>
                                    </nav>

                                    <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-gray-50">
                                       <div className="space-y-4">
                                          {!isAuthenticated ? (
                                             // Show Sign In and Register buttons in mobile menu when not authenticated
                                             <>
                                                <button
                                                   onClick={() => {
                                                      setIsMenuOpen(false);
                                                      setIsSignInModalOpen(
                                                         true
                                                      );
                                                   }}
                                                   className="w-full py-2 text-gray-600 hover:text-gray-900"
                                                >
                                                   Sign In
                                                </button>
                                                <button
                                                   onClick={() => {
                                                      setIsMenuOpen(false);
                                                      setIsRegisterModalOpen(
                                                         true
                                                      );
                                                   }}
                                                   className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                   Register
                                                </button>
                                             </>
                                          ) : (
                                             // Show My Account and Logout buttons when authenticated
                                             <>
                                                <button
                                                   onClick={() => {
                                                      setIsMenuOpen(false);
                                                      handleAccountNavigation();
                                                   }}
                                                   className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                                >
                                                   My Account
                                                </button>
                                                <button
                                                   onClick={() => {
                                                      setIsMenuOpen(false);
                                                      logout();
                                                   }}
                                                   className="w-full py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50"
                                                >
                                                   Logout
                                                </button>
                                             </>
                                          )}
                                       </div>
                                    </div>
                                 </div>
                              </>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </header>

         {/* Sign In Modal */}
         {isSignInModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
               <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="px-6 pb-8 pt-8">
                     <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-lg">
                        <div className="flex justify-between items-center p-4 border-b">
                           <p className="font-bold text-xl text-blue-600">
                              Sign in
                           </p>
                           <button
                              onClick={closeAllModals}
                              className="p-2 hover:bg-gray-100 rounded-lg"
                           >
                              <X className="w-6 h-6" />
                           </button>
                        </div>
                        <SigIn />
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Register Modal */}
         {isRegisterModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center p-6 border-b">
                     <h2 className="text-2xl font-bold text-blue-600">
                        Create Account
                     </h2>
                     <button
                        onClick={closeAllModals}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                     >
                        <X className="w-6 h-6" />
                     </button>
                  </div>
                  <RegisterPage />
               </div>
            </div>
         )}

         {/* Cart Modal */}
         <Cart
            isOpen={showCart}
            onClose={() => setShowCart(false)}
            onCheckout={handleCheckout}
         />
      </>
   );
};

export default Header;

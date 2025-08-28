"use client";

import React, { useEffect, useRef } from "react";
import { toast } from "react-toastify";

interface PayPalButtonProps {
   amount: number;
   currency?: string;
   items: Array<{
      name: string;
      price: number;
      quantity: number;
   }>;
   shippingAddress: any;
   onSuccess: (details: any) => void;
   onError?: (error: any) => void;
   onCancel?: () => void;
   disabled?: boolean;
}

declare global {
   interface Window {
      paypal?: any;
   }
}

const PayPalButton: React.FC<PayPalButtonProps> = ({
   amount,
   currency = "USD",
   items,
   shippingAddress,
   onSuccess,
   onError,
   onCancel,
   disabled = false,
}) => {
   const paypalRef = useRef<HTMLDivElement>(null);
   const buttonRendered = useRef(false);

   useEffect(() => {
      if (disabled || buttonRendered.current) return;

      const loadPayPalScript = () => {
         if (window.paypal) {
            renderPayPalButton();
            return;
         }

         const script = document.createElement("script");
         script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=${currency}&intent=capture&enable-funding=venmo,paylater`;
         script.async = true;
         script.onload = () => {
            renderPayPalButton();
         };
         script.onerror = () => {
            console.error("Failed to load PayPal SDK");
            toast.error("Failed to load PayPal. Please try again.");
         };
         document.body.appendChild(script);
      };

      const renderPayPalButton = () => {
         if (!window.paypal || !paypalRef.current || buttonRendered.current)
            return;

         buttonRendered.current = true;

         window.paypal
            .Buttons({
               style: {
                  layout: "vertical",
                  color: "blue",
                  shape: "rect",
                  label: "paypal",
                  height: 50,
               },
               createOrder: async () => {
                  try {
                     const response = await fetch("/api/paypal/create-order", {
                        method: "POST",
                        headers: {
                           "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                           amount,
                           currency,
                           items,
                        }),
                     });

                     if (!response.ok) {
                        throw new Error("Failed to create PayPal order");
                     }

                     const data = await response.json();
                     return data.orderID;
                  } catch (error) {
                     console.error("Error creating PayPal order:", error);
                     toast.error("Failed to create PayPal order");
                     throw error;
                  }
               },
               onApprove: async (data: any) => {
                  try {
                     const response = await fetch("/api/paypal/capture-order", {
                        method: "POST",
                        headers: {
                           "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                           orderID: data.orderID,
                           orderData: {
                              items,
                              subtotal: amount - 24.99, // Subtract shipping
                              shipping: 24.99,
                              tax: 0,
                              total: amount,
                              customerInfo: {
                                 email: "", // Will be filled from PayPal data
                              },
                              shippingAddress,
                              notes: "",
                           },
                        }),
                     });

                     if (!response.ok) {
                        throw new Error("Failed to capture PayPal order");
                     }

                     const captureData = await response.json();

                     if (captureData.success) {
                        // Clear the cart after successful payment
                        try {
                           await fetch("/api/cart/clear", {
                              method: "POST",
                              headers: {
                                 "Content-Type": "application/json",
                              },
                           });
                        } catch (clearError) {
                           console.warn("Failed to clear cart:", clearError);
                           // Don't fail the payment if cart clearing fails
                        }

                        onSuccess(captureData);
                     } else {
                        throw new Error("Payment capture failed");
                     }
                  } catch (error) {
                     console.error("Error capturing PayPal order:", error);
                     toast.error("Payment processing failed");
                     if (onError) onError(error);
                  }
               },
               onError: (err: any) => {
                  console.error("PayPal error:", err);
                  toast.error("PayPal payment failed");
                  if (onError) onError(err);
               },
               onCancel: () => {
                  console.log("PayPal payment cancelled");
                  toast.info("Payment cancelled");
                  if (onCancel) onCancel();
               },
            })
            .render(paypalRef.current);
      };

      loadPayPalScript();

      return () => {
         // Cleanup: remove PayPal script if component unmounts
         const scripts = document.querySelectorAll(
            'script[src*="paypal.com/sdk/js"]'
         );
         scripts.forEach(script => script.remove());
      };
   }, [
      amount,
      currency,
      items,
      shippingAddress,
      onSuccess,
      onError,
      onCancel,
      disabled,
   ]);

   if (disabled) {
      return (
         <div className="w-full h-12 bg-gray-200 rounded-md flex items-center justify-center">
            <span className="text-gray-500">PayPal payment disabled</span>
         </div>
      );
   }

   return (
      <div className="w-full">
         <div ref={paypalRef} className="w-full min-h-[50px]" />
      </div>
   );
};

export default PayPalButton;

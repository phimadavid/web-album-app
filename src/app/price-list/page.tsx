"use client";
import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";

// Define the types for our book format data
interface BookFormat {
   id: string;
   title: string;
   dimensions: string;
   icon: React.ReactNode;
}

interface BookPricing {
   formatId: string;
   softcover: number | null;
   hardcover: number | null;
   dutchBook: boolean;
   appAndSoftware?: boolean;
   allInterfaces?: boolean;
   softwareOnly?: boolean;
}

interface ShippingOption {
   date: string;
   promotionalPrice: number;
   regularPrice: number;
   icon: React.ReactNode;
   title: string;
   description: string;
}

const BookPriceListPage: React.FC = () => {
   const [pageCount, setPageCount] = useState<number>(24);
   const [shipmentDate, setShipmentDate] = useState<string>("21/05/2025");

   // Book formats data
   const bookFormats: BookFormat[] = [
      {
         id: "mini-magnifier",
         title: "Mini magnifier",
         dimensions: "cm 15/15",
         icon: (
            <svg
               viewBox="0 0 24 24"
               fill="none"
               className="w-full h-full text-teal-100"
               stroke="currentColor"
            >
               <rect
                  x="3"
                  y="6"
                  width="12"
                  height="12"
                  rx="1"
                  fill="#B2E8E6"
                  strokeWidth="1"
               />
            </svg>
         ),
      },
      {
         id: "large-panoramic",
         title: "Large panoramic",
         dimensions: "cm 30/22",
         icon: (
            <svg
               viewBox="0 0 24 24"
               fill="none"
               className="w-full h-full text-teal-100"
               stroke="currentColor"
            >
               <rect
                  x="1"
                  y="6"
                  width="18"
                  height="12"
                  rx="1"
                  fill="#B2E8E6"
                  strokeWidth="1"
               />
            </svg>
         ),
      },
      {
         id: "classic",
         title: "Classic",
         dimensions: "cm 20/28",
         icon: (
            <svg
               viewBox="0 0 24 24"
               fill="none"
               className="w-full h-full text-teal-100"
               stroke="currentColor"
            >
               <rect
                  x="3"
                  y="2"
                  width="12"
                  height="18"
                  rx="1"
                  fill="#B2E8E6"
                  strokeWidth="1"
               />
            </svg>
         ),
      },
      {
         id: "classic-plus",
         title: "Classic Plus",
         dimensions: "cm 22.5/29",
         icon: (
            <svg
               viewBox="0 0 24 24"
               fill="none"
               className="w-full h-full text-teal-100"
               stroke="currentColor"
            >
               <rect
                  x="3"
                  y="2"
                  width="14"
                  height="20"
                  rx="1"
                  fill="#B2E8E6"
                  strokeWidth="1"
               />
            </svg>
         ),
      },
      {
         id: "large-square",
         title: "Large square",
         dimensions: "cm 30/30",
         icon: (
            <svg
               viewBox="0 0 24 24"
               fill="none"
               className="w-full h-full text-teal-100"
               stroke="currentColor"
            >
               <rect
                  x="1"
                  y="2"
                  width="20"
                  height="20"
                  rx="1"
                  fill="#B2E8E6"
                  strokeWidth="1"
               />
            </svg>
         ),
      },
      {
         id: "small-square",
         title: "Small square",
         dimensions: "cm 20/20",
         icon: (
            <svg
               viewBox="0 0 24 24"
               fill="none"
               className="w-full h-full text-teal-100"
               stroke="currentColor"
            >
               <rect
                  x="3"
                  y="4"
                  width="14"
                  height="14"
                  rx="1"
                  fill="#B2E8E6"
                  strokeWidth="1"
               />
            </svg>
         ),
      },
   ];

   // Pricing data
   const pricingData: BookPricing[] = [
      {
         formatId: "mini-magnifier",
         softcover: 69,
         hardcover: 79,
         dutchBook: false,
         appAndSoftware: true,
      },
      {
         formatId: "large-panoramic",
         softcover: null,
         hardcover: 187,
         dutchBook: false,
         appAndSoftware: true,
      },
      {
         formatId: "classic",
         softcover: 141,
         hardcover: 200,
         dutchBook: false,
         softwareOnly: true,
      },
      {
         formatId: "classic-plus",
         softcover: null,
         hardcover: 200,
         dutchBook: false,
         appAndSoftware: true,
      },
      {
         formatId: "large-square",
         softcover: null,
         hardcover: 255,
         dutchBook: false,
         allInterfaces: true,
      },
      {
         formatId: "small-square",
         softcover: 140,
         hardcover: 176,
         dutchBook: false,
         allInterfaces: true,
      },
   ];

   // Dutch book pricing (separate row in the table)
   const dutchBookPricing = {
      "mini-magnifier": 257,
      "large-panoramic": 257,
      classic: 258,
      "classic-plus": 258,
      "large-square": 347,
      "small-square": 248,
   };

   // Shipping options
   const shippingOptions: ShippingOption[] = [
      {
         date: "05/26/2025",
         promotionalPrice: 0,
         regularPrice: 0,
         icon: (
            <svg viewBox="0 0 24 24" className="w-full h-full">
               <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                  fill="#f0f0f0"
                  stroke="#666"
                  strokeWidth="1"
               />
               <path d="M7 7h10M7 12h10M7 17h6" stroke="#666" strokeWidth="1" />
            </svg>
         ),
         title: "Asphalt-collection calls",
         description: "from Rish\'ta",
      },
      {
         date: "05/29/2025",
         promotionalPrice: 18,
         regularPrice: 26,
         icon: (
            <svg viewBox="0 0 24 24" className="w-full h-full">
               <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="#f8f8f8"
                  stroke="#666"
                  strokeWidth="1"
               />
               <rect
                  x="8"
                  y="8"
                  width="8"
                  height="8"
                  fill="#f0f0f0"
                  stroke="#666"
                  strokeWidth="1"
               />
            </svg>
         ),
         title: "Collection from",
         description: "delivery points",
      },
      {
         date: "05/28/2025",
         promotionalPrice: 39,
         regularPrice: 39,
         icon: (
            <svg viewBox="0 0 24 24" className="w-full h-full">
               <rect
                  x="2"
                  y="7"
                  width="18"
                  height="10"
                  rx="2"
                  fill="#f8f8f8"
                  stroke="#666"
                  strokeWidth="1"
               />
               <circle
                  cx="6"
                  cy="17"
                  r="2"
                  fill="#f0f0f0"
                  stroke="#666"
                  strokeWidth="1"
               />
               <circle
                  cx="16"
                  cy="17"
                  r="2"
                  fill="#f0f0f0"
                  stroke="#666"
                  strokeWidth="1"
               />
            </svg>
         ),
         title: "Home delivery",
         description: "",
      },
      {
         date: "11/06/2025",
         promotionalPrice: 26,
         regularPrice: 30,
         icon: (
            <svg viewBox="0 0 24 24" className="w-full h-full">
               <rect
                  x="4"
                  y="4"
                  width="16"
                  height="16"
                  rx="2"
                  fill="#f8f8f8"
                  stroke="#666"
                  strokeWidth="1"
               />
               <path d="M8 12h8M12 8v8" stroke="#666" strokeWidth="1" />
            </svg>
         ),
         title: "Certified mail",
         description: "",
      },
   ];

   const incrementPages = () => {
      setPageCount(prevCount => prevCount + 2);
   };

   const decrementPages = () => {
      if (pageCount > 2) {
         setPageCount(prevCount => prevCount - 2);
      }
   };

   return (
      <div className="min-h-screen bg-white">
         <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Book Price List Section */}
            <div>
               {/* Title */}
               <div className="text-center mb-16 border-b border-gray-200 pb-8">
                  <h1 className="text-3xl font-bold text-gray-900">
                     Albummai photo book price list and digital album price
                     comparison
                  </h1>
               </div>

               {/* Page counter */}
               <div className="mb-12">
                  <div className="text-center mb-4">
                     <h2 className="text-xl font-semibold text-gray-800">
                        Prices shown are for {pageCount} pages
                     </h2>
                  </div>
                  <div className="text-sm text-gray-600 text-right max-w-3xl mx-auto mb-4">
                     Additional pages: on the website/application in 2-page
                     increments and in the computer software in 4-page
                     increments
                  </div>
                  <div className="flex justify-center items-center space-x-4">
                     <button
                        onClick={decrementPages}
                        className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded-md text-2xl font-bold"
                        disabled={pageCount <= 2}
                     >
                        -
                     </button>
                     <div className="w-12 h-12 bg-white border border-gray-300 flex items-center justify-center rounded-md text-2xl font-semibold">
                        {pageCount}
                     </div>
                     <button
                        onClick={incrementPages}
                        className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded-md text-2xl font-bold"
                     >
                        +
                     </button>
                  </div>
               </div>

               {/* Pricing grid */}
               <div className="mb-16">
                  {/* Format icons row */}
                  <div className="grid grid-cols-7 gap-4 mb-4">
                     <div className="col-span-1"></div>{" "}
                     {/* Empty cell for the corner */}
                     {bookFormats.map(format => (
                        <div
                           key={format.id}
                           className="flex flex-col items-center"
                        >
                           <div className="w-16 h-16 mb-2">{format.icon}</div>
                           <div className="text-center">
                              <div className="font-medium text-sm">
                                 {format.title}
                              </div>
                              <div className="text-xs text-gray-500">
                                 {format.dimensions}
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* Softcover row */}
                  <div className="grid grid-cols-7 gap-4 mb-4">
                     <div className="flex items-center justify-end">
                        <div className="flex items-center">
                           <svg
                              className="w-6 h-6 mr-2"
                              viewBox="0 0 24 24"
                              fill="none"
                           >
                              <path d="M3 5h18v14H3z" fill="#E2F1F0" />
                              <path d="M3 5h18" stroke="#999" strokeWidth="1" />
                           </svg>
                           <span className="font-medium">Softcover</span>
                        </div>
                     </div>
                     {bookFormats.map(format => {
                        const pricing = pricingData.find(
                           p => p.formatId === format.id
                        );
                        return (
                           <div
                              key={`softcover-${format.id}`}
                              className="bg-gray-50 p-4 text-center"
                           >
                              {pricing?.softcover ? (
                                 <div className="font-semibold">
                                    ₪{pricing.softcover}
                                 </div>
                              ) : (
                                 <div className="text-sm">
                                    Not available
                                    <br />
                                    in paperback
                                 </div>
                              )}
                           </div>
                        );
                     })}
                  </div>

                  {/* Hardcover row */}
                  <div className="grid grid-cols-7 gap-4 mb-4">
                     <div className="flex items-center justify-end">
                        <div className="flex items-center">
                           <svg
                              className="w-6 h-6 mr-2"
                              viewBox="0 0 24 24"
                              fill="none"
                           >
                              <path d="M3 5h18v14H3z" fill="#E2F1F0" />
                              <path d="M3 5h18" stroke="#444" strokeWidth="2" />
                           </svg>
                           <span className="font-medium">Hardcover</span>
                        </div>
                     </div>
                     {bookFormats.map(format => {
                        const pricing = pricingData.find(
                           p => p.formatId === format.id
                        );
                        return (
                           <div
                              key={`hardcover-${format.id}`}
                              className="bg-gray-100 p-4 text-center"
                           >
                              {pricing?.hardcover && (
                                 <div className="font-semibold">
                                    ₪{pricing.hardcover}
                                 </div>
                              )}
                           </div>
                        );
                     })}
                  </div>

                  {/* Dutch Book row */}
                  <div className="grid grid-cols-7 gap-4 mb-4">
                     <div className="flex items-center justify-end">
                        <div className="flex items-center">
                           <svg
                              className="w-6 h-6 mr-2"
                              viewBox="0 0 24 24"
                              fill="none"
                           >
                              <path d="M4 4h16v16H4z" fill="#E2F1F0" />
                              <path
                                 d="M4 20l16-16M4 4l16 16"
                                 stroke="#444"
                                 strokeWidth="1"
                              />
                           </svg>
                           <div className="text-sm">
                              <span className="font-medium">
                                 The Dutch Book
                              </span>
                              <br />
                              <span className="text-xs">
                                 Does not exist
                                 <br />
                                 as a Dutch book
                              </span>
                           </div>
                        </div>
                     </div>
                     {bookFormats.map(format => (
                        <div
                           key={`dutch-${format.id}`}
                           className="bg-gray-100 p-4 text-center"
                        >
                           <div className="font-semibold">
                              ₪
                              {
                                 dutchBookPricing[
                                    format.id as keyof typeof dutchBookPricing
                                 ]
                              }
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* App & Software indicators */}
                  <div className="grid grid-cols-7 gap-4">
                     <div></div> {/* Empty cell for the corner */}
                     {bookFormats.map(format => {
                        const pricing = pricingData.find(
                           p => p.formatId === format.id
                        );
                        return (
                           <div
                              key={`software-${format.id}`}
                              className="p-2 text-center"
                           >
                              <div
                                 className={`px-2 py-1 text-xs rounded ${
                                    pricing?.appAndSoftware
                                       ? "bg-green-100 text-green-800"
                                       : pricing?.allInterfaces
                                         ? "bg-blue-100 text-blue-800"
                                         : pricing?.softwareOnly
                                           ? "bg-yellow-100 text-yellow-800"
                                           : ""
                                 }`}
                              >
                                 {pricing?.appAndSoftware
                                    ? "App and software"
                                    : pricing?.allInterfaces
                                      ? "All interfaces"
                                      : pricing?.softwareOnly
                                        ? "Software"
                                        : ""}
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>
         </section>
         {/* Promotional banner */}
         <div className="bg-orange-400 text-center py-4 px-2">
            <div className="font-bold text-lg">
               New! The shortened route for only 199 NIS includes home delivery
            </div>
            <div className="text-sm">&lt;&lt; For more details</div>
         </div>
         <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Shipping Price List Section */}
            <div className="mt-16 mb-16">
               <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-gray-900">
                     Shipping price list and handling fees
                  </h2>
               </div>

               {/* Shipment time notice */}
               <div className="flex flex-wrap justify-between items-center mb-8 text-gray-700 text-right">
                  <div className="flex-grow text-right ml-4 md:ml-0 md:text-left md:pl-4 rtl">
                     :Until 3:00 PM, and we meet with her at the time set
                     according to the type of shipment
                  </div>
                  <div className="flex items-center space-x-2 mr-10">
                     <div className="border border-gray-300 px-3 py-1 min-w-28 text-center">
                        {shipmentDate}
                     </div>
                     <div className="border border-gray-300 p-1">
                        <svg viewBox="0 0 24 24" className="w-6 h-6">
                           <rect
                              x="3"
                              y="4"
                              width="18"
                              height="16"
                              fill="#f8f8f8"
                              stroke="#666"
                              strokeWidth="1"
                           />
                           <path
                              d="M8 2v4M16 2v4M3 10h18M8 14h2M14 14h2M8 18h2M14 18h2"
                              stroke="#666"
                              strokeWidth="1"
                           />
                        </svg>
                     </div>
                     <div className="text-right rtl">:Order the loofah at</div>
                  </div>
               </div>

               {/* Shipping options table */}
               <div className="w-full border-collapse">
                  {shippingOptions.map((option, index) => (
                     <div
                        key={index}
                        className="flex flex-col md:flex-row border-t border-gray-200"
                     >
                        {/* Price columns */}
                        <div className="flex flex-row md:w-2/5">
                           <div className="w-1/2 p-4 bg-green-100">
                              <div className="text-sm text-gray-700">
                                 Price for approved
                              </div>
                              <div className="text-sm text-gray-700">
                                 promotional emails
                              </div>
                              <div className="font-semibold text-lg">
                                 ₪{option.promotionalPrice}
                              </div>
                           </div>
                           <div className="w-1/2 p-4 bg-gray-50">
                              <div className="text-sm text-gray-700">
                                 Regular price
                              </div>
                              <div className="font-semibold text-lg">
                                 ₪{option.regularPrice}
                              </div>
                           </div>
                        </div>

                        {/* Date and information */}
                        <div className="md:w-2/5 p-4 bg-white flex flex-col justify-center">
                           <div className="text-right mb-1 rtl">
                              :Date of meeting with Albummia
                           </div>
                           <div className="text-right font-semibold mb-2">
                              {option.date}
                           </div>
                           <div className="text-right text-blue-600 text-sm rtl cursor-pointer hover:underline flex items-center justify-end">
                              <span className="inline-block mr-1 transform rotate-180">
                                 &#10094;
                              </span>
                              More information
                           </div>
                        </div>

                        {/* Icon and description */}
                        <div className="md:w-1/5 p-4 bg-white flex items-center justify-center border-l border-gray-200">
                           <div className="flex flex-col items-center">
                              <div className="w-12 h-12 mb-2">
                                 {option.icon}
                              </div>
                              <div className="text-center">
                                 <div className="font-medium text-sm">
                                    {option.title}
                                 </div>
                                 <div className="text-xs text-gray-600">
                                    {option.description}
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </section>
      </div>
   );
};

export default BookPriceListPage;

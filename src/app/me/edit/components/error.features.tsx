import { AlertCircle, RefreshCw } from "lucide-react";
import React from "react";

type ErrorMessageProps = {
   errorname: string;
   retry?: (() => void) | null;
};

const ErrorMessage: React.FC<ErrorMessageProps> = ({ errorname, retry }) => {
   return (
      <>
         <div className="flex flex-col items-center justify-center w-full p-6 mx-auto my-8 bg-red-50 border border-red-100 rounded-lg shadow-sm max-w-2xl">
            <div className="flex items-center justify-center w-16 h-16 mb-4 bg-red-100 rounded-full">
               <AlertCircle className="w-8 h-8 text-red-500" />
            </div>

            <h2 className="mb-2 text-xl font-semibold text-gray-800">
               Something went wrong
            </h2>

            <div className="mb-4 text-center text-gray-600">
               <p className="mb-2">
                  We encountered an error while loading your album.
               </p>
               <p className="px-6 py-2 bg-white border border-red-100 rounded-md text-red-600 font-mono text-sm">
                  {errorname || "An unknown error occurred"}
               </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
               {retry && (
                  <button
                     onClick={retry}
                     className="flex items-center justify-center px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
                  >
                     <RefreshCw className="w-4 h-4 mr-2" />
                     Try Again
                  </button>
               )}

               <button
                  onClick={() => (window.location.href = "/albums")}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
               >
                  Return to Albums
               </button>
            </div>

            <p className="mt-6 text-sm text-gray-500">
               If this problem persists, please contact our support team.
            </p>
         </div>
      </>
   );
};

export default ErrorMessage;

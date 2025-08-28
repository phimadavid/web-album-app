import React from "react";
import { ThreeDots } from "react-loader-spinner";

const Loading: React.FC = ({}) => {
   return (
      <>
         <div className="flex flex-col items-center mt-32 justify-start w-full">
            <div className="bg-white p-8 text-center place-items-center">
               <div>
                  <ThreeDots
                     color="#3b82f6"
                     width="80"
                     visible={true}
                     aria-label="loading-indicator"
                  />
               </div>
               <h3 className="text-lg font-semibold text-gray-800 mt-4">
                  Updating Layout
               </h3>
               <p className="text-sm text-gray-600 mt-2">
                  Please wait while we optimize your album layout
               </p>
            </div>
         </div>
      </>
   );
};

export default Loading;

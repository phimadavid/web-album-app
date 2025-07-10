import React from "react";

const FullScreenLoader: React.FC<React.PropsWithChildren> = () => {
  return (
    <div className="w-screen grid content-center bg-white">
      <div className="flex flex-col gap-3 items-center justify-center h-[300px]">
        <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin border-t-blue-500" />
        <p className="text-slate-700">Checking User...</p>
      </div>
    </div>
  );
};

export default FullScreenLoader;

"use client";

import React from "react";
import { UploadItem } from "../hooks/useUploadQueue";
import {
   Upload,
   Check,
   X,
   Pause,
   Play,
   RotateCcw,
   AlertTriangle,
   Clock,
   Zap,
} from "lucide-react";

interface UploadProgressOverlayProps {
   queue: UploadItem[];
   stats: {
      total: number;
      completed: number;
      failed: number;
      uploading: number;
      pending: number;
      overallProgress: number;
      totalSpeed: number;
      estimatedTimeRemaining: number;
   };
   isUploading: boolean;
   onPauseAll: () => void;
   onResumeAll: () => void;
   onClearCompleted: () => void;
   onRetryItem: (id: string) => void;
   onPauseItem: (id: string) => void;
   onResumeItem: (id: string) => void;
   onRemoveItem: (id: string) => void;
}

export function UploadProgressOverlay({
   queue,
   stats,
   onClearCompleted,
   onRetryItem,
   onPauseItem,
   onResumeItem,
   onRemoveItem,
}: UploadProgressOverlayProps) {
   if (queue.length === 0) return null;

   const formatSpeed = (bytesPerSecond: number) => {
      if (bytesPerSecond === 0) return "0 B/s";
      const units = ["B/s", "KB/s", "MB/s", "GB/s"];
      const i = Math.floor(Math.log(bytesPerSecond) / Math.log(1024));
      return `${(bytesPerSecond / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
   };

   const formatTime = (seconds: number) => {
      if (seconds === 0 || !isFinite(seconds)) return "--";
      if (seconds < 60) return `${Math.round(seconds)}s`;
      if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
      return `${Math.round(seconds / 3600)}h`;
   };

   const getStatusIcon = (status: UploadItem["status"]) => {
      switch (status) {
         case "success":
            return <Check size={16} className="text-green-500" />;
         case "error":
            return <X size={16} className="text-red-500" />;
         case "uploading":
            return <Upload size={16} className="text-blue-500 animate-pulse" />;
         case "paused":
            return <Pause size={16} className="text-yellow-500" />;
         case "cancelled":
            return <X size={16} className="text-gray-500" />;
         default:
            return <Clock size={16} className="text-gray-400" />;
      }
   };

   const getStatusColor = (status: UploadItem["status"]) => {
      switch (status) {
         case "success":
            return "border-green-200 bg-green-50";
         case "error":
            return "border-red-200 bg-red-50";
         case "uploading":
            return "border-blue-200 bg-blue-50";
         case "paused":
            return "border-yellow-200 bg-yellow-50";
         case "cancelled":
            return "border-gray-200 bg-gray-50";
         default:
            return "border-gray-200 bg-gray-50";
      }
   };

   return (
      <div className="fixed bottom-4 left-4 w-96 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
         {/* Header */}
         <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
               <h3 className="font-medium text-gray-900">Upload Progress</h3>
               <div className="flex items-center space-x-2">
                  {stats.completed > 0 && (
                     <button
                        onClick={onClearCompleted}
                        className="text-gray-500 hover:text-gray-700 p-1 rounded"
                        title="Clear completed"
                     >
                        <X size={16} />
                     </button>
                  )}
               </div>
            </div>

            {/* Overall Progress */}
            <div className="mt-3">
               <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>
                     {stats.completed} of {stats.total} files uploaded
                  </span>
                  <span>{Math.round(stats.overallProgress)}%</span>
               </div>
               <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                     className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                     style={{
                        width: `${stats.overallProgress}%`,
                     }}
                  />
               </div>
               <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  <div className="flex items-center space-x-4">
                     {stats.totalSpeed > 0 && (
                        <div className="flex items-center space-x-1">
                           <Zap size={12} />
                           <span>{formatSpeed(stats.totalSpeed)}</span>
                        </div>
                     )}
                     {stats.estimatedTimeRemaining > 0 && (
                        <div className="flex items-center space-x-1">
                           <Clock size={12} />
                           <span>
                              {formatTime(stats.estimatedTimeRemaining)}
                           </span>
                        </div>
                     )}
                  </div>
                  <div className="flex space-x-2">
                     {stats.failed > 0 && (
                        <span className="text-red-500">
                           {stats.failed} failed
                        </span>
                     )}
                     {stats.uploading > 0 && (
                        <span className="text-blue-500">
                           {stats.uploading} uploading
                        </span>
                     )}
                  </div>
               </div>
            </div>
         </div>

         {/* File List */}
         <div className="max-h-64 overflow-y-auto">
            {queue.map(item => (
               <div
                  key={item.id}
                  className={`p-3 border-b border-gray-100 last:border-b-0 ${getStatusColor(item.status)}`}
               >
                  <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {getStatusIcon(item.status)}
                        <div className="flex-1 min-w-0">
                           <div className="text-sm font-medium text-gray-900 truncate">
                              {item.file.filename ||
                                 item.file.name ||
                                 "Untitled"}
                           </div>
                           {item.status === "uploading" && (
                              <div className="text-xs text-gray-500 flex items-center space-x-2 mt-1">
                                 <span>{Math.round(item.progress)}%</span>
                                 {item.speed && (
                                    <span>{formatSpeed(item.speed)}</span>
                                 )}
                                 {item.timeRemaining && (
                                    <span>
                                       {formatTime(item.timeRemaining)}{" "}
                                       remaining
                                    </span>
                                 )}
                              </div>
                           )}
                           {item.error && (
                              <div className="text-xs text-red-500 mt-1 flex items-center space-x-1">
                                 <AlertTriangle size={12} />
                                 <span className="truncate">{item.error}</span>
                              </div>
                           )}
                        </div>
                     </div>

                     {/* Actions */}
                     <div className="flex items-center space-x-1">
                        {item.status === "error" && (
                           <button
                              onClick={() => onRetryItem(item.id)}
                              className="p-1 hover:bg-white/80 rounded"
                              title="Retry upload"
                           >
                              <RotateCcw size={14} className="text-gray-600" />
                           </button>
                        )}
                        {item.status === "uploading" && (
                           <button
                              onClick={() => onPauseItem(item.id)}
                              className="p-1 hover:bg-white/80 rounded"
                              title="Pause upload"
                           >
                              <Pause size={14} className="text-gray-600" />
                           </button>
                        )}
                        {item.status === "paused" && (
                           <button
                              onClick={() => onResumeItem(item.id)}
                              className="p-1 hover:bg-white/80 rounded"
                              title="Resume upload"
                           >
                              <Play size={14} className="text-gray-600" />
                           </button>
                        )}
                        {["pending", "paused", "error"].includes(
                           item.status
                        ) && (
                           <button
                              onClick={() => onRemoveItem(item.id)}
                              className="p-1 hover:bg-white/80 rounded"
                              title="Remove from queue"
                           >
                              <X size={14} className="text-gray-600" />
                           </button>
                        )}
                     </div>
                  </div>

                  {/* Progress Bar for Uploading Items */}
                  {item.status === "uploading" && (
                     <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                           <div
                              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                              style={{
                                 width: `${item.progress}%`,
                              }}
                           />
                        </div>
                     </div>
                  )}
               </div>
            ))}
         </div>
      </div>
   );
}

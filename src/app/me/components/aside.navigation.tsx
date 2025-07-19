"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Bell, PencilRuler, View, Plus, LogOut, BookOpen } from "lucide-react";

type AsideNavigationProps = {
  onLogout?: () => void;
};

const AsideNavigation: React.FC<AsideNavigationProps> = ({ onLogout }) => {
  const pathname = usePathname();

  return (
    <aside className="w-64 sticky top-0 min-h-screen bg-white shadow-lg">
      <div className="p-4 flex flex-col h-full">
        {/* Logo/Title */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900">My Albums</h2>
        </div>

        {/* Main Navigation */}
        <div className="flex-1">
          <nav>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/me/dashboard"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-md ${pathname === "/me/dashboard"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  <BookOpen className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/me/create-album"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-md ${pathname === "/me/create-album"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Album</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/me/preview"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-md ${pathname.startsWith("/me/preview")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  <View className="h-5 w-5" />
                  <span>Album Preview</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom section with logout */}
        <div className="border-t pt-4">
          <button
            onClick={onLogout}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-50 w-full text-left"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AsideNavigation;

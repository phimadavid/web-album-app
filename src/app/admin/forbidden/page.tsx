"use client";

import React from 'react';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const ForbiddenPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <ShieldX size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Forbidden</h1>
          <p className="text-gray-600">
            You don't have permission to access this admin area. This section is restricted to administrators only.
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/me/dashboard">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <Home size={20} className="mr-2" />
              Go to Dashboard
            </Button>
          </Link>
          
          <Link href="/">
            <Button variant="outline" className="w-full">
              <ArrowLeft size={20} className="mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Need admin access?</strong> Contact your system administrator to request the appropriate permissions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;

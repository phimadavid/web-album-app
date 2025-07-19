"use client";
import { useDashboardData } from "@/backend/hooks/user.hook.data";
import { withAuth } from "@/backend/withAuth";
import FullScreenLoader from "@/app/components/fullscreen.loader";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Calendar, Edit, Trash2, Eye } from "lucide-react";

interface Album {
  id: string;
  name: string;
  status: 'draft' | 'in_progress' | 'complete';
  termsAccepted: boolean;
  createdAt: string;
  updatedAt: string;
}

const UserDashboard = () => {
  const { name } = useDashboardData();
  const { isLoading, isAuthenticated, logout } = withAuth({
    role: 'user',
    redirectTo: '/signin',
  });
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      fetchAlbums();
    }
  }, [isAuthenticated]);

  const fetchAlbums = async () => {
    try {
      const response = await fetch('/api/me/albums');
      if (response.ok) {
        const data = await response.json();
        setAlbums(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setIsLoadingAlbums(false);
    }
  };

  const handleCreateAlbum = () => {
    router.push('/me/create-album');
  };

  const handleEditAlbum = (albumId: string) => {
    router.push(`/me/design/${albumId}`);
  };

  const handlePreviewAlbum = (albumId: string) => {
    router.push(`/me/preview?albumId=${albumId}`);
  };

  const getStatusColor = (status: Album['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'complete':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <FullScreenLoader />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-4">
            {!isAuthenticated ? 'You have no account' : 'Invalid role'}
          </div>
          <button
            onClick={logout}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {name}!
          </h1>
          <p className="text-gray-600">
            Manage your photo albums and create beautiful memories
          </p>
        </div>

        {/* Create Album Button */}
        <div className="mb-8">
          <Button
            onClick={handleCreateAlbum}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create New Album
          </Button>
        </div>

        {/* Albums Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <BookOpen className="mr-2 h-5 w-5" />
            My Albums
          </h2>

          {isLoadingAlbums ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <Card key={index} className="p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : albums.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No albums yet
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first album to get started with organizing your photos
              </p>
              <Button
                onClick={handleCreateAlbum}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Album
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album) => (
                <Card key={album.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {album.name}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        album.status
                      )}`}
                    >
                      {album.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Calendar className="mr-1 h-4 w-4" />
                    Created {new Date(album.createdAt).toLocaleDateString()}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleEditAlbum(album.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handlePreviewAlbum(album.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

"use client";
import { useDashboardData } from "@/backend/hooks/user.hook.data";
import { withAuth } from "@/backend/withAuth";
import FullScreenLoader from "@/app/components/fullscreen.loader";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
   Package,
   DollarSign,
   CheckCircle,
   XCircle,
   Clock,
   Truck,
   Palette,
   BookOpen,
} from "lucide-react";

interface Order {
   id: string;
   orderNumber: string;
   status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
   paymentStatus: "pending" | "paid" | "failed" | "refunded";
   items: Array<{
      albumName?: string;
      bookFormat?: string;
      coverType?: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
   }>;
   subtotal: number;
   shippingTotal: number;
   tax: number;
   total: number;
   customerInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
   };
   shippingAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
   };
   paymentMethod: string;
   notes?: string;
   estimatedDelivery?: string;
   trackingNumber?: string;
   createdAt: string;
   updatedAt: string;
}

interface OrderStats {
   totalOrders: number;
   pendingOrders: number;
   completedOrders: number;
   totalRevenue: number;
   aiArtOrders: number;
   albumOrders: number;
}

const AdminDashboard = () => {
   const { name } = useDashboardData();
   const { isLoading, isAuthenticated, logout } = withAuth({
      role: "admin",
      redirectTo: "/signin",
   });
   const [orders, setOrders] = useState<Order[]>([]);
   const [stats, setStats] = useState<OrderStats>({
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      totalRevenue: 0,
      aiArtOrders: 0,
      albumOrders: 0,
   });
   const [isLoadingOrders, setIsLoadingOrders] = useState(true);
   const [filterStatus, setFilterStatus] = useState<string>("all");
   const [filterType, setFilterType] = useState<string>("all");

   useEffect(() => {
      if (isAuthenticated) {
         fetchOrders();
      }
   }, [isAuthenticated]);

   const fetchOrders = async () => {
      try {
         const response = await fetch("/api/admin/orders");
         if (response.ok) {
            const data = await response.json();
            const orderData = data.orders || [];
            setOrders(orderData);
            calculateStats(orderData);
         }
      } catch (error) {
         console.error("Error fetching orders:", error);
      } finally {
         setIsLoadingOrders(false);
      }
   };

   const calculateStats = (orderData: Order[]) => {
      const stats = orderData.reduce(
         (acc, order) => {
            acc.totalOrders++;
            acc.totalRevenue += parseFloat(order.total.toString());

            if (order.status === "pending") acc.pendingOrders++;
            if (order.status === "delivered") acc.completedOrders++;

            // Check if order contains AI art or album items
            // Ensure items is an array before using array methods
            const items = Array.isArray(order.items) ? order.items : [];

            const hasAiArt = items.some(
               item =>
                  item.albumName?.toLowerCase().includes("ai") ||
                  item.albumName?.toLowerCase().includes("generated")
            );
            const hasAlbum = items.some(
               item => item.bookFormat || item.coverType
            );

            if (hasAiArt) acc.aiArtOrders++;
            if (hasAlbum) acc.albumOrders++;

            return acc;
         },
         {
            totalOrders: 0,
            pendingOrders: 0,
            completedOrders: 0,
            totalRevenue: 0,
            aiArtOrders: 0,
            albumOrders: 0,
         }
      );

      setStats(stats);
   };

   const getStatusColor = (status: Order["status"]) => {
      switch (status) {
         case "pending":
            return "bg-yellow-100 text-yellow-800";
         case "processing":
            return "bg-blue-100 text-blue-800";
         case "shipped":
            return "bg-purple-100 text-purple-800";
         case "delivered":
            return "bg-green-100 text-green-800";
         case "cancelled":
            return "bg-red-100 text-red-800";
         default:
            return "bg-gray-100 text-gray-800";
      }
   };

   const getStatusIcon = (status: Order["status"]) => {
      switch (status) {
         case "pending":
            return <Clock className="h-4 w-4" />;
         case "processing":
            return <Package className="h-4 w-4" />;
         case "shipped":
            return <Truck className="h-4 w-4" />;
         case "delivered":
            return <CheckCircle className="h-4 w-4" />;
         case "cancelled":
            return <XCircle className="h-4 w-4" />;
         default:
            return <Clock className="h-4 w-4" />;
      }
   };

   const getOrderType = (order: Order) => {
      // Ensure items is an array before using array methods
      const items = Array.isArray(order.items) ? order.items : [];

      const hasAiArt = items.some(
         item =>
            item.albumName?.toLowerCase().includes("ai") ||
            item.albumName?.toLowerCase().includes("generated")
      );
      const hasAlbum = items.some(item => item.bookFormat || item.coverType);

      if (hasAiArt && hasAlbum) return "AI Art & Album";
      if (hasAiArt) return "AI Art";
      if (hasAlbum) return "Album Book";
      return "Other";
   };

   const filteredOrders = orders.filter(order => {
      const statusMatch =
         filterStatus === "all" || order.status === filterStatus;
      const typeMatch =
         filterType === "all" ||
         (filterType === "ai-art" && getOrderType(order).includes("AI Art")) ||
         (filterType === "album" && getOrderType(order).includes("Album"));
      return statusMatch && typeMatch;
   });

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
                  {!isAuthenticated ? "You have no account" : "Invalid role"}
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
         <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
               <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Admin Dashboard - Welcome back, {name}!
               </h1>
               <p className="text-gray-600">
                  Track and manage all user orders for AI-generated art and
                  album books
               </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
               <Card className="p-6">
                  <div className="flex items-center">
                     <Package className="h-8 w-8 text-blue-600" />
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                           Total Orders
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                           {stats.totalOrders}
                        </p>
                     </div>
                  </div>
               </Card>
               <Card className="p-6">
                  <div className="flex items-center">
                     <Clock className="h-8 w-8 text-yellow-600" />
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                           Pending
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                           {stats.pendingOrders}
                        </p>
                     </div>
                  </div>
               </Card>
               <Card className="p-6">
                  <div className="flex items-center">
                     <CheckCircle className="h-8 w-8 text-green-600" />
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                           Completed
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                           {stats.completedOrders}
                        </p>
                     </div>
                  </div>
               </Card>
               <Card className="p-6">
                  <div className="flex items-center">
                     <DollarSign className="h-8 w-8 text-green-600" />
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                           Revenue
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                           ${stats.totalRevenue.toFixed(2)}
                        </p>
                     </div>
                  </div>
               </Card>
               <Card className="p-6">
                  <div className="flex items-center">
                     <Palette className="h-8 w-8 text-purple-600" />
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                           AI Art Orders
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                           {stats.aiArtOrders}
                        </p>
                     </div>
                  </div>
               </Card>
               <Card className="p-6">
                  <div className="flex items-center">
                     <BookOpen className="h-8 w-8 text-indigo-600" />
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                           Album Orders
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                           {stats.albumOrders}
                        </p>
                     </div>
                  </div>
               </Card>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                     Filter by Status
                  </label>
                  <select
                     value={filterStatus}
                     onChange={e => setFilterStatus(e.target.value)}
                     className="border border-gray-300 rounded-md px-3 py-2 bg-white"
                  >
                     <option value="all">All Statuses</option>
                     <option value="pending">Pending</option>
                     <option value="processing">Processing</option>
                     <option value="shipped">Shipped</option>
                     <option value="delivered">Delivered</option>
                     <option value="cancelled">Cancelled</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                     Filter by Type
                  </label>
                  <select
                     value={filterType}
                     onChange={e => setFilterType(e.target.value)}
                     className="border border-gray-300 rounded-md px-3 py-2 bg-white"
                  >
                     <option value="all">All Types</option>
                     <option value="ai-art">AI Art Orders</option>
                     <option value="album">Album Book Orders</option>
                  </select>
               </div>
            </div>

            {/* Orders List */}
            <div className="mb-8">
               <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Order Tracking ({filteredOrders.length})
               </h2>

               {isLoadingOrders ? (
                  <div className="space-y-4">
                     {[...Array(5)].map((_, index) => (
                        <Card key={index} className="p-6 animate-pulse">
                           <div className="flex justify-between items-start mb-4">
                              <div className="space-y-2">
                                 <div className="h-4 bg-gray-200 rounded w-32"></div>
                                 <div className="h-3 bg-gray-200 rounded w-48"></div>
                              </div>
                              <div className="h-6 bg-gray-200 rounded w-20"></div>
                           </div>
                           <div className="grid grid-cols-4 gap-4">
                              <div className="h-3 bg-gray-200 rounded"></div>
                              <div className="h-3 bg-gray-200 rounded"></div>
                              <div className="h-3 bg-gray-200 rounded"></div>
                              <div className="h-3 bg-gray-200 rounded"></div>
                           </div>
                        </Card>
                     ))}
                  </div>
               ) : filteredOrders.length === 0 ? (
                  <Card className="p-8 text-center">
                     <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                     <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No orders found
                     </h3>
                     <p className="text-gray-500">
                        {filterStatus !== "all" || filterType !== "all"
                           ? "Try adjusting your filters to see more orders."
                           : "Orders will appear here once customers start placing them."}
                     </p>
                  </Card>
               ) : (
                  <div className="space-y-4">
                     {filteredOrders.map(order => (
                        <Card
                           key={order.id}
                           className="p-6 hover:shadow-lg transition-shadow"
                        >
                           <div className="flex justify-between items-start mb-4">
                              <div>
                                 <h3 className="text-lg font-semibold text-gray-900">
                                    Order #{order.orderNumber}
                                 </h3>
                                 <p className="text-sm text-gray-600">
                                    {order.customerInfo.firstName}{" "}
                                    {order.customerInfo.lastName} •{" "}
                                    {order.customerInfo.email}
                                 </p>
                              </div>
                              <div className="flex items-center space-x-3">
                                 <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {getOrderType(order)}
                                 </span>
                                 <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(order.status)}`}
                                 >
                                    {getStatusIcon(order.status)}
                                    <span className="ml-1">
                                       {order.status.charAt(0).toUpperCase() +
                                          order.status.slice(1)}
                                    </span>
                                 </span>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                 <p className="text-sm font-medium text-gray-600">
                                    Order Date
                                 </p>
                                 <p className="text-sm text-gray-900">
                                    {new Date(
                                       order.createdAt
                                    ).toLocaleDateString()}
                                 </p>
                              </div>
                              <div>
                                 <p className="text-sm font-medium text-gray-600">
                                    Total Amount
                                 </p>
                                 <p className="text-sm text-gray-900 font-semibold">
                                    $
                                    {parseFloat(order.total.toString()).toFixed(
                                       2
                                    )}
                                 </p>
                              </div>
                              <div>
                                 <p className="text-sm font-medium text-gray-600">
                                    Payment Status
                                 </p>
                                 <p
                                    className={`text-sm font-medium ${order.paymentStatus === "paid" ? "text-green-600" : "text-yellow-600"}`}
                                 >
                                    {order.paymentStatus
                                       .charAt(0)
                                       .toUpperCase() +
                                       order.paymentStatus.slice(1)}
                                 </p>
                              </div>
                              <div>
                                 <p className="text-sm font-medium text-gray-600">
                                    Items
                                 </p>
                                 <p className="text-sm text-gray-900">
                                    {Array.isArray(order.items)
                                       ? order.items.length
                                       : 0}{" "}
                                    item(s)
                                 </p>
                              </div>
                           </div>

                           {/* Order Items */}
                           <div className="border-t pt-4">
                              <h4 className="text-sm font-medium text-gray-600 mb-2">
                                 Order Items:
                              </h4>
                              <div className="space-y-2">
                                 {Array.isArray(order.items) ? (
                                    order.items.map((item, index) => (
                                       <div
                                          key={index}
                                          className="flex justify-between items-center text-sm"
                                       >
                                          <div>
                                             <span className="font-medium">
                                                {item.albumName || "Album"}
                                             </span>
                                             {item.bookFormat && (
                                                <span className="text-gray-600 ml-2">
                                                   ({item.bookFormat})
                                                </span>
                                             )}
                                             <span className="text-gray-600 ml-2">
                                                × {item.quantity}
                                             </span>
                                          </div>
                                          <span className="font-medium">
                                             $
                                             {parseFloat(
                                                item.totalPrice.toString()
                                             ).toFixed(2)}
                                          </span>
                                       </div>
                                    ))
                                 ) : (
                                    <div className="text-sm text-gray-500">
                                       No items available
                                    </div>
                                 )}
                              </div>
                           </div>

                           {/* Shipping Address */}
                           <div className="border-t pt-4 mt-4">
                              <h4 className="text-sm font-medium text-gray-600 mb-2">
                                 Shipping Address:
                              </h4>
                              <p className="text-sm text-gray-900">
                                 {order.shippingAddress.street},{" "}
                                 {order.shippingAddress.city},{" "}
                                 {order.shippingAddress.state}{" "}
                                 {order.shippingAddress.zipCode},{" "}
                                 {order.shippingAddress.country}
                              </p>
                              {order.trackingNumber && (
                                 <p className="text-sm text-gray-600 mt-1">
                                    Tracking:{" "}
                                    <span className="font-medium">
                                       {order.trackingNumber}
                                    </span>
                                 </p>
                              )}
                              {order.estimatedDelivery && (
                                 <p className="text-sm text-gray-600 mt-1">
                                    Estimated delivery:{" "}
                                    {new Date(
                                       order.estimatedDelivery
                                    ).toLocaleDateString()}
                                 </p>
                              )}
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

export default AdminDashboard;

import { BookOpen, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const OrderLink = () => {
    return (
        <div className="border-t border-gray-200 p-2">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-3">
                <div className="text-center">
                    <div className="w-10 h-10 mx-auto bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-2">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs font-medium text-gray-800 mb-2">
                        Ready to Print?
                    </p>
                    <Link
                        href="/signin"
                        className="inline-flex items-center justify-center w-full p-2 bg-gradient-to-r from-green-600 to-blue-600 text-white text-xs font-medium rounded-full hover:from-green-700 hover:to-blue-700 transition-all duration-300"
                    >
                        <ShoppingBag className="w-3 h-3 mr-1" />
                        Order Now
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default OrderLink
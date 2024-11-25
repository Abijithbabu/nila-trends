"use client"
import { useSearchParams } from "next/navigation";

export default function OrderSuccess() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  console.log('orderId',orderId);
  

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-12 h-12 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m0 6a9 9 0 11-6.637-3.081A9 9 0 0112 21z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Order Placed Successfully!
        </h1>
        {orderId && (
          <p className="text-gray-600 mb-6">Your Order ID: <strong>{orderId}</strong></p>
        )}
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your order is being processed.
        </p>

        <div className="space-x-4">
          {/* <a
            href="/orderdetails"
            className="px-6 py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
          >
            View Orders
          </a> */}
          <a
            href="/allproducts"
            className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Continue Shopping
          </a>
        </div>
      </div>
    </div>
  );
}

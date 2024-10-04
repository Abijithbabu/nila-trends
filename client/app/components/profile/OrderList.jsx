import React from 'react'
import dayjs from 'dayjs';

const OrderList = ({ orders, selectedOrder, setSelectedOrder, selectedStatus, setSelectedStatus }) => {
   return (
      <div className={`${selectedOrder && "hidden"} md:block`}>
         <h2 className="text-xl font-bold mb-4">My Orders</h2>
         <div className="flex space-x-2 mb-4">
            {['Placed', 'Delivered', 'Canceled', 'Returned'].map((status, index) => (
               <button
                  key={index}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1 rounded-full text-sm ${selectedStatus === status ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'
                     }`}
               >
                  {status}
               </button>
            ))}
         </div>

         <div className="space-y-4 md:max-h-[60vh] md:overflow-y-scroll">
            {orders?.map((order) => (
               <div key={order?._id} className={`bg-gray-100 rounded-lg p-4 cursor-pointer border ${selectedOrder?._id === order?._id && "border-blue-500"}`} onClick={() => setSelectedOrder(order)}>
                  <div className="flex justify-between items-start mb-2">
                     <div>
                        <p className="text-sm md:text-base font-bold">Order No : {order?._id}</p>
                        <p className="text-xs text-gray-600">Shipping addresses</p>
                        <p className="text-xs text-gray-600 max-w-xs">{order?.address.address_line_1}, {order?.address.city}</p>
                     </div>
                     <p className="text-sm text-gray-600">{dayjs(order?.createdAt).format('DD/MM/YYYY')}</p>
                  </div>
                  <div className="flex justify-between items-center">
                     <p className="text-sm">products : {order?.products?.item?.length} </p>
                     <div className="text-right">
                        <p className="text-sm">Total Amount AED:{order?.amount}</p>
                        <button className="text-sm bg-gray-200 px-3 py-1 rounded-full mt-1">Details</button>
                     </div>
                  </div>
                  <p className="text-green-500 text-sm mt-2">{order?.status}</p>
               </div>
            ))}
         </div>
      </div>
   )
}

export default OrderList
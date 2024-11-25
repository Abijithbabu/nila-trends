'use client'
import { useEffect } from 'react';
// import { useRouter } from 'next/router';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosInstance from '../../axios';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { setUserDetails } from '../../redux/actions/userActions';

export default function PaymentConfirmation() {
  const dispatch = useDispatch();



  const router = useRouter();
  // const { ref } = router.query; 
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  console.log('ref', ref);


  useEffect(() => {
    if (ref) {
      confirmPayment(ref);
    }
  }, [ref]);

  const confirmPayment = async (orderReference) => {

    try {
      const storedOrderData = localStorage.getItem('orderDetails');
      const orderDetails = storedOrderData ? JSON.parse(storedOrderData) : null;
      console.log('orderDetails12', orderDetails);

      const response = await axiosInstance.post('/payment/confirm', { orderReference,orderDetails });
      console.log('response samad',response);
      
      if (response.data.message === 'Payment successful') {
        dispatch(setUserDetails(response.data.user));
        // toast.success("Payment confirmed!");
        localStorage.removeItem('orderDetails');
        // router.push('/order-success'); 
        // router.push('/'); 
        router.push(`/order-success?orderId=${response.data.orderId}`)
      } else {
        toast.error("Payment not captured.");
        // router.push('/order-failed');
        router.push('/');
      }
    } catch (error) {
      toast.error("Payment confirmation failed. Please contact support.");
    }
  };

  return <div>Loading...</div>;
}

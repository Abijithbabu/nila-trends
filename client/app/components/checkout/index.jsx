"use client";
import { CheckOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons'
import { Input, Radio } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import axiosInstance from '../../../axios'
import { useSelector, useDispatch } from 'react-redux';
import { setUserDetails } from '../../../redux/actions/userActions';
import { setProfile } from '../../../redux/actions/storeActions';
import { setOrderDetails } from '../../../redux/actions/orderActions';
import { useRouter } from 'next/navigation';
import { CircularProgress, useMediaQuery } from '@mui/material';
import toast from 'react-hot-toast';
import Address from './Address';
import PaymentMode from './PaymentMode';
import { formattedDate, getTimeUntilNextDay } from './helper';

function Checkout() {
  const dispatch = useDispatch();
  const router = useRouter()
  const storeData = useSelector(state => state.storeDetails);
  const storeDataCheckout = useSelector(state => state?.storeDetails?.checkout);
  const userDetails = useSelector(state => state.userDetails);
  const checkoutProduct = storeData?.checkoutProduct
  // const checkoutProduct = useSelector(state => state?.storeDetails?.checkoutProduct);
  const isSmallScreen = useMediaQuery('(max-width: 640px)');
  const [DeliveryInstruction, setDeliveryInstruction] = useState(false)
  const [DeliveryAddress, setDeliveryAddress] = useState('')
  const [coupon, setCoupon] = useState(null);
  const [addCoupon, setAddCoupon] = useState(false);
  const inputRef = useRef()
  const [addresses, setAddresses] = useState([]);

  const [coupons, setCoupons] = useState([]);

  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [loadingState, setLoadingState] = useState(false);

  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [appliedCouponDetails, setAppliedCouponDetails] = useState('');
  const [discount, setDiscount] = useState(0);
  const [ordersCount, setOrdersCount] = useState();
  const [step, setStep] = useState(0)
  const fetchCoupons = async () => {
    try {
      const { data } = await axiosInstance.get('/coupons/client');
      setCoupons(data.data);
    } catch (error) {
      console.error('Failed to fetch coupons', error);
    } finally {
      setLoadingCoupons(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await axiosInstance.get('/address');
      setAddresses(res?.data?.data);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    fetchAddresses();
  }, [storeData]);

  useEffect(() => {
    setOrdersCount(userDetails?.orderCount)
  }, [storeData, userDetails]);

  const [cartData, setCartData] = useState([])
  const [salePriceTotal, setSalePriceTotal] = useState(0)
  const [proPriceTotal, setProPriceTotal] = useState(0)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("COD");
  const [selectedDaliveryDays, setSelectedDaliveryDays] = useState("12");

  const calculateTotalSalePrice = (items) => {
    let totalSalePrice = 0;
    items.forEach((item) => {
      totalSalePrice += item?.productId?.sale_rate * item?.qty;
    });
    return totalSalePrice;
  };
  const calculateTotalProPrice = (items) => {
    let totalSalePrice = 0;
    items.forEach((item) => {
      totalSalePrice += item?.productId?.price * item?.qty;
    });
    return totalSalePrice;
  };
  const fetchData = async () => {
    try {
      const response = await axiosInstance.get(`/user/getcarts`);
      setCartData(response?.data?.data)
      const items = response?.data?.data?.item;
      const filteredItems = items.filter((obj) => {
        return obj.productId.isAvailable != false
      })
      const totalSalePrice = calculateTotalSalePrice(filteredItems);
      setSalePriceTotal(totalSalePrice)
      const totalProPrice = calculateTotalProPrice(filteredItems);
      setProPriceTotal(totalProPrice)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    setAppliedCoupon('')
    setAppliedCouponDetails('')
    setDiscount(0)
    setCoupon(null)
    setAddCoupon(false)
    setDeliveryAddress('')
    setSelectedDaliveryDays('12')
    if (checkoutProduct) {
      const newCartItem = {
        item: [{
          productId: checkoutProduct?.product,
          size: checkoutProduct?.selectedSize,
          price: checkoutProduct?.product?.price,
          coupon: checkoutProduct?.coupon,
          qty: 1,
        }]
      };
      setCartData(newCartItem);
      const items = newCartItem?.item;
      const filteredItems = items.filter((obj) => {
        return obj.productId.isAvailable != false
      })
      const totalSalePrice = calculateTotalSalePrice(filteredItems);
      setSalePriceTotal(totalSalePrice)
      const totalProPrice = calculateTotalProPrice(filteredItems);
      setProPriceTotal(totalProPrice)
    } else {
      setCartData([])
      fetchData()
    }
  }, [storeData])

  const handleCoupon = async (couponCode) => {
    try {
      setDiscount(0)
      let useCoupon;
      if (couponCode) {
        useCoupon = coupons?.filter((coupon) => {
          if (coupon.code === couponCode) {
            setAppliedCoupon(coupon?.code);
            setCoupon(coupon?.code)
            setAppliedCouponDetails(coupon);
            return coupon
          }
        })
        useCoupon[0] ? '' : toast.error('your coupon code not exists')
      }
      if (useCoupon) {
        const couponId = useCoupon[0]?._id;
        const { data } = await axiosInstance.post('/coupons/validate-coupon', {
          couponId,
          userDetails,
          salePriceIncludingDeliveryCharge,
        });

        if (data.valid) {
          setDiscount(data.discount);
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      console.error('Failed to apply coupon', error);
    }
  };

  const handleDeliveryAddress = (details) => {
    setStep(0)
    setDeliveryAddress(details);
  }
  const handleDeliveryInstruction = () => setDeliveryInstruction(!DeliveryInstruction)

  const deliveryCharge = Number(selectedDaliveryDays);
  const includedDeliveryCharge = ordersCount === 0 ? 0 : salePriceTotal < 200 ? deliveryCharge : deliveryCharge === 18 ? 18 : 0;
  const salePriceIncludingDeliveryCharge = (includedDeliveryCharge + salePriceTotal).toFixed(2)
  const maximumDiscountPrice = ((appliedCouponDetails?.maxValue < ((salePriceIncludingDeliveryCharge * discount) / 100)) ? appliedCouponDetails?.maxValue : ((salePriceIncludingDeliveryCharge * discount) / 100)).toFixed(2)
  const lastTotal = discount > 0
    ? salePriceIncludingDeliveryCharge - maximumDiscountPrice : salePriceIncludingDeliveryCharge;

  const handlePaymentMethodChange = (e) => {
    setSelectedPaymentMethod(e.target.value);
    if (step > 1) setStep(1)
  };
  const handleDaliveryDaysChange = (e) => {
    setSelectedDaliveryDays(e.target.value);
  };
  const checkDaliveryDays = lastTotal < 200 ? (selectedDaliveryDays === '12' ? '2' : '1') : 'free'
  const deliveryDays = ordersCount === 0 ? 'free' : checkDaliveryDays
  const handlePaymentSuccess = async () => {
    setLoadingState(true)
    const mappedItems = await cartData?.item?.map((item) => ({
      product_id: item.productId._id,
      qty: item.qty,
      price: item.productId.sale_rate,
      size: item?.size
    }));

    const totalPrice = mappedItems.reduce(
      (total, item) => total + item.qty * item.price,
      0
    );

    const productsOrderData = {
      item: mappedItems,
      totalPrice,
    };

    const response = await axiosInstance.post(`/orders`, {
      payment_mode: selectedPaymentMethod,
      delivery_days: deliveryDays,
      amount: lastTotal,
      address: DeliveryAddress,
      products: productsOrderData,
      couponId: appliedCouponDetails._id,
    });

    dispatch(setUserDetails(response.data.user));
    // toast.success('Your order has been placed!')
    setLoadingState(false)
    router.push(`/order-success?orderId=${response.data.orderId}`)
  };

  const handleNetworkPayment = async () => {
    setLoadingState(true)
    try {
      const response = await axiosInstance.post('/payment/initiate', {
        totalPrice: lastTotal,
        currency: 'AED',
        redirectUrl: `${process.env.NEXT_PUBLIC_CLIENT_API}/payment-confirmation`,
      });

      if (response.data.orderPaypageUrl) {
        window.location.href = response.data.orderPaypageUrl;
      }
    } catch (error) {
      toast.error("Payment initiation failed. Please try again.");
    }
  };

  const orderStoredInlocalStorage = {} = async () => {
    const mappedItems = await cartData?.item?.map((item) => ({
      product_id: item.productId._id,
      qty: item.qty,
      price: item.productId.sale_rate,
      size: item?.size
    }));

    const totalPrice = mappedItems.reduce(
      (total, item) => total + item.qty * item.price,
      0
    );

    const productsOrderData = {
      item: mappedItems,
      totalPrice,
    };

    const orderData = {
      payment_mode: selectedPaymentMethod,
      delivery_days: deliveryDays,
      amount: lastTotal,
      address: DeliveryAddress,
      products: productsOrderData,
      couponId: appliedCouponDetails._id,
    };
    localStorage.setItem('orderDetails', JSON.stringify(orderData));
  }

  const checkCheaptCoupon = async (data) => {
    try {
      const couponsIncluded = data.filter(item => item.coupon);
      const uniqueCoupons = {};
      couponsIncluded.forEach(item => {
        const couponId = item.coupon._id;
        if (!uniqueCoupons[couponId] || uniqueCoupons[couponId].discount > item.coupon.discount) {
          uniqueCoupons[couponId] = item.coupon;
          uniqueCoupons[couponId].associatedItems = uniqueCoupons[couponId].associatedItems || [];
          uniqueCoupons[couponId].associatedItems.push(item);
        }
      });
      const filteredCoupons = Object.values(uniqueCoupons);
      if (filteredCoupons.length === 0) {
        return null;
      }

      let cheapestCoupon = filteredCoupons[0];

      filteredCoupons.forEach(coupon => {
        if (coupon.discount < cheapestCoupon.discount) {
          cheapestCoupon = coupon;
        } else if (coupon.discount === cheapestCoupon.discount) {
          if (coupon.minValue < cheapestCoupon.minValue) {
            cheapestCoupon = coupon;
          }
        }
      });
      return cheapestCoupon;
    } catch (error) {
      console.error(error);
    }
  };

  const setAlreyIncludedCoupons = async () => {
    try {
      if (cartData?.item?.length === 1 && cartData?.item[0]?.coupon) {
        await handleCoupon(cartData?.item[0]?.coupon?.code)
      } else if (cartData?.item?.length > 1) {
        const cheapestCoupon = await checkCheaptCoupon(cartData?.item)
        if (cheapestCoupon) {
          await handleCoupon(cheapestCoupon?.code)
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!loadingCoupons && storeDataCheckout) {
      setAlreyIncludedCoupons();
    }
  }, [loadingCoupons, storeDataCheckout, cartData]);

  const CheckoutButton = () => {
    const data = [
      {
        text: "Deliver to this address",
        desc: "Review the address carefully, by proceeding will set this as your delivery address"
      },
      {
        text: "Use this payment method",
        desc: "Review your payment mode carefully, by proceeding will set this as your payment mode"
      },
      {
        text: "Place your Order",
        desc: "By placing your order, you agree to Nilaa's privacy notice and conditions of use"
      },
      {
        text: "Proceed To Payment",
        desc: "Review the order carefully, by proceeding will redirect to secure payment gateway page."
      },
    ]

    const handleClick = () => {
      if (step === 0) {
        if (!DeliveryAddress) {
          toast.error("Please select a delivery address.");
          return;
        }
        setStep(1);
        return;
      }
      if (step === 1) {
        if (!selectedPaymentMethod) {
          toast.error("Please select a payment method.");
          return;
        }
        setStep(selectedPaymentMethod === "COD" ? 2 : 3);
        return;
      }
      if (step === 2) {
        handlePaymentSuccess();
        return;
      }
      if (step === 3) {
        orderStoredInlocalStorage();
        handleNetworkPayment();
        return;
      }
      setStep(0);
    };

    return (
      <div>
        <div className="flex py-2">
          <p className=" w-full text-xs font-medium">{data?.[step]?.desc}</p>
        </div>
        <button onClick={handleClick} disabled={loadingState} className='bg-[#1F1F1F] text-white py-2 gap-2 rounded-lg w-full flex justify-center items-center'>
          {!!loadingState && <CircularProgress size={16} color='inherit' />}
          {data?.[step]?.text}
        </button>
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto flex flex-col gap-3 p-4 md:p-8 mb-28 md:mb-1 text-sm md:text-sm mt-20 md:mt-28'>
      <h2 className='font-bold text-lg md:pt-1'>Secure Checkout</h2>
      <hr />
      <div className='flex flex-col md:flex-row gap-8'>
        <div className='w-full flex flex-col gap-8 md:w-2/3'>

          {/* Delivery Address Section*/}
          <div>
            {!step ? <Address data={addresses} dispatch={handleDeliveryAddress} selected={DeliveryAddress} /> :
              <div>
                <h2 className="text-sm md:text-md font-bold mb-4">Delivery address</h2>
                <div key={DeliveryAddress._id} onClick={() => dispatch(DeliveryAddress)} className="flex flex-row gap-2 text-xs md:text-sm border rounded-lg p-4">
                  <div className="relative flex justify-between items-start mb-2 w-full">
                    <div>
                      <p className="font-bold">{DeliveryAddress?.fullname}</p>
                      <p className="text-gray-600">{DeliveryAddress?.address_line_1}, {DeliveryAddress?.address_line_2}, {DeliveryAddress?.area}, {DeliveryAddress?.emirate}</p>
                      <p className="text-gray-600">Email: {DeliveryAddress?.email}</p>
                      <p className="text-gray-600">Phone: {DeliveryAddress?.code} {DeliveryAddress?.mobile}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setStep(0)} className="font-medium text-blue-400">Change Address</button>
                    </div>
                  </div>
                </div>
              </div>
            }
            {step === 0 && <CheckoutButton />}
          </div>

          {/* Payment Method Section */}
          <div className='border p-4 flex gap-5 flex-col'>
            <h2 className="text-sm md:text-md font-bold">Payment Method</h2>
            <PaymentMode data={selectedPaymentMethod} dispatch={handlePaymentMethodChange} expand={step < 2} change={() => setStep(1)} />
            <div className='flex flex-col gap-2'>
              <p className='text-sm font-medium'>have a coupon code ? Apply your coupon code for a discount</p>
              <div className="flex flex-row flex-wrap">
                <div onClick={() => setAddCoupon(!addCoupon)} className="bg-gray-100 border-dashed rounded-full border-2 border-gray-300 cursor-pointer">
                  <p className='text-center text-sm px-5'> Add coupon <span>{addCoupon ? <CloseOutlined /> : <PlusOutlined />}</span></p>
                </div>
              </div>
              {addCoupon && (
                <div className='flex mt-1 bg-black rounded-lg'>
                  <input ref={inputRef} onChange={(e) => setAppliedCoupon(e.target.value)} className="w-full px-3 border rounded-lg h-8 outline-none" value={appliedCoupon} placeholder="Add a Coupon Code" />
                  <button onClick={() => handleCoupon(appliedCoupon)} className='bg-[#1F1F1F] text-white rounded-md px-3'>apply</button>
                </div>)}
              {discount > 0 && <div className='flex gap-2'>
                <div
                  onClick={handleDeliveryInstruction}
                  className="bg-[#FBFFFF] bg-gradient-to-tr to-[#FBFFFF] from-[#EAC4A2] border-dashed rounded-full border-2 border-gray-300 px-2 w-1/3"
                >
                  <p className="text-center text-sm">{coupon}</p>
                </div>
                <span className='text-green-500 text-xs md:text-sm'>coupon applied <CheckOutlined /></span>
              </div>}
            </div>
            {step === 1 && <CheckoutButton />}
          </div>

          {/* Delivery plan section */}
          <div className='border p-4 flex flex-col gap-2'>
            <h2 className="text-sm md:text-md font-bold">Arriving {formattedDate(selectedDaliveryDays == 12 ? 2 : 1)}</h2>
            <p className='text-xs md:text-sm'>{getTimeUntilNextDay()}</p>
            <hr />
            {/* {(lastTotal < 200 && ordersCount > 0) && */}
            <div className="flex flex-col gap-3 w-full">
              <div className="flex-row flex gap-3"> <p>Shipping</p><Svg /><p><span className='text-green-500'>1 - 2</span> days delivery</p>.</div>
              <p className=" w-full text-xs font-medium ">How many days are you expecting for delivery ?</p>
              <div className="flex flex-col">
                <Radio.Group onChange={handleDaliveryDaysChange} value={selectedDaliveryDays} className='w-full flex flex-col md:flex-row gap-3'>
                  <Radio value="12" className={`w-full md:w-1/2 bg-stone-100 rounded-lg border-2 p-4 max-w-80 ${selectedDaliveryDays == 12 && "border-blue-400"}`}>
                    <p className='pl-2 text-sm font-medium'>{formattedDate(2)}</p>
                    <p className='pl-2 text-sm font-medium'>2 day Standard Delivery</p>
                    {ordersCount === 0 || salePriceTotal > 200 ? <p className='pl-2 text-green-600 font-sans text-xs'><span className='line-through text-stone-500 text-sm font-mono'>AED:12</span> Eligible for free delivery</p> : <p className='pl-2 font-mono'>AED:12</p>}
                  </Radio>
                  <Radio value="18" className={`w-full md:w-1/2 bg-stone-100 rounded-lg border-2 p-4 max-w-80 ${selectedDaliveryDays == 18 && "border-blue-400"}`}>
                    <p className='pl-2 text-sm font-medium'>{formattedDate(1)}</p>
                    <p className='pl-2 text-sm font-medium'>1 day Express Delivery</p>
                    <p className='pl-2 font-mono'>AED:18</p>
                  </Radio>
                </Radio.Group>
              </div>
            </div>
            {step > 1 && <CheckoutButton />}
          </div>
        </div>

        {/* Order Summary Section */}
        <div className='w-full relative md:w-1/3'>
          <div className="space-y-4 md:fixed md:mr-8 max-w-96">
            <h3 className='font-bold text-sm'>Order Summary</h3>
            <div className="flex flex-col gap-1.5 justify-between px-5 py-2 border rounded-md overflow-y-auto max-h-32">
              {cartData?.item?.slice().reverse().map((item) => (
                <div key={item?._id} className="flex items-center justify-between space-x-4">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${item?.productId?.image[0]}`}
                    alt="Product"
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-grow text-left">
                    <h4 className="font-semibold text-sm">{item?.productId?.name}</h4>
                    {item?.size && <p className="text-gray-500 text-xs">Size • {item?.size}</p>}
                    <p className="text-gray-500 text-xs">Quantity  • {item?.qty}</p>
                    <p className="text-gray-500 text-xs">AED • {item?.productId?.sale_rate}</p>
                  </div>
                </div>
              ))}
            </div>
            <hr className='border-dashed ' />
            <div className="flex flex-col gap-1">
              <div className="flex flex-row justify-between"> <p>Subtotal</p><p className='font-mono'>AED:<span>{(salePriceTotal).toFixed(2)}</span></p>  </div>
              <div className="flex flex-row justify-between"> <p>Delivery Charge</p><p className='font-mono'>AED:<span>{includedDeliveryCharge ? deliveryCharge : 'Free'}</span></p> </div>
              {coupon && <div className="flex flex-row justify-between"> <p>Coupon discount</p><p className='font-mono'>AED:<span>{maximumDiscountPrice}</span></p> </div>}
              <hr className='border-dashed ' />
              <div className="flex flex-row justify-between"> <p>Grand Total</p><p className='font-mono'>AED:<span>{lastTotal}</span></p> </div>
            </div>
            <CheckoutButton />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout

const Svg = () => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.5 17.5C19.5 18.163 19.2366 18.7989 18.7678 19.2678C18.2989 19.7366 17.663 20 17 20C16.337 20 15.7011 19.7366 15.2322 19.2678C14.7634 18.7989 14.5 18.163 14.5 17.5C14.5 16.837 14.7634 16.2011 15.2322 15.7322C15.7011 15.2634 16.337 15 17 15C17.663 15 18.2989 15.2634 18.7678 15.7322C19.2366 16.2011 19.5 16.837 19.5 17.5ZM9.5 17.5C9.5 18.163 9.23661 18.7989 8.76777 19.2678C8.29893 19.7366 7.66304 20 7 20C6.33696 20 5.70107 19.7366 5.23223 19.2678C4.76339 18.7989 4.5 18.163 4.5 17.5C4.5 16.837 4.76339 16.2011 5.23223 15.7322C5.70107 15.2634 6.33696 15 7 15C7.66304 15 8.29893 15.2634 8.76777 15.7322C9.23661 16.2011 9.5 16.837 9.5 17.5Z" stroke="#545454" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M14.5 17.5H9.5M19.5 17.5H20.263C20.483 17.5 20.593 17.5 20.685 17.488C21.016 17.4468 21.3239 17.2964 21.5599 17.0606C21.7959 16.8248 21.9465 16.517 21.988 16.186C22 16.093 22 15.983 22 15.763V13C22 11.2761 21.3152 9.62279 20.0962 8.40381C18.8772 7.18482 17.2239 6.5 15.5 6.5M2 4H12C13.414 4 14.121 4 14.56 4.44C15 4.878 15 5.585 15 7V15.5M2 12.75V15C2 15.935 2 16.402 2.201 16.75C2.33265 16.978 2.52199 17.1674 2.75 17.299C3.098 17.5 3.565 17.5 4.5 17.5M2 7H8M2 10H6" stroke="#545454" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  )
}
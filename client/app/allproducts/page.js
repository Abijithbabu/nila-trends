"use client";
import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import RightBox from './RightBox';
import Pagination from '@mui/material/Pagination';
import axiosInstance from '../../axios';
import { useDispatch, useSelector } from 'react-redux';
import { setUserDetails } from '../../redux/actions/userActions';
import { useRouter } from 'next/navigation';
import ProductCard from '../components/products/ProductCard';
import Filters from '../components/products/Filters';

const KurtaSetsListing = () => {
  const dispatch = useDispatch();
  const userData = useSelector(state => state.userDetails);
  const router = useRouter();
  const [products, setProducts] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [message, setMessage] = useState()

  const [priceRange, setPriceRange] = useState([10, 15000]);
  const [selectedDiscount, setSelectedDiscount] = useState(0);
  const [selectedRatings, setSelectedRatings] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sorting, setSorting] = useState();

  const fetchProducts = async () => {
    try {
      const { data } = await axiosInstance.get(`/products`, {
        params: {
          page,
          search,
          category: selectedCategories.join(','),
          priceRange: priceRange.join('-'),
          discount: selectedDiscount,
          rating: selectedRatings,
          sort: sorting,
        }
      });
      setProducts(data.products);
      setMessage(data.message)
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching products:', error.message);
    }
  };

  useEffect(() => {     
    fetchProducts();
  }, [page, search, priceRange, selectedDiscount, selectedRatings, selectedCategories,sorting]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const fixedSelectedProduct = selectedProduct ? selectedProduct : products?.[0];

  const isInWishlist = (productId) => {

    if (wishlistItems === undefined) {
      return false;
    }
    return wishlistItems.some((item) => item?._id === productId);
  };

  const fetchWishlist = async () => {
    try {
      const wishlistResponse = await axiosInstance.get('/user/getwishlist');
      setWishlistItems(wishlistResponse?.data?.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  // const toggleWishlist = async (proId) => {
  //   if (!userData) {
  //     router.push('/register');
  //   } else {
  //     try {
  //       if (isInWishlist(proId)) {
  //         const response = await axiosInstance.patch(`/user/removeFromWishlist/${proId}`);
  //         dispatch(setUserDetails(response?.data?.userData));
  //       } else {
  //         const response = await axiosInstance.patch(`/user/addToWishlist/${proId}`);
  //         dispatch(setUserDetails(response?.data?.userData));
  //       }
  //       await fetchWishlist();
  //     } catch (error) {
  //       console.error('Error toggling wishlist:', error);
  //     }
  //   }
  // };


  const toggleWishlist = async (proId) => {
    if (!userData) {
      router.push('/register');
    } else {
      const alreadyInWishlist = isInWishlist(proId);
      setWishlistItems((prev) => {
        if (alreadyInWishlist) {
          return prev.filter(item => item._id !== proId);
        } else {
          return [...prev, { _id: proId }];
        }
      });
  
      try {
        const response = await axiosInstance.patch(
          alreadyInWishlist ? `/user/removeFromWishlist/${proId}` : `/user/addToWishlist/${proId}`
        );
        dispatch(setUserDetails(response?.data?.userData));
        // await fetchWishlist(); 
      } catch (error) {
        console.error('Error toggling wishlist:', error);
        setWishlistItems(prev => (alreadyInWishlist ? [...prev, { _id: proId }] : prev.filter(item => item._id !== proId)));
      }
    }
  };
  useEffect(() => {
    fetchWishlist();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 mt-20 md:mt-28">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 first-item">
          <div className="flex items-center mb-4">
            <Filters
              setPriceRange={setPriceRange}
              setSelectedDiscount={setSelectedDiscount}
              setSelectedRatings={setSelectedRatings}
              setSelectedCategories={setSelectedCategories}
              setSorting={setSorting} 
              handleSearchChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className='w-full pb-3 md:pb-4 text-xs md:text-sm'>{message}</div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products ? products?.map((product) => (
              <ProductCard
                key={product._id}
                ProId={product._id}
                images={product?.image}
                category={product?.category?.name}
                title={product.name}
                fit={product.fitAndCare[0] || 'Regular'}
                price={product.price}
                sale_rate={product.sale_rate}
                onClick={() => handleProductClick(product)}
                onWishlistClick={() => toggleWishlist(product._id)}
                isInWishlist={isInWishlist(product._id)}
              />
            )) :
              Array(9).fill().map((_item, index) => <ProductCard key={index} />)}
          </div>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            className="flex justify-center mb-10 md:mb-3 mt-5"
            size='small'
          />
        </div>
        <RightBox product={fixedSelectedProduct} />
      </div>
    </div>
  );
};

export default KurtaSetsListing;

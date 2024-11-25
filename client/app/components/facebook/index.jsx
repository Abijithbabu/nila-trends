import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import FacebookLogin from '@greatsumini/react-facebook-login';
import axios from '../../../axios';
import { CircularProgress } from '@mui/material';

const FacebookLoginComponent = (props) => {
   const [isLoading, setIsLoading] = useState(false);
   const router = useRouter();

   const handleFacebookCallback = async (response) => {
      setIsLoading(true);
      try {
         const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/facebook-login`, response);
         localStorage.setItem('Tokens', JSON.stringify({
            access: res.data.token.accessToken,
            refresh: res.data.token.refreshToken,
         }));
         setIsLoading(false);
         router.back()
      } catch (error) {
         console.error('Error during Google login: ', error);
         setIsLoading(false);
      }
   }

   return (
      <>
         {isLoading && (
            <div className="fixed z-50 top-0 left-0 bg-white opacity-80 w-[100vw] h-[100vh] flex items-center justify-center">
               <p className="text-black text-xl font-medium"><CircularProgress size={20} color='inherit' />&nbsp;loading...</p>
            </div>
         )}
         <FacebookLogin
            appId={process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}
            style={{
               padding: "10px 20px",
               backgroundColor: "#4267B2",
               color: "#fff",
               borderRadius: "5px",
               fontSize: "14px",
               cursor: "pointer",
               width: "100%"
            }}
            onSuccess={(response) => {
               console.log('Login Success!', response);
            }}
            onFail={(error) => {
               console.log('Login Failed!', error);
            }}
            onProfileSuccess={handleFacebookCallback}
         />
      </>
   );
};
export default FacebookLoginComponent;   
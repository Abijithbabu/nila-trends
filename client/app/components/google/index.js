'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';

const GoogleLoginComponent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadGoogleApi = () => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/platform.js';
        script.async = true;
        script.onload = () => {
          window.gapi.load('auth2', () => {
            window.gapi.auth2.init({
              client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
              scope: 'profile email',
            });
          });
        };
        document.body.appendChild(script);
      };
      loadGoogleApi();
    }
  }, []);

  const handleLogin = () => {
    setIsLoading(true);
    const auth2 = window.gapi.auth2.getAuthInstance();
    auth2.signIn().then(async (googleUser) => {
      const id_token = googleUser.getAuthResponse().id_token;
      try {
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/google-login`, { tokenId: id_token });
        localStorage.setItem('Tokens', JSON.stringify({ access: res.data.token.accessToken, refresh: res.data.token.refreshToken }));
        setIsLoading(false);
        router.push('/');
      } catch (error) {
        console.error('Error during Google login: ', error);
        setIsLoading(false);
      }
    }).catch((error) => {
      alert('Google login failed');
      setIsLoading(false);
      console.error('Google login failed: ', error);
    });
  };

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50">
          <div className="loader"></div>
        </div>
      )}
      <button
        onClick={handleLogin}
        className="w-full flex items-center justify-center bg-white border border-gray-300 p-2 rounded hover:bg-gray-50 mb-4"
      >
        <Image src="/assets/google-icon.png" alt="Google" width={20} height={20} className="mr-2" />
        Continue with Google
      </button>
    </>
  );
};

export default GoogleLoginComponent;

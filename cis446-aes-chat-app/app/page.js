'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';


export default function SplashPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('x-user-id');
    if (token) setIsLoggedIn(true);
  }, []);

  return (
    <main className="splash-container mainOffset flex flex-col items-center justify-center min-h-screen p-8">
      <Navbar></Navbar>
      <h1 className="headingColor text-3xl font-bold mb-6">Secure Messaging App</h1>

      {isLoggedIn ? (
        <button
          className="navButton px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => router.push('/inbox')}
        >
          Go to Inbox
        </button>
      ) : (
        <div className=" space-x-4">
          <button
            className="navButton px-4 py-2 bg-green-600 text-white rounded"
            onClick={() => router.push('/login')}
          >
            Login
          </button>
          <button
            className="navButton px-4 py-2 bg-gray-700 text-white rounded"
            onClick={() => router.push('/register')}
          >
            Register
          </button>
        </div>
      )}
      
      <div className="waveform">
        <div className="bar bar1"></div>
        <div className="bar bar2"></div>
        <div className="bar bar3"></div>
        <div className="bar bar4"></div>
        <div className="bar bar5"></div>
      </div>
      <div className="splash-text">
        <span className="headingColor fade-in-text">Encrypting your messages...</span>
      </div>
    
    </main>
  );
}
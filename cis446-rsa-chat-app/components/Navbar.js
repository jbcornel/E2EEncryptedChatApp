'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useMediator } from '@/components/mediatorContext';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    userId,
    username,
    setUserId,
    setUsername,
    setSessionReady,
  } = useMediator();

  async function logout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    localStorage.removeItem('x-user-id');
    localStorage.removeItem('username');
    setUserId(null);
    setUsername(null);
    setSessionReady(false);
    router.push('/');
  }

  const showNav = pathname.startsWith('/inbox') || pathname.startsWith('/chat') || pathname === '/';

  if (!showNav) return null;

  return (
    <div className="navBar position-fixed top-0 start-0 h-100 d-flex flex-column bg-light border-end shadow" style={{ width: '250px', zIndex: 1050 }}>
      <div className="text-center py-4 border-bottom">
        <h4 className="fw-bold text-primary">SafeeChat</h4>
        {username && <div className="text-muted small">Hello, <strong>{username}</strong></div>}
      </div>
      <div className="flex-grow-1 d-flex flex-column gap-3 px-3 pt-4">
        {userId && (
          <>
            <button onClick={() => router.push('/inbox')} className="navButton btn btn-outline-primary btn-lg w-100">
               Inbox
            </button>
            <button onClick={logout} className="navButton btn btn-outline-danger btn-lg w-100">
               Logout
            </button>
          </>
        )}
        {!userId && (
          <button onClick={() => router.push('/login')} className="navButton btn-outline-success btn-lg w-100">
             Login
          </button>
        )}
      </div>
    </div>
  );
}

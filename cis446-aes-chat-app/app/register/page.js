'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push('/login');
    } else {
      setError(data.error || 'Registration failed');
    }
  }

  return (
    <main className="mainOffset ml-12 flex flex-col items-center justify-center min-h-screen p-8">
      <h2 className="headingColor text-2xl font-bold mb-4">Register</h2>
      <form onSubmit={handleRegister} className="flex flex-col space-y-4 w-64">
        <input
          type="text"
          placeholder="Username"
          className=" registerInput border p-2"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className=" registerInput border p-2"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="registerInput border p-2"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button className=" navButton bg-green-600 text-white py-2 rounded" type="submit">
          Register
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>
      <Link href="/login" className="text-primary text-decoration-none">
        <button className="navButton btn btn-outline-primary btn-sm mt-3">
            Back to login
        </button>
        </Link>
    </main>
  );
}

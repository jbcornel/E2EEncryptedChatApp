'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMediator } from '@/components/mediatorContext';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const mediator = useMediator();

  const [username, setUsernameInput] = useState('');
  const [password, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('login');
  const [privateKey, setPrivateKey] = useState('');
  const [passphrase, setPassphrase] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('x-user-id', data.user.id);
      localStorage.setItem('username', data.user.username);

      document.cookie = `username=${data.user.username}; path=/; max-age=${60 * 60 * 24 * 7}`;
      document.cookie = `x-user-id=${data.user.id}; path=/; max-age=${60 * 60 * 24 * 7}`;

      if (typeof mediator.setUserId === 'function') mediator.setUserId(data.user.id);
      if (typeof mediator.setUsername === 'function') mediator.setUsername(data.user.username);
      if (typeof mediator.setSessionReady === 'function') mediator.setSessionReady(true);

    
      setStep('privateKey');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handlePrivateKeySubmit(e) {
    e.preventDefault();
    if (!privateKey) {
      setError('Private key required for end-to-end encryption');
      return;
    }
    localStorage.setItem('myPrivateKey', privateKey);
    localStorage.setItem('myPrivateKeyPassphrase', passphrase || '');
    router.push('/inbox');
  }

  return (
    <main className="mainOffset p-4 max-w-md mx-auto">
      <h1 className="headingColor text-2xl font-bold mb-4">Login</h1>
      {step === 'login' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsernameInput(e.target.value)}
            className="loginInput w-full p-2 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPasswordInput(e.target.value)}
            className="loginInput w-full p-2 border rounded"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="navButton w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      ) : (
        <form onSubmit={handlePrivateKeySubmit} className="w-100" style={{ maxWidth: 700 }}>
        <div className="mb-5 w-100">
          <label htmlFor="privateKey" className="custom-label">Private Key</label>
          <textarea
            id="privateKey"
            placeholder="Paste your PRIVATE KEY (PEM/armored format)"
            value={privateKey}
            onChange={e => setPrivateKey(e.target.value)}
            className="form-control"
            required
            rows={6}
            style={{ fontFamily: "monospace", fontSize: "0.97rem", minHeight: 120 }}
          />
        </div>
        <div className="mb-5 w-100">
          <label htmlFor="passphrase" className="custom-label">Passcode</label>
          <textarea
            id="passphrase"
            placeholder="Passphrase (if your key is protected, optional)"
            value={passphrase}
            onChange={e => setPassphrase(e.target.value)}
            className="form-control"
            rows={6}
            style={{ minHeight: 120 }}
          />
        </div>
        {<button
type="submit"
className="navButton w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
>
Store Private Key & Continue
</button>
}
      </form>
      
      )}

      <Link href="/register" className="text-primary text-decoration-none">
        <button className="navButton btn btn-outline-primary btn-sm mt-3">
          Don't have an account? Register now
        </button>
      </Link>
    </main>
  );
}

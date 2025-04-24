'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as openpgp from 'openpgp';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setError('');

    try {
      const { privateKey, publicKey } = await openpgp.generateKey({
        type: 'rsa',
        rsaBits: 2048,
        userIDs: [{ name: username, email }],
        passphrase: password,
      });


      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, publicKey }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      
      localStorage.setItem('myPrivateKey', privateKey.trim());
      localStorage.setItem('myPrivateKeyPassphrase', password.trim());
 
      localStorage.setItem('myPublicKey', publicKey.trim());

      setPrivateKey(privateKey); 
      setShowKey(true); 

    } catch (err) {
      setError('Failed to generate encryption key: ' + (err?.message || err));
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(privateKey);
    alert("Private key copied! Save it somewhere safe.");
  }

  function handleDownload() {
    const blob = new Blob([privateKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${username}-private-key.asc`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleContinue() {
    router.push('/login');
  }

  return (
    <main className="mainOffset ml-12 flex flex-col items-center justify-center min-h-screen p-8">
      <h2 className="headingColor text-2xl font-bold mb-4">Register</h2>
      {!showKey ? (
        <form onSubmit={handleRegister} className="flex flex-col space-y-4 w-64">
          <input
            type="text"
            placeholder="Username"
            className="registerInput border p-2"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="registerInput border p-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="registerInput border p-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button className="navButton bg-green-600 text-white py-2 rounded" type="submit">
            Register
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      ) : (
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-bold text-red-600 mb-2">Save Your Private Key!</h3>
          <p className="mb-2 text-sm text-red-400">
            This key is required to decrypt your messages. If you lose it, you will not be able to read your messages again. Copy and store it somewhere safe (password manager, file, etc).
          </p>
          <textarea
            value={privateKey}
            readOnly
            rows={8}
            className="w-full p-2 border rounded"
            style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
          />
          <div className="flex flex-row gap-2 my-2">
            <button className="btn btn-outline-primary" onClick={handleCopy}>Copy</button>
            <button className="btn btn-outline-secondary" onClick={handleDownload}>Download</button>
          </div>
          <button className="btn btn-success mt-3" onClick={handleContinue}>
            I've Saved My Private Key — Continue to Login
          </button>
        </div>
      )}
      <Link href="/login" className="text-primary text-decoration-none">
        <button className="navButton btn btn-outline-primary btn-sm mt-3">
          Back to login
        </button>
      </Link>
    </main>
  );
}


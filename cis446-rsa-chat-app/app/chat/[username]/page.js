'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useMediator } from '@/components/mediatorContext';
import io from 'socket.io-client';
import Navbar from '@/components/Navbar';
import { encryptWithPublicKey, decryptWithPrivateKey } from '@/lib/asymmetricEncryption';

export default function ChatPage() {
  const { username: chatPartner } = useParams();
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const { userId, username: currentUsername, sessionReady } = useMediator();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [editId, setEditId] = useState(null);
  const [room, setRoom] = useState('');
  const [partnerPublicKey, setPartnerPublicKey] = useState('');
  const [myPublicKey, setMyPublicKey] = useState('');
  const [myPrivateKey, setMyPrivateKey] = useState('');
  const [privateKeyPassphrase, setPrivateKeyPassphrase] = useState('');
  const [error, setError] = useState('');

  //Load keys from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setMyPrivateKey(localStorage.getItem('myPrivateKey') || '');
      setPrivateKeyPassphrase(localStorage.getItem('myPrivateKeyPassphrase') || '');
      setMyPublicKey(localStorage.getItem('myPublicKey') || '');
    }
  }, []);


  useEffect(() => {
    if (!sessionReady || !userId || !currentUsername || !chatPartner || !myPrivateKey || !privateKeyPassphrase) return;
    const calculatedRoom = [currentUsername, chatPartner].sort().join(':');
    setRoom(calculatedRoom);

   
    fetch(`/api/users/${chatPartner}/public-key`)
      .then(res => res.json())
      .then(data => setPartnerPublicKey(data.publicKey || ''));

   
    fetch(`/api/messages?with=${chatPartner}`, { credentials: 'include' })
      .then(res => res.json())
      .then(async data => {
        const decryptedMessages = await Promise.all(
          data.map(async m => {
            const cipher = m.senderId === userId
              ? m.cipherForSender
              : m.cipherForRecipient;
            try {
              const text = await decryptWithPrivateKey(cipher, localStorage.getItem('myPrivateKey'), localStorage.getItem('myPrivateKeyPassphrase'));
              return { ...m, content: text };
            } catch (err) {
              return { ...m, content: '[Decryption failed]' };
            }
          })
        );
        setMessages(decryptedMessages);
      });


    fetch('/api/socket');
    const socket = io(undefined, { path: '/api/socket' });
    socketRef.current = socket;
    socket.emit('join-room', calculatedRoom);

    socket.on('receive-message', async msg => {
      const cipher = msg.senderId === userId
        ? msg.cipherForSender
        : msg.cipherForRecipient;
      try {
        const text = await decryptWithPrivateKey(cipher, localStorage.getItem('myPrivateKey'), localStorage.getItem('myPrivateKeyPassphrase'));
        setMessages(prev => [...prev, { ...msg, content: text }]);
      } catch {
        setMessages(prev => [...prev, { ...msg, content: '[Decryption failed]' }]);
      }
    });

    socket.on('message-edited', async msg => {
      const cipher = msg.senderId === userId
        ? msg.cipherForSender
        : msg.cipherForRecipient;
      try {
        const text = await decryptWithPrivateKey(cipher, localStorage.getItem('myPrivateKey'), localStorage.getItem('myPrivateKeyPassphrase'));
        setMessages(prev =>
          prev.map(m => m.id === msg.id ? { ...msg, content: text } : m)
        );
      } catch {
        setMessages(prev =>
          prev.map(m => m.id === msg.id ? { ...msg, content: '[Decryption failed]' } : m)
        );
      }
    });

    socket.on('message-deleted', id => {
      setMessages(prev => prev.filter(m => m.id !== id));
    });

    return () => socket.disconnect();
  }, [chatPartner, sessionReady, userId, currentUsername, myPrivateKey, privateKeyPassphrase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  async function sendMessage() {
    setError('');
    if (!input.trim()) {
      setError("Input is empty");
      return;
    }
    if (!partnerPublicKey || !myPublicKey) {
      setError("Keys not loaded.");
      return;
    }
    try {
      const cipherForSender = await encryptWithPublicKey(input, myPublicKey);
      const cipherForRecipient = await encryptWithPublicKey(input, partnerPublicKey);

      const res = await fetch('/api/messages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: chatPartner,
          cipherForSender,
          cipherForRecipient
        }),
      });
      const msg = await res.json();

      if (res.ok) {
        setMessages(prev => [...prev, { ...msg, content: input, senderId: userId }]);
        socketRef.current.emit('send-message', { room, message: msg });
        setInput('');
      } else {
        setError("Message send failed: " + (msg.error || "Unknown error"));
      }
    } catch (err) {
      setError("Failed to send message: " + err.message);
    }
  }


  async function updateMessage() {
    setError('');
    if (!input.trim()) {
      setError("Input is empty");
      return;
    }
    if (!partnerPublicKey || !myPublicKey) {
      setError("Keys not loaded.");
      return;
    }
    try {
      const cipherForSender = await encryptWithPublicKey(input, myPublicKey);
      const cipherForRecipient = await encryptWithPublicKey(input, partnerPublicKey);

      const res = await fetch(`/api/messages/${editId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cipherForSender,
          cipherForRecipient
        }),
      });
      const msg = await res.json();

      if (res.ok) {
        setMessages(prev =>
          prev.map(m => m.id === editId ? { ...m, content: input } : m)
        );
        socketRef.current.emit('edit-message', { room, message: { ...msg, id: editId } });
        setEditId(null);
        setInput('');
      } else {
        setError("Update failed: " + (msg.error || "Unknown error"));
      }
    } catch (err) {
      setError("Failed to update message: " + err.message);
    }
  }


  async function deleteMessage(id) {
    setError('');
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== id));
        socketRef.current.emit('delete-message', { room, id });
        if (editId === id) {
          setEditId(null);
          setInput('');
        }
      }
    } catch (err) {
      setError("Failed to delete message: " + err.message);
    }
  }

  return (
    <main className="container py-4 d-flex flex-column align-items-center" style={{ height: 'calc(70vh)' }}>
      <Navbar />
      <h1 className="headingColor text-center mb-3">Chat with {chatPartner}</h1>
      <div className="w-100 chat-window border rounded bg-white px-3 d-flex flex-column"
        style={{ maxHeight: '500px', overflowY: 'scroll', scrollbarWidth: 'auto', borderRadius: '12px', background: '#717c81' }}>
        {messages.map(msg => {
          const isCurrentUser = msg.senderId?.toString() === userId?.toString();
          return (
            <div key={msg.id} className="d-flex mb-2">
              <div
                className={`card shadow-sm ${isCurrentUser ? 'bg-primary text-white' : 'bg-light'} border-0`}
                style={{
                  maxWidth: '60%',
                  fontSize: '0.85rem',
                  borderRadius: '16px',
                  padding: '8px',
                  marginLeft: isCurrentUser ? 'auto' : 0
                }}
              >
                <div className="card-body py-2 px-3">
                  <h6 className="card-subtitle mb-1 small">{isCurrentUser ? 'You' : chatPartner}</h6>
                  <p className="card-text mb-1" style={{ wordBreak: 'break-word' }}>{msg.content}</p>
                  {isCurrentUser && (
                    <div className="d-flex justify-content-end gap-2">
                      <button
                        onClick={() => { setEditId(msg.id); setInput(msg.content); }}
                        className="btn btn-sm btn-outline-light"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="btn btn-sm btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}></div>
      </div>

      <form
        onSubmit={e => {
          e.preventDefault();
          editId ? updateMessage() : sendMessage();
        }}
        className="d-flex gap-2 w-100 mt-3"
        style={{ maxWidth: '860px' }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={editId ? 'Edit your message...' : 'Type a message...'}
          className="flex-grow-1 input enter-message form-control"
        />
        <button type="submit" className={`button btn ${editId ? 'btn-warning' : 'btn-primary'}`}>
          {editId ? 'Save' : 'Send'}
        </button>
        {editId && (
          <button
            type="button"
            className="button btn btn-secondary"
            onClick={() => {
              setEditId(null);
              setInput('');
            }}
          >
            Cancel
          </button>
        )}
      </form>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </main>
  );
}

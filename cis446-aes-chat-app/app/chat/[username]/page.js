'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMediator } from '@/components/mediatorContext';
import io from 'socket.io-client';
import Navbar from '@/components/Navbar';
import { encrypt, decrypt } from '@/lib/encryption';

export default function ChatPage() {
  const { username: chatPartner } = useParams();
  const router = useRouter();
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const { userId, username: currentUsername, sessionReady } = useMediator();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [editId, setEditId] = useState(null);
  const [room, setRoom] = useState('');

  useEffect(() => {
    if (!sessionReady || !userId || !currentUsername) return;

    const calculatedRoom = [currentUsername, chatPartner].sort().join(':');
    setRoom(calculatedRoom);

    fetch(`/api/messages?with=${chatPartner}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const decryptedMessages = data.map(m => {
          try {
            return { ...m, content: decrypt(m.content) };
          } catch (err) {
            return { ...m, content: '[Decryption failed]' };
          }
        });
        setMessages(decryptedMessages);
      });

    fetch('/api/socket');
    const socket = io(undefined, { path: '/api/socket' });
    socketRef.current = socket;
    socket.emit('join-room', calculatedRoom);

    socket.on('receive-message', msg => {
      try {
        const decrypted = { ...msg, content: decrypt(msg.content) };
        setMessages(prev => [...prev, decrypted]);
      } catch {
        setMessages(prev => [...prev, { ...msg, content: '[Decryption failed]' }]);
      }
    });

    socket.on('message-edited', msg => {
      try {
        const decrypted = decrypt(msg.content);
        setMessages(prev =>
          prev.map(m => m.id === msg.id ? { ...msg, content: decrypted } : m)
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
  }, [chatPartner, sessionReady, userId, currentUsername]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;

    const encryptedContent = encrypt(input);

    const res = await fetch('/api/messages', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: chatPartner, content: encryptedContent }),
    });

    const msg = await res.json();
    if (res.ok) {
      setMessages(prev => [...prev, { ...msg, content: input }]);
      socketRef.current.emit('send-message', { room, message: msg });
      setInput('');
    }
  }

  async function updateMessage() {
    const encrypted = encrypt(input);

    const res = await fetch(`/api/messages/${editId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: encrypted }),
    });

    const updated = await res.json();

    if (res.ok) {
      const decrypted = decrypt(updated.content);
      setMessages(prev =>
        prev.map(m => m.id === updated.id ? { ...updated, content: decrypted } : m)
      );
      socketRef.current.emit('edit-message', { room, message: updated });
      setEditId(null);
      setInput('');
    }
  }

  async function deleteMessage(id) {
    const res = await fetch(`/api/messages/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (res.ok) {
      setMessages(prev => prev.filter(m => m.id !== id));
      socketRef.current.emit('delete-message', { room, id });
    }

    if (editId === id) {
      setEditId(null);
      setInput('');
    }
  }

  return (
    <main className="container py-4 d-flex flex-column align-items-center" style={{ height: 'calc(70vh)' }}>
      <Navbar />
      <h1 className="headingColor text-center mb-3">Chat with {chatPartner}</h1>

      <div
        className="w-100 chat-window border rounded bg-white px-3 d-flex flex-column"
        style={{ maxHeight: '500px', overflowY: 'scroll', scrollbarWidth: 'auto', borderRadius: '12px', background: '#717c81' }}
      >
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
                      <button onClick={() => { setEditId(msg.id); setInput(msg.content); }} className="btn btn-sm btn-outline-light">Edit</button>
                      <button onClick={() => deleteMessage(msg.id)} className="btn btn-sm btn-danger">Delete</button>
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
          <button type="button" className="button btn btn-secondary" onClick={() => { setEditId(null); setInput(''); }}>
            Cancel
          </button>
        )}
      </form>
    </main>
  );
}

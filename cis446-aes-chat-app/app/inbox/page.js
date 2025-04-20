
'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMediator } from '@/components/mediatorContext';
import io from 'socket.io-client';
import Navbar from '@/components/Navbar';
import { decrypt } from '@/lib/encryption';

export default function InboxPage() {
  const router = useRouter();
  const mediator = useMediator();
  const {
    userId,
    username,
    sessionReady,
    refreshInbox,
    setRefreshInbox,
    refreshFriends,
    setRefreshFriends,
  } = mediator || {};

  const socketRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);

  async function fetchFriends() {
    const res = await fetch('/api/friends', { credentials: 'include' });
    const data = await res.json();
    setFriends(Array.isArray(data) ? data : []);
  }

  async function fetchConversations() {
    const res = await fetch('/api/messages', { credentials: 'include' });
    const data = await res.json();
  
    if (Array.isArray(data)) {
      const decryptedConversations = data.map(conv => ({
        ...conv,
        lastMessage: decrypt(conv.lastMessage),
      }));
      setConversations(decryptedConversations);
    } else {
      setConversations([]);
    }
  }
  

  useEffect(() => {
    if (!sessionReady || !userId) return;

    fetch('/api/socket');
    socketRef.current = io(undefined, { path: '/api/socket' });

    const room = `friends:${userId}`;
    socketRef.current.emit('join-room', room);

    socketRef.current.on('friend-list-updated', fetchFriends);

    fetchConversations();
    fetchFriends();

    const friendInterval = setInterval(fetchFriends, 5000);
    const convoInterval = setInterval(fetchConversations, 4000);

    return () => {
      socketRef.current?.disconnect();
      clearInterval(friendInterval);
      clearInterval(convoInterval);
    };
  }, [sessionReady, refreshInbox, refreshFriends, userId]);

  useEffect(() => {
    if (!search) return setResults([]);
    const delay = setTimeout(() => {
      fetch(`/api/users/search?username=${search}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => setResults(Array.isArray(data) ? data : []));
    }, 300);
    return () => clearTimeout(delay);
  }, [search, friends]);

  async function addFriend(friendId) {
    await fetch('/api/friends', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendId }),
    });
    fetchFriends();
  }

  async function deleteFriend(friendUsername) {
    await fetch(`/api/friends/${friendUsername}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    fetchFriends();
  }

  function openChat(username) {
    router.push(`/chat/${username}`);
  }

  if (!sessionReady) return <div className="p-4 text-center">Loading...</div>;

  return (
    <main className="mainOffset min-vh-100 bg-light text-dark">
      <Navbar />
      <div className="container py-5">
        <h1 className="headingColor text-center text-primary mb-5">Inbox</h1>

        <div className="mb-5">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-control form-control-lg mb-8"
            placeholder="Search users..."
          />
          {results.length > 0 && (
            <div className="row g-3 search-results">
              {results.map(user => {
                const isFriend = friends.some(f => f.id === user.id);
                return (
                  <div key={user.id} className="col-md-6 mt-3">
                    <div
                      className="card border border-primary-subtle shadow-sm"
                      style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease', boxShadow: '0 4px 6px rgba(0,0,0,0.08)' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 18px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.08)';
                      }}
                    >
                      <div className="card-body d-flex justify-content-between align-items-center">
                        <span className="fs-5 fw-semibold text-primary text-uppercase" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>{user.username}</span>
                        {isFriend ? (
                          <button onClick={() => deleteFriend(user.username)} className="btn btn-sm btn-outline-danger">
                            Remove
                          </button>
                        ) : (
                          <button onClick={() => addFriend(user.id)} className="btn btn-sm btn-outline-primary">
                            Add Friend
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-5">
          <h2 className="headingColor mb-3">Friends</h2>
          {!Array.isArray(friends) || friends.length === 0 ? (
            <p className="text-muted">No friends yet.</p>
          ) : (
            <div className="row g-3">
              {friends.map(friend => (
                <div key={friend.id} className="col-md-6">
                  <div
                    className="card border border-success-subtle shadow-sm"
                    style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease', boxShadow: '0 4px 6px rgba(0,0,0,0.08)' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 10px 16px rgba(0,0,0,0.12)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.08)';
                    }}
                  >
                    <div className="card-body d-flex justify-content-between align-items-center">
                      <span className="fw-semibold fs-5" onClick={() => openChat(friend.username)} style={{ cursor: 'pointer' }}>
                        {friend.username}
                      </span>
                      <button onClick={() => deleteFriend(friend.username)} className="btn btn-sm btn-outline-danger">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="headingColor mb-3">Recent Conversations</h2>
          {Array.isArray(conversations) && conversations.length === 0 ? (
            <p className="text-muted">No conversations yet.</p>
          ) : (
            <div className="row g-3">
              {conversations.map((conv, index) => {
                const otherUser = conv.with === username ? conv.otherUser : conv.with;
                return (
                  <div key={index} className="col-md-6">
                    <div
                      onClick={() => openChat(otherUser)}
                      className="card border border-info-subtle h-100 shadow-sm"
                      style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease', boxShadow: '0 8px 12px rgba(0,0,0,0.1)' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 12px rgba(0,0,0,0.1)';
                      }}
                    >
                      <div className="card-body">
                        <h4 className="card-title fs-4 fw-bold text-primary text-uppercase mb-3" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>{otherUser}</h4>
                        <p className="card-text text-muted small text-truncate">{conv.lastMessage}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

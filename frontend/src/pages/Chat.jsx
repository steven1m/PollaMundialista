import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getWsUrl } from '../api/client';
import { formatDate } from '../hooks/useApp';

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const wsRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const data = await api.getChat();
      setMessages(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadMessages();

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'chat') {
        setMessages((prev) => [...prev, payload.data]);
      }
    };

    return () => ws.close();
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setError('');
    try {
      await api.sendChat(text);
      setText('');
    } catch (err) {
      setError(err.message);
    }
  };

  if (user?.is_admin) {
    return (
      <div>
        <h1 className="page-title">Chat</h1>
        <div className="alert alert-info">El administrador puede ver el chat pero no escribir mensajes.</div>
        <div className="card" style={{ maxHeight: 500, overflowY: 'auto' }}>
          {messages.map((m) => (
            <div key={m.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
              <strong>{m.user_name}</strong>
              <span style={{ color: 'var(--muted)', fontSize: '0.75rem', marginLeft: 8 }}>{formatDate(m.created_at)}</span>
              <div>{m.message}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Chat</h1>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ maxHeight: 450, overflowY: 'auto', marginBottom: '1rem' }}>
        {messages.length === 0 ? (
          <p className="empty-state">Sé el primero en escribir</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              style={{
                padding: '0.6rem',
                marginBottom: '0.5rem',
                background: m.user_id === user.id ? '#d6eaf8' : '#f8f9fa',
                borderRadius: 8,
                alignSelf: m.user_id === user.id ? 'flex-end' : 'flex-start',
              }}
            >
              <strong style={{ fontSize: '0.85rem' }}>{m.user_name}</strong>
              <span style={{ color: 'var(--muted)', fontSize: '0.7rem', marginLeft: 6 }}>{formatDate(m.created_at)}</span>
              <div style={{ marginTop: 4 }}>{m.message}</div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="card" style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje..."
          maxLength={500}
          style={{ flex: 1, padding: '0.65rem', border: '1px solid var(--border)', borderRadius: 8 }}
        />
        <button type="submit" className="btn btn-primary">Enviar</button>
      </form>
    </div>
  );
}

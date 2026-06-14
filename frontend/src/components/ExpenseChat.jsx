import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { Send, X, MessageSquare } from 'lucide-react';

export default function ExpenseChat({ expense, onClose }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState(expense.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    socketRef.current = socket;

    socket.emit('join_expense', expense.id);

    socket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, [expense.id]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      expenseId: expense.id,
      userId: user.id,
      content: newMessage.trim()
    };

    socketRef.current.emit('send_message', messageData);
    setNewMessage('');
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-bg-base border-l border-border-soft shadow-2xl flex flex-col z-50 transform transition-transform duration-300">
      {/* Header */}
      <div className="p-4 border-b border-border-soft bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 className="font-bold text-charcoal text-sm truncate max-w-[200px]">{expense.title}</h3>
            <p className="text-xs text-graphite">Expense Chat</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-graphite hover:bg-bg-card rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-graphite text-sm">
            <p>No messages yet.</p>
            <p>Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.userId === user.id || msg.user?.id === user.id;
            return (
              <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-graphite mb-1 px-1">
                  {isMe ? 'You' : msg.user?.name || 'Unknown'}
                </span>
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isMe 
                      ? 'bg-primary text-white rounded-tr-sm' 
                      : 'bg-white border border-border-soft text-charcoal rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-border-soft shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-bg-base border border-border-soft rounded-full text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-primary text-white rounded-full hover:bg-primary-light disabled:opacity-50 transition-colors"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

import React from 'react';
import { Message } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwn }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">{message.sender}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </span>
        </div>
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? 'gradient-primary text-primary-foreground'
              : 'bg-card text-card-foreground border border-border'
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;

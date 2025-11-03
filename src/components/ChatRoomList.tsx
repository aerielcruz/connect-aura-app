import React from 'react';
import { ChatRoom } from '@/lib/api';
import { MessageSquare, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatRoomListProps {
  rooms: ChatRoom[];
  selectedRoomId: number | null;
  onSelectRoom: (id: number) => void;
}

const ChatRoomList: React.FC<ChatRoomListProps> = ({ rooms, selectedRoomId, onSelectRoom }) => {
  return (
    <div className="space-y-2">
      <div className="px-4 py-2 flex items-center gap-2 text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        <span className="text-sm font-medium">Chat Rooms</span>
      </div>
      
      <div className="space-y-1">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            className={cn(
              "w-full px-4 py-3 flex items-center gap-3 rounded-lg transition-all",
              "hover:bg-sidebar-accent group",
              selectedRoomId === room.id && "bg-sidebar-accent border-l-2 border-primary"
            )}
          >
            <Hash className={cn(
              "h-5 w-5 transition-colors",
              selectedRoomId === room.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )} />
            <span className={cn(
              "text-sm font-medium transition-colors",
              selectedRoomId === room.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
            )}>
              {room.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatRoomList;

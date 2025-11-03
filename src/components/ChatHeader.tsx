import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Hash, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ChatHeaderProps {
  roomName: string | null;
  onCreateRoom: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ roomName, onCreateRoom }) => {
  const { username, logout } = useAuth();

  return (
    <div className="h-16 border-b border-border px-6 flex items-center justify-between glass">
      <div className="flex items-center gap-3">
        {roomName ? (
          <>
            <Hash className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">{roomName}</h1>
          </>
        ) : (
          <h1 className="text-lg font-semibold">Select a room</h1>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {username}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreateRoom}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Room
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;

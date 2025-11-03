import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiClient, ChatRoom, Message } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import ChatRoomList from '@/components/ChatRoomList';
import ChatHeader from '@/components/ChatHeader';
import ChatMessage from '@/components/ChatMessage';
import CreateRoomDialog from '@/components/CreateRoomDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const Chat = () => {
  const { isAuthenticated, username, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isCreateRoomDialogOpen, setIsCreateRoomDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadChatRooms();
    }
  }, [isAuthenticated]);

  const loadChatRooms = async () => {
    try {
      setIsLoadingRooms(true);
      const fetchedRooms = await apiClient.getChatRooms();
      setRooms(fetchedRooms);
      if (fetchedRooms.length > 0 && !selectedRoomId) {
        setSelectedRoomId(fetchedRooms[0].id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load chat rooms';
      
      // If unauthorized, redirect to login
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('login')) {
        navigate('/');
        toast({
          title: 'Session expired',
          description: 'Please login again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleCreateRoom = async (name: string) => {
    try {
      const newRoom = await apiClient.createChatRoom(name);
      setRooms([...rooms, newRoom]);
      setSelectedRoomId(newRoom.id);
      toast({
        title: 'Room created',
        description: `Successfully created "${name}"`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create room',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedRoomId) return;

    // For demo purposes, we'll add the message locally
    // In a real app, you'd send it to the server
    const newMessage: Message = {
      id: Date.now(),
      room_id: selectedRoomId,
      sender: username || 'User',
      content: messageInput,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
    setMessageInput('');
  };

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col">
        <div className="h-16 border-b border-sidebar-border px-4 flex items-center">
          <h2 className="text-lg font-bold gradient-primary bg-clip-text text-transparent">
            ChatApp
          </h2>
        </div>
        
        <ScrollArea className="flex-1">
          {isLoadingRooms ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ChatRoomList
              rooms={rooms}
              selectedRoomId={selectedRoomId}
              onSelectRoom={setSelectedRoomId}
            />
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatHeader
          roomName={selectedRoom?.name || null}
          onCreateRoom={() => setIsCreateRoomDialogOpen(true)}
        />

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          {selectedRoomId ? (
            messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isOwn={message.sender === username}
                  />
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            )
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Select a room to start chatting
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        {selectedRoomId && (
          <div className="border-t border-border p-4 glass">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 bg-background/50"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!messageInput.trim()}
                className="gradient-primary hover:opacity-90 transition-opacity"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>

      <CreateRoomDialog
        open={isCreateRoomDialogOpen}
        onOpenChange={setIsCreateRoomDialogOpen}
        onCreateRoom={handleCreateRoom}
      />
    </div>
  );
};

export default Chat;

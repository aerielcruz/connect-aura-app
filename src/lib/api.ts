import { z } from 'zod';

const API_BASE_URL = 'https://16.176.160.194/8000/api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface ChatRoom {
  id: number;
  name: string;
  created_at?: string;
}

export interface Message {
  id: number;
  room_id: number;
  sender: string;
  content: string;
  timestamp: string;
}

export interface AuthResponse {
  token: string;
  user?: {
    id: number;
    username: string;
  };
}

// Input validation schemas
const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required').max(100, 'Username too long'),
  password: z.string().min(1, 'Password is required').max(255, 'Password too long'),
});

const roomNameSchema = z.string().trim().min(1, 'Room name is required').max(100, 'Room name too long');

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Token ${this.token}`;
    }

    return headers;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Validate input
    const validatedData = loginSchema.parse(credentials);

    try {
      const response = await fetch(`${API_BASE_URL}/login/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed. Please check your credentials.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorData.non_field_errors?.[0] || errorMessage;
        } catch {
          // If we can't parse the error, use default message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Django REST Framework returns token in different formats
      const token = data.token || data.key || data.auth_token;
      
      if (!token) {
        console.error('Login response:', data);
        throw new Error('Invalid response from server - no token received');
      }

      this.token = token;
      localStorage.setItem('auth_token', token);
      
      return {
        token,
        user: data.user || { id: data.user_id, username: credentials.username }
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(error.errors[0].message);
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running and CORS is enabled.');
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/logout/`, {
        method: 'POST',
        headers: this.getHeaders(),
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }
    } catch (error) {
      // Even if logout fails on server, clear local token
      console.error('Logout error:', error);
    } finally {
      this.token = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('username');
    }
  }

  async getChatRooms(): Promise<ChatRoom[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat_rooms/`, {
        method: 'GET',
        headers: this.getHeaders(),
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          this.token = null;
          localStorage.removeItem('auth_token');
          localStorage.removeItem('username');
          throw new Error('Unauthorized. Please login again.');
        }
        throw new Error('Failed to fetch chat rooms');
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server');
      }
      throw error;
    }
  }

  async createChatRoom(name: string): Promise<ChatRoom> {
    // Validate input
    const validatedName = roomNameSchema.parse(name);

    try {
      const response = await fetch(`${API_BASE_URL}/chat_rooms/`, {
        method: 'POST',
        headers: this.getHeaders(),
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({ name: validatedName }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Unauthorized. Please login again.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || 'Failed to create chat room');
      }

      return response.json();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(error.errors[0].message);
      }
      throw error;
    }
  }

  async updateChatRoom(id: number, name: string): Promise<ChatRoom> {
    // Validate input
    const validatedName = roomNameSchema.parse(name);

    const response = await fetch(`${API_BASE_URL}/chat_rooms/${id}/`, {
      method: 'PUT',
      headers: this.getHeaders(),
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({ name: validatedName }),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized. Please login again.');
      }
      throw new Error('Failed to update chat room');
    }

    return response.json();
  }

  async deleteChatRoom(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chat_rooms/${id}/`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized. Please login again.');
      }
      throw new Error('Failed to delete chat room');
    }
  }

  async getChatRoomDetail(id: number): Promise<ChatRoom> {
    const response = await fetch(`${API_BASE_URL}/chat_rooms/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized. Please login again.');
      }
      throw new Error('Failed to fetch chat room detail');
    }

    return response.json();
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const apiClient = new ApiClient();

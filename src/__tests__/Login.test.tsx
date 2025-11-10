import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Login from '@/pages/Login';

// Mock the modules
const mockUseAuth = vi.fn();
const mockToast = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: (args: any) => mockToast(args),
}));

vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Login Component', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Setup default mocks
    mockUseAuth.mockReturnValue({
      user: null,
      login: mockLogin,
      logout: vi.fn(),
      loading: false,
    });
    
    // Mock successful login by default
    mockLogin.mockResolvedValue({});
  });

  const renderLogin = () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
  };

  it('renders the login form', () => {
    renderLogin();
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors when form is submitted with empty fields', async () => {
    renderLogin();
    
    // Submit the form without filling in any fields
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check if toast is called with validation error
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Validation Error',
        description: 'Please enter both username and password.',
        variant: 'destructive',
      });
    });
    
    // Ensure login was not called
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('submits the form with username and password', async () => {
    renderLogin();
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check if login was called with correct credentials
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
    });
    
    // Check if success toast is shown
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Welcome back!',
      description: 'You have successfully logged in.',
    });
    
    // Check if navigation occurred
    expect(mockNavigate).toHaveBeenCalledWith('/chat');
  });

  it('shows error message when login fails', async () => {
    // Mock login to reject with an error
    const errorMessage = 'Invalid credentials';
    mockLogin.mockRejectedValueOnce(new Error(errorMessage));
    
    renderLogin();
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check if error toast is shown
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive',
      });
    });
  });

  it('disables the submit button when loading', () => {
    // Mock login to take some time
    mockLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );
    
    renderLogin();
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    // Check if button is disabled and shows loading text
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Signing in...');
  });
});

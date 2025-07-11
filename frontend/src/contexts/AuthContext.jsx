import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set up axios interceptors
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        // Include cookies in all requests for HTTP-only cookie authentication
        config.withCredentials = true;
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          dispatch({ type: 'LOGOUT' });
          localStorage.removeItem('user');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = localStorage.getItem('user');
        
        if (user) {
          // Try to verify authentication with backend using lighter endpoint
          const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/merchant/login`, {
            withCredentials: true,
            timeout: 5000 // 5 second timeout
          });
          
          if (response.status === 200) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: {
                token: 'cookie-based',
                user: JSON.parse(user)
              }
            });
            return;
          }
        }
        
        // If no user in localStorage or verification failed, set as not authenticated but don't show error
        dispatch({ type: 'AUTH_FAILURE', payload: null });
        
      } catch (error) {
        console.warn('Auth check failed:', error.message);
        
        // Only clear auth if we get a definitive 401/403, otherwise keep trying
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('user');
          dispatch({ type: 'AUTH_FAILURE', payload: 'Authentication expired' });
        } else {
          // For network errors or 500s, try to keep existing auth
          const user = localStorage.getItem('user');
          if (user) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: {
                token: 'cookie-based',
                user: JSON.parse(user)
              }
            });
            console.log("User:", user);
          } else {
            dispatch({ type: 'AUTH_FAILURE', payload: null });
          }
        }
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/merchant/login`, {
        email,
        password
      }, {
        withCredentials: true // Include cookies in request
      });

      const { merchant } = response.data;

      // Store user data in localStorage (token is in HTTP-only cookie)
      localStorage.setItem('user', JSON.stringify(merchant));

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          token: 'cookie-based', // Placeholder since token is in HTTP-only cookie
          user: merchant
        }
      });

      return { success: true, user: merchant };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear HTTP-only cookie
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/merchant/logout`, {}, {
        withCredentials: true
      });
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    }
    
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData) => {
    const updatedUser = { ...state.user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    logout,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
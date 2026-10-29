import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  switchDemoUser: (role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('sigo_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('sigo_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (error) {
          console.warn('Sesión caducada o inválida');
          localStorage.removeItem('sigo_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    localStorage.setItem('sigo_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('sigo_token');
    setToken(null);
    setUser(null);
  };

  const switchDemoUser = async (role: Role) => {
    let email = 'admin@sigo.com';
    let pass = 'Admin123!';

    if (role === 'DENTIST') {
      email = 'dr.perez@sigo.com';
      pass = 'Doctor123!';
    } else if (role === 'RECEPTIONIST') {
      email = 'recepcion@sigo.com';
      pass = 'Staff123!';
    } else if (role === 'ASSISTANT') {
      email = 'asistente@sigo.com';
      pass = 'Staff123!';
    } else if (role === 'AUDITOR') {
      email = 'auditor@sigo.com';
      pass = 'Staff123!';
    }

    await login(email, pass);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};

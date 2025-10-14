import React, {useEffect, useState, type ReactNode} from "react";
import {authApi, userApi} from "../../api/endpoints/auth";
import type {LoginDto, RegisterDto, User} from "../../api/types";
import {AuthContext} from "./AuthContext";

export const AuthProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authApi.isAuthenticated()) {
          const currentUser = authApi.getCurrentUser();
          setUser(currentUser);

          try {
            const freshUser = await userApi.getMe();
            setUser(freshUser);
          } catch {
            authApi.logout();
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (data: LoginDto) => {
    const response = await authApi.login(data);
    setUser(response.user);
  };

  const register = async (data: RegisterDto) => {
    const response = await authApi.register(data);
    setUser(response.user);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const freshUser = await userApi.getMe();
    setUser(freshUser);
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

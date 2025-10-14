import apiClient, {storage} from "../client";
import type {AuthResponse, LoginDto, RegisterDto, User} from "../types";

export const authApi = {
  register: async (data: RegisterDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/register", data);
    const {user} = response.data;

    storage.setToken(user.id);
    storage.setUser(user);

    return response.data;
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/login", data);
    const {user} = response.data;

    storage.setToken(user.id);
    storage.setUser(user);

    return response.data;
  },

  logout: (): void => {
    storage.clear();
  },

  getCurrentUser: (): User | null => {
    return storage.getUser();
  },

  isAuthenticated: (): boolean => {
    return !!storage.getToken();
  },
};

export const userApi = {
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>("/users/me");
    storage.setUser(response.data);
    return response.data;
  },

  updateMe: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.patch<User>("/users/me", data);
    storage.setUser(response.data);
    return response.data;
  },
};

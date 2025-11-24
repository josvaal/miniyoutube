export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  channelName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  username: string;
  email: string;
  channelName: string;
  avatarURL: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  channelName: string;
  avatarURL: string;
  createdAt: string;
}

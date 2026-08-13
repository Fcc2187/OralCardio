import { httpClient } from "@/shared/api/httpClient";

export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileUpdateInput {
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
}

export function fetchUserProfile(): Promise<UserProfile> {
  return httpClient.get<UserProfile>("/api/v1/users/me");
}

export function updateUserProfile(input: UserProfileUpdateInput): Promise<UserProfile> {
  return httpClient.patch<UserProfile>("/api/v1/users/me", input);
}

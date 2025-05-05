import { AuthUser } from "./authUser";

export interface AuthProvider {
  initialize(): Promise<void>;
  currentUser(): AuthUser | null;
  logIn(email: string, password: string): Promise<AuthUser>;
  createUser(email: string, password: string, username: string): Promise<AuthUser>;
  logOut(): Promise<void>;
  sendEmailVerification(): Promise<void>;
}

import { AuthProvider } from './authProvider';
import { FirebaseAuthProvider } from './firebaseAuthProvider';

export class AuthService implements AuthProvider {
  private provider: AuthProvider;

  constructor(provider: AuthProvider) {
    this.provider = provider;
  }

  static firebase() {
    return new AuthService(new FirebaseAuthProvider());
  }

  initialize() {
    return this.provider.initialize();
  }

  currentUser() {
    return this.provider.currentUser();
  }

  logIn(email: string, password: string) {
    return this.provider.logIn(email, password);
  }

  createUser(email: string, password: string, username: string) {
    return this.provider.createUser(email, password, username);
  }

  logOut() {
    return this.provider.logOut();
  }

  sendEmailVerification() {
    return this.provider.sendEmailVerification();
  }
}

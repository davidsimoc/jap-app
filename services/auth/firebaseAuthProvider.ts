import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification as firebaseSendEmailVerification,
} from "firebase/auth";
import { firebaseConfig } from '../../firebaseConfig' // ai deja asta
import { AuthUser } from "./authUser";
import {
  AuthProvider,
} from "./authProvider";
import {
  EmailAlreadyInUseAuthException,
  GenericAuthException,
  InvalidEmailAuthException,
  UserNotFoundAuthException,
  UserNotLoggedInAuthException,
  WeakPasswordAuthException,
  WrongPasswordAuthException,
} from "./authExceptions";

export class FirebaseAuthProvider implements AuthProvider {
  private initialized = false;

  async initialize() {
   // this.initialized = true;
    if (!this.initialized) {
      initializeApp(firebaseConfig);
      this.initialized = true;
    }
  }

  currentUser(): AuthUser | null {
    const user = getAuth().currentUser;
    return user ? AuthUser.fromFirebase(user) : null;
  }

  async createUser(email: string, password: string): Promise<AuthUser> {
    try {
      await createUserWithEmailAndPassword(getAuth(), email, password);
      const user = this.currentUser();
      if (user) return user;
      throw new UserNotLoggedInAuthException();
    } catch (e: any) {
      switch (e.code) {
        case "auth/weak-password":
          throw new WeakPasswordAuthException();
        case "auth/email-already-in-use":
          throw new EmailAlreadyInUseAuthException();
        case "auth/invalid-email":
          throw new InvalidEmailAuthException();
        default:
          throw new GenericAuthException();
      }
    }
  }

  async logIn(email: string, password: string): Promise<AuthUser> {
    try {
      await signInWithEmailAndPassword(getAuth(), email, password);
      const user = this.currentUser();
      if (user) return user;
      throw new UserNotLoggedInAuthException();
    } catch (e: any) {
      switch (e.code) {
        case "auth/user-not-found":
          throw new UserNotFoundAuthException();
        case "auth/wrong-password":
          throw new WrongPasswordAuthException();
        default:
          throw new GenericAuthException();
      }
    }
  }

  async logOut(): Promise<void> {
    const auth = getAuth();
    if (auth.currentUser) {
      await signOut(auth);
    } else {
      throw new UserNotLoggedInAuthException();
    }
  }

  async sendEmailVerification(): Promise<void> {
    const user = getAuth().currentUser;
    if (user) {
      await firebaseSendEmailVerification(user);
    } else {
      throw new UserNotLoggedInAuthException();
    }
  }
}

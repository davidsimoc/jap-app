import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification as firebaseSendEmailVerification,
  User,
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
import { getFirestore, collection, doc, setDoc, serverTimestamp } from "firebase/firestore"; // Importă firestore
import { use } from "react";

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

  async createUser(email: string, password: string, username: string): Promise<AuthUser> {
    try {
      await createUserWithEmailAndPassword(getAuth(), email, password);
      const user = this.currentUser();
      if (user && user.uid) 
        {
          const firestore = getFirestore(); // Initializează Firestore
          const usersCollection = collection(firestore, 'users');
          const userDocRef = doc(usersCollection, user.uid);
          await setDoc(userDocRef, {
            username: username,
            email: email,
            createdAt: serverTimestamp(), 
          })
          console.log("Sending verification email..."); // Add this line

          //return AuthUser.fromFirebase(user); // Returnează utilizatorul creat
          await this.sendEmailVerification(); // Send verification email
          console.log("Verification email sent."); // Add this line

          return user;
        }
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
        const userCredential = await signInWithEmailAndPassword(getAuth(), email, password);
        const user: User = userCredential.user; // Explicitly type user
        if (user) {
            if (!user.emailVerified) {
                await signOut(getAuth()); // Sign out the user
                throw new Error("EmailNotVerified"); // Or use your custom exception
            }
            return AuthUser.fromFirebase(user);
        }
        throw new UserNotLoggedInAuthException();
    } catch (e: any) {
        switch (e.code) {
            case "auth/user-not-found":
                throw new UserNotFoundAuthException();
            case "auth/wrong-password":
                throw new WrongPasswordAuthException();
            case "EmailNotVerified": // Handle the new error case
                throw new Error("Please verify your email address before logging in.");
            default:
                throw new GenericAuthException();
        }
    }
  }

  async logInWithGoogle(): Promise<AuthUser> {
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      const { GoogleAuthProvider, signInWithCredential } = require('firebase/auth');
      
      // Ensure GoogleSignin is configured (webClientId is needed from Firebase Console)
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'ADD_YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com',
        iosClientId: '1006721640718-on3hqtjo85i403ddeuk7g2fvdd7vpl5v.apps.googleusercontent.com',
      });

      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        throw new Error('No ID token found');
      }

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      const userCredential = await signInWithCredential(getAuth(), googleCredential);
      const user: User = userCredential.user;

      if (user) {
        // Also save user to firestore
        const firestore = getFirestore();
        const usersCollection = collection(firestore, 'users');
        const userDocRef = doc(usersCollection, user.uid);
        await setDoc(userDocRef, {
          username: user.displayName || 'Google User',
          email: user.email,
          createdAt: serverTimestamp(),
        }, { merge: true });

        return AuthUser.fromFirebase(user);
      }
      throw new UserNotLoggedInAuthException();
    } catch (e: any) {
      console.error('Google Sign-In Error:', e);
      throw new GenericAuthException();
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

import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { AuthService } from '../services/auth/authService';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const auth = AuthService.firebase();

export default function App() {
  const router = useRouter();

  function AuthHandler() {
    useEffect(() => {
      const checkAuthStatus = async () => {
        await auth.initialize();

        const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
          if (user) {
            router.replace('/(home)/home');
          } else {
            router.replace('/(auth)/login');
          }
        });

        return unsubscribe;
      };

      checkAuthStatus();
    }, []);

    return null;
  }

  return <AuthHandler />;
}
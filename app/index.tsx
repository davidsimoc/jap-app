import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { AuthService } from '../services/auth/authService';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { UserNotLoggedInAuthException } from '../services/auth/authExceptions';

const auth = AuthService.firebase(); // Folosește serviciul de autentificare

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      await auth.initialize(); // inițializăm Firebase

      const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
        if (user) {
          router.replace('/(home)/home');
        } else {
          router.replace('/(auth)/login');
        }
      });

      return unsubscribe; // cleanup
    };

    checkAuthStatus();
  }, []);

  return null;
}

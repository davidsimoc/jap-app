import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '../../services/auth/authService';
import {
  EmailAlreadyInUseAuthException,
  InvalidEmailAuthException,
  WeakPasswordAuthException,
  GenericAuthException,
} from '../../services/auth/authExceptions';
import { darkTheme, lightTheme } from '@/constants/Colors';

const auth = AuthService.firebase();

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // Adaugă starea pentru nume de utilizator
  const [error, setError] = useState('');

  const handleSignup = async () => {
    try {
      await auth.initialize();
      await auth.createUser(email, password, username);
      router.replace('/(home)/home');
    } catch (e) {
      if (e instanceof EmailAlreadyInUseAuthException) {
        setError('Email already in use.');
      } else if (e instanceof InvalidEmailAuthException) {
        setError('Invalid email address.');
      } else if (e instanceof WeakPasswordAuthException) {
        setError('Password is too weak.');
      } else if (e instanceof GenericAuthException) {
        setError('Something went wrong. Please try again.');
      } else {
        setError('Unknown error occurred.');
      }
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" hidden={true} />
      <View style={{ flex: 1 }}>
        <View style={styles.container}>
          <Text style={styles.title}>Sign Up</Text>
          <TextInput placeholder="Username" placeholderTextColor={"#999"} style={styles.input} value={username} onChangeText={setUsername} />
          <TextInput placeholder="Email" placeholderTextColor={"#999"} style={styles.input} value={email} onChangeText={setEmail} />
          <TextInput placeholder="Password" placeholderTextColor={"#999"} style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={styles.button} onPress={handleSignup}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonSecondary} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.buttonText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Occupy full screen height
    justifyContent: 'center',
    padding: 20,
    backgroundColor: darkTheme.background, // Use light theme background
  },
  title: {
    fontSize: 32,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    color: darkTheme.text,
  },
  input: {
    height: 50,
    borderColor: darkTheme.border, // Use light theme border color
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
    borderRadius: 10,
    color: darkTheme.text, // Text color for the input
    backgroundColor: darkTheme.surface, // Background color for the input
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  button: {
    backgroundColor: darkTheme.primary,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: darkTheme.text, // Text color for the button
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonSecondary: {
    //backgroundColor: darkTheme.secondary, // Lighter color for Sign Up button
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

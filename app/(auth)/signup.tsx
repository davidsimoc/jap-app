import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '../../services/auth/authService';
import {
  EmailAlreadyInUseAuthException,
  InvalidEmailAuthException,
  WeakPasswordAuthException,
  GenericAuthException,
} from '../../services/auth/authExceptions';
import { lightTheme } from '@/constants/Colors';

const auth = AuthService.firebase(); 

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    try {
      await auth.initialize();
      await auth.createUser(email, password);
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
          <TextInput placeholder="Email" placeholderTextColor={"#999"} style={styles.input} value={email} onChangeText={setEmail} />
          <TextInput placeholder="Password" placeholderTextColor={"#999"} style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Sign Up" onPress={handleSignup} />
          <Button title="Already have an account? Login" onPress={() => router.push('/(auth)/login')} />
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
  },
  title: {
    fontSize: 32,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
    borderRadius: 10,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
});

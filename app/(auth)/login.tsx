import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, Dimensions, StatusBar, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '../../services/auth/authService';
import {
  UserNotFoundAuthException,
  WrongPasswordAuthException,
} from '../../services/auth/authExceptions';
import { lightTheme, darkTheme } from '@/constants/Colors';
import { TotpSecret } from 'firebase/auth/web-extension';

const auth = AuthService.firebase();
const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      await auth.initialize();
      await auth.logIn(email, password);
      router.replace('/(home)/home'); // Redirect to home after successful login
    } catch (e) {
      if (e instanceof UserNotFoundAuthException) {
        setError('User not found. Please check your email.');
      } else if (e instanceof WrongPasswordAuthException) {
        setError('Wrong password. Please try again.');
      } else {
        setError('An error occurred. Please try again later.');
      }
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" hidden={true} />
      <View style={{ flex: 1 }}>
        <View style={styles.topCircle}>
          <Image
            source={require('../../assets/images/login.jpg')}
            style={styles.circleImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.container}>
          <Text style={styles.title}>Login</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#999"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#999"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonSecondary} onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.buttonText}>Don't have an account? Sign Up</Text>
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
    borderColor: darkTheme.border,
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
  topCircle: {
    width: width * 2,
    height: width * 2,
    borderRadius: width,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: -width * 1.45,
    marginBottom: -60,
    backgroundColor: darkTheme.background,
    zIndex:1,
  },
  circleImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
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
  }
});

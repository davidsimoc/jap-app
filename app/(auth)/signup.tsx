import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Dimensions, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthService } from '../../services/auth/authService';
import {
  EmailAlreadyInUseAuthException,
  InvalidEmailAuthException,
  WeakPasswordAuthException,
  GenericAuthException,
} from '../../services/auth/authExceptions';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';
import { AuthUser } from '../../services/auth/authUser';

const auth = AuthService.firebase();
const { width } = Dimensions.get('window');

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    setError('');
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

  const handleGoogleSignup = async () => {
    setError('');
    try {
      await auth.initialize();
      await auth.logInWithGoogle(); // Handles both signup and login in Firebase
      router.replace('/(home)/home');
    } catch (e) {
      setError('Google Sign-In failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: currentTheme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom, 40) }} showsVerticalScrollIndicator={false}>
        {/* We can use a slightly different background header or reuse the image style */}
        <View style={styles.topCircle}>
          <Image
            source={require('../../assets/images/japanese_login_bg.png')}
            style={styles.circleImage}
            resizeMode="cover"
          />
          <View style={[styles.overlay, { backgroundColor: currentTheme.primary + 'D9' }]} />
        </View>

        <View style={[styles.contentContainer, { paddingTop: 20 }]}>
          <Text style={[styles.subtitle, { color: currentTheme.primary }]}>START YOUR JOURNEY</Text>
          <Text style={[styles.title, { color: currentTheme.text }]}>Sign Up</Text>

          <View style={styles.formContainer}>
            <View style={[styles.inputWrapper, { backgroundColor: currentTheme.surface, borderColor: currentTheme.text + '10' }]}>
              <Ionicons name="person-outline" size={20} color={currentTheme.text + '50'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: currentTheme.text }]}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="words"
                placeholderTextColor={currentTheme.text + '50'}
              />
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: currentTheme.surface, borderColor: currentTheme.text + '10' }]}>
              <Ionicons name="mail-outline" size={20} color={currentTheme.text + '50'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: currentTheme.text }]}
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={currentTheme.text + '50'}
              />
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: currentTheme.surface, borderColor: currentTheme.text + '10' }]}>
              <Ionicons name="lock-closed-outline" size={20} color={currentTheme.text + '50'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: currentTheme.text }]}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor={currentTheme.text + '50'}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={currentTheme.text + '50'} />
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: currentTheme.primary, marginTop: 10 }]} 
              onPress={handleSignup}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Create Account</Text>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.googleButton, { backgroundColor: currentTheme.surface, borderColor: currentTheme.text + '20' }]} 
              onPress={handleGoogleSignup}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={20} color={currentTheme.primary} />
              <Text style={[styles.googleButtonText, { color: currentTheme.text }]}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: currentTheme.text + '70' }]}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={[styles.footerLink, { color: currentTheme.primary }]}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topCircle: {
    width: width,
    height: width * 0.6,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 30,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 5,
    marginTop: 15,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 20,
  },
  formContainer: {
    gap: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    height: '100%',
  },
  eyeIcon: {
    padding: 10,
    marginRight: -10,
  },
  error: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
    marginTop: -5,
  },
  button: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
    gap: 10,
    marginTop: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  googleButton: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    gap: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '800',
  }
});

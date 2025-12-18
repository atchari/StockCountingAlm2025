import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch } from '@/src/redux/hooks';
import { setCredentials } from '@/src/redux/authSlice';
import { authAPI } from '@/src/api';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleLogin = async () => {
    if (!userName.trim() || !password.trim()) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอก Username และ Password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.login({ userName, password });
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user', JSON.stringify({
        id: response.id,
        userName: response.userName,
        fullName: response.fullName,
        role: response.role,
      }));

      // Update Redux state
      dispatch(setCredentials({
        user: {
          id: response.id,
          userName: response.userName,
          fullName: response.fullName,
          role: response.role,
        },
        token: response.token,
      }));

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'เข้าสู่ระบบไม่สำเร็จ',
        error.response?.data?.error || 'กรุณาตรวจสอบ Username และ Password'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo/Title */}
          <View style={styles.header}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
              <Text style={styles.logoText}>🏢</Text>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              ALUMET Stock Counting
            </Text>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              ระบบนับ Stock สิ้นปี
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Username</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? colors.gray[800] : colors.gray[50],
                    borderColor: colorScheme === 'dark' ? colors.gray[700] : colors.gray[300],
                    color: colors.text,
                  },
                ]}
                placeholder="กรอก Username"
                placeholderTextColor={colors.icon}
                value={userName}
                onChangeText={setUserName}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? colors.gray[800] : colors.gray[50],
                    borderColor: colorScheme === 'dark' ? colors.gray[700] : colors.gray[300],
                    color: colors.text,
                  },
                ]}
                placeholder="กรอก Password"
                placeholderTextColor={colors.icon}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                onSubmitEditing={handleLogin}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                { backgroundColor: colors.primary },
                isLoading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>เข้าสู่ระบบ</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={[styles.footer, { color: colors.icon }]}>
            ALUMET © 2025
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  loginButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    textAlign: 'center',
    fontSize: 14,
  },
});

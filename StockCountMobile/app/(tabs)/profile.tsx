import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { clearAuth } from '@/src/redux/authSlice';
import { authAPI } from '@/src/api';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'ออกจากระบบ',
      'คุณต้องการออกจากระบบหรือไม่?',
      [
        {
          text: 'ยกเลิก',
          style: 'cancel',
        },
        {
          text: 'ออกจากระบบ',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              // Call logout API
              await authAPI.logout();
            } catch (error) {
              console.error('Logout API error:', error);
              // Continue with logout even if API fails
            } finally {
              // Clear AsyncStorage
              await AsyncStorage.multiRemove(['token', 'user']);
              
              // Clear Redux state
              dispatch(clearAuth());
              
              setIsLoggingOut(false);
              
              // Navigate to login
              router.replace('/login');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0) || user?.userName?.charAt(0) || 'U'}
            </Text>
          </View>
        </View>
        <Text style={styles.userName}>{user?.fullName || user?.userName}</Text>
        <Text style={styles.userRole}>{user?.role || 'User'}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* User Info Card */}
        <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? colors.gray[800] : 'white' }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>ข้อมูลผู้ใช้</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Username:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.userName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>ชื่อ-นามสกุล:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.fullName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>บทบาท:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.role}</Text>
          </View>
        </View>

        {/* Actions Card */}
        <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? colors.gray[800] : 'white' }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>การตั้งค่า</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('กำลังพัฒนา', 'ฟีเจอร์นี้อยู่ระหว่างการพัฒนา')}
          >
            <Text style={styles.actionIcon}>🔑</Text>
            <Text style={[styles.actionText, { color: colors.text }]}>เปลี่ยนรหัสผ่าน</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('กำลังพัฒนา', 'ฟีเจอร์นี้อยู่ระหว่างการพัฒนา')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={[styles.actionText, { color: colors.text }]}>ประวัติการนับ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('กำลังพัฒนา', 'ฟีเจอร์นี้อยู่ระหว่างการพัฒนา')}
          >
            <Text style={styles.actionIcon}>ℹ️</Text>
            <Text style={[styles.actionText, { color: colors.text }]}>เกี่ยวกับ</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error }]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutText}>ออกจากระบบ</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <Text style={[styles.footer, { color: colors.icon }]}>
          ALUMET Stock Counting v1.0.0{'\n'}
          © 2025 ALUMET
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  logoutIcon: {
    fontSize: 20,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 24,
  },
});

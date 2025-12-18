import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useAppSelector } from '@/src/redux/hooks';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAppSelector((state) => state.auth);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>ALUMET Stock Counting</Text>
          <Text style={styles.headerSubtitle}>ระบบนับ Stock สิ้นปี</Text>
          <Text style={styles.userName}>สวัสดี, {user?.fullName || user?.userName}</Text>
        </View>

        {/* Welcome Card */}
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? colors.gray[800] : 'white' }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              ยินดีต้อนรับสู่ระบบ Mobile
            </Text>
            <Text style={[styles.cardText, { color: colors.icon }]}>
              ใช้เมนูด้านล่างเพื่อเริ่มต้นการทำงาน
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? colors.gray[800] : 'white' }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              เมนูหลัก
            </Text>
            
            <View style={styles.menuItem}>
              <Text style={styles.menuIcon}>📦</Text>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>สแกน Bin</Text>
                <Text style={[styles.menuDescription, { color: colors.icon }]}>
                  สแกน QR Code บน Bin เพื่อบันทึกตำแหน่ง
                </Text>
              </View>
            </View>

            <View style={styles.menuItem}>
              <Text style={styles.menuIcon}>📝</Text>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>นับ Stock</Text>
                <Text style={[styles.menuDescription, { color: colors.icon }]}>
                  สแกนสินค้าและบันทึกจำนวน Stock
                </Text>
              </View>
            </View>

            <View style={styles.menuItem}>
              <Text style={styles.menuIcon}>👤</Text>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>โปรไฟล์</Text>
                <Text style={[styles.menuDescription, { color: colors.icon }]}>
                  ดูข้อมูลส่วนตัวและออกจากระบบ
                </Text>
              </View>
            </View>
          </View>

          {/* Instructions */}
          <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? colors.gray[800] : 'white' }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              คำแนะนำ
            </Text>
            <Text style={[styles.instructionText, { color: colors.icon }]}>
              • Phase 0: ทีมงาน IT สแกน Bin Mapping ก่อนเริ่มนับ{'\n'}
              • Phase 1: ทีมงานนับ Stock ตาม Location ที่ได้รับมอบหมาย{'\n'}
              • Phase 1.5: Admin ดู Dashboard และตรวจสอบความคืบหน้า
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  userName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  menuIcon: {
    fontSize: 32,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 22,
  },
});

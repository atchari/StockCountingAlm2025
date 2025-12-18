import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ScanBinScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>สแกน Bin Mapping</Text>
        <Text style={styles.headerSubtitle}>Phase 0: IT Team</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? colors.gray[800] : 'white' }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            🚧 กำลังพัฒนา
          </Text>
          <Text style={[styles.cardText, { color: colors.icon }]}>
            ฟีเจอร์นี้อยู่ระหว่างการพัฒนา{'\n'}
            ใช้สำหรับ IT Team สแกน QR Code บน Bin เพื่อบันทึก Location
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? colors.gray[800] : 'white' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>ขั้นตอนการทำงาน</Text>
          <Text style={[styles.stepText, { color: colors.icon }]}>
            1. สแกน QR Code บน Bin{'\n'}
            2. ระบบแสดงข้อมูล Bin{'\n'}
            3. เลือก Location ที่ต้องการ Mapping{'\n'}
            4. บันทึกข้อมูล
          </Text>
        </View>
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
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
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
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 14,
    lineHeight: 24,
  },
});

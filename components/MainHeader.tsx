import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  title: string;
};

export default function MainHeader({ title }: Props) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      {/* 左上：マイページへ */}
      <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/profile')}>
        <Ionicons name="person-circle-outline" size={32} color="#fff" />
      </TouchableOpacity>

      {/* 中央：タイトル */}
      <Text style={styles.headerTitle}>{title}</Text>
      
      {/* 右上：メッセージ一覧へ */}
      <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/messages')}>
        <Ionicons name="chatbubbles-outline" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    height: 100, 
    paddingTop: 50, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#111', 
    marginBottom: 10,
    backgroundColor: '#000', // 背景色を明示（スクロール時に透けないように）
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#fff', 
    letterSpacing: 2 
  },
  iconButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
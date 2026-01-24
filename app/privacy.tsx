import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>プライバシーポリシー</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.text}>
          本アプリ（Evolsence）は、ユーザーのプライバシーを尊重します。{"\n\n"}
          
          <Text style={styles.heading}>1. 収集する情報{"\n"}</Text>
          - アカウント情報（メールアドレス、ユーザー名）{"\n"}
          - プロフィール情報（職歴、学歴、自己紹介、アイコン画像）{"\n"}
          - 利用データ（読書ログ、診断結果）{"\n\n"}
          
          <Text style={styles.heading}>2. 利用目的{"\n"}</Text>
          - サービスの提供および本人確認のため{"\n"}
          - ビジネスOS/スキルの分析・可視化のため{"\n"}
          - ユーザー間のマッチング機能の提供のため{"\n\n"}
          
          <Text style={styles.heading}>3. 第三者への提供{"\n"}</Text>
          法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。ただし、書籍情報の分析のためにGoogle Gemini APIを使用します。{"\n\n"}
          
          <Text style={styles.heading}>4. アカウントの削除{"\n"}</Text>
          ユーザーは、マイページ下部よりいつでもアカウントを削除し、サーバー上の全データを消去することができます。{"\n\n"}
          
          <Text style={styles.heading}>5. お問い合わせ{"\n"}</Text>
          本ポリシーに関するお問い合わせは、サポート窓口までご連絡ください。
        </Text>
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { 
    height: 100, paddingTop: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#111'
  },
  backButton: { width: 40, alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  content: { padding: 20 },
  text: { color: '#ccc', fontSize: 14, lineHeight: 24 },
  heading: { fontWeight: 'bold', color: '#fff', fontSize: 16 }
});
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DeletionScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
<TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton}>
  <Ionicons name="arrow-back" size={24} color="#fff" />
</TouchableOpacity>
        <Text style={styles.headerTitle}>データ削除規定</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.text}>
          Evolsenceにおけるアカウントおよびデータの削除手順について説明します。{"\n\n"}
          
          <Text style={styles.heading}>1. 削除手順{"\n"}</Text>
          ユーザーは、アプリ内の以下の手順でいつでもアカウントを削除できます。{"\n"}
          1. アプリにログインする{"\n"}
          2. ダッシュボード左上のアイコンから「マイページ」へ移動する{"\n"}
          3. 画面最下部の「アカウントを削除」ボタンをタップする{"\n"}
          4. 確認ダイアログで「削除する」を選択する{"\n\n"}
          
          <Text style={styles.heading}>2. 削除されるデータ{"\n"}</Text>
          アカウント削除が実行されると、以下のデータが即座に、かつ永久に削除されます。{"\n"}
          - ユーザープロフィール（名前、写真、経歴等）{"\n"}
          - 読書ログおよびメモ{"\n"}
          - ビジネスOS/スキルの診断ステータス{"\n"}
          - フォロー情報およびメッセージ履歴{"\n\n"}
          
          <Text style={styles.heading}>3. データの復元{"\n"}</Text>
          削除されたデータを復元することはできません。再度利用する場合は、新規アカウントとして登録が必要です。{"\n\n"}
          
          <Text style={styles.heading}>4. お問い合わせ{"\n"}</Text>
          ログインできない場合や削除に関する問題がある場合は、サポートまでご連絡ください。
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
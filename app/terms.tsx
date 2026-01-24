import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>利用規約</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.text}>
          この利用規約（以下「本規約」）は、Evolsence（以下「本サービス」）の利用条件を定めるものです。{"\n\n"}
          
          <Text style={styles.heading}>1. アカウント登録{"\n"}</Text>
          本サービスは完全招待制です。虚偽の情報での登録は禁止します。{"\n\n"}
          
          <Text style={styles.heading}>2. 禁止事項{"\n"}</Text>
          - 他のユーザーへの誹謗中傷、ハラスメント行為{"\n"}
          - 公序良俗に反する投稿{"\n"}
          - サーバーへの不正アクセスや運営の妨害{"\n\n"}
          
          <Text style={styles.heading}>3. 免責事項{"\n"}</Text>
          本サービスの利用により生じた損害について、運営者は一切の責任を負いません。また、30日間利用がない場合、アカウントが検索結果から非表示になる場合があります。{"\n\n"}
          
          <Text style={styles.heading}>4. 規約の変更{"\n"}</Text>
          運営者は、必要と判断した場合には、本規約を変更することができるものとします。
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
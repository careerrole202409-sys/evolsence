import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    // Webではキーボード操作不要なのでスキップ
    if (Platform.OS !== 'web') {
      Keyboard.dismiss();
    }
    
    if (!email || !password || !inviteCode) {
      Alert.alert('エラー', '全ての項目を入力してください');
      return;
    }
    if (inviteCode !== 'EVOLSENCE2026') {
      Alert.alert('エラー', '招待コードが無効です');
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('登録失敗', error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
            id: data.user.id, 
            username: 'Unknown User',
            invite_code: inviteCode,
            updated_at: new Date(),
        });
      if (profileError) console.log('Profile Error:', profileError);
      
      setLoading(false);
      router.replace('/(tabs)/status');
    }
  };

  // 画面の中身（共通部分）
  const content = (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <Text style={styles.title}>Evolsence</Text>
        <Text style={styles.subtitle}>INVITATION ONLY</Text>

        <View style={styles.form}>
          <Text style={styles.label}>INVITE CODE</Text>
          <TextInput
            style={styles.input}
            placeholder="招待コードを入力"
            placeholderTextColor="#666"
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="none"
          />

          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="パスワード（6文字以上）"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>ENTER SYSTEM</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // ★修正ポイント：Webならそのまま、スマホならタップで閉じる機能をつける
  if (Platform.OS === 'web') {
    return content;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {content}
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 50,
    letterSpacing: 2,
  },
  form: {
    gap: 15,
  },
  label: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 16,
    // ★Webでのフォーカス枠を消すためのスタイル
    ...Platform.select({
      web: { outlineStyle: 'none' } as any
    }),
  },
  button: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
});
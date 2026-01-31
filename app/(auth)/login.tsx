import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async () => {
    if (Platform.OS !== 'web') {
      Keyboard.dismiss();
    }
    
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    setLoading(true);

    try {
      // 1. まずログインを試行
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (!loginError && loginData.session) {
        // ログイン成功時、プロフィールを更新
        await supabase.from('profiles').upsert({
          id: loginData.user.id,
          email: email,
          updated_at: new Date(),
        });
        router.replace('/(tabs)/status');
        return;
      }

      // 2. ユーザーが存在しない等のエラーであれば新規登録を試行
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (signupError) {
        throw new Error(loginError?.message || signupError.message);
      }

      if (signupData.user) {
        // 新規登録成功時、プロフィールを作成
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ 
              id: signupData.user.id, 
              username: '新規ユーザー',
              email: email,
              updated_at: new Date(),
          });
        
        if (profileError) console.log('Profile Error:', profileError);
        router.replace('/(tabs)/status');
      }

    } catch (error: any) {
      Alert.alert('エラー', '認証に失敗しました。パスワードが間違っているか、入力内容を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <Text style={styles.title}>Evolsence</Text>
        <Text style={styles.subtitle}>エボルセンス</Text>
        
        <View style={styles.form}>
          <Text style={styles.label}>メールアドレス</Text>
          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>パスワード</Text>
          <TextInput
            style={styles.input}
            placeholder="6文字以上のパスワード"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>新規登録 / ログイン</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  if (Platform.OS === 'web') return content;

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
    color: '#888',
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
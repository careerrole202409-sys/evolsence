import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // 入力状態
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  // ステップ管理 ('auth': 認証 / 'name': 名前登録)
  const [step, setStep] = useState<'auth' | 'name'>('auth');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // ■ 認証処理（ログイン or 新規登録）
  const handleAuth = async () => {
    if (Platform.OS !== 'web') Keyboard.dismiss();
    
    // 入力チェック
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }
    // パスワード文字数チェック（Supabase仕様）
    if (password.length < 6) {
      Alert.alert('エラー', 'パスワードは6文字以上で入力してください');
      return;
    }

    setLoading(true);

    try {
      // 1. まず「ログイン」を試行
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // --- ログイン成功時の処理 ---
      if (!loginError && loginData.session) {
        // 名前が設定済みか確認
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', loginData.user.id)
          .single();

        // 名前がちゃんとある人 -> そのままホームへ
        if (profile?.username && profile.username !== '新規ユーザー' && profile.username !== 'Unknown User') {
          router.replace('/(tabs)/status');
          return;
        }

        // 名前がない/初期値の人 -> 名前入力ステップへ
        setCurrentUserId(loginData.user.id);
        setStep('name');
        setLoading(false);
        return;
      }

      // --- 2. ログイン失敗なら「新規登録」を試行 ---
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signupError) {
        throw new Error(signupError.message);
      }

      if (signupData.user) {
        // 新規登録成功：まずは仮のプロフィールを作る
        await supabase.from('profiles').upsert({ 
          id: signupData.user.id, 
          email: email,
          username: '新規ユーザー', // 仮の名前
          updated_at: new Date(),
        });
        
        // 名前入力ステップへ
        setCurrentUserId(signupData.user.id);
        setStep('name');
        setLoading(false); // 名前入力待ちにするのでローディング解除
      }

    } catch (error: any) {
      // シンプルなエラー表示
      Alert.alert('エラー', '認証に失敗しました。入力内容を確認してください。');
      setLoading(false);
    }
  };

  // ■ 名前保存処理
  const handleSaveName = async () => {
    if (!username.trim()) {
      Alert.alert('エラー', '名前を入力してください');
      return;
    }
    if (!currentUserId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          username: username,
          updated_at: new Date()
        })
        .eq('id', currentUserId);

      if (error) throw error;

      // 完了したらホームへ
      router.replace('/(tabs)/status');

    } catch (error: any) {
      Alert.alert('エラー', '設定に失敗しました。もう一度お試しください。');
      setLoading(false);
    }
  };

  // 画面コンテンツ
  const content = (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <Text style={styles.title}>Evolsence</Text>
        <Text style={styles.subtitle}>エボルセンス</Text>
        
        {step === 'auth' ? (
          // 【ステップ1】認証フォーム
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

            <View style={styles.labelRow}>
              <Text style={styles.label}>パスワード</Text>
              <Text style={styles.subLabel}>（6文字以上）</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="パスワードを入力"
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
        ) : (
          // 【ステップ2】名前入力フォーム
          <View style={styles.form}>
            <Text style={styles.instruction}>
              はじめまして。{"\n"}あなたのお名前を教えてください。
            </Text>
            
            <Text style={styles.label}>ユーザー名</Text>
            <TextInput
              style={styles.input}
              placeholder="例: 田中 太郎"
              placeholderTextColor="#666"
              value={username}
              onChangeText={setUsername}
              autoFocus={true}
            />

            <TouchableOpacity 
              style={styles.button} 
              onPress={handleSaveName}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>はじめる</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // Web対応ラッパー
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
  instruction: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  label: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subLabel: {
    color: '#666',
    fontSize: 11,
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
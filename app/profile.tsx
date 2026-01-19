import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // 画像選択用
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false); // 画像アップロード中のくるくる用
  
  // プロフィール情報
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState('');
  const [career, setCareer] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(''); 

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setUsername(data.username || '');
        setBio(data.bio || '');
        setEducation(data.education || '');
        setCareer(data.career || '');
        setAvatarUrl(data.avatar_url || '');
      }
    };
    fetchProfile();
  }, []);

  // ■ 画像選択処理（これが消えていました！）
  const pickImage = async () => {
    // 1. カメラロールの許可を求める＆開く
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // 画像のみ
      allowsEditing: true, // トリミング許可
      aspect: [1, 1], // 正方形
      quality: 0.5, // 容量節約のため画質を落とす
    });

    if (!result.canceled) {
      await uploadImage(result.assets[0].uri);
    }
  };

  // ■ 画像アップロード処理（修正版：FormDataを使用）
  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. ファイルの拡張子を取得
      const ext = uri.split('.').pop()?.toLowerCase() ?? 'png';
      const fileName = `${user.id}/${Date.now()}.${ext}`;

      // 2. FormDataを作成（これが一番確実！）
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        name: fileName,
        type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      } as any);

      // 3. Supabase Storageにアップロード
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, formData, {
          contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 4. 公開URLを取得
      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      // キャッシュ対策（?t=時間）をつけてURLを保存
      setAvatarUrl(publicData.publicUrl + `?t=${Date.now()}`);

    } catch (error: any) {
      Alert.alert("エラー", "画像のアップロードに失敗しました: " + error.message);
    } finally {
      setUploading(false);
    }
  };

// 保存処理
  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updates = {
      id: user.id,
      username,
      bio,
      education,
      career,
      avatar_url: avatarUrl,
      updated_at: new Date(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);

    if (error) {
      Alert.alert('エラー', error.message);
    } else {
      // ★修正箇所：router.back() を削除しました
      Alert.alert('完了', 'プロフィールを更新しました');
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    Alert.alert("ログアウト", "本当にログアウトしますか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "ログアウト", style: "destructive", onPress: async () => { await supabase.auth.signOut(); router.replace('/(auth)/login'); } }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>マイページ</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          
          {/* アバター画像エリア */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
              {uploading ? (
                <ActivityIndicator size="small" color="#00ffff" />
              ) : avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={50} color="#333" />
              )}
              {/* カメラアイコンを重ねる */}
              <View style={styles.cameraIconBadge}>
                <Ionicons name="camera" size={16} color="#000" />
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>写真をタップして変更</Text>
          </View>

          {/* 入力フォーム */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>名前</Text>
            <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="あなたの名前" placeholderTextColor="#666" />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>自己紹介</Text>
            <TextInput style={[styles.input, styles.textArea]} value={bio} onChangeText={setBio} placeholder="専門分野や目標など" placeholderTextColor="#666" multiline />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>学歴</Text>
            <TextInput style={styles.input} value={education} onChangeText={setEducation} placeholder="大学・学部など" placeholderTextColor="#666" />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>職歴</Text>
            <TextInput style={[styles.input, styles.textArea]} value={career} onChangeText={setCareer} placeholder="会社名・役職・経験など" placeholderTextColor="#666" multiline />
          </View>

          {/* 保存ボタン */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
            <Text style={styles.saveButtonText}>{loading ? '保存中...' : 'プロフィールを保存'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <Text style={styles.logoutButtonText}>ログアウト</Text>
          </TouchableOpacity>
          
          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  content: { padding: 20 },
  
  avatarContainer: { alignItems: 'center', marginBottom: 30 },
  avatarWrapper: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333', position: 'relative' },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  cameraIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#00ffff', width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000' },
  changePhotoText: { color: '#666', fontSize: 12, marginTop: 10 },

  formGroup: { marginBottom: 20 },
  label: { color: '#ccc', fontSize: 12, marginBottom: 8, fontWeight: 'bold' },
  input: { backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 8, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#333' },
  textArea: { height: 80, textAlignVertical: 'top' },

  saveButton: { backgroundColor: '#00ffff', padding: 16, borderRadius: 30, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  saveButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },

  logoutButton: { padding: 16, alignItems: 'center' },
  logoutButtonText: { color: '#ff4444', fontWeight: 'bold', fontSize: 14 },
});
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

type ChatRoom = {
  partnerId: string;
  partnerName: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastDate: string;
};

export default function MessagesListScreen() {
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChatList = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. 自分に関係する全メッセージを取得（最新順）
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!messages) {
        setLoading(false);
        return;
      }

      // 2. 「相手」ごとにグループ化して最新メッセージを抽出
      const partnerMap = new Map<string, any>();
      
      messages.forEach(msg => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        // まだリストになければ追加（＝それがその人との最新メッセージ）
        if (!partnerMap.has(partnerId)) {
          partnerMap.set(partnerId, {
            partnerId,
            lastMessage: msg.content,
            lastDate: msg.created_at
          });
        }
      });

      // 3. 相手のプロフィール情報を取得
      const partnerIds = Array.from(partnerMap.keys());
      if (partnerIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', partnerIds);

      // 4. データを結合して表示用リスト作成
      const chatList = partnerIds.map(id => {
        const profile = profiles?.find(p => p.id === id);
        const msgInfo = partnerMap.get(id);
        return {
          partnerId: id,
          partnerName: profile?.username || 'Unknown',
          avatarUrl: profile?.avatar_url,
          lastMessage: msgInfo.lastMessage,
          lastDate: msgInfo.lastDate
        };
      });

      setRooms(chatList);
      setLoading(false);
    };

    fetchChatList();
  }, []);

  const renderItem = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity style={styles.roomItem} onPress={() => router.push(`/chat/${item.partnerId}`)}>
      <View style={styles.avatar}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Ionicons name="person" size={24} color="#333" />
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 15 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.username}>{item.partnerName}</Text>
          <Text style={styles.date}>{new Date(item.lastDate).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.message} numberOfLines={1}>{item.lastMessage}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>メッセージ</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00ffff" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={rooms}
          renderItem={renderItem}
          keyExtractor={item => item.partnerId}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>まだメッセージはありません</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { height: 100, paddingTop: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#111' },
  backButton: { width: 40, alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  
  roomItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333', overflow: 'hidden' },
  username: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  date: { color: '#666', fontSize: 12 },
  message: { color: '#aaa', fontSize: 14, marginTop: 4 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 50 },
});
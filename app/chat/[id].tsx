import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams(); // 相手のID
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [myId, setMyId] = useState('');
  const [partnerName, setPartnerName] = useState('Chat');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setMyId(user.id);

      // 相手の名前取得
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', id).single();
      if (profile) setPartnerName(profile.username);

      fetchMessages(user.id);

      // リアルタイム受信の設定（簡易版：ポーリングでも可だが、subscribeを使う）
      const channel = supabase
        .channel('chat_room')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
          fetchMessages(user.id);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };
    init();
  }, [id]);

  const fetchMessages = async (userId: string) => {
    // 自分と相手の間のメッセージを全取得（時系列順）
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
    // 最新メッセージまでスクロール
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText(''); // 先に消す

    const { error } = await supabase.from('messages').insert({
      sender_id: myId,
      receiver_id: id,
      content: text
    });

    if (error) console.log(error);
    // 送信後も再取得
    fetchMessages(myId);
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === myId;
    return (
      <View style={[styles.messageRow, isMe ? styles.myRow : styles.partnerRow]}>
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.partnerBubble]}>
          <Text style={[styles.messageText, isMe ? styles.myText : styles.partnerText]}>{item.content}</Text>
          <Text style={styles.timeText}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{partnerName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={20}>
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="メッセージを入力..."
            placeholderTextColor="#666"
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Ionicons name="send" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { height: 100, paddingTop: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#111' },
  backButton: { width: 40, alignItems: 'flex-start' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  
  listContent: { padding: 15, paddingBottom: 20 },
  messageRow: { marginBottom: 15, flexDirection: 'row' },
  myRow: { justifyContent: 'flex-end' },
  partnerRow: { justifyContent: 'flex-start' },
  
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  myBubble: { backgroundColor: '#00ffff', borderBottomRightRadius: 2 },
  partnerBubble: { backgroundColor: '#222', borderBottomLeftRadius: 2 },
  
  messageText: { fontSize: 15, lineHeight: 22 },
  myText: { color: '#000', fontWeight: 'bold' },
  partnerText: { color: '#fff' },
  
  timeText: { fontSize: 10, color: 'rgba(0,0,0,0.5)', marginTop: 4, alignSelf: 'flex-end' },
  
  inputArea: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#111', backgroundColor: '#000', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, fontSize: 16, marginRight: 10 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00ffff', alignItems: 'center', justifyContent: 'center' },
});
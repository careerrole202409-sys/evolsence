import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import MainHeader from '../../components/MainHeader'; // ★共通ヘッダーを読み込み
import { analyzeBook } from '../../lib/gemini';
import { supabase } from '../../lib/supabase';

type BookLog = {
  id: string;
  book_title: string;
  author?: string;
  summary?: string;
  gained_points: any;
  created_at: string;
  tags?: string[];
};

const LABEL_MAP: {[key: string]: string} = {
  os_strategy: "戦略", os_execution: "実行", os_logic: "論理", os_humanity: "心理", os_liberal_arts: "教養",
  skill_sales: "営業", skill_marketing: "マーケ", skill_technology: "IT", skill_finance: "財務", skill_management: "管理",
};

export default function LibraryScreen() {
  const [books, setBooks] = useState<BookLog[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookLog | null>(null);
  
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [inputTitle, setInputTitle] = useState('');
  const [inputAuthor, setInputAuthor] = useState('');
  const [loading, setLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editTags, setEditTags] = useState('');

  const fetchBooks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('read_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setBooks(data);
  };

  useEffect(() => { fetchBooks(); }, []);

  const handleAddBook = async () => {
    if (!inputTitle.trim()) return;
    setLoading(true);
    Keyboard.dismiss();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ユーザーが見つかりません");

      const aiResult = await analyzeBook(inputTitle, inputAuthor);

      const { error: logError } = await supabase.from('read_logs').insert({
        user_id: user.id,
        book_title: inputTitle,
        author: aiResult.author,
        summary: aiResult.summary,
        tags: aiResult.tags,
        gained_points: aiResult.points,
      });
      if (logError) throw logError;

      await updateStats(user.id, aiResult.points, 'add');

      Alert.alert("分析完了", `「${inputTitle}」を追加しました！`);
      setInputTitle('');
      setInputAuthor('');
      setAddModalVisible(false);
      fetchBooks();

    } catch (error: any) {
      Alert.alert("エラー", "分析に失敗しました: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook) return;

    Alert.alert(
      "本の削除",
      "この本を削除しますか？\n獲得したステータスもマイナスされます。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除する",
          style: "destructive",
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              await updateStats(user.id, selectedBook.gained_points, 'subtract');

              const { error } = await supabase.from('read_logs').delete().eq('id', selectedBook.id);
              if (error) throw error;

              setSelectedBook(null);
              fetchBooks();
              Alert.alert("削除完了", "ステータスを元に戻しました。");
            } catch (error: any) {
              Alert.alert("エラー", "削除に失敗しました");
            }
          }
        }
      ]
    );
  };

  const handleUpdateBook = async () => {
    if (!selectedBook) return;
    
    const tagsArray = editTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    try {
      const { error } = await supabase
        .from('read_logs')
        .update({
          book_title: editTitle,
          author: editAuthor,
          summary: editSummary,
          tags: tagsArray
        })
        .eq('id', selectedBook.id);

      if (error) throw error;

      const updatedBook = { ...selectedBook, book_title: editTitle, author: editAuthor, summary: editSummary, tags: tagsArray };
      setSelectedBook(updatedBook);
      setIsEditing(false);
      fetchBooks();
      Alert.alert("更新完了", "情報を修正しました。");

    } catch (error) {
      Alert.alert("エラー", "更新に失敗しました");
    }
  };

  const startEditing = () => {
    if (!selectedBook) return;
    setEditTitle(selectedBook.book_title);
    setEditAuthor(selectedBook.author || '');
    setEditSummary(selectedBook.summary || '');
    setEditTags(selectedBook.tags ? selectedBook.tags.join(', ') : '');
    setIsEditing(true);
  };

  const updateStats = async (userId: string, points: any, mode: 'add' | 'subtract') => {
    const { data: currentStats } = await supabase.from('latest_stats').select('*').eq('user_id', userId).single();
    const stats = currentStats || {}; 
    const newStats: any = { ...stats };

    Object.keys(points).forEach(key => {
      const val = points[key] || 0;
      const currentVal = stats[key] || 0;
      newStats[key] = mode === 'add' ? currentVal + val : Math.max(0, currentVal - val);
    });

    const { error: latestError } = await supabase
      .from('latest_stats')
      .upsert({ user_id: userId, ...newStats, updated_at: new Date() });
    
    if (latestError) throw latestError;

    const historyData = {
      user_id: userId,
      recorded_at: new Date(),
      total_os_strategy: newStats.os_strategy,
      total_os_execution: newStats.os_execution,
      total_os_logic: newStats.os_logic,
      total_os_humanity: newStats.os_humanity,
      total_os_liberal_arts: newStats.os_liberal_arts,
      total_skill_sales: newStats.skill_sales,
      total_skill_marketing: newStats.skill_marketing,
      total_skill_technology: newStats.skill_technology,
      total_skill_finance: newStats.skill_finance,
      total_skill_management: newStats.skill_management,
    };

    const { error: historyError } = await supabase
      .from('stats_history')
      .insert(historyData);

    if (historyError) {
      console.log("History Error:", historyError);
    }
  };

  const renderPoints = (points: any) => {
    if (!points) return null;
    return Object.entries(points).map(([key, val]) => {
      if (Number(val) === 0) return null;
      const label = LABEL_MAP[key] || key;
      const isOs = key.startsWith('os_');
      const color = isOs ? '#00ffff' : '#ff00ff'; 
      return (
        <View key={key} style={[styles.badge, { borderColor: color }]}>
          <Text style={[styles.badgeText, { color: color }]}>{label} +{String(val)}</Text>
        </View>
      );
    });
  };

  const renderItem = ({ item }: { item: BookLog }) => (
    <TouchableOpacity style={styles.card} onPress={() => { setSelectedBook(item); setIsEditing(false); }}>
      <View style={styles.cardHeader}>
        <Ionicons name="book-outline" size={24} color="#fff" />
        <View style={{ marginLeft: 15, flex: 1 }}>
          <Text style={styles.bookTitle} numberOfLines={1}>{item.book_title}</Text>
          <Text style={styles.bookAuthor}>{item.author || "著者不明"}</Text>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* ★ヘッダーを共通コンポーネントに置き換え */}
      <MainHeader title="本棚" />

      <FlatList
        data={books}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No books yet.</Text>}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
          <Text style={styles.addButtonText}>＋ 本を追加</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isAddModalVisible} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.inputContainer}>
              <Text style={styles.modalTitle}>本を分析</Text>
              <Text style={styles.modalSubTitle}>AIが本を分析し、能力値を抽出します。</Text>
              <Text style={styles.label}>タイトル</Text>
              <TextInput style={styles.input} placeholder="例: イシューからはじめよ" placeholderTextColor="#666" value={inputTitle} onChangeText={setInputTitle} autoFocus />
              <Text style={styles.label}>著者名（任意）</Text>
              <TextInput style={styles.input} placeholder="例: 安宅和人" placeholderTextColor="#666" value={inputAuthor} onChangeText={setInputAuthor} />
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setAddModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.analyzeButton, loading && { opacity: 0.5 }]} onPress={handleAddBook} disabled={loading}>
                  {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.analyzeButtonText}>分析＆追加</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={!!selectedBook} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedBook && (
              <ScrollView>
                <View style={styles.modalHeader}>
                  {isEditing ? (
                    <Text style={styles.detailTitle}>情報を修正</Text>
                  ) : (
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailTitle}>{selectedBook.book_title}</Text>
                      <Text style={styles.detailAuthor}>{selectedBook.author}</Text>
                    </View>
                  )}

                  <View style={styles.headerIcons}>
                    {isEditing ? (
                      <>
                        <TouchableOpacity onPress={() => setIsEditing(false)} style={{ marginRight: 15 }}>
                           <Text style={{ color: '#ccc', fontWeight: 'bold' }}>取消</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleUpdateBook}>
                           <Text style={{ color: '#00ffff', fontWeight: 'bold' }}>保存</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity onPress={startEditing} style={{ marginRight: 15 }}>
                          <Ionicons name="create-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDeleteBook} style={{ marginRight: 15 }}>
                          <Ionicons name="trash-outline" size={24} color="#ff4444" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSelectedBook(null)}>
                          <Ionicons name="close-circle" size={30} color="#666" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>

                <View style={styles.divider} />

                {isEditing ? (
                  <View style={{ gap: 15 }}>
                    <View>
                      <Text style={styles.label}>タイトル</Text>
                      <TextInput style={styles.editInput} value={editTitle} onChangeText={setEditTitle} />
                    </View>
                    <View>
                      <Text style={styles.label}>著者</Text>
                      <TextInput style={styles.editInput} value={editAuthor} onChangeText={setEditAuthor} />
                    </View>
                    <View>
                      <Text style={styles.label}>タグ（カンマ区切り）</Text>
                      <TextInput 
                        style={styles.editInput} 
                        value={editTags} 
                        onChangeText={setEditTags} 
                        placeholder="例: 心理学, マーケティング"
                        placeholderTextColor="#666"
                      />
                    </View>
                    <View>
                      <Text style={styles.label}>あらすじ</Text>
                      <TextInput 
                        style={[styles.editInput, { height: 100 }]} 
                        value={editSummary} 
                        onChangeText={setEditSummary} 
                        multiline 
                      />
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={styles.sectionTitle}>獲得ステータス</Text>
                    <View style={styles.badgesContainer}>
                      {renderPoints(selectedBook.gained_points)}
                    </View>
                    <Text style={styles.sectionTitle}>あらすじ</Text>
                    <Text style={styles.summaryText}>{selectedBook.summary || 'No summary'}</Text>
                    {selectedBook.tags && (
                      <View style={styles.tagsContainer}>
                        {selectedBook.tags.map((tag, index) => (
                          <Text key={index} style={styles.tag}>#{tag}</Text>
                        ))}
                      </View>
                    )}
                  </>
                )}
                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  // header系のスタイルは不要なので削除済み
  
  card: { backgroundColor: '#111', borderRadius: 12, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  bookTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', flex: 1 },
  bookAuthor: { color: '#888', fontSize: 14, marginTop: 2 },
  date: { color: '#666', fontSize: 12, marginTop: 4 },
  
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: 'rgba(0,0,0,0.9)' },
  addButton: { backgroundColor: '#fff', padding: 16, borderRadius: 30, alignItems: 'center' },
  addButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  inputContainer: { backgroundColor: '#1a1a1a', padding: 30, borderRadius: 20, width: '100%' },
  
  label: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginBottom: 5, marginLeft: 5 },
  input: { backgroundColor: '#000', color: '#fff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#333', fontSize: 16, marginBottom: 15 },
  editInput: { backgroundColor: '#333', color: '#fff', padding: 15, borderRadius: 10, fontSize: 16 },

  modalContent: { backgroundColor: '#1a1a1a', height: '80%', marginTop: 'auto', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  
  detailTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 5, flex: 1 },
  detailAuthor: { fontSize: 16, color: '#888' },
  
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 10 },
  modalSubTitle: { color: '#888', textAlign: 'center', marginBottom: 20, fontSize: 12 },

  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelButton: { flex: 1, backgroundColor: '#333', padding: 15, borderRadius: 10, alignItems: 'center' },
  cancelButtonText: { color: '#ccc', fontWeight: 'bold' },
  analyzeButton: { flex: 2, backgroundColor: '#00ffff', padding: 15, borderRadius: 10, alignItems: 'center' },
  analyzeButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },

  divider: { height: 1, backgroundColor: '#333', marginBottom: 20 },
  sectionTitle: { color: '#888', fontSize: 12, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  badgesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25 },
  badge: { borderWidth: 1, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  summaryText: { color: '#ccc', fontSize: 16, lineHeight: 24, marginBottom: 25 },
  tagsContainer: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  tag: { color: '#888', fontSize: 14, backgroundColor: '#111', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5, overflow: 'hidden' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 50 },
});
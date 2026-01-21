import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import MainHeader from '../../components/MainHeader';
import { useProcessing } from '../../contexts/ProcessingContext';
import { supabase } from '../../lib/supabase';

type BookLog = {
  id: string;
  book_title: string;
  author?: string;
  summary?: string;
  gained_points: any;
  created_at: string;
  tags?: string[];
  memo?: string;
};

const LABEL_MAP: {[key: string]: string} = {
  os_strategy: "戦略", os_execution: "実行", os_logic: "論理", os_humanity: "心理", os_liberal_arts: "教養",
  skill_sales: "営業", skill_marketing: "マーケ", skill_technology: "IT", skill_finance: "財務", skill_management: "管理",
};

export default function LibraryScreen() {
  const { addBooksToQueue } = useProcessing();
  const [books, setBooks] = useState<BookLog[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookLog | null>(null);
  
  // 追加モーダル用
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single');
  
  // Single入力
  const [inputTitle, setInputTitle] = useState('');
  const [inputAuthor, setInputAuthor] = useState('');
  
  // Bulk入力
  const [bulkInputs, setBulkInputs] = useState([{ title: '', author: '' }, { title: '', author: '' }, { title: '', author: '' }]);

  // 編集用
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editMemo, setEditMemo] = useState('');

  const fetchBooks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('read_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setBooks(data);
  };

  useFocusEffect(useCallback(() => { fetchBooks(); }, []));

  // 追加実行
  const handleExecuteAdd = () => {
    const targets: { title: string; author: string }[] = [];
    
    if (inputMode === 'single') {
      if (inputTitle.trim()) {
        targets.push({ title: inputTitle, author: inputAuthor });
      }
    } else {
      bulkInputs.forEach(item => {
        if (item.title.trim()) {
          targets.push({ title: item.title, author: item.author });
        }
      });
    }

    if (targets.length === 0) return;

    addBooksToQueue(targets);

    // リセット
    setAddModalVisible(false);
    setInputTitle('');
    setInputAuthor('');
    setBulkInputs([{ title: '', author: '' }, { title: '', author: '' }, { title: '', author: '' }]);
    
    if (Platform.OS !== 'web') {
      Keyboard.dismiss();
    }
  };

  const updateBulkInput = (index: number, field: 'title' | 'author', value: string) => {
    const newInputs = [...bulkInputs];
    newInputs[index][field] = value;
    setBulkInputs(newInputs);
  };

  const addBulkRow = () => {
    setBulkInputs([...bulkInputs, { title: '', author: '' }]);
  };

  // 削除処理
  const handleDeleteBook = async () => {
    if (!selectedBook) return;
    
    const confirmDelete = async () => {
      await supabase.from('read_logs').delete().eq('id', selectedBook.id);
      setSelectedBook(null);
      fetchBooks();
    };
    
    if (Platform.OS === 'web') {
      if (window.confirm("本当に削除しますか？")) confirmDelete();
    } else {
      Alert.alert("削除", "本当に削除しますか？", [
        { text: "キャンセル", style: "cancel" },
        { text: "削除", style: "destructive", onPress: confirmDelete }
      ]);
    }
  };

  // 更新処理
  const handleUpdateBook = async () => {
    if (!selectedBook) return;
    const tagsArray = editTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    
    const { error } = await supabase.from('read_logs').update({
      book_title: editTitle,
      author: editAuthor,
      summary: editSummary,
      tags: tagsArray,
      memo: editMemo,
    }).eq('id', selectedBook.id);

    if (!error) {
      setSelectedBook({ 
        ...selectedBook, 
        book_title: editTitle, 
        author: editAuthor, 
        summary: editSummary, 
        tags: tagsArray, 
        memo: editMemo 
      });
      setIsEditing(false);
      fetchBooks();
    }
  };

  const startEditing = () => {
    if (!selectedBook) return;
    setEditTitle(selectedBook.book_title);
    setEditAuthor(selectedBook.author || '');
    setEditSummary(selectedBook.summary || '');
    setEditTags(selectedBook.tags ? selectedBook.tags.join(', ') : '');
    setEditMemo(selectedBook.memo || '');
    setIsEditing(true);
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

  // ★修正ポイント：Webとアプリで動作を変えるラッパー
  const Wrapper = Platform.OS === 'web' ? React.Fragment : TouchableWithoutFeedback;
  const wrapperProps = Platform.OS === 'web' ? {} : { onPress: Keyboard.dismiss };

  return (
    <View style={styles.container}>
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

      {/* 追加モーダル */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent={true}>
        <Wrapper {...wrapperProps}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.inputContainer}>
              <Text style={styles.modalTitle}>本を分析</Text>
              
              <View style={styles.modeTabs}>
                <TouchableOpacity style={[styles.modeTab, inputMode === 'single' && styles.activeModeTab]} onPress={() => setInputMode('single')}>
                  <Text style={[styles.modeText, inputMode === 'single' && styles.activeModeText]}>1冊追加</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modeTab, inputMode === 'bulk' && styles.activeModeTab]} onPress={() => setInputMode('bulk')}>
                  <Text style={[styles.modeText, inputMode === 'bulk' && styles.activeModeText]}>まとめて追加</Text>
                </TouchableOpacity>
              </View>

              {inputMode === 'single' ? (
                <View>
                  <Text style={styles.label}>タイトル</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="例: イシューからはじめよ" 
                    placeholderTextColor="#666" 
                    value={inputTitle} 
                    onChangeText={setInputTitle} 
                    autoFocus 
                  />
                  <Text style={styles.label}>著者名（任意）</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="例: 安宅和人" 
                    placeholderTextColor="#666" 
                    value={inputAuthor} 
                    onChangeText={setInputAuthor} 
                  />
                </View>
              ) : (
                <View style={{ maxHeight: 300 }}>
                  <ScrollView nestedScrollEnabled>
                    {bulkInputs.map((item, index) => (
                      <View key={index} style={styles.bulkRow}>
                        <TextInput 
                          style={[styles.input, { flex: 1, marginRight: 5 }]} 
                          placeholder="タイトル" 
                          placeholderTextColor="#666" 
                          value={item.title} 
                          onChangeText={(text) => updateBulkInput(index, 'title', text)} 
                        />
                        <TextInput 
                          style={[styles.input, { flex: 0.6 }]} 
                          placeholder="著者" 
                          placeholderTextColor="#666" 
                          value={item.author} 
                          onChangeText={(text) => updateBulkInput(index, 'author', text)} 
                        />
                      </View>
                    ))}
                    <TouchableOpacity onPress={addBulkRow} style={styles.addMoreButton}>
                      <Text style={styles.addMoreText}>+ 枠を追加</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setAddModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.analyzeButton} onPress={handleExecuteAdd}>
                  <Text style={styles.analyzeButtonText}>分析＆追加</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Wrapper>
      </Modal>

      {/* 詳細モーダル */}
      <Modal visible={!!selectedBook} animationType="slide" transparent={true}>
        <Wrapper {...wrapperProps}>
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
                          style={[styles.editInput, { height: 80 }]} 
                          value={editSummary} 
                          onChangeText={setEditSummary} 
                          multiline 
                        />
                      </View>
                      <View>
                        <Text style={styles.label}>読書メモ（自分のみ表示）</Text>
                        <TextInput 
                          style={[styles.editInput, { height: 100, backgroundColor: '#222', borderColor: '#00ffff', borderWidth: 1 }]} 
                          value={editMemo} 
                          onChangeText={setEditMemo} 
                          multiline 
                          placeholder="気づきや学びをメモしよう" 
                          placeholderTextColor="#555" 
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
                      
                      <View style={styles.memoContainer}>
                        <Text style={styles.sectionTitle}>読書メモ</Text>
                        {selectedBook.memo ? (
                          <Text style={styles.memoText}>{selectedBook.memo}</Text>
                        ) : (
                          <Text style={styles.emptyMemoText}>まだメモがありません。{'\n'}右上の編集ボタンから追加できます。</Text>
                        )}
                      </View>

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
        </Wrapper>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { height: 100, paddingTop: 50, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#111' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', letterSpacing: 2 },
  
  card: { backgroundColor: '#111', borderRadius: 12, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  bookTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', flex: 1 },
  bookAuthor: { color: '#888', fontSize: 14, marginTop: 2 },
  date: { color: '#666', fontSize: 12, marginTop: 4 },
  
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: 'rgba(0,0,0,0.9)' },
  addButton: { backgroundColor: '#fff', padding: 16, borderRadius: 30, alignItems: 'center' },
  addButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end', padding: 20 },
  inputContainer: { backgroundColor: '#1a1a1a', padding: 30, borderRadius: 20, width: '100%', marginBottom: 50 },
  
  // モードタブ
  modeTabs: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#111', borderRadius: 10, padding: 2 },
  modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeModeTab: { backgroundColor: '#333' },
  modeText: { color: '#666', fontWeight: 'bold' },
  activeModeText: { color: '#fff' },

  label: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginBottom: 5, marginLeft: 5 },
  input: { 
    backgroundColor: '#000', 
    color: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#333', 
    fontSize: 16, 
    marginBottom: 15, 
    textAlignVertical: 'top',
    ...Platform.select({ web: { outlineStyle: 'none' } as any })
  },
  
  bulkRow: { flexDirection: 'row', marginBottom: 10 },
  addMoreButton: { padding: 10, alignItems: 'center' },
  addMoreText: { color: '#00ffff', fontWeight: 'bold' },

  editInput: { 
    backgroundColor: '#333', 
    color: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    fontSize: 16,
    ...Platform.select({ web: { outlineStyle: 'none' } as any })
  },

  modalContent: { backgroundColor: '#1a1a1a', height: '92%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25 },
  
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
  
  memoContainer: { marginBottom: 25, backgroundColor: '#222', padding: 15, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#00ffff' },
  memoText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  emptyMemoText: { color: '#666', fontSize: 14, fontStyle: 'italic', lineHeight: 20 },

  tagsContainer: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  tag: { color: '#888', fontSize: 14, backgroundColor: '#111', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5, overflow: 'hidden' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 50 },
});
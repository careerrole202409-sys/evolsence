import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BarChart from '../../components/BarChart';
import LineChart from '../../components/LineChart';
import RadarChart from '../../components/RadarChart';
import { supabase } from '../../lib/supabase';

type UserProfile = {
  id: string;
  username: string;
  bio: string;
  avatar_url: string;
  career: string;
  education: string;
};

const CATEGORIES = [
  "ビジネス・経済",
  "小説・文学",
  "エッセイ・ノンフィクション",
  "教養・学術",
  "ライフスタイル・実用"
];

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookshelf'>('dashboard');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [books, setBooks] = useState<any[]>([]);
  
  // 分析用ステート
  const [genreStats, setGenreStats] = useState<number[]>([0, 0, 0, 0, 0]);
  const [tagRanking, setTagRanking] = useState<{label: string, value: number}[]>([]);
  const [readingTrend, setReadingTrend] = useState<{label: string, value: number}[]>([]);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  const [selectedBook, setSelectedBook] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        // 1. プロフィール取得
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', id).single();
        if (profileData) setProfile(profileData);

        // 2. 読書ログ取得 & 分析
        const { data: logsData, error } = await supabase
          .from('read_logs')
          .select('*')
          .eq('user_id', id)
          .order('created_at', { ascending: false });

        if (logsData) {
          setBooks(logsData);

          // --- 傾向分析 (Radar) ---
          const gCounts = CATEGORIES.map(cat => 
            logsData.filter(log => log.category === cat).length
          );
          setGenreStats(gCounts);

          // --- 興味範囲 (Bar) ---
          const tCounts: {[key: string]: number} = {};
          logsData.forEach(log => {
            log.tags?.forEach((tag: string) => {
              tCounts[tag] = (tCounts[tag] || 0) + 1;
            });
          });
          setTagRanking(Object.entries(tCounts)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10));

          // --- 読書記録 (Line) ---
          const trendData = [];
          const now = new Date();
          for (let i = 7; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
            const startOfWeek = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
            const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
            const count = logsData.filter(log => {
              const date = new Date(log.created_at);
              return date >= startOfWeek && date < endOfWeek;
            }).length;
            trendData.push({ label: `${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()}`, value: count });
          }
          setReadingTrend(trendData);
        }

        // 3. フォロー状態取得
        const { count } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id);
        setFollowerCount(count || 0);

        if (currentUser) {
          const { data: followData } = await supabase.from('follows').select('*').eq('follower_id', currentUser.id).eq('following_id', id).single();
          setIsFollowing(!!followData);
        }

      } catch (error) { console.log(error); } finally { setLoading(false); }
    };
    fetchUserData();
  }, [id]);

  const handleToggleFollow = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', id);
      setIsFollowing(false); setFollowerCount(prev => prev - 1);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: id });
      setIsFollowing(true); setFollowerCount(prev => prev + 1);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#00ffff" /></View>;

  const renderBookItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.bookCard} onPress={() => setSelectedBook(item)}>
      <Ionicons name="book-outline" size={24} color="#ccc" />
      <View style={{ marginLeft: 15, flex: 1 }}>
        <Text style={styles.bookTitle} numberOfLines={1}>{item.book_title}</Text>
        <Text style={styles.bookAuthor}>{item.author || '著者不明'}</Text>
        {item.category && <Text style={styles.categoryLabel}>{item.category}</Text>}
      </View>
      <View style={styles.miniBadge}><Text style={styles.miniBadgeText}>詳細</Text></View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile?.username}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={40} color="#333" />
              )}
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}><Text style={styles.statValue}>{followerCount}</Text><Text style={styles.statLabel}>フォロワー</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{books.length}</Text><Text style={styles.statLabel}>累計冊数</Text></View>
            </View>
          </View>

          <Text style={styles.bio}>{profile?.bio || '自己紹介はありません'}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>{profile?.career || '職歴なし'}</Text>
            <Text style={styles.infoText}> / </Text>
            <Text style={styles.infoText}>{profile?.education || '学歴なし'}</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.actionButton, styles.followButton, isFollowing && styles.followingButton]} onPress={handleToggleFollow}>
              <Text style={[styles.actionButtonText, isFollowing && styles.followingButtonText]}>{isFollowing ? 'フォロー中' : 'フォローする'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.messageButton]} onPress={() => router.push(`/chat/${id}`)}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#000" style={{marginRight:5}} />
              <Text style={styles.actionButtonText}>メッセージ</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'dashboard' && styles.activeTab]} onPress={() => setActiveTab('dashboard')}>
            <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>分析</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'bookshelf' && styles.activeTab]} onPress={() => setActiveTab('bookshelf')}>
            <Text style={[styles.tabText, activeTab === 'bookshelf' && styles.activeTabText]}>本棚</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'dashboard' ? (
          <View style={styles.contentArea}>
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>傾向分析</Text>
              <View style={styles.chartWrapper}>
                <RadarChart 
                  data={genreStats}
                  labels={["ビジネス", "小説", "エッセイ", "教養", "ライフ"]}
                  color="#00ffff"
                  size={360} // 調整済みサイズ
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>興味範囲</Text>
              {tagRanking.length > 0 ? <BarChart data={tagRanking} color="#ccff00" /> : <Text style={styles.emptyText}>データ不足</Text>}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>読書記録（週間トレンド）</Text>
              {readingTrend.length > 0 ? <LineChart data={readingTrend} color="#ff00ff" /> : <Text style={styles.emptyText}>データ不足</Text>}
            </View>
          </View>
        ) : (
          <View style={styles.contentArea}>
            {books.length > 0 ? books.map(book => <View key={book.id} style={{ marginBottom: 10 }}>{renderBookItem({ item: book })}</View>) : <Text style={styles.emptyText}>まだ本が登録されていません</Text>}
          </View>
        )}
      </ScrollView>

      {/* 詳細モーダル */}
      <Modal visible={!!selectedBook} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedBook && (
              <ScrollView>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailTitle}>{selectedBook.book_title}</Text>
                    <Text style={styles.detailAuthor}>{selectedBook.author}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedBook(null)}>
                    <Ionicons name="close-circle" size={30} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>カテゴリ / タグ</Text>
                {selectedBook.category && <Text style={styles.categoryText}>ジャンル：{selectedBook.category}</Text>}
                {selectedBook.tags && (
                  <View style={styles.tagsContainer}>
                    {selectedBook.tags.map((tag: any, i:number) => <Text key={i} style={styles.tagCyan}>#{tag}</Text>)}
                  </View>
                )}

                <View style={{height: 20}} />
                <Text style={styles.sectionTitle}>あらすじ</Text>
                <Text style={styles.summaryText}>{selectedBook.summary || 'No summary'}</Text>
                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  header: { height: 100, paddingTop: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#111' },
  backButton: { width: 40, alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  
  profileSection: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#111' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333', marginRight: 20, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },

  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 4 },

  bio: { fontSize: 15, color: '#ddd', marginBottom: 15, lineHeight: 22 },
  infoRow: { flexDirection: 'row', marginBottom: 25 },
  infoText: { color: '#aaa', fontSize: 14, marginRight: 5, fontWeight: 'bold' },

  actionButtons: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, paddingVertical: 12, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  actionButtonText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  followButton: { backgroundColor: '#00ffff' },
  followingButton: { backgroundColor: '#333', borderWidth: 1, borderColor: '#666' },
  followingButtonText: { color: '#ccc' },
  messageButton: { backgroundColor: '#fff' },

  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333' },
  tabButton: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#00ffff' },
  tabText: { color: '#666', fontWeight: 'bold' },
  activeTabText: { color: '#00ffff' },

  contentArea: { padding: 20 },
  section: { marginBottom: 30 },
  sectionHeader: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15, paddingLeft: 10, borderLeftWidth: 4, borderLeftColor: '#333' },
  chartWrapper: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 20, fontSize: 12 },

  bookCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#222' },
  bookTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  bookAuthor: { color: '#888', fontSize: 14 },
  categoryLabel: { color: '#00ffff', fontSize: 11, marginTop: 2, fontWeight: 'bold' },
  miniBadge: { backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  miniBadgeText: { color: '#aaa', fontSize: 11 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a1a1a', height: '92%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  detailTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', flex: 1, marginRight: 10 },
  detailAuthor: { fontSize: 16, color: '#888' },
  divider: { height: 1, backgroundColor: '#333', marginBottom: 20 },
  sectionTitle: { color: '#888', fontSize: 12, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  summaryText: { color: '#ccc', fontSize: 16, lineHeight: 24, marginBottom: 25 },
  tagsContainer: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  categoryText: { color: '#fff', fontSize: 14, marginBottom: 10 },
  tagCyan: { color: '#00ffff', fontSize: 14, backgroundColor: 'rgba(0, 255, 255, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0, 255, 255, 0.3)' },
});
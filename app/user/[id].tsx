import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BarChart from '../../components/BarChart';
import RadarChart from '../../components/RadarChart';
import { supabase } from '../../lib/supabase';

type UserProfile = {
  username: string; bio: string; avatar_url: string; career: string; education: string;
};

const LABEL_MAP: {[key: string]: string} = {
  os_strategy: "戦略", os_execution: "実行", os_logic: "論理", os_humanity: "心理", os_liberal_arts: "教養",
  skill_sales: "営業", skill_marketing: "マーケ", skill_technology: "IT", skill_finance: "財務", skill_management: "管理",
};

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookshelf'>('dashboard');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [tagRanking, setTagRanking] = useState<any[]>([]);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [totalOS, setTotalOS] = useState(0);
  const [totalSkill, setTotalSkill] = useState(0);

  const [selectedBook, setSelectedBook] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', id).single();
        if (profileData) setProfile(profileData);

        const { data: statsData } = await supabase.from('latest_stats').select('*').eq('user_id', id).single();
        if (statsData) {
          setStats(statsData);
          setTotalOS((statsData.os_strategy || 0) + (statsData.os_execution || 0) + (statsData.os_logic || 0) + (statsData.os_humanity || 0) + (statsData.os_liberal_arts || 0));
          setTotalSkill((statsData.skill_sales || 0) + (statsData.skill_marketing || 0) + (statsData.skill_technology || 0) + (statsData.skill_finance || 0) + (statsData.skill_management || 0));
        }

        const { data: logsData } = await supabase.from('read_logs').select('*').eq('user_id', id).order('created_at', { ascending: false });
        if (logsData) {
          setBooks(logsData);
          const counts: {[key: string]: number} = {};
          logsData.forEach(log => log.tags?.forEach((tag: string) => { counts[tag] = (counts[tag] || 0) + 1; }));
          setTagRanking(Object.entries(counts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10));
        }

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

  const renderPoints = (points: any) => {
    if (!points) return null;
    return Object.entries(points).map(([key, val]) => {
      if (Number(val) === 0) return null;
      const label = LABEL_MAP[key] || key;
      const isOs = key.startsWith('os_');
      const color = isOs ? '#00ffff' : '#ff00ff'; 
      return (<View key={key} style={[styles.badge, { borderColor: color }]}><Text style={[styles.badgeText, { color: color }]}>{label} +{String(val)}</Text></View>);
    });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#00ffff" /></View>;

  const renderBookItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.bookCard} onPress={() => setSelectedBook(item)}>
      <Ionicons name="book-outline" size={24} color="#ccc" />
      <View style={{ marginLeft: 15, flex: 1 }}>
        <Text style={styles.bookTitle} numberOfLines={1}>{item.book_title}</Text>
        <Text style={styles.bookAuthor}>{item.author || '著者不明'}</Text>
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
              {/* ★ここ：画像があれば表示 */}
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={40} color="#333" />
              )}
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}><Text style={styles.statValue}>{followerCount}</Text><Text style={styles.statLabel}>フォロワー</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{totalOS}</Text><Text style={styles.statLabel}>ビジネスOS</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{totalSkill}</Text><Text style={styles.statLabel}>スキル</Text></View>
            </View>
          </View>

          <Text style={styles.bio}>{profile?.bio || '自己紹介はありません'}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>{profile?.career || '職歴なし'}</Text>
            <Text style={styles.infoText}> / </Text>
            <Text style={styles.infoText}>{profile?.education || '学歴なし'}</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.followButton, isFollowing && styles.followingButton]} 
              onPress={handleToggleFollow}
            >
              <Text style={[styles.actionButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'フォロー中' : 'フォローする'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.messageButton]} 
              onPress={() => router.push(`/chat/${id}`)}
            >
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
            {stats ? (
              <>
                <View style={styles.chartWrapper}>
                  <Text style={styles.chartTitle}>ビジネスOS</Text>
                  <RadarChart 
                    data={[stats.os_strategy, stats.os_execution, stats.os_logic, stats.os_humanity, stats.os_liberal_arts]}
                    labels={[`戦略 ${stats.os_strategy}`, `実行 ${stats.os_execution}`, `論理 ${stats.os_logic}`, `心理 ${stats.os_humanity}`, `教養 ${stats.os_liberal_arts}`]}
                    color="#00ffff" size={200}
                  />
                </View>
                <View style={styles.chartWrapper}>
                  <Text style={styles.chartTitle}>ビジネススキル</Text>
                  <RadarChart 
                    data={[stats.skill_sales, stats.skill_marketing, stats.skill_technology, stats.skill_finance, stats.skill_management]}
                    labels={[`営業 ${stats.skill_sales}`, `マーケ ${stats.skill_marketing}`, `IT ${stats.skill_technology}`, `財務 ${stats.skill_finance}`, `管理 ${stats.skill_management}`]}
                    color="#ff00ff" size={200}
                  />
                </View>
                <View style={styles.chartWrapper}>
                  <Text style={styles.chartTitle}>傾向分析</Text>
                  <View style={{ width: '100%' }}><BarChart data={tagRanking} color="#ccff00" /></View>
                </View>
              </>
            ) : <Text style={styles.emptyText}>データがありません</Text>}
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
                <Text style={styles.sectionTitle}>獲得ステータス</Text>
                <View style={styles.badgesContainer}>{renderPoints(selectedBook.gained_points)}</View>
                <Text style={styles.sectionTitle}>あらすじ</Text>
                <Text style={styles.summaryText}>{selectedBook.summary || 'No summary'}</Text>
                {selectedBook.tags && <View style={styles.tagsContainer}>{selectedBook.tags.map((tag: any, i:number) => <Text key={i} style={styles.tag}>#{tag}</Text>)}</View>}
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
  avatarImage: { width: '100%', height: '100%' }, // 追加

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
  chartWrapper: { alignItems: 'center', marginBottom: 30 },
  chartTitle: { color: '#888', marginBottom: 15, fontSize: 14, fontWeight: 'bold' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 20 },

  bookCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#222' },
  bookTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  bookAuthor: { color: '#888', fontSize: 14 },
  miniBadge: { backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  miniBadgeText: { color: '#aaa', fontSize: 11 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a1a1a', height: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  detailTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', flex: 1, marginRight: 10 },
  detailAuthor: { fontSize: 16, color: '#888' },
  divider: { height: 1, backgroundColor: '#333', marginBottom: 20 },
  sectionTitle: { color: '#888', fontSize: 12, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  badgesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25 },
  badge: { borderWidth: 1, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  summaryText: { color: '#ccc', fontSize: 16, lineHeight: 24, marginBottom: 25 },
  tagsContainer: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  tag: { color: '#888', fontSize: 14, backgroundColor: '#111', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5, overflow: 'hidden' },
});
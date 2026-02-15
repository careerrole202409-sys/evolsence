import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MainHeader from '../../components/MainHeader';
import { supabase } from '../../lib/supabase';

type MatchUser = {
  id: string;
  username: string;
  bio: string;
  avatar_url: string | null;
  career: string;
  education: string; 
  commonTags: string[]; 
  matchScore: number; 
  isTopFive: boolean;
  totalBooks: number;
  topCategory: string;
};

const CATEGORIES = [
  "ビジネス・経済",
  "小説・文学",
  "エッセイ・ノンフィクション",
  "教養・学術",
  "ライフスタイル・実用"
];

export default function ExploreScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ジャンル比率を算出する関数 (0.0 ~ 1.0)
  const getGenreRatios = (logs: any[]) => {
    const counts: {[key: string]: number} = {};
    CATEGORIES.forEach(cat => counts[cat] = 0);
    logs.forEach(log => {
      if (log.category && counts[log.category] !== undefined) {
        counts[log.category]++;
      }
    });
    const total = logs.length || 1;
    const ratios: {[key: string]: number} = {};
    CATEGORIES.forEach(cat => {
      ratios[cat] = counts[cat] / total;
    });
    return ratios;
  };

  const fetchMatches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // 1. 自分のデータ取得
      const { data: myLogs } = await supabase.from('read_logs').select('tags, category').eq('user_id', user.id);
      const myRatios = getGenreRatios(myLogs || []);
      const myTagsSet = new Set<string>();
      myLogs?.forEach(log => log.tags?.forEach((t: string) => myTagsSet.add(t)));

      // 2. 他のユーザー候補を取得
      const { data: candidates, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, bio, avatar_url, career, education, updated_at')
        .neq('id', user.id)
        .eq('is_visible', true)
        .limit(50);

      if (profileError || !candidates || candidates.length === 0) {
        setMatches([]); setLoading(false); return;
      }

      const candidateIds = candidates.map(c => c.id);

      // 3. 候補者の読書ログを一括取得
      const { data: allCandidateLogs } = await supabase.from('read_logs').select('user_id, tags, category').in('user_id', candidateIds);
      
      const userLogsMap: {[key: string]: any[]} = {};
      allCandidateLogs?.forEach(log => {
        if (!userLogsMap[log.user_id]) userLogsMap[log.user_id] = [];
        userLogsMap[log.user_id].push(log);
      });

      // 4. スコア計算 (DNAマッチング v2.0)
      const scoredUsers = candidates.map(candidate => {
        const logs = userLogsMap[candidate.id] || [];
        
        // --- A. ジャンル構成一致スコア (最大70点) ---
        const otherRatios = getGenreRatios(logs);
        let totalDiff = 0;
        CATEGORIES.forEach(cat => {
          totalDiff += Math.abs(myRatios[cat] - otherRatios[cat]);
        });
        const genreScore = (1 - (totalDiff / 2)) * 70;

        // --- B. タグ一致率スコア (最大30点) ---
        const otherTagsSet = new Set<string>();
        logs.forEach(l => l.tags?.forEach((t: string) => otherTagsSet.add(t)));
        const commonTags = Array.from(otherTagsSet).filter(t => myTagsSet.has(t));
        const totalUniqueTags = new Set([...Array.from(myTagsSet), ...Array.from(otherTagsSet)]).size;
        const tagScore = totalUniqueTags > 0 ? (commonTags.length / totalUniqueTags) * 30 : 0;

        const finalScore = Math.round(genreScore + tagScore);

        // メインジャンルの特定
        const topCategory = Object.entries(otherRatios).sort((a, b) => b[1] - a[1])[0]?.[0] || '未分類';

        return {
          id: candidate.id,
          username: candidate.username || 'Unknown',
          bio: candidate.bio || '',
          avatar_url: candidate.avatar_url,
          career: candidate.career || '',
          education: candidate.education || '',
          commonTags,
          matchScore: Math.min(99, Math.max(10, finalScore)),
          totalBooks: logs.length,
          topCategory,
          updated_at: candidate.updated_at,
          isTopFive: false
        };
      });

      // 5. ソート (共通度 > 読書量 > 更新日)
      scoredUsers.sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return b.totalBooks - a.totalBooks;
      });

      // 6. 上位5名へのバッジ付与
      const finalUsers = scoredUsers.slice(0, 20).map((u, index) => ({
        ...u,
        isTopFive: index < 5 && u.matchScore >= 30
      }));

      setMatches(finalUsers);

    } catch (error) {
      console.log('Explore Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchMatches(); }, []));
  const onRefresh = async () => { setRefreshing(true); await fetchMatches(); setRefreshing(false); };

  const renderItem = ({ item }: { item: MatchUser }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/user/${item.id}`)}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Ionicons name="person" size={24} color="#333" />
          )}
        </View>

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.username}>{item.username}</Text>
            {item.isTopFive && (
              <View style={styles.topBadge}>
                <Text style={styles.topBadgeText}>おすすめ</Text>
              </View>
            )}
          </View>
          <Text style={styles.career} numberOfLines={1}>{item.career || '職歴なし'}</Text>
          <Text style={styles.career} numberOfLines={1}>{item.education || '学歴なし'}</Text>
        </View>
        
        <View style={styles.matchBadge}>
          <Text style={styles.matchScoreText}>{item.matchScore}%</Text>
          <Text style={styles.matchLabelSub}>共通度</Text>
        </View>
      </View>

      <View style={styles.divider} />
      
      <View style={styles.cardFooter}>
         <View style={styles.tagsMini}>
            <Text style={styles.tagText} numberOfLines={1}>
              {item.commonTags.length > 0 
                ? `共通：${item.commonTags.slice(0, 2).join(', ')}` 
                : `メイン：${item.topCategory}`}
            </Text>
         </View>
         <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.viewDetail}>詳細を見る</Text>
            <Ionicons name="chevron-forward" size={14} color="#00ffff" />
         </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <MainHeader title="探索" />
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#00ffff" /></View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ffff" />}
          ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>まだマッチするユーザーがいません。</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#666', fontSize: 16, fontWeight: 'bold' },
  card: { backgroundColor: '#111', borderRadius: 12, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatar: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  userInfo: { flex: 1, marginLeft: 15 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  username: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  topBadge: { backgroundColor: 'rgba(0, 255, 255, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8, borderWidth: 1, borderColor: '#00ffff' },
  topBadgeText: { color: '#00ffff', fontSize: 10, fontWeight: 'bold' },
  career: { color: '#888', fontSize: 12, marginBottom: 2 },
  matchBadge: { alignItems: 'center', justifyContent: 'center', paddingLeft: 10 },
  matchScoreText: { color: '#00ffff', fontSize: 22, fontWeight: 'bold' },
  matchLabelSub: { color: '#666', fontSize: 9, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#222', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tagsMini: { flex: 1, marginRight: 10 },
  tagText: { color: '#aaa', fontSize: 11 },
  viewDetail: { color: '#00ffff', fontSize: 11, fontWeight: 'bold', marginRight: 2 },
});
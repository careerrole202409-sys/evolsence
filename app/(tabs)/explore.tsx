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
  skillDiff: number;    
  osDiff: number;       
};

export default function ExploreScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. 自分のデータを取得
      const { data: myStats } = await supabase.from('latest_stats').select('*').eq('user_id', user.id).single();
      const { data: myLogs } = await supabase.from('read_logs').select('tags').eq('user_id', user.id);
      
      const myTags = new Set<string>();
      myLogs?.forEach(log => log.tags?.forEach((t: string) => myTags.add(t)));

      // 2. 他のユーザーのプロフィールを取得
      const { data: candidates, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, bio, avatar_url, career, education')
        .neq('id', user.id)
        .eq('is_visible', true)
        .limit(50);

      if (profileError || !candidates || candidates.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      const candidateIds = candidates.map(c => c.id);

      // 3. 候補者のステータスを一括取得（ここを結合から変更）
      const { data: candidatesStats } = await supabase
        .from('latest_stats')
        .select('*')
        .in('user_id', candidateIds);

      // 4. 候補者の読書タグを一括取得
      const { data: candidatesLogs } = await supabase
        .from('read_logs')
        .select('user_id, tags')
        .in('user_id', candidateIds);

      // データをマップ化して検索しやすくする
      const statsMap: {[key: string]: any} = {};
      candidatesStats?.forEach(stat => { statsMap[stat.user_id] = stat; });

      const tagsMap: {[key: string]: Set<string>} = {};
      candidatesLogs?.forEach(log => {
        if (!tagsMap[log.user_id]) tagsMap[log.user_id] = new Set();
        log.tags?.forEach((t: string) => tagsMap[log.user_id].add(t));
      });

      // 5. スコア計算
      const scoredUsers = candidates.map(candidate => {
        const stats = statsMap[candidate.id];
        const otherTags = tagsMap[candidate.id] || new Set();
        const commonTags = Array.from(otherTags).filter(t => myTags.has(t));

        let skillDiff = 1000;
        let osDiff = 1000;

        if (myStats && stats) {
          skillDiff = 
            Math.abs((myStats.skill_sales || 0) - (stats.skill_sales || 0)) +
            Math.abs((myStats.skill_marketing || 0) - (stats.skill_marketing || 0)) +
            Math.abs((myStats.skill_technology || 0) - (stats.skill_technology || 0)) +
            Math.abs((myStats.skill_finance || 0) - (stats.skill_finance || 0)) +
            Math.abs((myStats.skill_management || 0) - (stats.skill_management || 0));

          osDiff = 
            Math.abs((myStats.os_strategy || 0) - (stats.os_strategy || 0)) +
            Math.abs((myStats.os_execution || 0) - (stats.os_execution || 0)) +
            Math.abs((myStats.os_logic || 0) - (stats.os_logic || 0)) +
            Math.abs((myStats.os_humanity || 0) - (stats.os_humanity || 0)) +
            Math.abs((myStats.os_liberal_arts || 0) - (stats.os_liberal_arts || 0));
        }

        return {
          id: candidate.id,
          username: candidate.username || 'Unknown',
          bio: candidate.bio || '',
          avatar_url: candidate.avatar_url,
          career: candidate.career || '',
          education: candidate.education || '',
          commonTags,
          skillDiff,
          osDiff
        };
      });

      // 並び替え
      scoredUsers.sort((a, b) => {
        if (b.commonTags.length !== a.commonTags.length) return b.commonTags.length - a.commonTags.length;
        if (a.skillDiff !== b.skillDiff) return a.skillDiff - b.skillDiff;
        return a.osDiff - b.osDiff;
      });

      setMatches(scoredUsers.slice(0, 20));

    } catch (error) {
      console.log('Explore Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMatches();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  };

  const calculateSimilarity = (diff: number) => {
    if (diff > 50) return 10;
    return Math.max(10, 100 - (diff * 1.5)).toFixed(0);
  };

  const renderItem = ({ item }: { item: MatchUser }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/user/${item.id}`)}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {item.avatar_url ? (
            <Image 
              source={{ uri: item.avatar_url }} 
              style={styles.avatarImage} 
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person" size={24} color="#333" />
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.career} numberOfLines={1}>{item.career || '職歴なし'}</Text>
          <Text style={styles.career} numberOfLines={1}>{item.education || '学歴なし'}</Text>
        </View>
        
        <View style={styles.matchBadge}>
          <Text style={styles.matchScore}>
            {item.commonTags.length > 0 ? `共通タグ ${item.commonTags.length}` : 'New User'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />
      
      <View style={styles.cardFooter}>
         <Text style={styles.similarityText}>スキル類似度: {calculateSimilarity(item.skillDiff)}%</Text>
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
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>まだマッチするユーザーがいません。</Text>
            </View>
          }
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
  
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  
  userInfo: { flex: 1, marginLeft: 15 },
  username: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  career: { color: '#888', fontSize: 12, marginBottom: 2 },
  
  matchBadge: { backgroundColor: 'rgba(0, 255, 255, 0.1)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(0, 255, 255, 0.3)', alignSelf: 'flex-start' },
  matchScore: { color: '#00ffff', fontSize: 10, fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: '#222', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  similarityText: { color: '#666', fontSize: 12, fontWeight: 'bold' },
  viewDetail: { color: '#00ffff', fontSize: 12, fontWeight: 'bold', marginRight: 2 },
});
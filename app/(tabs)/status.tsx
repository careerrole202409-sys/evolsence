import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import BarChart from '../../components/BarChart';
import LineChart from '../../components/LineChart';
import MainHeader from '../../components/MainHeader';
import RadarChart from '../../components/RadarChart';
import { supabase } from '../../lib/supabase';

const CATEGORIES = [
  "ビジネス・経済",
  "小説・文学",
  "エッセイ・ノンフィクション",
  "教養・学術",
  "ライフスタイル・実用"
];

export default function StatusScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [genreStats, setGenreStats] = useState<number[]>([0, 0, 0, 0, 0]);
  const [tagRanking, setTagRanking] = useState<{label: string, value: number}[]>([]);
  const [readingTrend, setReadingTrend] = useState<{label: string, value: number}[]>([]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: logsData, error } = await supabase
        .from('read_logs')
        .select('created_at, category, tags')
        .eq('user_id', user.id);

      if (error) throw error;

      if (logsData) {
        // 1. 傾向分析（ジャンル集計）
        const gCounts = CATEGORIES.map(cat => 
          logsData.filter(log => log.category === cat).length
        );
        setGenreStats(gCounts);

        // 2. 興味範囲（タグ集計）
        const tCounts: {[key: string]: number} = {};
        logsData.forEach(log => {
          log.tags?.forEach((tag: string) => {
            // ★ここを修正しました：counts -> tCounts
            tCounts[tag] = (tCounts[tag] || 0) + 1;
          });
        });
        setTagRanking(Object.entries(tCounts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10));

        // 3. 読書記録（週間トレンド）
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
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  if (loading && !refreshing) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#00ffff" /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ffff" />}>
      <MainHeader title="ダッシュボード" />

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>傾向分析</Text>
        <View style={styles.chartWrapper}>
          <RadarChart 
            data={genreStats}
            labels={["ビジネス・経済", "小説・文学", "エッセイ・ノンフィクション", "教養・学術", "ライフスタイル・実用"]}
            color="#00ffff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>興味範囲</Text>
        <View style={styles.listWrapper}>
          {tagRanking.length > 0 ? <BarChart data={tagRanking} color="#ccff00" /> : <Text style={styles.emptyText}>データ不足</Text>}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>読書記録（週間トレンド）</Text>
        <View style={styles.listWrapper}>
          {readingTrend.length > 0 ? <LineChart data={readingTrend} color="#ff00ff" /> : <Text style={styles.emptyText}>データ不足</Text>}
        </View>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  section: { marginBottom: 40 },
  sectionHeader: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginBottom: 20, paddingLeft: 10, borderLeftWidth: 4, borderLeftColor: '#333' },
  chartWrapper: { alignItems: 'center', justifyContent: 'center' },
  listWrapper: { width: '100%' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 10, fontSize: 12 }
});
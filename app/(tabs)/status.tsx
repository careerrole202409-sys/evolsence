import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import BarChart from '../../components/BarChart';
import MainHeader from '../../components/MainHeader'; // ★共通ヘッダーを読み込み
import RadarChart from '../../components/RadarChart';
import { supabase } from '../../lib/supabase';

export default function StatusScreen() {
  const [refreshing, setRefreshing] = useState(false);
  
  const [stats, setStats] = useState({
    os_strategy: 0, os_execution: 0, os_logic: 0, os_humanity: 0, os_liberal_arts: 0,
    skill_sales: 0, skill_marketing: 0, skill_technology: 0, skill_finance: 0, skill_management: 0,
  });
  const [tagRanking, setTagRanking] = useState<{label: string, value: number}[]>([]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: statsData } = await supabase.from('latest_stats').select('*').eq('user_id', user.id).single();
      if (statsData) setStats(statsData);
      const { data: logsData } = await supabase.from('read_logs').select('tags').eq('user_id', user.id);
      if (logsData) {
        const counts: {[key: string]: number} = {};
        logsData.forEach(log => log.tags?.forEach((tag: string) => { counts[tag] = (counts[tag] || 0) + 1; }));
        setTagRanking(Object.entries(counts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10));
      }
    } catch (error) { console.log(error); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ffff" />}
    >
      {/* ★ヘッダーはこれ1行だけでOK！ */}
      <MainHeader title="ダッシュボード" />

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>ビジネスOS</Text>
        <View style={styles.chartWrapper}>
          <RadarChart 
            data={[stats.os_strategy, stats.os_execution, stats.os_logic, stats.os_humanity, stats.os_liberal_arts]}
            labels={[`戦略 ${stats.os_strategy}`, `実行 ${stats.os_execution}`, `論理 ${stats.os_logic}`, `心理 ${stats.os_humanity}`, `教養 ${stats.os_liberal_arts}`]}
            color="#00ffff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>ビジネススキル</Text>
        <View style={styles.chartWrapper}>
          <RadarChart 
            data={[stats.skill_sales, stats.skill_marketing, stats.skill_technology, stats.skill_finance, stats.skill_management]}
            labels={[`営業 ${stats.skill_sales}`, `マーケ ${stats.skill_marketing}`, `IT ${stats.skill_technology}`, `財務 ${stats.skill_finance}`, `管理 ${stats.skill_management}`]}
            color="#ff00ff" 
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>読書分析</Text>
        <View style={styles.listWrapper}>
          {tagRanking.length > 0 ? (
            <BarChart data={tagRanking} color="#ccff00" />
          ) : (
            <Text style={styles.emptyText}>データ不足</Text>
          )}
        </View>
      </View>
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  // header系のスタイルは全部削除しました
  section: { marginBottom: 30 },
  sectionHeader: {
    color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginBottom: 15, paddingLeft: 10, borderLeftWidth: 4, borderLeftColor: '#333',
  },
  chartWrapper: { alignItems: 'center' },
  listWrapper: { width: '100%' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 10, fontSize: 12 }
});
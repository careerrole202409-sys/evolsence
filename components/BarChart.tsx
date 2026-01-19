import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type DataItem = {
  label: string;
  value: number;
};

type Props = {
  data: DataItem[];
  color: string;
};

export default function BarChart({ data, color }: Props) {
  // データの中で最大の値（これを基準に棒の長さを決める）
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <View style={styles.container}>
      {data.map((item, index) => {
        // 棒の長さ（％）を計算
        const widthPercent = (item.value / maxValue) * 100;
        
        return (
          <View key={index} style={styles.row}>
            {/* 1. ラベル（左側） */}
            <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
            
            {/* 2. 棒グラフと数値（右側） */}
            <View style={styles.barArea}>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { width: `${widthPercent}%`, backgroundColor: color, shadowColor: color }
                  ]} 
                />
              </View>
              <Text style={[styles.value, { color: color }]}>{item.value}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', paddingHorizontal: 20 },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12,
  },
  label: { 
    width: 80, // ラベル幅固定
    color: '#ccc', 
    fontSize: 12, 
    fontWeight: 'bold',
    marginRight: 10,
    textAlign: 'right'
  },
  barArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#333', // 棒の背景（空の部分）
    borderRadius: 4,
    marginRight: 10,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  value: {
    width: 20,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  }
});
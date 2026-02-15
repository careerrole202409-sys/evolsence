import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

type DataItem = {
  label: string;
  value: number;
};

type Props = {
  data: DataItem[];
  color: string;
};

export default function LineChart({ data, color }: Props) {
  // 画面幅から余白を引いたサイズ
  const screenWidth = Dimensions.get('window').width - 40;
  const height = 150;
  const padding = 30; // グラフの上下左右の余白
  
  // 縦軸の最大値を計算（データがない、あるいは全て0の場合は5にする）
  const maxValInData = Math.max(...data.map(d => d.value), 0);
  const maxValue = maxValInData === 0 ? 5 : maxValInData;
  
  // 座標計算ロジック
  const points = data.map((item, index) => {
    // X軸：インデックスに応じて均等に配置
    const x = (index * (screenWidth - padding * 2)) / (data.length - 1) + padding;
    // Y軸：値に応じて高さを計算（上が0なので反転させる）
    const y = height - (item.value / maxValue) * (height - padding * 2) - padding;
    return { x, y, value: item.value, label: item.label };
  });

  // Polyline用の文字列作成 "x1,y1 x2,y2 ..."
  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <View style={styles.container}>
      <Svg height={height} width={screenWidth}>
        {/* 背景のグリッド（横線 3本） */}
        {[0, 0.5, 1].map((p) => {
          const y = height - (p * (height - padding * 2)) - padding;
          return (
            <React.Fragment key={p}>
              {/* グリッド線 */}
              <Line x1={padding} y1={y} x2={screenWidth - padding} y2={y} stroke="#222" strokeWidth="1" />
              {/* Y軸の数字 */}
              <SvgText x={padding - 5} y={y + 4} fill="#666" fontSize="10" textAnchor="end">
                {Math.round(maxValue * p)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* 折れ線本体 */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* 各データ点のドットとラベル */}
        {points.map((p, i) => (
          <React.Fragment key={i}>
            {/* 点 */}
            <Circle cx={p.x} cy={p.y} r="4" fill={color} />
            
            {/* X軸のラベル（日付） */}
            <SvgText x={p.x} y={height - 5} fill="#666" fontSize="9" textAnchor="middle">
              {p.label}
            </SvgText>
            
            {/* 値の数字（0より大きい時のみ上に表示） */}
            {p.value > 0 && (
              <SvgText x={p.x} y={p.y - 10} fill={color} fontSize="10" fontWeight="bold" textAnchor="middle">
                {p.value}
              </SvgText>
            )}
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginVertical: 10,
    width: '100%' 
  },
});
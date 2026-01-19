import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

type Props = {
  data: number[];   
  labels: string[]; 
  color: string;    
  size?: number;    
};

export default function RadarChart({ data, labels, color, size = 250 }: Props) {
  const center = size / 2;
  const radius = (size / 2) - 50; 
  const angleSlice = (Math.PI * 2) / 5; 

  // ★ここが変更点：データの中の最大値を探す（最低でも10にしておく）
  // これにより、値が小さくてもチャートが大きく描画されます
  const maxValue = Math.max(...data, 10);

  const getXY = (value: number, index: number) => {
    // 値を最大値で割って割合を出す
    const r = (value / maxValue) * radius;
    const angle = index * angleSlice - Math.PI / 2; 
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const polygonPoints = data.map((val, i) => {
    const { x, y } = getXY(val, i);
    return `${x},${y}`;
  }).join(' ');

  // 背景のグリッドも割合（20%, 40%...）で描画する
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg height={size} width={size}>
        {/* 1. 背景のグリッド */}
        {gridLevels.map((rate, idx) => (
          <Polygon
            key={idx}
            points={[0, 1, 2, 3, 4].map(i => {
              // 最大値の〇〇%の位置に線を引く
              const { x, y } = getXY(maxValue * rate, i);
              return `${x},${y}`;
            }).join(' ')}
            stroke="#333"
            strokeWidth="1"
            fill="none"
          />
        ))}

        {/* 2. 軸線 */}
        {[0, 1, 2, 3, 4].map((i) => {
          const { x, y } = getXY(maxValue, i);
          return <Line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#333" strokeWidth="1" />;
        })}

        {/* 3. データ（色付きの五角形） */}
        <Polygon
          points={polygonPoints}
          fill={color}
          fillOpacity="0.2"
          stroke={color}
          strokeWidth="2"
        />

        {/* 4. 頂点のドット */}
        {data.map((val, i) => {
          const { x, y } = getXY(val, i);
          return <Circle key={i} cx={x} cy={y} r="3" fill={color} />;
        })}

        {/* 5. ラベル文字 */}
        {labels.map((label, i) => {
          const labelRadius = radius + 30; 
          const angle = i * angleSlice - Math.PI / 2;
          const x = center + labelRadius * Math.cos(angle);
          const y = center + labelRadius * Math.sin(angle);
          
          return (
            <SvgText
              key={i}
              x={x}
              y={y}
              fill="#fff"
              fontSize="14" 
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
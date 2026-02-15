import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText, TSpan } from 'react-native-svg';

type Props = {
  data: number[];   
  labels: string[]; 
  color: string;    
  size?: number;    
};

export default function RadarChart({ data, labels, color, size = 360 }: Props) {
  const center = size / 2;
  const radius = 80; // 図形を小さくして、文字が切れないスペースを確保
  const angleSlice = (Math.PI * 2) / 5; 

  const maxValue = Math.max(...data, 10);

  const getXY = (value: number, index: number, customRadius?: number) => {
    const r = (value / maxValue) * (customRadius || radius);
    const angle = index * angleSlice - Math.PI / 2; 
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // 変数名を統一
  const polygonPoints = data.map((val, i) => {
    const { x, y } = getXY(val, i);
    return `${x},${y}`;
  }).join(' ');

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg height={size} width={size}>
        {/* 背景グリッド */}
        {gridLevels.map((rate, idx) => (
          <Polygon
            key={idx}
            points={[0, 1, 2, 3, 4].map(i => {
              const { x, y } = getXY(maxValue * rate, i);
              return `${x},${y}`;
            }).join(' ')}
            stroke="#333"
            strokeWidth="1"
            fill="none"
          />
        ))}

        {/* 軸線 */}
        {[0, 1, 2, 3, 4].map((i) => {
          const { x, y } = getXY(maxValue, i);
          return <Line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#333" strokeWidth="1" />;
        })}

        {/* データポリゴン（ここを polygonPoints に修正しました） */}
        <Polygon 
          points={polygonPoints} 
          fill={color} 
          fillOpacity={0.2} 
          stroke={color} 
          strokeWidth={2} 
        />

        {/* 頂点ドット */}
        {data.map((val, i) => {
          const { x, y } = getXY(val, i);
          return <Circle key={i} cx={x} cy={y} r="3" fill={color} />;
        })}

        {/* ラベル */}
        {labels.map((label, i) => {
          const angle = i * angleSlice - Math.PI / 2;
          const labelRadius = radius + 20; 
          const { x, y } = getXY(maxValue, i, labelRadius);
          
          let textAnchor: "start" | "middle" | "end" = "middle";
          const cos = Math.cos(angle);
          if (cos > 0.3) textAnchor = "start"; 
          else if (cos < -0.3) textAnchor = "end";

          const lines = label.split('・');
          // 一番上(0)は少し上に、下側(2,3)は少し下にずらす
          const yOffset = (i === 2 || i === 3) ? 15 : (i === 0 ? -15 : 0);

          return (
            <SvgText
              key={i}
              x={x}
              y={y + yOffset}
              fill="#fff"
              fontSize="11"
              fontWeight="bold"
              textAnchor={textAnchor}
            >
              {lines.map((line, index) => (
                <TSpan
                  key={index}
                  x={x}
                  dy={index === 0 ? 0 : 14}
                >
                  {index === 0 && lines.length > 1 ? line + "・" : line}
                </TSpan>
              ))}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current; // 透明度
  const scaleAnim = useRef(new Animated.Value(0.9)).current; // サイズ（少し拡大させる）

  useEffect(() => {
    // アニメーションの手順
    Animated.sequence([
      // 1. ふわっと表示 & 少し拡大
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000, // 1秒かけて表示
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      // 2. しばらく待機（ロゴを見せる時間）
      Animated.delay(1500),
      // 3. ふわっと消える
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500, // 0.5秒かけて消える
        useNativeDriver: true,
      }),
    ]).start(() => {
      // アニメーションが終わったら親に伝える
      onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <Text style={styles.title}>EVOLSENCE</Text>
        <View style={styles.line} />
        <Text style={styles.subtitle}>Upgrade Your Business OS.</Text>
      </Animated.View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // 真っ黒な背景
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 5,
    textAlign: 'center',
  },
  line: {
    width: 40,
    height: 2,
    backgroundColor: '#00ffff', // シアン色のアクセント線
    marginTop: 20,
    marginBottom: 20,
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    letterSpacing: 2,
    textAlign: 'center',
    fontWeight: '300',
  },
});
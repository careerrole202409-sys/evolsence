import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1500),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <Text style={styles.title}>EVOLSENCE</Text>
        <Text style={styles.katakana}>エボルセンス</Text>
        <View style={styles.line} />
        <Text style={styles.subtitle}>その読書を、ビジネスの武器に変える。</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    marginBottom: 8, // カタカナとの間隔
  },
  katakana: {
    fontSize: 14,
    color: '#888',
    letterSpacing: 2,
    textAlign: 'center',
  },
  line: {
    width: 40,
    height: 2,
    backgroundColor: '#00ffff',
    marginTop: 20,
    marginBottom: 20,
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 15, 
    color: '#ccc',
    letterSpacing: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
});
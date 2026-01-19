import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import SplashScreen from '../components/SplashScreen'; // ★作成したスプラッシュ画面
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [initialized, setInitialized] = useState(false); // Authチェック完了フラグ
  const [splashFinished, setSplashFinished] = useState(false); // アニメーション完了フラグ
  
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // 1. ログインチェック
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setInitialized(true);
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // 2. 「Authチェック」と「アニメーション」の両方が終わるまで画面遷移しない
    if (!initialized || !splashFinished) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (session && inAuthGroup) {
      router.replace('/(tabs)/status');
    } else if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [session, initialized, splashFinished, segments]);

  // ★「Authチェック中」または「アニメーション中」ならスプラッシュを表示
  if (!splashFinished || !initialized) {
    return (
      <SplashScreen onFinish={() => setSplashFinished(true)} />
    );
  }

  return <Slot />;
}
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import SplashScreen from '../components/SplashScreen';
import { ProcessingProvider } from '../contexts/ProcessingContext';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);
  
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
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
    if (!initialized || !splashFinished) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    // ★修正: ログイン不要でアクセスを許可するルートのリスト
    const isPublicPage = ['privacy', 'terms', 'deletion'].includes(segments[0]);

    if (session && inAuthGroup) {
      // ログイン済みでログイン画面系にいる場合は、メイン画面へ
      router.replace('/(tabs)/status');
    } else if (!session && !inAuthGroup && !isPublicPage) {
      // ★修正: 未ログインで、かつ認証グループでも公開ページでもない場合のみ、ログイン画面へ
      router.replace('/(auth)/login');
    }
  }, [session, initialized, splashFinished, segments]);

  if (!splashFinished || !initialized) {
    return <SplashScreen onFinish={() => setSplashFinished(true)} />;
  }

  return (
    <ProcessingProvider>
      <Slot />
    </ProcessingProvider>
  );
}
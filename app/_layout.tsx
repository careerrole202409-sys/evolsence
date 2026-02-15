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
    // 1. セッションの監視
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

    // 画面遷移の交通整理ロジック
    const performRedirect = async () => {
      const inAuthGroup = segments[0] === '(auth)';
      const isPublicPage = ['privacy', 'terms', 'deletion'].includes(segments[0]);

      if (session && inAuthGroup) {
        // ★修正ポイント：ログイン済みでも「名前が決まっていない」ならリダイレクトしない
        // プロフィールを取得して確認する
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single();

        const username = profile?.username;
        const isNameSet = username && username !== '新規ユーザー' && username !== 'Unknown User';

        if (isNameSet) {
          // 名前設定済みなら -> メイン画面へ
          router.replace('/(tabs)/status');
        } else {
          // 名前未設定なら -> そのまま (login.tsxで名前入力をさせる)
          // 何もしない
        }

      } else if (!session && !inAuthGroup && !isPublicPage) {
        // 未ログインで中身を見ようとしたら -> ログイン画面へ強制送還
        router.replace('/(auth)/login');
      }
    };

    performRedirect();

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
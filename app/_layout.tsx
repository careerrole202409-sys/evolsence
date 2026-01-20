import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import SplashScreen from '../components/SplashScreen';
import { ProcessingProvider } from '../contexts/ProcessingContext'; // ★追加
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
    if (session && inAuthGroup) {
      router.replace('/(tabs)/status');
    } else if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [session, initialized, splashFinished, segments]);

  if (!splashFinished || !initialized) {
    return <SplashScreen onFinish={() => setSplashFinished(true)} />;
  }

  // ★ここで全体を包む
  return (
    <ProcessingProvider>
      <Slot />
    </ProcessingProvider>
  );
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

// ★ここを変更：直接書かずに process.env から読み込む
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// (以下、storageAdapterの設定などはそのままでOK)
const storageAdapter = Platform.OS === 'web' 
  ? {
      getItem: (key: string) => {
        if (typeof window === 'undefined') return Promise.resolve(null);
        return Promise.resolve(window.localStorage.getItem(key));
      },
      setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return Promise.resolve();
        return Promise.resolve(window.localStorage.setItem(key, value));
      },
      removeItem: (key: string) => {
        if (typeof window === 'undefined') return Promise.resolve();
        return Promise.resolve(window.localStorage.removeItem(key));
      },
    }
  : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
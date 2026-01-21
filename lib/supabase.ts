import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

// ★ご自身のURLとキーに戻してください
const supabaseUrl = "https://wirsnivematggblznqxo.supabase.co"; 
const supabaseAnonKey = "sb_publishable_oV0Yp5KCWrJy9hnzct8bhg_Ctn4bVw7"; 

// ★Webならブラウザ標準の保存場所、アプリならAsyncStorageを使う
// これが一番バグりません
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
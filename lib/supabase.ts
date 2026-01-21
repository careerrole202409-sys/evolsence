import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// ★環境変数、もしくは直書きのキー（ご自身のものに合わせてください）
const supabaseUrl = "https://wirsnivematggblznqxo.supabase.co"; 
const supabaseAnonKey = "sb_publishable_oV0Yp5KCWrJy9hnzct8bhg_Ctn4bVw7"; 

// ★ここが修正ポイント：サーバー（ビルド中）かどうかを判定
const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // ブラウザ/スマホならAsyncStorageを使う。
    // ビルド中（サーバー）なら何もしないダミーを使う。
    storage: isBrowser ? AsyncStorage : {
      getItem: () => Promise.resolve(null),
      setItem: () => Promise.resolve(),
      removeItem: () => Promise.resolve(),
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
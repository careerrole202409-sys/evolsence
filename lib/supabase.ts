import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// ここに自分のSupabaseのURLとキーを入れる
const supabaseUrl = 'https://wirsnivematggblznqxo.supabase.co'; // 例: https://abcdef.supabase.co
const supabaseAnonKey = 'sb_publishable_oV0Yp5KCWrJy9hnzct8bhg_Ctn4bVw7'; // 例: eyJhbGciOiJIUzI1NiIsInR5cCI6...

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
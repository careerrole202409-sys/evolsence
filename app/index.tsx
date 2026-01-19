import { Redirect } from 'expo-router';

export default function Index() {
  // アプリを開いたら、まずは招待コード入力画面(login)へ飛ばす
  return <Redirect href="/(auth)/login" />;
}
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { analyzeBook } from '../lib/gemini';
import { supabase } from '../lib/supabase';

type ProcessingContextType = {
  processingCount: number;
  addBooksToQueue: (books: { title: string; author: string }[]) => void;
};

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [processingCount, setProcessingCount] = useState(0);

  // ステータス更新ロジック
  const updateStats = async (userId: string, points: any) => {
    const { data: currentStats } = await supabase.from('latest_stats').select('*').eq('user_id', userId).single();
    const stats = currentStats || {}; 
    const newStats: any = { ...stats };

    Object.keys(points).forEach(key => {
      const val = points[key] || 0;
      const currentVal = stats[key] || 0;
      newStats[key] = currentVal + val;
    });

    await supabase.from('latest_stats').upsert({ user_id: userId, ...newStats, updated_at: new Date() });
    
    // 履歴保存
    const historyData = {
      user_id: userId,
      recorded_at: new Date(),
      total_os_strategy: newStats.os_strategy,
      total_os_execution: newStats.os_execution,
      total_os_logic: newStats.os_logic,
      total_os_humanity: newStats.os_humanity,
      total_os_liberal_arts: newStats.os_liberal_arts,
      total_skill_sales: newStats.skill_sales,
      total_skill_marketing: newStats.skill_marketing,
      total_skill_technology: newStats.skill_technology,
      total_skill_finance: newStats.skill_finance,
      total_skill_management: newStats.skill_management,
    };
    await supabase.from('stats_history').insert(historyData);
  };

  // 本をキューに追加して順次処理（修正版：順番に処理する）
  const addBooksToQueue = async (books: { title: string; author: string }[]) => {
    // UI上のカウントを増やす
    setProcessingCount(prev => prev + books.length);

    // 非同期処理を開始（呼び出し元は待たせない）
    processQueue(books);
  };

  // 実際の処理ロジック（再帰的、あるいはループで順次処理）
  const processQueue = async (books: { title: string; author: string }[]) => {
    for (const book of books) {
      try {
        console.log(`処理開始: ${book.title}`);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("ユーザーが見つかりません");
          continue; // 次の本へ
        }

        // 1. Gemini分析（ここでawaitすることで、終わるまで次の本に行かない）
        const aiResult = await analyzeBook(book.title, book.author);

        // 2. ログ保存
        const { error: logError } = await supabase.from('read_logs').insert({
          user_id: user.id,
          book_title: book.title,
          author: aiResult.author,
          summary: aiResult.summary,
          tags: aiResult.tags,
          gained_points: aiResult.points,
          memo: '',
        });

        if (logError) {
          console.error(`保存エラー: ${book.title}`, logError);
          continue;
        }

        // 3. ステータス更新
        await updateStats(user.id, aiResult.points);
        console.log(`完了: ${book.title}`);

      } catch (error) {
        console.error(`失敗: ${book.title}`, error);
      } finally {
        // 1冊終わるごとにカウントを減らす
        setProcessingCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  return (
    <ProcessingContext.Provider value={{ processingCount, addBooksToQueue }}>
      {children}
    </ProcessingContext.Provider>
  );
}

export function useProcessing() {
  const context = useContext(ProcessingContext);
  if (!context) throw new Error('useProcessing must be used within a ProcessingProvider');
  return context;
}
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

  // 本をキューに追加して順次処理
  const addBooksToQueue = async (books: { title: string; author: string }[]) => {
    setProcessingCount(prev => prev + books.length);
    processQueue(books);
  };

  const processQueue = async (books: { title: string; author: string }[]) => {
    for (const book of books) {
      try {
        console.log(`処理開始: ${book.title}`);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) continue;

        // 1. Gemini分析
        const aiResult = await analyzeBook(book.title, book.author);

        // 2. ログ保存（gained_pointsを削除し、categoryを追加）
        const { error: logError } = await supabase.from('read_logs').insert({
          user_id: user.id,
          book_title: book.title,
          author: aiResult.author,
          summary: aiResult.summary,
          tags: aiResult.tags,
          category: aiResult.category, // ★ここ：ジャンルを保存
          memo: '',
        });

        if (logError) throw logError;
        console.log(`完了: ${book.title}`);

      } catch (error) {
        console.error(`失敗: ${book.title}`, error);
      } finally {
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
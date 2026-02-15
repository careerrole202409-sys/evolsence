import { GoogleGenerativeAI } from "@google/generative-ai";

// 環境変数からAPIキーを読み込む
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

if (!API_KEY) {
  console.error("APIキーが設定されていません。.envファイルを確認してください。");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export async function analyzeBook(bookTitle: string, author?: string) {
  try {
    // 安定して動作する 2.5 Flash を指定
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

    const prompt = `
      あなたはあらゆるジャンルの書籍に精通した優秀な司書です。
      以下の書籍を分析し、指定されたフォーマットのJSON形式のみで回答してください。Markdown記法（\`\`\`json 等）は不要です。

      書籍名: 『${bookTitle}』
      著者名: ${author ? author : "不明（書籍名から推測してください）"}

      【分析ルール】
      1. **ジャンル分類**:
         本の内容に基づき、以下の5つの中から**最も適切なものを1つだけ**選んでください。
         - ビジネス・経済
         - 小説・文学
         - エッセイ・ノンフィクション
         - 教養・学術
         - ライフスタイル・実用

      2. **タグ生成**:
         本の内容、テーマ、キーワードを表すタグを**必ず5個**生成してください。

      3. **あらすじ**:
         100文字以内の魅力的なあらすじ（デスマス調）を作成してください。

      【出力フォーマット(JSON)】
      {
        "author": "正式な著者名",
        "category": "選択したジャンル名",
        "summary": "あらすじテキスト",
        "tags": ["タグ1", "タグ2", "タグ3", "タグ4", "タグ5"]
      }
    `;

    console.log("AI分析開始: " + bookTitle);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("AIからの返答あり");

    // JSONを綺麗に取り出す処理
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString);

  } catch (error: any) {
    console.error("AI Error:", error);
    throw new Error("AI分析エラー: " + error.message);
  }
}
import { GoogleGenerativeAI } from "@google/generative-ai";

// ★修正：直書きをやめて、環境変数から読み込む
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

if (!API_KEY) {
  console.error("APIキーが設定されていません。.envファイルを確認してください。");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export async function analyzeBook(bookTitle: string, author?: string) {
  try {
    // 2.5 Flash または 2.0 Flash を指定
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

    const prompt = `
      あなたはビジネス書の価値を定量化する分析官です。
      以下の書籍を分析し、JSON形式でのみ回答してください。

      書籍名: 『${bookTitle}』
      著者名: ${author ? author : "不明（書籍名から推測してください）"}

      【重要：採点ルール（厳守）】
      この本を読むことで得られる経験値を算出します。以下の「持ち点配分ルール」を必ず守ってください。

      1. **ビジネスOSの5項目**（戦略,実行,論理,心理,教養）
         - 5つの項目の点数合計が**「ちょうど10点」**になるように配分してください。
         - 本の内容に最も関連する項目に点数を集中させ、関係ない項目は0点にしてください。

      2. **ビジネススキルの5項目**（営業,マーケ,IT,財務,管理）
         - 5つの項目の点数合計が**「ちょうど10点」**になるように配分してください。
         - まったく言及がないスキル分野は0点にしてください。

      例: 『イシューからはじめよ』の場合
      OS: 戦略2, 実行0, 論理8, 心理0, 教養0 (合計10)
      Skill: 営業0, マーケ0, IT 0, 財務0, 管理10 (合計10)

      【出力フォーマット(JSON)】
      {
        "author": "正式な著者名",
        "summary": "100文字以内のあらすじ（デスマス調）",
        "tags": ["タグ1", "タグ2"],
        "points": {
          "os_strategy": 0~10,
          "os_execution": 0~10,
          "os_logic": 0~10,
          "os_humanity": 0~10,
          "os_liberal_arts": 0~10,
          "skill_sales": 0~10,
          "skill_marketing": 0~10,
          "skill_technology": 0~10,
          "skill_finance": 0~10,
          "skill_management": 0~10
        }
      }

      【注意】
      - os_humanityは「心理・人間性」として評価してください。
      - 合計値の計算ミスがないようにしてください。
    `;

    console.log("AI分析開始: " + bookTitle);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("AIからの返答あり");

    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString);

  } catch (error: any) {
    console.error("AI Error:", error);
    throw new Error("AI分析エラー: " + error.message);
  }
}
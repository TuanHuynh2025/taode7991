import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { ExamConfig, Question, QuestionType } from "../types";
import { CURRICULUM_DATA } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateExamQuestions = async (config: ExamConfig): Promise<Question[]> => {
  const totalQuestions = config.numMC + config.numTF + config.numShort + config.numEssay;
  
  if (totalQuestions === 0) return [];

  let contextInstruction = "";
  const parts: any[] = [];

  if (config.mode === 'file') {
    if (config.uploadedFileBase64 && config.uploadedFileMimeType) {
      parts.push({
        inlineData: {
          data: config.uploadedFileBase64,
          mimeType: config.uploadedFileMimeType
        }
      });
      contextInstruction = "dựa trên TÀI LIỆU ĐÍNH KÈM (File PDF). Phân tích kỹ nội dung, dạng bài, và kiến thức trong file để tạo đề tương tự.";
    } else {
      contextInstruction = "ngẫu nhiên tổng hợp kiến thức Toán 9 (vì người dùng chưa tải file).";
    }
  } else {
    // Curriculum Mode
    const selectedTopicNames: string[] = [];
    
    // Flatten selected topics to get names
    CURRICULUM_DATA.forEach(chapter => {
      chapter.topics.forEach(topic => {
        if (config.selectedTopics.includes(topic.id)) {
          selectedTopicNames.push(`${chapter.name} - ${topic.name}`);
        }
      });
    });

    if (selectedTopicNames.length === 0) {
       // Fallback if nothing selected but button clicked (UI should prevent)
       contextInstruction = "ngẫu nhiên tổng hợp kiến thức Toán 9.";
    } else {
       contextInstruction = `tập trung vào các CHỦ ĐỀ KIẾN THỨC SAU:\n${selectedTopicNames.map(t => `- ${t}`).join('\n')}`;
    }
  }

  const prompt = `
    Đóng vai là một giáo viên Toán lớp 9 giỏi chuyên môn, am hiểu chương trình GDPT 2018 (Sách giáo khoa Chân trời sáng tạo).
    Hãy soạn một đề kiểm tra ${contextInstruction}
    
    YÊU CẦU CHUNG:
    1. Tạo ra các câu hỏi MỚI, không sao chép y nguyên sách giáo khoa hay tài liệu mẫu.
    2. Đảm bảo số liệu hợp lý, tính toán ra kết quả đẹp (nếu có thể).
    3. Mức độ đánh giá chung: ${config.difficulty}.
    
    CẤU TRÚC ĐỀ THI (BẮT BUỘC PHẢI ĐỦ SỐ LƯỢNG):
    1. PHẦN 1: ${config.numMC} câu Trắc nghiệm nhiều lựa chọn (Chọn 1 đáp án đúng A,B,C,D).
    2. PHẦN 2: ${config.numTF} câu Trắc nghiệm Đúng/Sai. Mỗi câu hỏi có một đề bài chính và 4 ý nhỏ (a, b, c, d). Học sinh phải xác định mỗi ý là Đúng hay Sai.
    3. PHẦN 3: ${config.numShort} câu Trả lời ngắn. Học sinh tính toán và điền kết quả (thường là số hoặc biểu thức đơn giản).
    4. PHẦN 4: ${config.numEssay} câu Tự luận. Yêu cầu trình bày lời giải chi tiết.

    YÊU CẦU KỸ THUẬT:
    - Các công thức toán học PHẢI bọc trong dấu $ (ví dụ $x^2$, $\\frac{1}{2}$).
    - Không sử dụng các môi trường LaTeX phức tạp không được MathJax hỗ trợ cơ bản.
  `;

  parts.push({ text: prompt });

  // Define Schema
  const subQuestionSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "a, b, c, or d" },
      content: { type: Type.STRING, description: "Nội dung ý nhỏ" },
      isCorrect: { type: Type.BOOLEAN, description: "True nếu mệnh đề đúng, False nếu sai" },
      explanation: { type: Type.STRING, description: "Giải thích ngắn gọn" }
    },
    required: ["id", "content", "isCorrect"]
  };

  const questionSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      type: { 
        type: Type.STRING, 
        enum: [
          QuestionType.MULTIPLE_CHOICE, 
          QuestionType.TRUE_FALSE, 
          QuestionType.SHORT_ANSWER, 
          QuestionType.ESSAY
        ] 
      },
      content: { type: Type.STRING },
      options: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Chỉ dành cho Trắc nghiệm nhiều lựa chọn (4 đáp án)"
      },
      subQuestions: {
        type: Type.ARRAY,
        items: subQuestionSchema,
        description: "Chỉ dành cho Trắc nghiệm Đúng/Sai (4 ý)"
      },
      correctAnswer: { type: Type.STRING, description: "Đáp án đúng hoặc lời giải chi tiết" },
      points: { type: Type.NUMBER }
    },
    required: ["id", "type", "content", "points"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: questionSchema
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as Question[];
    }
    throw new Error("No response text from Gemini");

  } catch (error) {
    console.error("Error generating exam:", error);
    // Fallback simple error question
    return [
      {
        id: "error-1",
        type: QuestionType.ESSAY,
        content: "Có lỗi xảy ra khi kết nối API hoặc xử lý. Vui lòng thử lại. Lỗi: " + (error as Error).message,
        correctAnswer: "",
        points: 0
      }
    ];
  }
};

export const createExamChatSession = (questions: Question[]): Chat => {
  let context = "Bạn là một trợ lý AI thông minh, giỏi Toán lớp 9 (Chương trình GDPT 2018).";
  
  if (questions.length > 0) {
    context += `\n\nHọc sinh đang làm một đề thi Toán với các câu hỏi sau:\n`;
    questions.forEach((q, idx) => {
      context += `\n--- Câu ${idx + 1} (${q.type}) ---\n`;
      context += `Nội dung: ${q.content}\n`;
      if (q.options) context += `Các đáp án: ${q.options.join(', ')}\n`;
      if (q.subQuestions) {
        context += `Các ý đúng sai:\n`;
        q.subQuestions.forEach(sq => context += `- ${sq.id}) ${sq.content} -> ${sq.isCorrect} (${sq.explanation})\n`);
      }
      if (q.correctAnswer) context += `Đáp án/Lời giải: ${q.correctAnswer}\n`;
    });
    context += `\n\nNHIỆM VỤ CỦA BẠN:
    - Giải đáp thắc mắc của học sinh về các câu hỏi này.
    - Gợi ý cách làm (không đưa ra đáp án ngay nếu học sinh chưa thử).
    - Giải thích các khái niệm Toán học liên quan.
    - Luôn dùng công thức Toán trong dấu $ (ví dụ $x^2$) để hiển thị đẹp.
    - Giọng văn thân thiện, khuyến khích học tập.`;
  } else {
    context += "\nHiện tại chưa có đề thi nào được tạo. Hãy hướng dẫn học sinh tạo đề hoặc giải đáp thắc mắc chung về Toán 9.";
  }

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: context,
    }
  });
};
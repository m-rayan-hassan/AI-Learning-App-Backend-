import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateQuiz = async (url, numQuestions = 5) => {
  const prompt = `Generate exactly ${numQuestions} multiple choice questions from the provided document.
    Format each question as: 
    Q: [Question]
    O1: [Option 1]
    O2: [Option 2]
    O3: [Option 3]
    O4: [Option 4]
    C: [Correct option - exactly as above]
    E: [Brief explaination]
    D: [Difficulty: easy, medium, or hard]
    
    Seperate questions with ---`;

  const pdfResp = await fetch(url).then((response) => response.arrayBuffer());

  const contents = [
    { text: prompt },
    {
      inlineData: {
        mimeType: "application/pdf",
        data: Buffer.from(pdfResp).toString("base64"),
      },
    },
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
    });

    const generatedText = response.text;

    const questions = [];
    const questionBlocks = generatedText.split("---").filter((q) => q.trim());

    for (const block of questionBlocks) {
      const lines = block.trim().split("\n");
      let question = "",
        options = [],
        correctAnswer = "",
        explaination = "",
        difficulty = "medium";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("Q:")) {
          question = trimmed.substring(2).trim();
        } else if (trimmed.match(/^O\d:/)) {
          options.push(trimmed.substring(3).trim());
        } else if (trimmed.startsWith("C:")) {
          correctAnswer = trimmed.substring(2).trim();
        } else if (trimmed.startsWith("E:")) {
          explaination = trimmed.substring(2).trim();
        } else if (trimmed.startsWith("D:")) {
          const diff = trimmed.substring(2).trim().toLowerCase();
          if (["easy", "medium", "hard"].includes(diff)) {
            difficulty = diff;
          }
        }
      }

      if (question && options.length === 4 && correctAnswer) {
        questions.push({
          question,
          options,
          correctAnswer,
          explaination,
          difficulty,
        });
      }
    }

    return questions.slice(0, numQuestions);
  } catch (error) {
    console.error("Gemini API error", error);
    throw new Error("Failed to generate quiz");
  }
};

export const generateFlashcards = async (url, count = 10) => {
  const prompt = `Generate exactly ${count} educational flashcards from the document that provided you.
    Format of each flash card as:
    Q: [Clear, specific question]
    A: [Concise, accurate answer]
    D: [Difficulty level: easy, medium, or hard]

    Seperate each flashcard with "---"`;

  const pdfResp = await fetch(url).then((response) => response.arrayBuffer());

  const contents = [
    { text: prompt },
    {
      inlineData: {
        mimeType: "application/pdf",
        data: Buffer.from(pdfResp).toString("base64"),
      },
    },
  ];
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
    });

    const generatedText = response.text;

    const flashcards = [];
    const cards = generatedText.split("---").filter((c) => c.trim());

    for (const card of cards) {
      const lines = card.trim().split("\n");
      let question = "",
        answer = "",
        difficulty = "medium";

      for (const line of lines) {
        if (line.startsWith("Q:")) {
          question = line.substring(2).trim();
        } else if (line.startsWith("A:")) {
          answer = line.substring(2).trim();
        } else if (line.startsWith("D:")) {
          const diff = line.substring(2).trim().toLowerCase();
          if (["easy", "medium", "hard"].includes(diff)) {
            difficulty = diff;
          }
        }
      }

      if (question && answer) {
        flashcards.push({question, answer, difficulty});
      }
    }

    return flashcards.slice(0, count);
  } catch (error) {
    console.error("Gemini API error: ", error);
    throw new Error("Failed to generate flashcards");
  }
};

export const generateSummary = async (url) => {
  const prompt = `Provide a concise summary of the following document, highlighting the key concepets, main ideas, and important points.
  Keep the summary clear and structured`;

  const pdfResp = await fetch(url).then((response) => response.arrayBuffer());

  const contents = [
    { text: prompt },
    {
      inlineData: {
        mimeType: "application/pdf",
        data: Buffer.from(pdfResp).toString("base64"),
      },
    },
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error", error);
    throw new Error("Failed to generate summary");
  }
};

export const chatWithContext = async (question, url, chatHistoryMessages) => {
  const prompt = `Based on the context of the provided document, analyze the context and answer the user's question
  If the answer is not in the context, say so.
  
  Question: ${question}

  Previous Chat of user and ai assisstant: ${chatHistoryMessages}
  
  Answer:`;

  const pdfResp = await fetch(url).then((response) => response.arrayBuffer());

  const contents = [
    { text: prompt },
    {
      inlineData: {
        mimeType: "application/pdf",
        data: Buffer.from(pdfResp).toString("base64"),
      },
    },
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error", error);
    throw new Error("Failed to process chat request");
  }
};

export const explainConcept = async (concept, url) => {
  const prompt = `Explain the concept of ${concept} based on the context of the document provided
    Provide a clear, educational explaination that is easy to understand.`;

  const pdfResp = await fetch(url).then((response) => response.arrayBuffer());

  const contents = [
    { text: prompt },
    {
      inlineData: {
        mimeType: "application/pdf",
        data: Buffer.from(pdfResp).toString("base64"),
      },
    },
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error", error);
    throw new Error("Failed to explain concept");
  }
};

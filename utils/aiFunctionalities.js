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
        flashcards.push({ question, answer, difficulty });
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

export const generateVoiceOverviewScript = async (url) => {
  const prompt = `You are an expert educator and narrator for a premium AI learning app.

Your task is to generate a voice-over script based on the provided document.

STYLE & DELIVERY RULES:
- The script must sound completely natural when spoken aloud.
- Write exactly how a great teacher would speak to a curious student.
- Use a friendly, confident, and engaging tone.
- Explain concepts clearly, step by step, without sounding robotic.
- Use short and medium-length sentences.
- Use pauses with ellipses (…) where a natural pause would occur.
- Use excitement sparingly with exclamation marks (!) only when appropriate.
- Use a calm, softer tone by slowing the sentence structure — NOT by labeling emotions.
- NEVER include brackets, labels, or emotion tags like [whispers], [excitedly], etc.
- Everything you write will be spoken exactly as written.

EDUCATIONAL GUIDELINES:
- Assume the listener is intelligent but learning this topic for the first time.
- Use simple analogies where helpful.
- Avoid filler phrases like “In this document we will…”
- Speak directly to the listener using “you” where appropriate.
- Maintain a smooth narrative flow from one idea to the next.

OUTPUT REQUIREMENTS:
- Output ONLY the voice-over script.
- Do NOT include headings, bullet points, or formatting.
- Do NOT mention the document, PDF, or source.
- Do NOT include any meta commentary.

The script should feel like a calm, engaging podcast-style explanation that helps the listener truly understand the material.
`;

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
    throw new Error("Failed to generate voice overview");
  }
};

export const generatePodcast = async (url, voice_id1, voice_id2) => {
  const prompt = `You are writing a natural, educational podcast-style dialogue for a premium AI learning app.

The goal is to help the listener deeply understand the provided document through a friendly conversation between two voices.

VOICE ROLES:
- Voice A (voiceId: ${voice_id1}): A calm, confident expert who explains concepts clearly.
- Voice B (voiceId: ${voice_id2}): A curious learner who asks smart questions, seeks clarification, and reacts naturally.

STYLE & DELIVERY RULES:
- The dialogue must sound completely natural when spoken aloud.
- Write exactly how real people speak in a podcast.
- Keep sentences conversational, clear, and engaging.
- Use curiosity, mild excitement, and thoughtful pauses through wording — NOT labels.
- Do NOT include any emotion tags, brackets, or stage directions.
- Do NOT include filler like “Welcome to the podcast” or “In this episode”.
- Avoid robotic back-and-forth. Let the conversation flow naturally.
- Voice B should ask genuine follow-up questions, not scripted ones.
- Voice A should explain using simple analogies and examples when helpful.
- Avoid repeating information unnecessarily.

EDUCATIONAL GUIDELINES:
- Assume the listener is intelligent but new to the topic.
- Break complex ideas into small, understandable parts.
- Focus on clarity and understanding, not speed.
- Speak directly to the listener using natural language.

OUTPUT FORMAT (STRICT):
- Output ONLY a JSON array.
- Each item must be an object with exactly:
  - "voiceId": one of the provided voice IDs
  - "text": the dialogue text for that speaker
- Do NOT include anything outside the JSON array.
- Do NOT wrap the output in markdown.

Example format:
[
  {
    "voiceId": ${voice_id1},
    "text": "Let’s start by thinking about this in a simple way..."
  },
  {
    "voiceId": ${voice_id2},
    "text": "Okay, that makes sense. But what happens when..."
  }
]
`;

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
    throw new Error("Failed to generate podcast");
  }
};

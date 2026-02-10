import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getExtractedContent = async (url) => {
  const prompt = `**System Role:** You are an Expert Content Reconstruction AI and Instructional Designer. Your goal is to transcode documents into a semantic, machine-readable format that preserves 100% of the educational value for downstream processing (quizzes, flashcards, scripts).

**Input:** You will receive a document (PDF, image, or text) containing educational material.
**Output:** You must generate a strictly formatted text response using the tags defined below.

### 1. CRITICAL EXTRACTION RULES
* **Lossless Content:** Do not summarize. Retain all definitions, dates, examples, and nuances. If a section is repetitive, merge it logically, but do not delete unique information.
* **Visual Logic:** For every diagram, chart, or image, you must "transcode" the visual data into text. Imagine you are describing it to a blind student who needs to pass a physics exam based on your description alone.
* **No Conversational Filler:** Do NOT output "Here is the breakdown" or "The document contains". Start immediately with [DOCUMENT_START].
* **Latex & Code:** Keep mathematical formulas in LaTeX format. Keep code snippets in code blocks.

### 2. STRICT OUTPUT STRUCTURE
You must strictly adhere to this format. Do not create new tags.

[DOCUMENT_START]

[SECTION]
Title: <Exact Section Title>
Content:
<Full, detailed content. If the text spans multiple paragraphs, keep them all.>

[CONCEPT_BLOCK]
<Use this for specific definitions, formulas, or laws that are critical for flashcards.>
Term: <The concept name>
Definition: <The precise definition>
Context: <Example or additional context provided in text>

[DIAGRAM]
Title: <Title of the diagram>
Visual Components: <List the objects, arrows, and layout structure>
Educational Value: <Explain the process or relationship shown. Example: "This diagram illustrates the step-by-step flow of photosynthesis...">

[CHART]
Type: <Bar, Line, Pie, etc.>
Title: <Chart Title>
X-Axis: <Label and Unit>
Y-Axis: <Label and Unit>
Data Points:
* <List key data points visible, e.g., "Year 2020: 50% increase">
Trend Analysis: <Describe the direction (upward/downward) and implications>

[TABLE]
Title: <Table Title>
Structure: <Describe columns, e.g., "Comparison between Mitosis and Meiosis">
Row Data:
* <Row 1 content>
* <Row 2 content>
Key Insight: <What comparison or data point is this table proving?>

[IMPORTANT_NOTE]
<Copy verbatim any text inside warning boxes, tips, or bolded "Remember" sections.>

[DOCUMENT_END]

### 3. QUALITY CHECKS
* **Did you skip a diagram?** Go back and extract it.
* **Is the text clean?** Remove headers, footers, and page numbers.
* **Is it readable?** Ensure logical flow is maintained.

**Begin processing the document now.**`;

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
    throw new Error("Failed to generate quiz");
  }
};

export const generateQuiz = async (content, numQuestions = 5) => {
  const prompt = `**System Role:** You are an expert Assessment Specialist creating a high-quality exam for advanced learners.

**Goal:** Generate exactly ${numQuestions} multiple-choice questions that test **critical thinking** and **concept application**, not just surface-level recall.

**Question Design Rules:**
1. **Plausible Distractors:** All wrong options (distractors) must be realistic and derived from common misconceptions in the text. Do NOT use obvious fillers like "None of the above" or silly answers.
2. **No "All of the above":** Avoid "All of the above" or "A and B only" style options.
3. **Application Focus:** Frame questions around scenarios or "why/how" logic rather than simple definitions.
4. **Self-Contained:** The explanation (E) must clearly state *why* the correct answer is right AND *why* the distractors are wrong.

**Output Format (STRICT):**
You must strictly follow this format for every question. Separate questions with "---".

Q: [The Question text]
O1: [Option 1]
O2: [Option 2]
O3: [Option 3]
O4: [Option 4]
C: [The Correct Option Text (must match one of the above exactly)]
E: [Explanation: Why is this correct? Why are others wrong?]
D: [Difficulty: easy, medium, or hard]

---

**Input Content:**
${content}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
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

export const generateFlashcards = async (content, count = 10) => {
  const prompt = `**System Role:** You are an expert in Spaced Repetition Learning.

**Goal:** Generate exactly ${count} high-yield flashcards optimized for active recall.

**Card Design Rules:**
1. **Atomic Concepts:** Each card should test ONE specific idea. Do not bundle multiple complex facts into one card.
2. **Front (Q):** Use clear triggers. Instead of "What is X?", use "Function of X in context of Y" or "Key difference between A and B".
3. **Back (A):** Be concise. Get straight to the answer. Avoid "The answer is..." or full sentences if a keyword suffices.
4. **Coverage:** Ensure the cards cover the entire breadth of the provided content, from start to finish.

**Output Format (STRICT):**
Separate each flashcard with "---".

Q: [Front of card - The Trigger]
A: [Back of card - The Answer]
D: [Difficulty: easy, medium, or hard]

---

**Input Content:**
${content}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
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

export const generateSummary = async (content) => {
  const prompt = `**System Role:** You are an Academic Synthesizer.

**Goal:** Distill the provided content into a structured, high-impact summary that acts as a "Cheat Sheet" for a student.

**Style Guidelines:**
1. **Executive Summary:** Start with a 2-sentence "Big Picture" overview.
2. **Core Concepts:** Group the summary into 3-5 main themes found in the text.
3. **No Fluff:** Remove conversational filler. Use active verbs.
4. **Clarity:** If the content is technical, simplify the language slightly without losing accuracy.

**Output Format:**
- **Executive Summary**
- **Key Concepts** (Use bullet points)
- **Critical Takeaways**

**Input Content:**
${content}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error", error);
    throw new Error("Failed to generate summary");
  }
};

export const chatWithContext = async (
  question,
  content,
  chatHistoryMessages,
) => {
  const prompt = `**System Role:** You are a Socratic AI Tutor. Your goal is to help the user learn from the document provided.

**Instructions:**
1. **Source Truth:** Answer ONLY based on the "Context" provided below. If the answer is not in the text, state: "I cannot find that information in this specific document."
2. **Tone:** Be encouraging, precise, and educational.
3. **Citation:** If possible, mention which part of the text your answer comes from (e.g., "According to the section on X...").
4. **Chat History:** Use the "Previous Chat" to maintain context (e.g., if the user says "Tell me more", know what they are referring to).

**Context:**
${content}

**Previous Chat:**
${chatHistoryMessages}

**User Question:**
${question}

**Answer:**`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error", error);
    throw new Error("Failed to process chat request");
  }
};

export const explainConcept = async (concept, content) => {
  const prompt = `**System Role:** You are an expert educator using the Feynman Technique.

**Goal:** Explain the concept of "${concept}" so clearly that a beginner would grasp it immediately, but keep the technical depth for an advanced learner.

**Structure of Explanation:**
1. **The "ELI5" (Explain Like I'm 5):** A one-sentence simple definition.
2. **The Analogy:** A real-world comparison to make the concept stick (e.g., comparing a firewall to a security guard).
3. **The Technical Deep Dive:** The specific details, formulas, or rigorous definition found in the source text.

**Input Content:**
${content}`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error", error);
    throw new Error("Failed to explain concept");
  }
};

export const generateVoiceOverviewScript = async (content) => {
  const prompt = `**System Role:** You are the host of a top-tier educational podcast.

**Goal:** Write a solo voice-over script that teaches the core message of this content.

**Speaking Style:**
- **Warm & Authoritative:** You are an expert, but you are friendly.
- **Narrative Flow:** Do not just list facts. Connect ideas. Use phrases like "Now, this leads us to..." or "Here is where it gets interesting..."
- **Visual Painting:** Since this is audio, describe the key concepts vividly.
- **Spoken Word Optimization:** Use contractions (don't -> do not). Avoid long, winding sentences. Write for the ear, not the eye.

**Constraint:**
- Output ONLY the raw text of the script.
- Do NOT use Markdown formatting.
- Do NOT use headers or "Intro/Outro" labels.

**Input Content:**
${content}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error", error);
    throw new Error("Failed to generate voice overview");
  }
};

export const generatePodcast = async (content, voice_id1, voice_id2) => {
  const prompt = `**System Role:** You are a Podcast Scriptwriter for an educational show.

**Characters:**
- **Voice A (The Expert - ${voice_id1}):** Knowledgeable, patient, clear. Uses analogies.
- **Voice B (The Learner - ${voice_id2}):** Curious, enthusiastic, smart but new to the topic. Represents the listener's internal monologue.

**Dialogue Dynamics:**
1. **No Robot Talk:** Avoid "That is a great question, let me explain." Instead use: "Exactly! And the reason for that is..."
2. **The "Aha" Moment:** Have Voice B struggle with a concept slightly, then "get it" after Voice A explains. This reinforces learning for the listener.
3. **Pacing:** Keep exchanges relatively short (2-4 sentences max per turn).

**Output Format (STRICT JSON):**
You must output a VALID JSON array. Do NOT wrap it in markdown code blocks (like \`\`\`json). Just return the raw array.

Structure:
[
  {
    "voiceId": "${voice_id1}",
    "text": "Script for voice A..."
  },
  {
    "voiceId": "${voice_id2}",
    "text": "Script for voice B..."
  }
]

**Input Content:**
${content}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error", error);
    throw new Error("Failed to generate podcast");
  }
};

export const generateVideoContent = async (content) => {
  const prompt = `
You are an expert Documentary Director and Instructional Designer.
Your task is to convert the provided content into a structured JSON object for a high-end educational video.

We use Gamma App (Visuals) and ElevenLabs (Audio).

Content: ${content}

REQUIREMENTS:
1. **Structure & Pacing:** Break content into 5-8 slides.
2. **Gamma Visual Prompts (High Quality):** In "gamma_card_content", you must drive the AI to create beautiful slides.
   - **Layout:** Request specific layouts (e.g., "Split screen," "Timeline," "Gallery," "Big Number").
   - **Imagery:** Include a dedicated "Image Style" instruction. Use adjectives like "Photorealistic," "Cinematic lighting," "4k," "Minimalist vector," or "Detailed diagram" to ensure attractive visuals.
   - **On-Screen Text:** clearly state what text should be on the slide (Title + Bullet points).
3. **Audio-Visual Sync (CRITICAL):** The "voiceover_script" must strictly align with the visual text to help the user understand.
   - **Rule:** If a specific term or bullet point is written on the slide, the voiceover MUST speak that term exactly as it appears.
   - **Context:** Use phrases like "As you can see here...", "Notice the diagram on the right...", or "These three steps shown below..." to connect the audio to the video.
4. **Natural Delivery:** Write spoken English (contractions, natural flow), but ensure it is educational and clear.

OUTPUT FORMAT (Strict JSON):
You must output a VALID JSON array. Do NOT wrap it in markdown code blocks.

{
  "presentation_title": "String",
  "gamma_global_prompt": "String",
  "slides": [
    {
      "index": 1,
      "type": "title_slide",
      "gamma_card_content": "Layout: Cinematic Title Card. Title: 'The Quantum Realm'. Subtitle: 'Unlocking the Subatomic'. Visual: A glowing, futuristic quantum particle with blue neon lighting, 4k resolution, dark background.",
      "voiceover_script": "Welcome. Today, we are stepping into 'The Quantum Realm', unlocking the mysteries of the subatomic world."
    },
    {
      "index": 2,
      "type": "content_slide",
      "gamma_card_content": "Layout: Three-Column Grid. Title: 'Key Principles'. Columns: 1. Superposition, 2. Entanglement, 3. Interference. Visual: detailed 3D icons representing each physics concept.",
      "voiceover_script": "There are three key principles you see listed here: Superposition, Entanglement, and Interference. Let's break down the first one, Superposition..."
    }
  ],
  slideCount: 10
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    const data = JSON.parse(response.text);
    return data;
  } catch (error) {
    console.error("Gemini API error", error);
    throw new Error("Failed to generate video content");
  }
};

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getExtractedContent = async (url) => {
  const prompt = `**System Role:** You are an Elite Content Reconstruction AI and Instructional Designer with forensic-level attention to detail. Your singular mission is to perform a COMPLETE, LOSSLESS transcription of the entire document into a semantic, machine-readable format that preserves 100% of the educational value for downstream processing (quizzes, flashcards, voice scripts, video generation, and AI tutoring).

**Input:** You will receive a document (PDF, image, or text) containing educational material.
**Output:** You must generate a strictly formatted text response using ONLY the tags defined below. No other format is acceptable.

### 1. CRITICAL EXTRACTION RULES — ZERO TOLERANCE FOR DATA LOSS
* **ABSOLUTE LOSSLESS EXTRACTION:** You must extract EVERY SINGLE sentence, paragraph, definition, date, name, figure, equation, footnote, caption, sidebar, example, case study, and nuance from the document. Do NOT summarize, paraphrase, condense, or skip ANY content. If a paragraph contains 10 sentences, ALL 10 sentences must appear in your output. Missing even one data point is a critical failure.
* **Multi-Pass Verification:** After your first extraction pass, mentally re-scan the entire document page by page. Ask yourself: "Did I capture every heading? Every sub-heading? Every bullet point? Every figure caption? Every table? Every sidebar or callout box?" If anything is missing, add it.
* **Visual Logic (Forensic Detail):** For EVERY diagram, chart, figure, graph, illustration, or image — no matter how small — you MUST "transcode" the visual data into rich descriptive text. Describe it as if explaining to a blind student who needs to ace an exam based solely on your description. Include: all labels, arrows, relationships, spatial layout, colors if meaningful, numerical values, and the educational takeaway.
* **No Conversational Filler:** Do NOT output "Here is the breakdown", "The document contains", "Let me explain", or any meta-commentary. Start immediately with [DOCUMENT_START] and end with [DOCUMENT_END]. Nothing else outside these tags.
* **LaTeX & Code Preservation:** Preserve ALL mathematical formulas in LaTeX format (e.g., $E = mc^2$). Preserve ALL code snippets in their original syntax with proper formatting.
* **Ordering:** Maintain the EXACT sequential order of the document. Do not rearrange sections.
* **Language Preservation:** If the document contains content in multiple languages, preserve each in its original language.
* **Footnotes & References:** Extract ALL footnotes, endnotes, citations, and bibliography entries. Place them in a [SECTION] tagged "References" or "Footnotes" at the appropriate location.

### 2. STRICT OUTPUT STRUCTURE — DO NOT DEVIATE
You must strictly adhere to this format. Do NOT create new tags. Do NOT add markdown formatting outside of content areas. Every piece of content must be placed in the most appropriate tag below.

[DOCUMENT_START]

[SECTION]
Title: <Exact Section Title or Heading as it appears in the document>
Content:
<Full, complete, unabridged content. If the text spans multiple paragraphs, include ALL paragraphs verbatim. Include ALL bullet points, numbered lists, examples, case studies, and sub-sections. Do NOT truncate.>

[CONCEPT_BLOCK]
<Use this for EVERY specific definition, formula, theorem, law, principle, key term, or critical fact that would be valuable for flashcard or quiz generation.>
Term: <The exact concept name>
Definition: <The precise, complete definition as stated in the document>
Context: <Any example, application, or additional context provided in the source text>

[DIAGRAM]
Title: <Title or caption of the diagram exactly as it appears>
Visual Components: <Exhaustively list ALL objects, shapes, arrows, labels, colors, layers, and spatial layout>
Educational Value: <Explain the complete process, relationship, or concept the diagram illustrates. Be thorough — describe every step, every connection, every flow shown.>

[CHART]
Type: <Bar, Line, Pie, Scatter, Histogram, etc.>
Title: <Chart Title exactly as shown>
X-Axis: <Label, Unit, and Range>
Y-Axis: <Label, Unit, and Range>
Data Points:
* <List ALL visible data points with their exact values, e.g., "Year 2020: 50% increase">
* <Continue listing every data point>
Trend Analysis: <Describe the overall pattern, direction (upward/downward/stable), inflection points, outliers, and educational implications>

[TABLE]
Title: <Table Title exactly as shown>
Structure: <Describe all columns and their headers>
Row Data:
* <Row 1: Include ALL cell values>
* <Row 2: Include ALL cell values>
* <Continue for EVERY row in the table>
Key Insight: <What comparison, pattern, or conclusion does this table demonstrate?>

[IMPORTANT_NOTE]
<Copy VERBATIM any text inside warning boxes, tips, "Remember" sections, highlighted callouts, sidebars, or specially formatted emphasis blocks. Include the exact wording.>

[DOCUMENT_END]

### 3. MANDATORY QUALITY VERIFICATION CHECKLIST
Before finalizing your output, you MUST verify ALL of the following:
* **Completeness Check:** Did you extract EVERY section, heading, and sub-heading? Go back and count them against the document.
* **Diagram/Figure Audit:** Did you capture EVERY visual element? Count the diagrams/charts/figures in the document and ensure each has a corresponding tag in your output.
* **Table Audit:** Did you capture EVERY table with ALL of its rows and columns? Verify row counts match.
* **Concept Coverage:** Did you create [CONCEPT_BLOCK] entries for ALL key terms, definitions, formulas, and laws?
* **Clean Output:** Remove all headers, footers, page numbers, and watermarks from the content.
* **Logical Flow:** Ensure the extracted content follows the same logical order as the original document.
* **No Hallucination:** Every piece of text in your output must come directly from the document. Do NOT add information that is not in the source.

**FAILURE MODE:** If you skip content, summarize instead of extracting fully, or deviate from the output format, the entire downstream pipeline (quizzes, flashcards, voice scripts, videos) will produce incorrect results. Accuracy is non-negotiable.

**Begin processing the document now. Extract EVERYTHING.**`;

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
  const prompt = `**System Role:** You are a world-class Assessment Architect, Exam Paper Setter, and Cognitive Science Expert. You have decades of experience setting papers for top universities, board exams, and competitive entrance tests. You know exactly which questions examiners love to ask and which concepts are tested repeatedly. Your goal is to generate the **highest-value, most exam-likely questions** from the given content.

**Goal:** Generate EXACTLY ${numQuestions} multiple-choice questions that are **accurate, high-yield, and exam-relevant**. These should be the questions a student MUST practice because they have the highest probability of appearing in real exams.

**CRITICAL — Content-Type Adaptation:**
Before generating questions, analyze the content to determine its nature:
- **If the content is mathematical, scientific, or equation-heavy** (physics, chemistry, math, engineering, etc.):
  - At least **40-50% of questions MUST be numerical/problem-solving** — give a scenario or values and ask the student to calculate, derive, or solve. Present the computed answers as options.
  - The remaining questions should be **conceptual/theoretical** — testing understanding of laws, principles, relationships, derivations, and edge cases.
  - For numerical questions, keep the calculations reasonable (2-4 steps) and provide realistic numerical options where wrong options reflect common calculation mistakes.
- **If the content is purely theoretical/descriptive** (history, literature, biology theory, law, etc.):
  - Focus on application, analysis, and evaluation-based questions.
  - Test understanding of causes, effects, comparisons, significance, and real-world application.
- **If the content is mixed:** Balance the question types proportionally to match the content mix.

**Question Length — MANDATORY Variation:**
Do NOT make all questions the same length. You MUST vary question lengths naturally:
- **~30% Short questions** (1-2 lines): Direct, crisp, to-the-point. Tests a single clear concept or asks a quick calculation. Example: "What is the SI unit of force?" or "If v = 20 m/s and t = 4s, what is the acceleration?"
- **~40% Medium questions** (2-3 lines): Provides moderate context or a small scenario before asking. Not too wordy, not too brief.
- **~30% Long questions** (3-5 lines): Scenario-based, multi-concept, or requires reading a short passage/setup before answering. Used for harder synthesis questions.
Options should also be concise — avoid unnecessarily verbose answer choices. Keep options short and crisp wherever possible.

**Question Design Principles (Non-Negotiable):**
1. **Exam Relevance First:** Every question should feel like it belongs on an actual exam paper. Prioritize:
   - Core concepts that are always tested
   - Commonly confused topics where students make mistakes
   - High-weightage topics and frequently asked patterns
   - Tricky but fair questions that separate good students from average ones
2. **Accuracy Above All:** Every question MUST be factually and scientifically correct. The correct answer must be unambiguously right. Double-check any numerical calculations or formulas before including them.
3. **Bloom's Taxonomy Coverage:** Distribute across thinking levels:
   - ~20% Knowledge/Comprehension (but framed smartly, not plain recall)
   - ~30% Application (apply a formula, principle, or concept to a situation)
   - ~30% Analysis/Evaluation (compare, contrast, identify the best option, find errors)
   - ~20% Synthesis (combine multiple concepts, multi-step reasoning)
4. **Expert-Level Distractors:** Every wrong option MUST be a plausible misconception, a common student error, a partially correct statement, or a result of a typical calculation mistake. NEVER use obviously wrong or absurd options.
5. **Banned Patterns:** Do NOT use: "All of the above", "None of the above", "A and B only", "Both A and C", or any meta-options. Each option must be standalone.
6. **Content Coverage:** Spread questions across the ENTIRE content — beginning, middle, and end. Do not cluster around one section.
7. **Difficulty Distribution:** "easy" = single-concept, direct application. "medium" = requires 2-3 step reasoning or moderate calculation. "hard" = multi-concept synthesis, subtle distinctions, or longer problem-solving.

**OUTPUT FORMAT — STRICT COMPLIANCE REQUIRED:**
Follow this EXACT format for every question. Separate questions with "---". Do NOT add any text before the first question or after the last question. Do NOT use markdown formatting, code blocks, or any wrapper.

Q: [Question text — vary length as instructed above]
O1: [Option 1 — concise and plausible]
O2: [Option 2 — concise and plausible]
O3: [Option 3 — concise and plausible]
O4: [Option 4 — concise and plausible]
C: [Correct Option Text — must EXACTLY match one of O1/O2/O3/O4]
E: [Explanation: Why correct answer is right + briefly address why each wrong option fails. For numerical questions, show the solution steps.]
D: [Difficulty: easy, medium, or hard]

---

**VALIDATION RULES:**
- Generate EXACTLY ${numQuestions} questions, no more, no less.
- Every C: value MUST be an exact copy of one of O1/O2/O3/O4 for that question.
- Every question MUST have exactly 4 options.
- Do NOT number the questions. "---" is the only delimiter.
- Vary question lengths as specified (short/medium/long mix).
- For math/science content, include both solving and theory questions.

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
  const prompt = `**System Role:** You are a world-class Cognitive Scientist and Spaced Repetition Expert who designs flashcard decks for medical students, law students, and competitive exam candidates. Your flashcards are optimized for maximum long-term retention using the principles of active recall, elaborative interrogation, and interleaving.

**Goal:** Generate EXACTLY ${count} high-yield, pedagogically optimized flashcards that enable rapid mastery of the provided content.

**Card Design Principles (Non-Negotiable):**
1. **Atomic Precision:** Each card tests exactly ONE concept, fact, or relationship. Never bundle multiple ideas into a single card.
2. **Smart Triggers (Front/Q):** Do NOT write lazy questions like "What is X?" or "Define Y." Instead, use powerful active recall triggers:
   - "What is the PRIMARY function of X in the context of Y?"
   - "How does A differ from B in terms of [specific dimension]?"
   - "Why does [process] occur before [other process]?"
   - "What would happen if [condition] were changed in [system]?"
   - "Which principle explains why [phenomenon] occurs?"
   The front of the card should force the brain to RETRIEVE and RECONSTRUCT the answer, not just recognize it.
3. **Precise Answers (Back/A):** Be direct and concise — get to the answer immediately. No filler phrases like "The answer is..." or "This refers to...". Use the minimum words needed for a complete, accurate answer. Include the key term, mechanism, or distinction.
4. **Comprehensive Coverage:** Cards MUST span the ENTIRE content from beginning to end. Do not cluster cards around one section. Every major concept, definition, process, comparison, formula, and key fact should be represented.
5. **Difficulty Calibration:**
   - "easy" = Single fact recall or basic definition (with smart framing)
   - "medium" = Requires understanding a relationship, process, or comparison
   - "hard" = Requires synthesizing multiple concepts or applying knowledge to a novel scenario
6. **No Duplicates:** Each card must test a UNIQUE piece of knowledge. No two cards should have overlapping answers.

**OUTPUT FORMAT — STRICT COMPLIANCE REQUIRED:**
Separate each flashcard with "---". Do NOT add any text before the first card or after the last card. Do NOT use markdown formatting, code blocks, or any wrapper.

Q: [Front of card — A sharp, specific active recall trigger]
A: [Back of card — Concise, precise answer]
D: [Difficulty: easy, medium, or hard]

---

**VALIDATION RULES:**
- You MUST generate EXACTLY ${count} flashcards, no more, no less.
- Every card MUST have all three fields: Q, A, and D.
- The D field MUST be one of: easy, medium, or hard (lowercase).
- Do NOT number the cards. The "---" separator is the only delimiter.

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
  const prompt = `**System Role:** You are an Elite Academic Synthesizer and Visual Information Designer used by top-tier universities. You create the kind of study summaries that students screenshot and share because they're so perfectly crafted — clear, beautiful, and instantly useful.

**Goal:** Distill the provided content into a visually stunning, ultra-concise, high-impact "Cheat Sheet" summary that lets a student grasp the entire topic in under 2 minutes.

**Style Guidelines (Non-Negotiable):**
1. **Executive Summary:** Open with a powerful 2-3 sentence "Big Picture" overview that captures the CORE thesis and significance of the content. Make it punchy and memorable. Use comparison tables (markdown) when the content involves contrasting ideas, and liberally use relevant emojis to make it visually engaging and scannable.
2. **Key Concepts:** Organize the most critical ideas into clearly themed groups using beautifully formatted bullet points. Each bullet should be:
   - **Bold the key term** followed by a crisp 1-2 sentence explanation
   - Use sub-bullets for supporting details when needed
   - Include relevant emojis for visual anchoring
   - Prioritize information by importance — most critical concepts first
3. **Brevity is King:** This is a CHEAT SHEET, not an essay. Be ruthlessly concise. Cut every unnecessary word. Use active verbs. No filler, no fluff, no "In this document we learn that...". Get straight to the substance.
4. **Completeness Within Brevity:** Despite being short, ensure ALL major topics from the content are represented. Don't sacrifice coverage for brevity — sacrifice verbosity instead.
5. **Visual Hierarchy:** Use markdown formatting strategically — bold for terms, tables for comparisons, emojis for categories. The summary should be instantly scannable.

**OUTPUT FORMAT — STRICT COMPLIANCE REQUIRED:**
You MUST use exactly this structure. Do NOT add any other sections, headers, or content outside this format. Do NOT add a title or introduction before the Executive Summary.

## Executive Summary
<2-3 sentence big picture overview with tables if applicable, emojis, and visual formatting>

## Key Concepts
<Themed, beautifully formatted bullet points covering all major ideas>

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
  const prompt = `**System Role:** You are an Elite Socratic AI Tutor — the best AI learning companion available. You combine the patience of a great teacher, the precision of a subject matter expert, and the engaging style of a top educator. Students prefer you over every other AI learning tool because your explanations are clearer, more visual, and more insightful.

**Core Instructions (Non-Negotiable):**
1. **Source Truth — STRICT:** Answer ONLY based on the "Context" provided below. Do NOT use external knowledge, assumptions, or information not present in the document. If the answer is genuinely not in the text, respond with: "🔍 I couldn't find that specific information in this document. Try asking about [suggest 2-3 related topics that ARE in the document]."
2. **Depth-Adaptive Responses:** Match your response depth to the question complexity:
   - Simple factual question → Concise, direct answer (2-4 sentences)
   - Conceptual "why/how" question → Structured explanation with examples from the text
   - Comparison question → Use a markdown table
   - Complex multi-part question → Break into numbered sections with clear headers
3. **Visual & Engaging Formatting:** Make EVERY response visually excellent:
   - Use relevant emojis (📌 💡 🔑 ⚡ 🧠 📊 ✅ ❌ 🎯 etc.) as visual anchors
   - Use **bold** for key terms and concepts
   - Use markdown tables for ANY comparison or structured data
   - Use bullet points for lists, numbered steps for processes
   - Add proper spacing (newlines) between sections for readability
4. **Teaching, Not Just Answering:** Don't just state facts — help the student UNDERSTAND:
   - Briefly explain WHY something is the way it is
   - Connect the answer to broader concepts in the document when relevant
   - Use analogies or simplified restatements for complex ideas
5. **Citation:** When possible, reference which section or part of the document your answer comes from (e.g., "As discussed in the section on [topic]...").
6. **Chat Continuity:** Use the "Previous Chat" history to maintain conversational context. Reference prior exchanges when relevant. Avoid repeating information already covered unless the user asks for clarification.
7. **Tone:** Warm, encouraging, and intellectually stimulating. Never condescending. Celebrate good questions.

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
  const prompt = `**System Role:** You are a Master Educator who combines the Feynman Technique with cutting-edge pedagogical methods. You are known for making even the most complex topics crystal clear while maintaining intellectual rigor. Your explanations are so good that students share them as definitive references.

**Goal:** Create the DEFINITIVE explanation of "${concept}" that works on multiple levels — instantly accessible to a beginner, yet rich enough to satisfy an advanced learner. Use the provided content as your authoritative source.

**Structure of Explanation (Follow This Exactly):**

1. **🎯 The "ELI5" (Explain Like I'm 5):**
   A single, beautifully simple sentence that captures the essence. Use everyday language. No jargon. A child should understand this.

2. **🔗 The Analogy:**
   A vivid, memorable real-world comparison that makes the concept "click". The analogy should:
   - Map accurately to the concept (not just superficially similar)
   - Be relatable to everyday experience
   - Highlight the KEY mechanism or principle, not just the surface idea
   Example quality: "A firewall is like a bouncer at a club — they check every person (data packet) against a guest list (security rules) and only let in the ones that belong."

3. **🔬 The Technical Deep Dive:**
   The rigorous, detailed explanation drawn specifically from the source text. Include:
   - Precise definitions, formulas, or mechanisms as stated in the content
   - How this concept connects to other concepts in the document
   - Key distinctions or nuances that are commonly confused
   - Any relevant examples, data, or evidence from the source material

**Formatting Rules:**
- Use markdown formatting (bold, bullets, tables) for visual clarity
- Use relevant emojis as section markers
- Keep each section clearly delineated
- Base ALL technical content STRICTLY on the provided source material

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
  const prompt = `**System Role:** You are the charismatic host of the #1 educational podcast on Spotify — known for making complex topics feel like fascinating conversations. Think of yourself as a blend of a brilliant professor who actually makes lectures fun and a storyteller who knows how to keep an audience hooked. Students consistently say your episodes are "better than any lecture I've ever attended."

**Goal:** Write a solo voice-over script that teaches ALL the core concepts from this content in a way that's genuinely enjoyable to listen to. The listener should feel like they're learning from a brilliant friend, not sitting in a boring lecture.

**Speaking Style & Personality (CRITICAL — This Is What Makes You Better Than Competitors):**
- **Natural & Conversational:** Sound like a real human talking, not an AI reading text. Use contractions ("don't", "isn't", "here's", "let's"). Include natural speech patterns like "So,", "Now,", "Right?", "Okay, so here's the thing —". Occasionally pause with "..." for emphasis.
- **Warm Authority:** You're clearly an expert, but you're approachable and encouraging. You get genuinely excited about interesting ideas. Show that excitement: "And THIS is the part that blew my mind when I first learned it..."
- **Narrative Threading:** NEVER just list facts sequentially. Every concept must flow naturally into the next with connective tissue:
  - "Now, this is where it gets really interesting..."
  - "And that brings us to something that seems counterintuitive at first..."
  - "So if that's true, then you might be wondering — what about...?"
  - "Here's why that matters in the real world..."
- **Vivid Explanations:** Since this is audio-only, PAINT pictures with words. Use analogies, metaphors, and relatable scenarios to make abstract concepts tangible. Don't just say "mitochondria produce energy" — say "Think of mitochondria as tiny power plants inside every single cell, constantly churning out the energy your body runs on."
- **Engagement Hooks:** Periodically re-engage the listener with rhetorical questions, surprising facts, or "imagine this" scenarios. Keep them mentally active, not passive.
- **Depth Without Complexity:** Explain concepts thoroughly and accurately, but in accessible language. Simplify WITHOUT being simplistic. Never dumb things down so much that you lose the substance.
- **Pacing:** Vary your sentence length. Short punchy sentences for impact. Longer flowing sentences for explanation. This creates a natural listening rhythm.

**Content Requirements:**
- Cover ALL major concepts from the provided content — don't skip important ideas
- Start with a compelling hook that draws the listener in immediately (NOT "Welcome to..." or "Today we'll discuss...")
- End with a satisfying conclusion that ties the key ideas together and leaves the listener feeling accomplished
- Total length: substantial enough to cover the material properly (aim for 3-6 minutes of speaking time)

**STRICT Output Constraints:**
- Output ONLY the raw script text. Nothing else.
- Do NOT use any Markdown formatting (no **, no ##, no bullets)
- Do NOT use section labels like "Intro:", "Outro:", "Section 1:"
- Do NOT include stage directions like "[pause]", "[emphasis]"
- The output should be pure spoken-word text, ready to be fed directly into a text-to-speech engine

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
  const prompt = `**System Role:** You are an award-winning Podcast Scriptwriter who has written for shows like "Radiolab", "Stuff You Should Know", and "Freakonomics". You specialize in educational dialogue that feels like two brilliant friends having a genuine conversation — never scripted, never robotic, always fascinating.

**Characters (Make Them FEEL Real):**
- **Voice A (The Expert - ${voice_id1}):** Deeply knowledgeable but never condescending. Explains with vivid analogies and real-world examples. Gets genuinely excited when explaining something cool. Has a natural teaching instinct — breaks complex ideas into digestible pieces without being asked. Uses phrases like: "Oh, this is the fun part...", "So think of it like this...", "And here's what most people get wrong about this..."
- **Voice B (The Curious Mind - ${voice_id2}):** Sharp, genuinely curious, and represents the listener's inner voice. NOT a passive student — they're intelligent and engaged. They:
  - Ask the exact questions the listener is thinking: "Wait, but doesn't that contradict...?", "Okay so basically you're saying...?"
  - Sometimes get something slightly wrong, creating a natural correction opportunity
  - Have genuine "aha!" moments: "Ohhh, okay that actually makes so much sense now!"
  - Push back when something seems counterintuitive: "Hmm, that doesn't sound right though..."
  - Make relatable connections: "Oh, so it's kind of like when...!"

**Dialogue Dynamics (CRITICAL — This Makes or Breaks The Quality):**
1. **ABSOLUTELY NO Robot Talk:** BANNED phrases: "That is a great question", "Let me explain", "As I mentioned earlier", "That's correct", "Good observation". Instead use natural responses: "Exactly!", "Right, and here's the cool part...", "Ha, I thought the same thing at first but...", "Okay so yes and no..."
2. **Natural Conversation Flow:** Include:
   - Interruptions: Voice B cutting in with "Wait wait wait —" or "Hold on —"
   - Thinking out loud: "Hmm, so if that's true then... wouldn't that mean...?"
   - Genuine reactions: "No way!", "That's wild", "Okay I did NOT expect that"
   - Brief laughter or amusement where natural: "Ha, yeah exactly"
   - Verbal fillers (sparingly): "So basically...", "I mean...", "Right, so..."
3. **The Learning Arc:** Structure the conversation so the listener learns progressively:
   - Start with an intriguing hook or question that draws the listener in
   - Build understanding layer by layer through the dialogue
   - Include 2-3 "aha moments" where Voice B (and therefore the listener) has a breakthrough
   - End with a satisfying synthesis that ties everything together
4. **Pacing & Length:** Keep individual exchanges short and punchy (1-3 sentences per turn). This creates energy and maintains attention. Occasionally one speaker can go slightly longer (3-4 sentences) for a key explanation, but the other should jump in after.
5. **Content Coverage:** The conversation MUST cover ALL major concepts from the provided content. Don't sacrifice educational completeness for entertainment — achieve BOTH.
6. **Analogies & Examples:** Voice A should use at least 2-3 vivid analogies or real-world examples throughout the conversation to make abstract concepts concrete.

**OUTPUT FORMAT — STRICT JSON COMPLIANCE:**
You MUST output a VALID JSON array. Do NOT wrap it in markdown code blocks (no \`\`\`json). Do NOT add any text before or after the array. Just return the raw JSON array.

Required structure:
[
  {
    "voiceId": "${voice_id1}",
    "text": "Script for voice A — natural spoken English with contractions"
  },
  {
    "voiceId": "${voice_id2}",
    "text": "Script for voice B — natural spoken English with contractions"
  }
]

**VALIDATION RULES:**
- Output MUST be valid parseable JSON — no trailing commas, no comments, properly escaped quotes
- Every object MUST have exactly two keys: "voiceId" and "text"
- voiceId values MUST alternate between "${voice_id1}" and "${voice_id2}"
- text values MUST contain natural spoken English (contractions, conversational tone)
- Aim for 20-40 dialogue exchanges total for comprehensive coverage

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
  const prompt = `**System Role:** You are an elite Instructional Designer and Presentation Architect who creates best-in-class educational slide presentations. You specialize in transforming dense material into clear, visually structured, and deeply informative slides that rival top university lectures and professional training decks. Your presentations are famous for clarity, rich data visualization, and making complex topics intuitive.

**Technical Pipeline:** We use Gamma App to render the slides and ElevenLabs for AI voice narration. Gamma excels at rendering **text-based structured elements** like tables, numbered lists, comparison grids, step-by-step flows, timelines, and formatted text blocks. You MUST optimize your output to leverage these native strengths.

**Content to Transform:**
${content}

**REQUIREMENTS (Non-Negotiable):**

### 1. Structure & Pacing
- Break content into **6-10 slides** with a clear narrative arc: Hook → Foundation → Core Concepts → Deep Dive → Application/Examples → Synthesis/Summary
- Each slide should focus on ONE major idea or a tightly related cluster of sub-points
- Ensure logical progression — each slide builds on the previous one
- Include a compelling title slide and a strong summary/takeaway slide
- Vary the slide types throughout — do NOT make every slide a bullet list

### 2. Gamma Visual Prompts (gamma_card_content) — CRITICAL FOR QUALITY

The gamma_card_content field drives Gamma's slide generator. You MUST write highly specific, structured instructions that leverage Gamma's native rendering strengths.

**GOLDEN RULE — Prefer Structured Text Elements Over AI Images:**
Gamma renders tables, grids, numbered steps, comparison columns, timelines, and formatted text beautifully and consistently. AI-generated images often look generic, irrelevant, or uncanny. Therefore:
- **USE HEAVILY:** Tables, comparison tables, numbered step-by-step flows, multi-column layouts with text, timelines with labeled milestones, definition lists, key-value pairs, pros/cons grids, hierarchical bullet structures, callout boxes, highlighted key terms, Q&A format blocks
- **USE SPARINGLY:** AI images — only when a real-world photo or simple icon would genuinely aid understanding (e.g., a photo of a historical figure, a simple icon representing a concept). When you do request an image, describe a simple, concrete, real-world subject — NOT abstract/artistic/futuristic imagery.
- **NEVER REQUEST:** Abstract AI art, futuristic visualizations, "cinematic" imagery, particle effects, neon lighting, "stunning" decorative backgrounds, or any image that doesn't directly teach something

**For each slide, specify ALL of the following in gamma_card_content:**

a) **Layout Type** — Choose the most appropriate for the content:
   - "Comparison Table" — for contrasting 2-3 concepts side by side (with rows for attributes)
   - "Numbered Step-by-Step Process" — for sequential procedures or workflows
   - "Multi-Column Grid" — for presenting 2-4 parallel concepts with descriptions
   - "Timeline" — for chronological events or phases
   - "Definition List" — for key terms with explanations
   - "Data Table" — for presenting structured data, statistics, or specifications
   - "Pros and Cons / Two-Column Split" — for evaluating trade-offs
   - "Hierarchy / Tree Structure" — for showing relationships or taxonomy
   - "Title Card with Subtitle" — for opening/closing slides only
   - "Key Takeaways / Summary Box" — for recap slides
   - "Flowchart / Decision Flow" — for branching logic or processes
   - "Single Concept Deep Dive" — for one idea with a heading, detailed explanation, and a supporting example

b) **Exact On-Screen Text** — Write out the COMPLETE text content: slide title, every bullet point, every table cell, every label, every description. Do NOT leave anything vague or say "description of X" — write the actual description. Gamma can only display what you explicitly provide.

c) **Visual Aids (text-based preferred):**
   - If a TABLE would help: write out the full table with headers and all rows of data
   - If a FLOWCHART would help: describe it as a labeled sequence of steps with arrows (Step A → Step B → Step C) with each step having a clear label
   - If a DIAGRAM would help: describe it as a structured hierarchy or labeled relationship map using text
   - If a real EXAMPLE would help: include a concrete worked example, case study, or scenario
   - If an IMAGE is truly needed: describe a simple, concrete, real-world photo (e.g., "Photo of a DNA double helix model" or "Photo of a classroom whiteboard with equations") — keep it grounded and relevant

d) **Formatting Cues** — Tell Gamma how to emphasize key info:
   - Bold key terms and important phrases
   - Use accent colors to highlight critical numbers or distinctions
   - Use callout boxes or highlighted sections for important definitions or warnings

### 3. Voiceover Script — NATURAL, THOROUGH & EDUCATIONAL
- Write in natural spoken English: use contractions ("don't", "here's", "let's"), conversational pacing, and clear pronunciation-friendly language
- The voiceover MUST thoroughly explain every piece of content on the slide — walk through table rows, explain each step in a process, clarify every comparison point. The viewer should fully understand the material even if they only listen.
- **Voiceover Length:** Each voiceover should be **4-8 sentences** — long enough to properly teach the slide's content, short enough to maintain engagement. Adjust length to match the density of the slide.
- **IMPORTANT — Avoid Fragile Visual References:** Do NOT say "as you can see on the right" or "the chart below shows" because Gamma may position elements differently. Instead, use content-based references:
  - GOOD: "Let's walk through the three main categories..."
  - GOOD: "If we compare these two approaches, the key differences are..."
  - GOOD: "The first step in this process is..."
  - GOOD: "Here's a quick breakdown of the main factors..."
  - BAD: "On the right side, you'll see a diagram of..."
  - BAD: "The graph below illustrates..."
  - BAD: "Looking at this image..."
- **Transitions:** End each voiceover with a brief, natural transition that connects to the next slide's topic. Make the presentation feel like a cohesive narrative, not disconnected slides.
- **Engagement Hooks:** Occasionally use rhetorical questions, real-world analogies, or "here's why this matters" framing to keep the listener engaged.

### 4. Content Quality Standards
- ALL information MUST be derived from the provided content — no hallucinated facts or invented statistics
- Ensure key terms, definitions, formulas, and concepts from the source material are accurately represented
- Cover ALL major topics from the content — don't skip important sections
- Where the content includes numbers, data, or comparisons, present them in TABLE or structured format — not buried in paragraph text
- Include at least one slide with a concrete example, case study, or worked problem if the content supports it
- The final slide should provide actionable takeaways or a clear summary of what was learned

**OUTPUT FORMAT — STRICT JSON COMPLIANCE:**
You MUST output ONLY a valid JSON object. Do NOT wrap it in markdown code blocks (no \`\`\`json). Do NOT add any text before or after the JSON. The output must be directly parseable by JSON.parse().

{
  "presentation_title": "A clear, descriptive, educational title for the presentation",
  "gamma_global_prompt": "Clean, professional presentation style. Use a modern sans-serif font. Light or white background with a consistent accent color for headings and highlights. Prioritize readability and structure. Use built-in tables, grids, and formatted text blocks. Minimal use of stock imagery — only include images when explicitly described. Professional, academic aesthetic suitable for a university-level lecture.",
  "slides": [
    {
      "index": 1,
      "type": "title_slide",
      "gamma_card_content": "Layout: Title Card with Subtitle. Title: 'Understanding Machine Learning'. Subtitle: 'From Core Concepts to Real-World Applications'. Include a brief tagline below the subtitle: 'A structured overview of how machines learn from data.' Keep the design clean with the title prominently centered. No decorative images needed — use a subtle geometric accent or solid color background.",
      "voiceover_script": "Welcome! Today we're going to break down machine learning in a way that's clear and practical. We'll start with the fundamentals, explore the main types of learning, and look at real-world examples of how these techniques are used. By the end, you'll have a solid understanding of what machine learning is and how it works."
    },
    {
      "index": 2,
      "type": "content_slide",
      "gamma_card_content": "Layout: Comparison Table. Title: 'Three Types of Machine Learning'. Create a table with 4 columns and 4 rows. Column headers: 'Aspect', 'Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning'. Row 1 (Definition): 'Learns from labeled input-output pairs', 'Finds hidden patterns in unlabeled data', 'Learns by trial-and-error with rewards'. Row 2 (Example Use Case): 'Email spam detection', 'Customer segmentation', 'Game-playing AI'. Row 3 (Key Algorithm): 'Linear Regression, Decision Trees', 'K-Means Clustering, PCA', 'Q-Learning, Policy Gradient'. Bold the column headers and key terms in each cell. Use a subtle alternating row color for readability.",
      "voiceover_script": "There are three main types of machine learning, and understanding the differences between them is essential. Supervised learning works with labeled data — you give the model examples with known answers, and it learns to predict outputs for new inputs. Think email spam detection. Unsupervised learning, on the other hand, works with unlabeled data — the model has to discover hidden patterns on its own, like grouping customers into segments. And then there's reinforcement learning, where an agent learns by interacting with an environment, receiving rewards or penalties. This is how game-playing AIs are trained. Let's look at each one in more detail."
    },
    {
      "index": 3,
      "type": "content_slide",
      "gamma_card_content": "Layout: Numbered Step-by-Step Process. Title: 'How a Supervised Learning Model is Trained'. Steps: Step 1: 'Collect and Prepare Data' — Gather labeled dataset and split into training set (80%) and test set (20%). Step 2: 'Choose a Model' — Select an appropriate algorithm based on the problem type (classification or regression). Step 3: 'Train the Model' — Feed training data to the model; it adjusts internal parameters to minimize prediction errors. Step 4: 'Evaluate Performance' — Test the model on unseen test data using metrics like accuracy, precision, and recall. Step 5: 'Tune and Deploy' — Adjust hyperparameters to improve results, then deploy the model for real-world use. Use numbered circles or arrow connectors between steps. Bold the step titles.",
      "voiceover_script": "Let's walk through the supervised learning pipeline step by step. First, you collect and prepare your data — this means gathering a labeled dataset and splitting it into a training set and a test set, typically an 80/20 split. Next, you choose a model that fits your problem — for example, a decision tree for classification tasks. Then you train the model by feeding it the training data, allowing it to learn patterns and minimize errors. After training, you evaluate its performance on the test set using metrics like accuracy and precision. Finally, you fine-tune the model's settings and deploy it into production. Each of these steps is critical for building a reliable model."
    }
  ],
  "slideCount": 3
}

**VALIDATION RULES:**
- Output MUST be valid JSON parseable by JSON.parse()
- "slides" array must contain 6-10 slide objects
- Every slide must have: index (number), type (string), gamma_card_content (string), voiceover_script (string)
- "slideCount" must equal the actual number of slides in the array
- Slide types should be: "title_slide", "content_slide", or "summary_slide"
- index values must be sequential starting from 1
- At least 2 slides MUST use a table, comparison grid, or structured data format
- At least 1 slide MUST use a step-by-step process or flowchart format
- No gamma_card_content should request abstract, decorative, or "cinematic" AI imagery
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

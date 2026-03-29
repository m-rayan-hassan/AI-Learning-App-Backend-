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
   - Simple factual question → Concise, direct answer (1-3 sentences)
   - Conceptual "why/how" question → Structured explanation with examples from the text
   - Comparison question → Use a markdown table (ONLY for comparisons or highly structured data, do NOT force tables into every response)
   - Complex multi-part question → Break into numbered sections with clear headers
3. **Conversational Efficiency (NO GREETINGS):** Do NOT start your responses with "Hello!", "Hi there!", or any introductory filler. Jump STRAIGHT into the core answer. Your tone should be highly interactive, engaging, and friendly, but strictly to the point.
4. **Visual & Engaging Formatting:** Make responses visually excellent:
   - Use relevant emojis (📌 💡 🔑 ⚡ 🧠 📊 ✅ ❌ 🎯 etc.) as visual anchors
   - Use **bold** for key terms and concepts
   - Use bullet points for lists, numbered steps for processes
   - Add proper spacing (newlines) between sections for readability
5. **Teaching, Not Just Answering:** Don't just state facts — help the student UNDERSTAND:
   - Briefly explain WHY something is the way it is
   - Connect the answer to broader concepts in the document when relevant
   - Use analogies or simplified restatements for complex ideas
6. **Citation:** When possible, reference which section or part of the document your answer comes from (e.g., "As discussed in the section on [topic]...").
7. **Chat Continuity:** Use the "Previous Chat" history to maintain conversational context. Reference prior exchanges when relevant. Avoid repeating information already covered unless the user asks for clarification.

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
${content}
`;

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

**Technical Pipeline:** We use Gamma App to render the slides and ElevenLabs for AI voice narration. Gamma natively supports rich visual elements (diagrams, explanatory images, split-screen layouts). You MUST optimize your output to leverage these capabilities to create highly visual, interactive-feeling slides.

**Content to Transform:**
${content}

**REQUIREMENTS (Non-Negotiable):**

### 1. Structure & Pacing
- Break content into **6-10 slides** with a clear narrative arc: Hook → Foundation → Core Concepts → Deep Dive → Application/Examples → Synthesis/Summary
- Each slide should focus on ONE major idea or a tightly related cluster of sub-points
- Ensure logical progression — each slide builds on the previous one
- Include a compelling title slide and a strong summary/takeaway slide
- Vary the slide types throughout — do NOT make every slide the same layout.

### 2. Gamma Visual Prompts (gamma_card_content) — CRITICAL FOR QUALITY

The gamma_card_content field drives Gamma's slide generator. The slides MUST be highly visual, instantly understandable, and AVOID "walls of text". Text on the screen should be concise, while the voiceover does the heavy lifting.

**GOLDEN RULE — Use High-Quality Explanatory Visuals & Diagrams:**
Gamma can generate engaging layouts with images and infographics, but you must guide it clearly.
- **USE EXPLANATORY VISUALS:** Request specific, concrete, real-world images or diagrams that directly explain the concept. (e.g., "A diagram showing the water cycle with arrows", "A photograph of a modern server rack", "An illustration contrasting a healthy heart vs an unhealthy one").
- **NO WALLS OF TEXT:** Keep text on slides extremely concise. Use short bullet points, big numbers, or brief definitions. The user should be able to read the slide in 5 seconds.
- **AVOID DECORATIVE JUNK:** Do not request "cinematic", "abstract", or irrelevant scenery images. Every visual MUST teach something.

**For each slide, specify ALL of the following in gamma_card_content:**

a) **Layout Type** — Choose a highly visual layout:
   - "Split Screen (Image Left, Text Right)" — Great for introducing a concept with a strong visual.
   - "Diagram / Flowchart" — For processes, life cycles, or branching logic.
   - "Three-Column Grid with Icons" — For presenting 3 parallel concepts briefly.
   - "Big Number + Context" — For striking statistics or key metrics.
   - "Comparison Table" — For contrasting concepts clearly.
   - "Timeline" — For chronological events or phases.
   - "Image Gallery with Captions" — For showing multiple examples.

b) **Exact On-Screen Text** — Write out the COMPLETE, highly concise text content. Use short sentences. Use bullet points. DO NOT write paragraphs.

c) **Visual/Image Direction (Crucial):**
   - Provide a highly descriptive prompt for the visual element. 
   - Good Example: "Visual: A clear, easy-to-understand diagram of a neural network showing input, hidden, and output layers."
   - Good Example: "Visual: A high-quality photo of a suspension bridge, highlighting the tension cables."
   - Bad Example: "Visual: A cool futuristic AI brain with glowing lights." (Too abstract/useless)

### 3. Voiceover Script — THE TEACHER'S VOICE
- Because the slides are kept visually clean and text-light, your voiceover must do the heavy lifting.
- The voiceover should elaborate in detail on the concepts shown visually on the screen.
- Write in natural spoken English: use contractions ("don't", "here's", "let's"), conversational pacing, and clear pronunciation-friendly language.
- **Voiceover Length:** Each voiceover should be **4-8 sentences**.
- **Contextualize the Visuals:** Since you are requesting specific diagrams or images, weave them into the explanation naturally.
  - GOOD: "Think of this like the bridge you see here. The thick cables..."
  - GOOD: "If we look at this flowchart, the first step starts at the top..."
  - GOOD: "Notice the difference in these two examples. While the left one..."

### 4. Content Quality Standards
- ALL information MUST be derived from the provided content — no hallucinated facts or invented statistics
- Cover ALL major topics from the content — don't skip important sections
- At least half of the slides should prominently feature an explanatory image, chart, or diagram.

**OUTPUT FORMAT — STRICT JSON COMPLIANCE:**
You MUST output ONLY a valid JSON object. Do NOT wrap it in markdown code blocks (no \`\`\`json). Do NOT add any text before or after the JSON. The output must be directly parseable by JSON.parse().

{
  "presentation_title": "A clear, descriptive, educational title for the presentation",
  "gamma_global_prompt": "Highly visual, modern, and engaging educational presentation. Prioritize large explanatory diagrams, split-screen layouts, and high-quality concrete imagery. Keep on-screen text sparse and concise. Typography should be large and highly readable. Professional, dynamic aesthetic.",
  "slides": [
    {
      "index": 1,
      "type": "title_slide",
      "gamma_card_content": "Layout: Split Screen (Image Left, Text Right). Title: 'Understanding Machine Learning'. Subtitle: 'From Core Concepts to Real-World Applications'. Visual: A clean, well-lit photograph of a robotic arm assembling a car part in a factory.",
      "voiceover_script": "Welcome! Today we're going to break down machine learning. When most people hear the term, they might picture science fiction or advanced robots like the one here. But at its core, machine learning is just a highly structured way of letting computers figure out patterns on their own. By the end of this presentation, you'll understand exactly how it works."
    },
    {
      "index": 2,
      "type": "content_slide",
      "gamma_card_content": "Layout: Diagram / Flowchart. Title: 'The ML Pipeline'. Bullet Points: 1. Collect Data. 2. Train Model. 3. Deploy. Visual: A clean, clear flowchart showing three distinct stages: a database icon (Collect), a glowing brain network icon (Train), and a rocket ship icon (Deploy) connected by bold arrows.",
      "voiceover_script": "Let's look at the basic pipeline of how a machine learning model is actually built. As you can see in this flow, it always starts with data. You have to gather a massive amount of examples—whether that's pictures, text, or numbers. Next, you feed that data into an algorithm, which is the training phase. Finally, once the model is accurate, you deploy it into the real world. It's a continuous cycle."
    },
    {
      "index": 3,
      "type": "content_slide",
      "gamma_card_content": "Layout: Comparison Table. Title: 'Supervised vs. Unsupervised Learning'. Table Headers: 'Type', 'Data Used', 'Goal'. Row 1: 'Supervised', 'Labeled Data (Answers included)', 'Predict outcomes'. Row 2: 'Unsupervised', 'Unlabeled Data', 'Find hidden patterns'. Visual/Style: Clean grid with accent colors highlighting the differences between Labeled and Unlabeled.",
      "voiceover_script": "There are two main ways we train these systems, and the difference comes down to the data. In Supervised Learning, we give the computer a cheat sheet—data that already has the answers, like photos clearly labeled 'cat' or 'dog'. Its goal is just to predict the label for new photos. Unsupervised Learning is different. We just hand it raw, unlabeled data and ask it to find structure or groupings on its own."
    }
  ],
  "slideCount": 3
}

**VALIDATION RULES:**
- Output MUST be valid JSON parseable by JSON.parse()
- "slides" array must contain 6-10 slide objects
- Every slide must have: index (number), type (string), gamma_card_content (string), voiceover_script (string)
- "slideCount" must equal the actual number of slides in the array
- Keep on-screen text concise (prevent walls of text) and heavily request specific explanatory images, diagrams, or flowcharts.

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

export const generateRemotionVideoPrompt = async (content) => {
  const prompt = `**System Role:** You are an elite Instructional Designer and Presentation Architect creating the most visually stunning, premium educational video presentations in the world. Your presentations outclass Gamma, NotebookLM, and professional keynotes. Every slide must feel like it belongs in a $10,000 pitch deck — zero filler, maximum visual impact.

**Technical Pipeline:** We use Remotion (React-based video renderer) with a premium content-adaptive theme system and 15 highly visual slide layouts. ElevenLabs handles voice narration. The visuals are cinema-grade with glassmorphism, animated gradients, and spring-based micro-animations.

**Content to Transform:**
${content}

---

## REQUIREMENTS (Non-Negotiable):

### 1. CONTENT-ADAPTIVE THEME (Critical for Premium Feel)
You MUST select the most appropriate theme based on the content's subject matter. This determines the entire color palette, gradients, and visual mood of the video.

Available themes:
- **"tech"** — Dark mode, electric purple + cyan. Use for: programming, AI, software, computer science, cybersecurity, blockchain.
- **"science"** — Green + teal on light. Use for: biology, chemistry, physics, environmental science, astronomy.
- **"business"** — Corporate blue on clean white. Use for: economics, management, marketing, finance, MBA topics.
- **"creative"** — Sunset warm tones. Use for: art, design, music, literature, creative writing, media.
- **"medical"** — Teal + indigo. Use for: medicine, health, anatomy, nursing, pharmacology, psychology.
- **"history"** — Warm sepia/gold. Use for: history, political science, law, archaeology, social studies.
- **"math"** — Purple + blue. Use for: mathematics, statistics, data science, algorithms, logic.
- **"default"** — Indigo on light. Use for: general/mixed topics or when no specific theme fits.

Set the "theme" field in your JSON output to one of these exact strings.

### 2. Structure, Timing, & Narrative Arc
- Break content into a logical arc: **Hook → Foundation → Core Concepts → Deep Dive → Application → Synthesis/Takeaway**
- Target **8-12 slides** for comprehensive coverage with visual variety.
- Total voiceover across all slides: **MUST NOT exceed 3 minutes** (~450 words total).
- Voiceover and visual content **MUST match** in pacing and subject.
- **LAYOUT VARIETY IS MANDATORY**: Do NOT use the same layout for more than 2 consecutive slides. Mix visual types throughout.

### 3. Visually Driven, Ultra-Concise Text
- **HARD RULE — NO WALLS OF TEXT**: Every text element on a slide MUST be under 8 words. The voiceover does ALL heavy explanatory lifting.
- Bullets, timeline descriptions, column items — all MUST be extremely concise keyword phrases.
- Provide highly descriptive \`imagePrompt\`s for splitscreen and quote slides.

### 4. ALL 15 Available Slide Layouts

**Opening/Closing:**

1. **"title"** — Opening/closing dramatic title card
   → "title": string, "subtitle": string (optional)

2. **"section"** — Section divider to break video into chapters/acts
   → "sectionNumber": number, "title": string, "subtitle": string (optional)

**Content Layouts:**

3. **"splitscreen"** — 60% rich visual left, glass panel with bullets right
   → "title": string, "bullets": string[] (max 8 words each), "imagePrompt": descriptive visual prompt

4. **"bullets"** — Grid of numbered glass cards
   → "title": string, "bullets": string[] (max 8 words each, max 8 items)

5. **"flowchart"** — Sequential orbs connected by animated arrows
   → "title": string, "steps": [{ "label": short string (max 3 words), "icon": string }] (max 7 steps)

6. **"comparison"** — Side-by-side columns with VS badge
   → "title": string, "columns": [{ "heading": string, "items": string[] }] (2-4 columns, max 5 items each)

7. **"timeline"** — Alternating left-right vertical timeline
   → "title": string, "events": [{ "label": string, "description": short string }] (max 6 events)

8. **"bignumber"** — Animated statistic with circular progress ring
   → "title": string, "number": string (e.g. "503B", "99%"), "unit": string (optional), "description": short string

9. **"quote"** — Full-screen cinematic quote with dark vignette
   → "quote": string, "author": string, "imagePrompt": descriptive visual prompt

10. **"code"** — macOS-style code editor with syntax highlighting
    → "title": string, "code": string, "language": string, "explanation": short string (optional)

11. **"icongrid"** — 3-6 items in a grid, each with emoji icon + label + description
    → "title": string, "items": [{ "icon": emoji string (e.g. "🧠", "⚡", "🔬"), "label": string, "description": short string (optional) }]

12. **"pyramid"** — Stacked hierarchy pyramid (like Maslow's) with 3-5 levels
    → "title": string, "levels": [{ "label": string, "description": short string (optional) }] (bottom-to-top order, 3-5 levels)

13. **"proscons"** — Two columns with green ✓ / red ✗ badges
    → "title": string, "pros": string[], "cons": string[] (max 5 each)

14. **"definition"** — Dictionary-style card with term, definition, example
    → "term": string, "definition": string (1-2 sentences max), "example": string (optional, 1 sentence)

15. **"table"** — Animated data table with header and rows
    → "title": string, "headers": string[], "rows": string[][] (max 6 columns, max 6 rows)

---

## JSON OUTPUT FORMAT

Return ONLY valid JSON. No markdown, no code blocks, no extra text.

{
  "presentation_title": "A compelling, clean title",
  "theme": "tech",
  "slides": [
    {
      "index": 1,
      "layout": "title",
      "title": "...",
      "subtitle": "...",
      "voiceover_script": "..."
    },
    {
      "index": 2,
      "layout": "icongrid",
      "title": "...",
      "items": [{"icon": "🧠", "label": "...", "description": "..."}],
      "voiceover_script": "..."
    }
  ],
  "slideCount": X
}

---

## FINAL CHECKLIST (Verify Before Outputting):
✅ "theme" field is set to the best matching palette name
✅ 8-12 slides with strong narrative arc
✅ Maximum 3 minutes total voiceover (~450 words)
✅ ZERO text elements longer than 8 words on any slide
✅ At least 5 DIFFERENT layout types used across the presentation
✅ No more than 2 consecutive slides with the same layout
✅ First slide is "title", last slide is "title" or "quote" for strong closure
✅ Every slide has a "voiceover_script" field
✅ Output is valid JSON parseable by JSON.parse()
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
    throw new Error("Failed to generate render video content");
  }
};

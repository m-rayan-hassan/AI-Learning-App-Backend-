/**
 * Hardcoded test data for Remotion video pipeline.
 * 
 * This provides sample slide data that exercises all 7 template types
 * without calling the LLM or spending any API credits.
 * 
 * Used by the testRemotionVideo endpoint.
 */

export const getTestSlideData = () => {
  return {
    presentation_title: "Introduction to Machine Learning",
    theme: "dark",
    slides: [
      {
        index: 1,
        layout: "title",
        title: "Introduction to Machine Learning",
        subtitle: "From Core Concepts to Real-World Applications",
        voiceover_script:
          "Welcome to this presentation on Machine Learning. Today we'll explore the fundamental concepts that drive modern AI systems, from basic definitions to real-world applications that are transforming industries around the globe.",
      },
      {
        index: 2,
        layout: "splitscreen",
        title: "What is Machine Learning?",
        bullets: [
          "Computers learn patterns from data",
          "No explicit programming required",
          "Performance improves with more examples",
          "Subset of Artificial Intelligence",
        ],
        imagePrompt: "A neural network visualization with glowing interconnected nodes and data flowing through layers",
        voiceover_script:
          "At its core, machine learning is about teaching computers to learn from data without being explicitly programmed. Instead of writing rules by hand, we feed the system examples, and it discovers patterns on its own. The more data it sees, the better it gets.",
      },
      {
        index: 3,
        layout: "flowchart",
        title: "The ML Pipeline",
        steps: [
          { label: "Collect Data", icon: "database" },
          { label: "Preprocess", icon: "gear" },
          { label: "Train Model", icon: "brain" },
          { label: "Evaluate", icon: "chart" },
          { label: "Deploy", icon: "rocket" },
        ],
        voiceover_script:
          "Every machine learning project follows a standard pipeline. First, you collect raw data. Then you clean and preprocess it. Next comes training, where the algorithm learns patterns. After training, you evaluate how well it performs. Finally, you deploy the model to production.",
      },
      {
        index: 4,
        layout: "comparison",
        title: "Supervised vs Unsupervised Learning",
        columns: [
          {
            heading: "Supervised",
            items: [
              "Uses labeled training data",
              "Predicts known outcomes",
              "Classification & Regression",
              "Example: Spam Detection",
            ],
          },
          {
            heading: "Unsupervised",
            items: [
              "Uses unlabeled data",
              "Discovers hidden patterns",
              "Clustering & Association",
              "Example: Customer Segments",
            ],
          },
        ],
        voiceover_script:
          "There are two main categories of machine learning. Supervised learning uses labeled data where we know the correct answers, like training a spam filter. Unsupervised learning works with unlabeled data, finding hidden patterns and groupings, like segmenting customers by behavior.",
      },
      {
        index: 5,
        layout: "bignumber",
        title: "Global ML Market Size",
        number: "$503B",
        unit: "",
        description:
          "The global machine learning market is projected to reach over $503 billion by 2030, growing at a compound annual growth rate of 34.8%.",
        voiceover_script:
          "The scale of machine learning adoption is staggering. The global market is projected to reach over five hundred and three billion dollars by twenty-thirty, growing at an annual rate of nearly thirty-five percent. This explosive growth reflects how deeply ML is being integrated across every industry.",
      },
      {
        index: 6,
        layout: "bullets",
        title: "Key Applications",
        bullets: [
          "Self-driving vehicles & autonomous systems",
          "Medical diagnosis & drug discovery",
          "Fraud detection in financial services",
          "Recommendation engines (Netflix, Spotify)",
          "Natural language processing & chatbots",
        ],
        voiceover_script:
          "Machine learning is everywhere. Self-driving cars use it to navigate roads. Hospitals use it to detect diseases from medical scans. Banks use it to catch fraudulent transactions in real time. And every time Netflix recommends a show or Spotify suggests a playlist, that's machine learning at work.",
      },
      {
        index: 7,
        layout: "timeline",
        title: "History of Machine Learning",
        events: [
          { label: "1950 — Turing Test", description: "Alan Turing proposes a test for machine intelligence" },
          { label: "1957 — Perceptron", description: "Frank Rosenblatt invents the first neural network" },
          { label: "1997 — Deep Blue", description: "IBM's Deep Blue defeats world chess champion" },
          { label: "2012 — AlexNet", description: "Deep learning breakthrough in image recognition" },
          { label: "2022 — ChatGPT", description: "Large language models go mainstream" },
        ],
        voiceover_script:
          "Machine learning has a rich history spanning over seventy years. It started with Alan Turing's famous test in nineteen fifty. The first neural network, the Perceptron, was invented in fifty-seven. In ninety-seven, Deep Blue shocked the world by beating the chess champion. Two thousand twelve brought a deep learning revolution with AlexNet. And in twenty twenty-two, ChatGPT brought large language models to millions of users.",
      },
      {
        index: 8,
        layout: "title",
        title: "The Future is Intelligent",
        subtitle: "Machine learning is not just a technology — it's a paradigm shift in how we solve problems.",
        voiceover_script:
          "Machine learning represents a fundamental shift in how we approach problem-solving. Instead of telling computers exactly what to do, we're teaching them to figure it out on their own. The future belongs to those who understand and harness this powerful technology. Thank you for watching.",
      },
    ],
    slideCount: 8,
  };
};

/**
 * Generate fake audio duration data for testing.
 * Simulates what voiceFunctionalities.generateVideoScript() returns,
 * but without calling ElevenLabs.
 * 
 * Each slide gets a duration based on its voiceover_script word count.
 */
export const getTestAudioDurations = (slides) => {
  return slides.map((slide) => {
    // Estimate ~2.5 words per second for speech
    const wordCount = (slide.voiceover_script || '').split(/\s+/).length;
    const estimatedDuration = Math.max(5, Math.ceil(wordCount / 2.5));

    return {
      index: slide.index,
      duration: estimatedDuration,
      filePath: '', // No actual audio file in test mode
    };
  });
};

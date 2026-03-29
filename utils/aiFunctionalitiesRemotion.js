/**
 * Hardcoded test data for Remotion video pipeline.
 * 
 * Exercises all 15 template types with the "tech" theme.
 * Used by the testRemotionVideo endpoint — zero API credits consumed.
 */

export const getTestSlideData = () => {
  return {
    presentation_title: "Introduction to Machine Learning",
    theme: "tech",
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
        layout: "icongrid",
        title: "Why Machine Learning Matters",
        items: [
          { icon: "🧠", label: "Intelligent Systems", description: "Learns from data autonomously" },
          { icon: "📈", label: "Predictive Power", description: "Forecasts future outcomes" },
          { icon: "⚡", label: "Automation", description: "Eliminates repetitive tasks" },
          { icon: "🔬", label: "Discovery", description: "Finds hidden patterns" },
          { icon: "🌐", label: "Scalability", description: "Handles massive datasets" },
          { icon: "🎯", label: "Precision", description: "Reduces human error" },
        ],
        voiceover_script:
          "Machine learning matters because it enables intelligent systems that learn from data, predict outcomes, and automate tasks. It helps discover hidden patterns, scales to massive datasets, and delivers precision that reduces human error.",
      },
      {
        index: 3,
        layout: "splitscreen",
        title: "What is Machine Learning?",
        bullets: [
          "Computers learn patterns from data",
          "No explicit programming required",
          "Improves with more examples",
          "Subset of Artificial Intelligence",
        ],
        imagePrompt: "A neural network visualization with glowing interconnected nodes and data flowing through layers",
        voiceover_script:
          "At its core, machine learning is about teaching computers to learn from data without being explicitly programmed. Instead of writing rules by hand, we feed the system examples, and it discovers patterns on its own. The more data it sees, the better it gets.",
      },
      {
        index: 4,
        layout: "section",
        sectionNumber: 1,
        title: "The Core Process",
        subtitle: "Understanding how ML models are built",
        voiceover_script:
          "Now let's dive into the core process of building a machine learning model. Every ML project follows a structured pipeline from data collection to deployment.",
      },
      {
        index: 5,
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
        index: 6,
        layout: "comparison",
        title: "Supervised vs Unsupervised vs Reinforcement",
        columns: [
          {
            heading: "Supervised",
            items: [
              "Uses labeled training data",
              "Predicts known outcomes",
              "Classification & Regression",
            ],
          },
          {
            heading: "Unsupervised",
            items: [
              "Uses unlabeled data",
              "Discovers hidden patterns",
              "Clustering & Association",
            ],
          },
          {
            heading: "Reinforcement",
            items: [
              "Learn via trial and error",
              "Reward-based feedback",
              "Games & Robotics",
            ],
          },
        ],
        voiceover_script:
          "There are three main categories of machine learning. Supervised learning uses labeled data where we know the correct answers. Unsupervised learning works with unlabeled data to find hidden patterns. Reinforcement learning uses trial and error with reward signals, commonly used in robotics and game AI.",
      },
      {
        index: 7,
        layout: "definition",
        term: "Neural Network",
        definition: "A computing system inspired by biological neural networks, consisting of interconnected layers of nodes that process information using weighted connections and activation functions.",
        example: "Image recognition systems use convolutional neural networks to identify objects in photographs.",
        voiceover_script:
          "A neural network is a computing system inspired by the human brain. It consists of interconnected layers of nodes that process information using weighted connections. For example, convolutional neural networks can identify objects in photographs with remarkable accuracy.",
      },
      {
        index: 8,
        layout: "proscons",
        title: "ML Model Trade-offs",
        pros: [
          "High accuracy on complex tasks",
          "Scales with more data",
          "Discovers non-obvious patterns",
          "Automates decision-making",
        ],
        cons: [
          "Requires large training datasets",
          "Can be computationally expensive",
          "Risk of bias in training data",
          "Lack of interpretability",
        ],
        voiceover_script:
          "Machine learning comes with important trade-offs. On the plus side, models achieve high accuracy, scale beautifully with more data, and can discover patterns humans would miss. But they also require large datasets, can be expensive to train, and carry risks of bias and lack of interpretability.",
      },
      {
        index: 9,
        layout: "bignumber",
        title: "Global ML Market Size",
        number: "$503B",
        unit: "",
        description:
          "Projected global machine learning market by 2030, growing at 34.8% CAGR.",
        voiceover_script:
          "The scale of machine learning adoption is staggering. The global market is projected to reach over five hundred and three billion dollars by twenty-thirty, growing at an annual rate of nearly thirty-five percent.",
      },
      {
        index: 10,
        layout: "table",
        title: "Algorithm Comparison",
        headers: ["Algorithm", "Type", "Best For", "Speed"],
        rows: [
          ["Linear Regression", "Supervised", "Prediction", "Fast"],
          ["Random Forest", "Supervised", "Classification", "Medium"],
          ["K-Means", "Unsupervised", "Clustering", "Fast"],
          ["Neural Network", "Deep Learning", "Complex patterns", "Slow"],
        ],
        voiceover_script:
          "Here's a quick comparison of popular algorithms. Linear Regression is fast for simple predictions. Random Forest handles classification well. K-Means clusters data efficiently. And neural networks tackle complex patterns but require more compute.",
      },
      {
        index: 11,
        layout: "pyramid",
        title: "ML Complexity Pyramid",
        levels: [
          { label: "Traditional Statistics", description: "Descriptive analytics" },
          { label: "Machine Learning", description: "Predictive analytics" },
          { label: "Deep Learning", description: "Complex pattern recognition" },
          { label: "Artificial General Intelligence", description: "Human-level reasoning" },
        ],
        voiceover_script:
          "Think of AI as a pyramid of increasing complexity. At the base, we have traditional statistics for descriptive analytics. Then machine learning for predictions. Deep learning handles complex pattern recognition. And at the peak, AGI represents the goal of human-level reasoning.",
      },
      {
        index: 12,
        layout: "timeline",
        title: "History of Machine Learning",
        events: [
          { label: "1950 — Turing Test", description: "Alan Turing proposes machine intelligence" },
          { label: "1957 — Perceptron", description: "First neural network invented" },
          { label: "1997 — Deep Blue", description: "IBM defeats world chess champion" },
          { label: "2012 — AlexNet", description: "Deep learning revolution" },
          { label: "2022 — ChatGPT", description: "LLMs go mainstream" },
        ],
        voiceover_script:
          "Machine learning has a rich history. It started with Turing's famous test in 1950. The Perceptron was invented in '57. Deep Blue beat the chess champion in '97. AlexNet sparked the deep learning revolution in 2012. And ChatGPT brought AI to millions in 2022.",
      },
      {
        index: 13,
        layout: "code",
        title: "ML in 5 Lines of Python",
        code: "from sklearn.ensemble import RandomForestClassifier\n\nmodel = RandomForestClassifier(n_estimators=100)\nmodel.fit(X_train, y_train)\npredictions = model.predict(X_test)\nprint(f\"Accuracy: {model.score(X_test, y_test):.2%}\")",
        language: "python",
        explanation: "Train a Random Forest classifier, make predictions, and evaluate accuracy — all in just 5 lines of code.",
        voiceover_script:
          "Here's the beauty of modern ML frameworks. In just five lines of Python using scikit-learn, you can train a Random Forest classifier, make predictions on test data, and evaluate accuracy. The barrier to entry has never been lower.",
      },
      {
        index: 14,
        layout: "quote",
        quote: "Machine learning is the last invention that humanity will ever need to make.",
        author: "Nick Bostrom",
        imagePrompt: "A dramatic futuristic landscape with neural network patterns in the sky",
        voiceover_script:
          "As Nick Bostrom famously said, machine learning could be the last invention humanity needs to make. It represents a fundamental shift in how we approach problem-solving, and the future belongs to those who understand and harness this powerful technology. Thank you for watching.",
      },
    ],
    slideCount: 14,
  };
};

/**
 * Generate fake audio duration data for testing.
 * Each slide gets a duration based on its voiceover_script word count.
 */
export const getTestAudioDurations = (slides) => {
  return slides.map((slide) => {
    const wordCount = (slide.voiceover_script || '').split(/\s+/).length;
    const estimatedDuration = Math.max(5, Math.ceil(wordCount / 2.5));

    return {
      index: slide.index,
      duration: estimatedDuration,
      filePath: '',
    };
  });
};

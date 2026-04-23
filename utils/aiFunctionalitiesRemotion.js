/**
 * Test data for the Remotion video pipeline.
 * 
 * This file provides hardcoded slide data and audio durations
 * for testing the renderer without consuming any LLM / ElevenLabs credits.
 * Updated to include the new visual-first slide types (hero, visual, imagegrid).
 */

/**
 * Returns a complete slide data object matching the LLM output structure.
 * Includes the new image-heavy layouts (hero, visual, imagegrid) plus
 * imagePrompt fields on all image-capable slides.
 */
export const getTestSlideData = () => ({
  presentation_title: "Machine Learning: From Data to Intelligence",
  theme: "tech",
  slides: [
    {
      index: 1,
      layout: "hero",
      title: "Machine Learning",
      subtitle: "Transforming Data into Intelligent Systems",
      imagePrompt: "A stunning wide-angle photograph of a modern AI research lab with multiple screens showing neural network visualizations, data graphs, and code, illuminated by soft blue and purple ambient lighting",
      voiceover_script: "Welcome to Machine Learning — one of the most transformative technologies of our time. In this video, we'll explore how machines learn from data to make intelligent decisions, from the fundamental concepts to real-world applications that are reshaping every industry."
    },
    {
      index: 2,
      layout: "visual",
      title: "The Data Revolution",
      subtitle: "Every day we generate 2.5 quintillion bytes of data",
      imagePrompt: "A professional visualization of global data flows, showing streams of glowing data particles flowing around a digital representation of Earth, with network connections between major cities, clean dark background",
      voiceover_script: "We're living in an unprecedented era of data generation. Every single day, humanity creates two point five quintillion bytes of data. Machine learning is the key technology that allows us to extract meaningful patterns and intelligence from this massive data deluge."
    },
    {
      index: 3,
      layout: "splitscreen",
      title: "Core ML Categories",
      bullets: [
        "Supervised: labeled training data",
        "Unsupervised: hidden patterns",
        "Reinforcement: reward-based learning",
        "Semi-supervised: mixed approach"
      ],
      imagePrompt: "A clean educational diagram showing three branches of machine learning as a tree structure, with supervised learning on the left branch with labeled data icons, unsupervised in the center with cluster icons, and reinforcement on the right with a reward cycle icon, professional illustration style",
      voiceover_script: "Machine learning breaks down into several core categories. Supervised learning uses labeled training data where we teach the model with known correct answers. Unsupervised learning discovers hidden patterns in data without labels. Reinforcement learning trains through a reward-based system, learning from trial and error. And semi-supervised learning combines both approaches using a mix of labeled and unlabeled data."
    },
    {
      index: 4,
      layout: "flowchart",
      title: "The ML Pipeline",
      steps: [
        { label: "Collect Data", icon: "📊" },
        { label: "Clean & Prep", icon: "🧹" },
        { label: "Train Model", icon: "🧠" },
        { label: "Evaluate", icon: "📏" },
        { label: "Deploy", icon: "🚀" }
      ],
      voiceover_script: "Every machine learning project follows a systematic pipeline. First, we collect data from relevant sources. Then we clean and prepare that data, handling missing values and normalizing features. Next, we train our model on this prepared dataset. We then evaluate its performance using metrics like accuracy and precision. Finally, we deploy the model into production where it serves real predictions."
    },
    {
      index: 5,
      layout: "comparison",
      title: "Classical ML vs Deep Learning",
      columns: [
        {
          heading: "Classical ML",
          items: ["Manual feature engineering", "Works with small datasets", "Faster training time", "More interpretable results"]
        },
        {
          heading: "Deep Learning",
          items: ["Auto feature extraction", "Needs massive datasets", "GPU-intensive training", "Black-box predictions"]
        }
      ],
      voiceover_script: "Let's compare classical machine learning with deep learning. Classical ML requires manual feature engineering where you design the inputs, works well with smaller datasets, trains faster on standard hardware, and produces more interpretable results. Deep learning, on the other hand, automatically extracts features from raw data, but needs massive datasets to perform well, requires GPU-intensive training, and often acts as a black box where the reasoning is hard to explain."
    },
    {
      index: 6,
      layout: "icongrid",
      title: "Real-World Applications",
      items: [
        { icon: "🏥", label: "Healthcare", description: "Disease diagnosis" },
        { icon: "🚗", label: "Autonomous Driving", description: "Self-driving vehicles" },
        { icon: "💬", label: "NLP", description: "Language understanding" },
        { icon: "📈", label: "Finance", description: "Fraud detection" },
        { icon: "🎨", label: "Creative AI", description: "Art & music generation" },
        { icon: "🔬", label: "Research", description: "Drug discovery" }
      ],
      voiceover_script: "Machine learning powers an incredible range of real-world applications. In healthcare, it enables accurate disease diagnosis from medical scans. Autonomous driving relies on ML for real-time decision making in self-driving vehicles. Natural language processing allows machines to understand and generate human language. In finance, ML detects fraudulent transactions. Creative AI generates art and music. And in scientific research, it accelerates drug discovery by predicting molecular interactions."
    },
    {
      index: 7,
      layout: "bignumber",
      title: "ML Market Size",
      number: "$503B",
      unit: "by 2030",
      description: "Global ML market projected value",
      voiceover_script: "The machine learning industry is growing at an explosive rate. The global ML market is projected to reach five hundred and three billion dollars by 2030. This massive growth reflects the technology's transformative impact across virtually every sector of the economy."
    },
    {
      index: 8,
      layout: "visual",
      title: "Neural Networks in Action",
      subtitle: "Deep learning architectures that power modern AI",
      imagePrompt: "A detailed educational illustration of a deep neural network architecture, showing multiple layers of interconnected neurons with blue input nodes, green hidden layers, and red output nodes, with data flowing through weighted connections, clean professional style on dark background",
      voiceover_script: "Neural networks are the backbone of deep learning. These architectures are inspired by the human brain, consisting of layers of interconnected artificial neurons. Data flows through the network from input to output, with each layer extracting increasingly abstract features. The weighted connections between neurons are what the model learns during training."
    },
    {
      index: 9,
      layout: "splitscreen",
      title: "Getting Started with ML",
      bullets: [
        "Learn Python fundamentals",
        "Master NumPy and Pandas",
        "Study scikit-learn library",
        "Practice on Kaggle datasets",
        "Build portfolio projects"
      ],
      imagePrompt: "A clean photograph of a developer workspace with a laptop showing Python code with machine learning libraries, surrounded by data science books and a notebook with handwritten neural network diagrams, warm natural lighting",
      voiceover_script: "If you want to get started with machine learning, here's your roadmap. First, learn Python fundamentals — it's the dominant language in ML. Then master NumPy and Pandas for data manipulation. Study the scikit-learn library, which provides easy-to-use implementations of common algorithms. Practice your skills on Kaggle datasets with real-world challenges. And finally, build portfolio projects that demonstrate your abilities to potential employers."
    },
    {
      index: 10,
      layout: "quote",
      quote: "The question is not whether machines can think, but whether machines can learn to think better than we expect.",
      author: "Andrew Ng",
      imagePrompt: "A dramatic cinematic photograph of a sunrise over a futuristic city skyline with holographic data visualizations floating in the sky, warm golden light mixing with cool blue technology elements, panoramic wide angle",
      voiceover_script: "To close, let's reflect on the words of Andrew Ng, one of the pioneers of machine learning: 'The question is not whether machines can think, but whether machines can learn to think better than we expect.' As we've seen throughout this video, machine learning is not just a technology — it's a paradigm shift in how we solve problems and understand the world."
    }
  ],
  slideCount: 10,
});

/**
 * Generate fake audio durations for test data.
 * Each slide gets a fixed duration — no ElevenLabs calls needed.
 * 
 * @param {Array} slides - Array of slide objects
 * @param {number} perSlide - Seconds per slide (default: 12)
 * @returns {Array} - Array of { index, duration, filePath }
 */
export const getTestAudioDurations = (slides, perSlide = 12) => {
  return slides.map((slide) => ({
    index: slide.index,
    duration: perSlide,
    filePath: "",
  }));
};

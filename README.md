# 🌌 CosmicZoom - nwHacks 2025

An immersive educational platform that combines interactive 3D visualization with AI-powered Q&A to help students explore scientific concepts by zooming from the vast observable universe down to the atomic level.

## 🏆 Hackathon Project

This project was developed for **nwHacks 2025** with the goal of creating an engaging, interactive learning experience where students can:
- Explore 3D scientific models through intuitive scroll-based navigation
- Journey from the cosmic scale down to atomic structures through seamless zooming
- Ask questions and get AI-powered explanations about the content they're viewing

## ✨ Features

### 🎯 Interactive 3D Visualization
- **Scale-based Navigation**: Scroll to zoom from cosmic structures down to atomic level
- **Smooth Transitions**: Seamless movement from universe to atoms through progressive zooming
- **Real-time Rendering**: Powered by Three.js and React Three Fiber
- **Mouse Interaction**: Orbit controls for 360° exploration of 3D models

### 🧠 AI-Powered Q&A System
- **Context-Aware Assistant**: Ask questions about the currently displayed 3D model
- **OpenAI Integration**: Powered by GPT-3.5-turbo for intelligent responses
- **Collapsible Interface**: Clean, non-intrusive panel design
- **Real-time Communication**: Instant responses to student inquiries

### 📚 Educational Content
The platform covers scientific concepts across multiple scales, starting from the largest and zooming into progressively smaller structures:

1. **Observable Universe** - The largest scale we can observe
2. **Milky Way Galaxy** - Our home galaxy with billions of stars
3. **Solar System** - Celestial mechanics and planetary relationships
4. **Earth** - Our planet and its characteristics
5. **Biological Systems** - Living organisms (Beaver model)
6. **DNA Helix** - Genetic information storage
7. **Molecular Structure** - DNA bases and molecular interactions  
8. **Atomic Level** - Basic building blocks of matter

## 🛠️ Technology Stack

### Frontend
- **Next.js** - React framework with TypeScript
- **React Three Fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for 3D scenes
- **Three.js** - 3D graphics library
- **CSS Modules** - Scoped styling

### Backend
- **Express.js** - Backend API server
- **OpenAI API** - AI-powered responses
- **Axios** - HTTP client for API calls
- **CORS** - Cross-origin resource sharing

### 3D Assets
- **GLTF/GLB Models** - Optimized 3D model format
- **HDR Environment Maps** - Realistic lighting and reflections

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Teejay021/nwhacks2025.git
   cd nwhacks2025
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start the development servers**
   
   Terminal 1 - Frontend:
   ```bash
   npm run dev
   ```
   
   Terminal 2 - Backend API:
   ```bash
   node server.js
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 🎮 How to Use

### Navigation
- **Scroll Up/Down**: Zoom in/out on current model
- **Automatic Transitions**: Reach zoom limits to transition between scales
- **Mouse Controls**: Click and drag to rotate 3D models
- **Orbit View**: Explore models from all angles

### AI Assistant
1. Click **"Ask a Question"** button in the bottom-right corner
2. Type your question about the current 3D model or scientific concept
3. Click **"Ask"** to get an AI-powered response
4. Close the panel with the **"X"** button when done

### Educational Journey
Start from the **Observable Universe** and scroll to zoom in, triggering automatic transitions through:
Universe → Galaxy → Solar System → Earth → Biology → DNA → Molecule → Atom

## 📁 Project Structure

```
├── components/           # React components
│   ├── AIPanel.tsx      # AI Q&A interface
│   ├── CardPanel.tsx    # Information display panel
│   ├── Header.tsx       # Navigation header
│   ├── Model.tsx        # 3D model loader
│   ├── Scene.tsx        # Main 3D scene controller
│   └── ThreeCanvas.tsx  # 3D canvas setup
├── pages/               # Next.js pages
│   ├── api/            # API routes
│   ├── index.tsx       # Main application page
│   └── _app.tsx        # App configuration
├── public/             # Static assets
│   └── models/         # 3D model files
├── styles/             # CSS styling
├── utils/              # Utility functions
├── server.js           # Express backend server
└── package.json        # Dependencies and scripts
```

## Key Components

### Scene.tsx
- Central controller for 3D visualization
- Handles scroll-based zoom and model transitions
- Manages lighting, camera, and fog effects
- Coordinates with CardPanel for content display

### AIPanel.tsx
- Collapsible Q&A interface
- Connects to backend API for AI responses
- Loading states and error handling
- Responsive design for different screen sizes

### Model.tsx
- Dynamic 3D model loader using GLTF format
- Animation support with scroll synchronization
- Optimized loading with preloading capabilities

## Educational Impact

This platform addresses key challenges in STEM education:

- **Visual Learning**: Complex scientific concepts made tangible through 3D visualization
- **Scale Comprehension**: Journey from cosmic to atomic scales helps students grasp relative sizes
- **Interactive Engagement**: Active exploration rather than passive consumption
- **Personalized Learning**: AI assistant provides instant answers to student questions
- **Accessibility**: Web-based platform accessible from any device

## Future Enhancements

- **More 3D Models**: Expand the library with additional scientific visualizations
- **VR Support**: Virtual reality integration for even more immersive experiences
- **Collaborative Features**: Multi-user exploration and shared learning sessions
- **Progress Tracking**: Student learning analytics and progress monitoring
- **Mobile Optimization**: Enhanced mobile experience with touch controls
- **Offline Mode**: Downloadable content for areas with limited internet

## Contributing

This project was created for nwHacks 2025. If you'd like to contribute or build upon this work:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **nwHacks 2025** - For providing the platform and inspiration
- **Three.js Community** - For the amazing 3D graphics capabilities
- **OpenAI** - For the AI-powered educational assistance
- **React Three Fiber** - For seamless React-Three.js integration

## Contact

For questions about this project or collaboration opportunities, please reach out through the GitHub repository.

---

**Built with ❤️ for education and exploration**

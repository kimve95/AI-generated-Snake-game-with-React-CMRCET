import React, { useState, useEffect, useRef, useReducer } from 'react';

type Point = { x: number; y: number };

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 150;

const TRACKS = [
  {
    id: 1,
    title: "Neon Drive",
    artist: "AI Synth",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: 2,
    title: "Cyber City",
    artist: "AI Synth",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: 3,
    title: "Digital Horizon",
    artist: "AI Synth",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

const generateFood = (snake: Point[]): Point => {
  let newFood: Point;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    if (!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      break;
    }
  }
  return newFood;
};

type GameState = {
  snake: Point[];
  direction: Point;
  food: Point;
  score: number;
  highScore: number;
  gameOver: boolean;
  isPaused: boolean;
};

type GameAction = 
  | { type: 'MOVE' }
  | { type: 'CHANGE_DIRECTION'; payload: Point }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'RESET' };

const initialGameState: GameState = {
  snake: INITIAL_SNAKE,
  direction: INITIAL_DIRECTION,
  food: { x: 5, y: 5 },
  score: 0,
  highScore: 0,
  gameOver: false,
  isPaused: false,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'MOVE': {
      if (state.gameOver || state.isPaused) return state;

      const head = state.snake[0];
      const newHead = {
        x: head.x + state.direction.x,
        y: head.y + state.direction.y,
      };

      // Wall collision
      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE
      ) {
        return { ...state, gameOver: true };
      }

      // Self collision
      if (state.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        return { ...state, gameOver: true };
      }

      const newSnake = [newHead, ...state.snake];
      let newFood = state.food;
      let newScore = state.score;

      if (newHead.x === state.food.x && newHead.y === state.food.y) {
        newScore += 10;
        newFood = generateFood(newSnake);
      } else {
        newSnake.pop();
      }

      return {
        ...state,
        snake: newSnake,
        food: newFood,
        score: newScore,
        highScore: Math.max(state.highScore, newScore),
      };
    }
    case 'CHANGE_DIRECTION': {
      // Prevent 180 degree turns
      if (
        (state.direction.x !== 0 && action.payload.x === -state.direction.x) ||
        (state.direction.y !== 0 && action.payload.y === -state.direction.y)
      ) {
        return state;
      }
      return { ...state, direction: action.payload };
    }
    case 'TOGGLE_PAUSE':
      return { ...state, isPaused: !state.isPaused };
    case 'RESET':
      return {
        ...initialGameState,
        highScore: state.highScore,
        food: generateFood(INITIAL_SNAKE),
      };
    default:
      return state;
  }
}

export default function App() {
  const [gameState, dispatch] = useReducer(gameReducer, {
    ...initialGameState,
    food: generateFood(INITIAL_SNAKE)
  });

  // Music state
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (gameState.gameOver) {
        if (e.key === 'Enter') dispatch({ type: 'RESET' });
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          dispatch({ type: 'CHANGE_DIRECTION', payload: { x: 0, y: -1 } });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          dispatch({ type: 'CHANGE_DIRECTION', payload: { x: 0, y: 1 } });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dispatch({ type: 'CHANGE_DIRECTION', payload: { x: -1, y: 0 } });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          dispatch({ type: 'CHANGE_DIRECTION', payload: { x: 1, y: 0 } });
          break;
        case ' ':
          dispatch({ type: 'TOGGLE_PAUSE' });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.gameOver]);

  // Game loop
  useEffect(() => {
    const speed = Math.max(50, INITIAL_SPEED - Math.floor(gameState.score / 50) * 10);
    const intervalId = setInterval(() => {
      dispatch({ type: 'MOVE' });
    }, speed);
    return () => clearInterval(intervalId);
  }, [gameState.score]);

  // Audio effect
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.error("Audio play failed:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextTrack = () => setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  const toggleMute = () => setIsMuted(!isMuted);

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono flex flex-col items-center justify-center p-4 selection:bg-fuchsia-500 selection:text-black relative overflow-hidden">
      {/* Overlays */}
      <div className="scanlines"></div>
      <div className="static-noise"></div>

      <div className="relative z-10 w-full max-w-7xl flex flex-col items-center screen-tear">
        {/* Header */}
        <header className="mb-8 text-center border-b-4 border-fuchsia-500 pb-4 w-full relative">
          <h1 className="glitch-text text-5xl md:text-7xl font-bold uppercase tracking-tighter" data-text="SYS.SNAKE_PROTOCOL">
            SYS.SNAKE_PROTOCOL
          </h1>
          <p className="text-fuchsia-500 mt-2 text-lg md:text-xl tracking-widest uppercase animate-pulse">
            WARNING: NEURAL LINK UNSTABLE // ENTITY AWAITING INPUT
          </p>
          <div className="absolute top-2 left-2 text-xs text-fuchsia-500 opacity-50 hidden md:block">
            0x00F4A2<br/>0x11B8C0
          </div>
          <div className="absolute top-2 right-2 text-xs text-cyan-500 opacity-50 text-right hidden md:block">
            MEM_ALLOC: 4096KB<br/>STATUS: CRITICAL
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start w-full justify-center">
          
          {/* Left Panel: Stats & Controls */}
          <div className="flex flex-col gap-6 w-full lg:w-72">
            {/* Score Board */}
            <div className="bg-black border-2 border-cyan-400 p-4 relative">
              <div className="absolute -top-3 -left-2 bg-black px-2 text-fuchsia-500 font-bold">DATA_FRAGMENTS</div>
              <div className="space-y-6 mt-4">
                <div>
                  <p className="text-sm text-fuchsia-500 uppercase tracking-widest mb-1">VOLATILE_MEM [SCORE]</p>
                  <p className="text-5xl font-bold text-cyan-400">
                    {gameState.score.toString().padStart(4, '0')}
                  </p>
                </div>
                <div className="border-t border-dashed border-cyan-400/50 pt-4">
                  <p className="text-sm text-fuchsia-500 uppercase tracking-widest mb-1">NON_VOLATILE_MEM [HIGH]</p>
                  <p className="text-3xl font-bold text-fuchsia-500">
                    {gameState.highScore.toString().padStart(4, '0')}
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-black border-2 border-fuchsia-500 p-4 relative">
              <div className="absolute -top-3 -left-2 bg-black px-2 text-cyan-400 font-bold">INPUT_VECTORS</div>
              <div className="grid grid-cols-2 gap-2 text-sm text-cyan-400 mt-4">
                <div className="flex items-center justify-between border border-cyan-400/30 p-1">
                  <span>W/↑</span><span className="text-fuchsia-500">Y-</span>
                </div>
                <div className="flex items-center justify-between border border-cyan-400/30 p-1">
                  <span>S/↓</span><span className="text-fuchsia-500">Y+</span>
                </div>
                <div className="flex items-center justify-between border border-cyan-400/30 p-1">
                  <span>A/←</span><span className="text-fuchsia-500">X-</span>
                </div>
                <div className="flex items-center justify-between border border-cyan-400/30 p-1">
                  <span>D/→</span><span className="text-fuchsia-500">X+</span>
                </div>
                <div className="col-span-2 flex items-center justify-between border border-fuchsia-500/50 p-1 bg-fuchsia-500/10 mt-2">
                  <span>SPACE</span><span className="text-fuchsia-500">HALT_EXECUTION</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Game Board */}
          <div className="relative">
            <div 
              className="relative bg-black border-4 border-cyan-400 shadow-[0_0_20px_#00ffff_inset,0_0_20px_#00ffff]"
              style={{
                width: 'min(90vw, 500px)',
                height: 'min(90vw, 500px)',
              }}
            >
              {/* Grid Background */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: 'linear-gradient(#00ffff 1px, transparent 1px), linear-gradient(90deg, #00ffff 1px, transparent 1px)',
                  backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`
                }}
              />

              {/* Snake & Food */}
              <div className="absolute inset-0">
                {/* Food */}
                <div
                  className="absolute bg-fuchsia-500 shadow-[0_0_15px_#ff00ff]"
                  style={{
                    width: `${100 / GRID_SIZE}%`,
                    height: `${100 / GRID_SIZE}%`,
                    left: `${(gameState.food.x / GRID_SIZE) * 100}%`,
                    top: `${(gameState.food.y / GRID_SIZE) * 100}%`,
                  }}
                />

                {/* Snake */}
                {gameState.snake.map((segment, index) => {
                  const isHead = index === 0;
                  return (
                    <div
                      key={`${segment.x}-${segment.y}-${index}`}
                      className={`absolute ${
                        isHead 
                          ? 'bg-white shadow-[0_0_15px_#ffffff] z-10' 
                          : index % 2 === 0 ? 'bg-cyan-400' : 'bg-cyan-600'
                      }`}
                      style={{
                        width: `${100 / GRID_SIZE}%`,
                        height: `${100 / GRID_SIZE}%`,
                        left: `${(segment.x / GRID_SIZE) * 100}%`,
                        top: `${(segment.y / GRID_SIZE) * 100}%`,
                        border: '1px solid #000'
                      }}
                    />
                  );
                })}
              </div>

              {/* Overlays */}
              {gameState.gameOver && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 border-4 border-fuchsia-500 m-2">
                  <h2 className="glitch-text text-5xl font-bold text-white mb-2 uppercase" data-text="FATAL_ERROR">FATAL_ERROR</h2>
                  <p className="text-fuchsia-500 mb-6 text-xl animate-pulse">ENTITY_COLLISION_DETECTED</p>
                  <button 
                    onClick={() => dispatch({ type: 'RESET' })}
                    className="px-6 py-2 bg-transparent text-cyan-400 border-2 border-cyan-400 hover:bg-cyan-400 hover:text-black transition-colors font-bold uppercase text-xl"
                  >
                    REBOOT_SYSTEM
                  </button>
                </div>
              )}

              {gameState.isPaused && !gameState.gameOver && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
                  <h2 className="glitch-text text-5xl font-bold text-white uppercase" data-text="EXECUTION_HALTED">
                    EXECUTION_HALTED
                  </h2>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Music Player */}
          <div className="w-full lg:w-80">
            <div className="bg-black border-2 border-cyan-400 p-4 relative">
              <div className="absolute -top-3 -right-2 bg-black px-2 text-fuchsia-500 font-bold">AUDIO_SUBSYSTEM</div>
              
              <div className="mt-4">
                <div className="flex items-center justify-between mb-4 border-b border-cyan-400/30 pb-2">
                  <span className="text-cyan-400 text-sm">OUTPUT_STREAM</span>
                  <button 
                    onClick={toggleMute}
                    className="text-fuchsia-500 hover:text-white transition-colors"
                  >
                    {isMuted ? '[MUTED]' : '[ACTIVE]'}
                  </button>
                </div>

                {/* Track Info */}
                <div className="mb-6 border border-fuchsia-500 p-3 bg-fuchsia-500/10">
                  <h3 className="text-2xl font-bold text-white truncate uppercase">
                    <span className="text-fuchsia-500 mr-2">ID:</span>
                    {currentTrack.title}
                  </h3>
                  <p className="text-cyan-400 text-lg mt-1 uppercase">
                    <span className="text-cyan-600 mr-2">AUTH:</span>
                    {currentTrack.artist}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between gap-2 mb-6">
                  <button 
                    onClick={prevTrack}
                    className="flex-1 py-2 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-colors font-bold"
                  >
                    &lt;&lt; PRV
                  </button>
                  
                  <button 
                    onClick={togglePlay}
                    className={`flex-1 px-4 py-2 border-2 font-bold transition-colors ${
                      isPlaying 
                        ? 'border-fuchsia-500 bg-fuchsia-500 text-black' 
                        : 'border-fuchsia-500 text-fuchsia-500 hover:bg-fuchsia-500 hover:text-black'
                    }`}
                  >
                    {isPlaying ? 'PAUSE' : 'EXECUTE'}
                  </button>
                  
                  <button 
                    onClick={nextTrack}
                    className="flex-1 py-2 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-colors font-bold"
                  >
                    NXT &gt;&gt;
                  </button>
                </div>

                {/* Visualizer bars */}
                <div className="flex items-end justify-between h-16 border-b-2 border-cyan-400 pb-1">
                  {[...Array(16)].map((_, i) => (
                    <div 
                      key={i}
                      className={`w-3 ${i % 2 === 0 ? 'bg-cyan-400' : 'bg-fuchsia-500'} ${isPlaying ? 'animate-eq' : 'h-2'}`}
                      style={{
                        animationDelay: `${i * 0.05}s`,
                        animationDuration: `${0.2 + Math.random() * 0.3}s`
                      }}
                    ></div>
                  ))}
                </div>
              </div>

              <audio 
                ref={audioRef}
                src={currentTrack.url}
                onEnded={nextTrack}
                loop={false}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

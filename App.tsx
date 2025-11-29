
import React, { useState, useEffect } from 'react';
import Game from './components/Game';
import UI from './components/UI';
import { GameState, GameMode, Achievement, DailyChallengeState } from './types';
import { INITIAL_LEVEL } from './constants';
import { loadAchievements, saveAchievements, loadDailyState, saveDailyState, getTodayDateString } from './utils/storage';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.CLASSIC);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(INITIAL_LEVEL);
  const [gameKey, setGameKey] = useState(0); 
  const [swapTrigger, setSwapTrigger] = useState(0); // Trigger for UI swap button

  // Persistent Data
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [dailyState, setDailyState] = useState<DailyChallengeState>({ lastPlayedDate: null, completed: false });

  // Load data on mount
  useEffect(() => {
    const loadedAch = loadAchievements();
    setAchievements(loadedAch);

    const daily = loadDailyState();
    const today = getTodayDateString();
    if (daily.lastPlayedDate !== today) {
        // Reset daily if it's a new day
        setDailyState({ lastPlayedDate: today, completed: false });
    } else {
        setDailyState(daily);
    }
  }, []);

  const handleUnlockAchievement = (id: string) => {
    setAchievements(prev => {
        const index = prev.findIndex(a => a.id === id);
        if (index === -1) return prev;
        if (prev[index].unlocked) return prev; // Already unlocked

        const updated = [...prev];
        updated[index] = { ...updated[index], unlocked: true };
        saveAchievements(updated);
        // Could show a toast notification here
        return updated;
    });
  };

  const handleDailyComplete = () => {
      const today = getTodayDateString();
      const newState = { lastPlayedDate: today, completed: true };
      setDailyState(newState);
      saveDailyState(newState);
      handleUnlockAchievement('daily_hero');
  };

  const handleRestart = () => {
    if (gameState === GameState.VICTORY) {
      setLevel(l => l + 1);
      setGameState(GameState.PLAYING);
    } else {
      setScore(0); 
      setGameKey(k => k + 1);
      setGameState(GameState.PLAYING);
    }
  };

  return (
    <div className="w-full h-screen bg-black flex justify-center items-center overflow-hidden font-sans select-none">
      <div className="relative w-full h-full max-w-lg aspect-[9/16] bg-gray-900 shadow-2xl ring-8 ring-gray-800 overflow-hidden sm:rounded-3xl">
        <Game 
          key={gameKey}
          gameState={gameState} 
          gameMode={gameMode}
          setGameState={setGameState} 
          setScore={setScore}
          score={score}
          level={level}
          setLevel={setLevel}
          onUnlockAchievement={handleUnlockAchievement}
          onDailyComplete={handleDailyComplete}
          swapTrigger={swapTrigger}
        />
        <UI 
          gameState={gameState} 
          setGameState={setGameState} 
          setGameMode={setGameMode}
          score={score}
          level={level}
          restartLevel={handleRestart}
          onSwap={() => setSwapTrigger(t => t + 1)}
          achievements={achievements}
          dailyState={dailyState}
        />
      </div>
      
      {/* Desktop Helper */}
      <div className="fixed bottom-4 right-4 text-slate-500 text-xs hidden md:block text-right">
        <div>Use Mouse to Aim & Click to Shoot</div>
        <div>Tap Launcher or 'Swap' Area to Switch Ball</div>
      </div>
    </div>
  );
};

export default App;

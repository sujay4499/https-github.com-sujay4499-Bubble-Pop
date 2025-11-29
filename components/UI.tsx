
import React, { useState } from 'react';
import { GameMode, GameState, Achievement, DailyChallengeState } from '../types';
import { Play, RotateCcw, Volume2, VolumeX, Pause, Settings, Info, Trophy, Calendar, X, RefreshCw, Award, Target, Flame, Compass } from 'lucide-react';
import { audioService } from '../services/audioService';

interface UIProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setGameMode: (mode: GameMode) => void;
  score: number;
  level: number;
  restartLevel: () => void;
  onSwap: () => void;
  achievements: Achievement[];
  dailyState: DailyChallengeState;
}

const UI: React.FC<UIProps> = ({ 
  gameState, 
  setGameState, 
  setGameMode, 
  score, 
  level, 
  restartLevel,
  onSwap,
  achievements,
  dailyState
}) => {
  const [muted, setMuted] = React.useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  const toggleMute = () => {
    setMuted(!muted);
    audioService.setEnabled(muted); 
  };

  const handleStart = (mode: GameMode) => {
    setGameMode(mode);
    setGameState(GameState.PLAYING);
    audioService.setEnabled(!muted);
  };

  const getIcon = (name: string) => {
      switch(name) {
          case 'Flame': return <Flame className="text-orange-500" size={20} />;
          case 'Award': return <Award className="text-yellow-400" size={20} />;
          case 'Target': return <Target className="text-red-500" size={20} />;
          case 'Compass': return <Compass className="text-blue-400" size={20} />;
          case 'Calendar': return <Calendar className="text-green-400" size={20} />;
          default: return <Trophy className="text-yellow-400" size={20} />;
      }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
      
      {/* Achievements Overlay */}
      {showAchievements && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center pointer-events-auto z-50 animate-fade-in p-4">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl max-h-[80vh] flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                          <Trophy className="text-yellow-400" /> Achievements
                      </h2>
                      <button onClick={() => setShowAchievements(false)} className="text-slate-400 hover:text-white p-2">
                          <X size={24} />
                      </button>
                  </div>
                  <div className="overflow-y-auto space-y-3 flex-1 pr-2">
                      {achievements.map(a => (
                          <div key={a.id} className={`p-4 rounded-xl border ${a.unlocked ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-900 border-slate-800 opacity-60'} flex items-center gap-4`}>
                              <div className={`p-3 rounded-full ${a.unlocked ? 'bg-slate-700' : 'bg-slate-800'}`}>
                                  {getIcon(a.icon)}
                              </div>
                              <div className="flex-1">
                                  <h3 className={`font-bold ${a.unlocked ? 'text-white' : 'text-slate-500'}`}>{a.title}</h3>
                                  <p className="text-sm text-slate-400">{a.description}</p>
                              </div>
                              {a.unlocked && <Award size={16} className="text-yellow-500" />}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* HUD */}
      <div className="flex justify-between items-start w-full max-w-lg mx-auto pointer-events-auto">
        <div className="bg-slate-800/90 backdrop-blur text-white px-4 py-2 rounded-xl shadow-lg border border-slate-700 min-w-[80px]">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Score</div>
          <div className="text-2xl font-black text-yellow-400 leading-none">{score.toLocaleString()}</div>
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={toggleMute} 
             className="bg-slate-800/90 p-3 rounded-full text-white hover:bg-slate-700 transition active:scale-95 shadow-lg border border-slate-700"
           >
             {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
           </button>
           {gameState === GameState.PLAYING && (
             <button 
               onClick={() => setGameState(GameState.PAUSED)} 
               className="bg-slate-800/90 p-3 rounded-full text-white hover:bg-slate-700 transition active:scale-95 shadow-lg border border-slate-700"
             >
               <Pause size={20} />
             </button>
           )}
        </div>
        
        <div className="bg-slate-800/90 backdrop-blur text-white px-4 py-2 rounded-xl shadow-lg border border-slate-700 text-right min-w-[80px]">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Level</div>
          <div className="text-2xl font-black text-cyan-400 leading-none">{level}</div>
        </div>
      </div>

      {/* Swap Button (In-Game Bottom Right) */}
      {gameState === GameState.PLAYING && (
          <div className="absolute bottom-6 right-6 pointer-events-auto md:hidden">
              <button 
                onClick={onSwap}
                className="bg-blue-600/80 p-4 rounded-full text-white shadow-xl border border-blue-400 active:scale-90 transition-transform"
              >
                  <RefreshCw size={24} />
              </button>
          </div>
      )}

      {/* Menus */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {gameState === GameState.MENU && (
          <div className="bg-slate-900/95 p-8 rounded-3xl shadow-2xl border-2 border-slate-700 text-center pointer-events-auto max-w-sm w-full backdrop-blur-sm animate-fade-in relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2 drop-shadow-sm mt-4">
              BUBBLE POP
            </h1>
            <p className="text-slate-400 mb-8 font-medium">Clear the board, win rewards!</p>
            
            <button 
              onClick={() => handleStart(GameMode.CLASSIC)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg transform transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 mb-3"
            >
              <Play fill="currentColor" size={24} /> PLAY CLASSIC
            </button>
            
            <button 
              onClick={() => handleStart(GameMode.DAILY)}
              disabled={dailyState.completed}
              className={`w-full font-bold py-3 px-6 rounded-xl transition flex items-center justify-center gap-3 mb-3 border ${dailyState.completed ? 'bg-slate-800 text-green-500 border-green-900' : 'bg-slate-800 hover:bg-slate-750 text-purple-400 border-purple-900/50 hover:border-purple-500'}`}
            >
              <Calendar size={20} /> {dailyState.completed ? 'DAILY COMPLETE' : 'DAILY CHALLENGE'}
            </button>

            <div className="flex gap-3">
                <button 
                    onClick={() => setShowAchievements(true)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm"
                >
                    <Trophy size={16} /> ACHIEVEMENTS
                </button>
                <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm">
                    <Settings size={16} /> SETTINGS
                </button>
            </div>
          </div>
        )}

        {gameState === GameState.PAUSED && (
          <div className="bg-slate-900/95 p-8 rounded-3xl shadow-2xl border border-slate-700 text-center pointer-events-auto w-80 backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-white mb-6">PAUSED</h2>
            <button 
              onClick={() => setGameState(GameState.PLAYING)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl mb-3 shadow-lg"
            >
              Resume
            </button>
            <button 
              onClick={restartLevel}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl mb-3"
            >
              Restart Level
            </button>
            <button 
              onClick={() => setGameState(GameState.MENU)}
              className="w-full text-slate-400 hover:text-white py-2"
            >
              Quit to Menu
            </button>
          </div>
        )}

        {(gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) && (
          <div className="bg-slate-900/95 p-8 rounded-3xl shadow-2xl border border-slate-700 text-center pointer-events-auto w-80 backdrop-blur-sm animate-bounce-in">
            <div className="mb-4 flex justify-center">
                 {gameState === GameState.VICTORY ? <Trophy size={64} className="text-yellow-400" /> : <Info size={64} className="text-slate-500" />}
            </div>
            <h2 className={`text-4xl font-black mb-2 ${gameState === GameState.VICTORY ? 'text-green-400' : 'text-red-500'}`}>
              {gameState === GameState.VICTORY ? 'LEVEL CLEAR!' : 'GAME OVER'}
            </h2>
            <p className="text-white text-lg mb-6">Score: <span className="font-bold text-yellow-400">{score}</span></p>
            
            <button 
              onClick={restartLevel}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg transform transition hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
            >
              <RotateCcw size={24} /> {gameState === GameState.VICTORY ? 'Next Level' : 'Try Again'}
            </button>
            
            <button 
              onClick={() => setGameState(GameState.MENU)}
              className="mt-4 text-slate-400 hover:text-white text-sm"
            >
                Back to Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UI;

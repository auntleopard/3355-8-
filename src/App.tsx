/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, Info, ChevronRight, Hand as HandIcon, Layers } from 'lucide-react';
import { Card, GameState, Suit, GameStatus } from './types';
import { createDeck, SUIT_SYMBOLS, SUIT_COLORS, canPlayCard, SUITS } from './constants';

interface CardComponentProps {
  card: Card;
  isFaceUp?: boolean;
  onClick?: () => void;
  isPlayable?: boolean;
  className?: string;
  key?: string | number;
  style?: React.CSSProperties;
}

const CardComponent = ({ 
  card, 
  isFaceUp = true, 
  onClick, 
  isPlayable = false,
  className = "",
  style = {}
}: CardComponentProps) => {
  return (
    <motion.div
      layoutId={card.id}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      whileHover={isPlayable ? { y: -20, scale: 1.05 } : {}}
      onClick={isPlayable ? onClick : undefined}
      style={style}
      className={`relative w-24 h-36 sm:w-28 sm:h-40 rounded-xl border-2 shadow-lg cursor-pointer transition-colors ${
        isFaceUp ? 'bg-white border-slate-200' : 'bg-indigo-700 border-indigo-900'
      } ${isPlayable ? 'ring-4 ring-yellow-400 ring-offset-2' : ''} ${className}`}
    >
      {isFaceUp ? (
        <div className={`flex flex-col justify-between h-full p-2 ${SUIT_COLORS[card.suit]}`}>
          <div className="flex flex-col items-start">
            <span className="text-xl font-bold leading-none">{card.rank}</span>
            <span className="text-lg leading-none">{SUIT_SYMBOLS[card.suit]}</span>
          </div>
          <div className="flex justify-center items-center">
            <span className="text-4xl">{SUIT_SYMBOLS[card.suit]}</span>
          </div>
          <div className="flex flex-col items-end rotate-180">
            <span className="text-xl font-bold leading-none">{card.rank}</span>
            <span className="text-lg leading-none">{SUIT_SYMBOLS[card.suit]}</span>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-16 h-24 border-2 border-indigo-400/30 rounded-lg flex items-center justify-center">
             <Layers className="text-indigo-400/50 w-8 h-8" />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    discardPile: [],
    playerHand: [],
    aiHand: [],
    currentSuit: null,
    turn: 'player',
    status: 'waiting',
    winner: null,
  });

  const [message, setMessage] = useState<string>("欢迎来到 3355 疯狂8点！");
  const [isAiThinking, setIsAiThinking] = useState(false);

  useEffect(() => {
    console.log("3355 Crazy Eights App Mounted. Status:", gameState.status);
  }, []);

  const initGame = () => {
    const fullDeck = createDeck();
    const playerHand = fullDeck.splice(0, 8);
    const aiHand = fullDeck.splice(0, 8);
    const firstDiscard = fullDeck.pop()!;
    
    setGameState({
      deck: fullDeck,
      discardPile: [firstDiscard],
      playerHand,
      aiHand,
      currentSuit: null,
      turn: 'player',
      status: 'playing',
      winner: null,
    });
    setMessage("轮到你了！请出相同花色或点数的牌。");
  };

  const drawCard = (target: 'player' | 'ai') => {
    if (gameState.deck.length === 0) {
      setMessage("牌堆已空！跳过回合。");
      setGameState(prev => ({ ...prev, turn: prev.turn === 'player' ? 'ai' : 'player' }));
      return;
    }

    const newDeck = [...gameState.deck];
    const drawnCard = newDeck.pop()!;
    
    setGameState(prev => ({
      ...prev,
      deck: newDeck,
      [target === 'player' ? 'playerHand' : 'aiHand']: [...prev[target === 'player' ? 'playerHand' : 'aiHand'], drawnCard],
      turn: target === 'player' ? 'ai' : 'player'
    }));

    setMessage(`${target === 'player' ? '你' : '电脑'} 摸了一张牌。`);
  };

  const playCard = (card: Card, target: 'player' | 'ai') => {
    const handKey = target === 'player' ? 'playerHand' : 'aiHand';
    const newHand = gameState[handKey].filter(c => c.id !== card.id);
    const newDiscardPile = [...gameState.discardPile, card];

    if (card.rank === '8') {
      if (target === 'player') {
        setGameState(prev => ({
          ...prev,
          [handKey]: newHand,
          discardPile: newDiscardPile,
          status: 'choosing_suit',
        }));
        setMessage("请选择一个新的花色！");
      } else {
        // AI chooses suit
        const suits = SUITS;
        const randomSuit = suits[Math.floor(Math.random() * suits.length)];
        setGameState(prev => ({
          ...prev,
          [handKey]: newHand,
          discardPile: newDiscardPile,
          currentSuit: randomSuit,
          turn: 'player',
        }));
        setMessage(`电脑打出了 8 并选择了 ${translateSuit(randomSuit)}！`);
      }
    } else {
      setGameState(prev => ({
        ...prev,
        [handKey]: newHand,
        discardPile: newDiscardPile,
        currentSuit: null,
        turn: target === 'player' ? 'ai' : 'player',
      }));
      setMessage(`${target === 'player' ? '你' : '电脑'} 打出了 ${translateSuit(card.suit)} ${card.rank}。`);
    }
  };

  const translateSuit = (suit: Suit) => {
    const map: Record<Suit, string> = {
      hearts: '红心',
      diamonds: '方块',
      clubs: '梅花',
      spades: '黑桃'
    };
    return map[suit];
  };

  const handleSuitSelection = (suit: Suit) => {
    setGameState(prev => ({
      ...prev,
      currentSuit: suit,
      status: 'playing',
      turn: 'ai',
    }));
    setMessage(`你选择了 ${translateSuit(suit)}。轮到电脑了。`);
  };

  // AI Turn Logic
  useEffect(() => {
    if (gameState.turn === 'ai' && gameState.status === 'playing' && !gameState.winner) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const topCard = gameState.discardPile[gameState.discardPile.length - 1];
        const playableCards = gameState.aiHand.filter(c => canPlayCard(c, topCard, gameState.currentSuit));

        if (playableCards.length > 0) {
          // Play a card (prefer non-8s first, or just pick first)
          const cardToPlay = playableCards.find(c => c.rank !== '8') || playableCards[0];
          playCard(cardToPlay, 'ai');
        } else {
          drawCard('ai');
        }
        setIsAiThinking(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.turn, gameState.status, gameState.winner]);

  // Win Condition Check
  useEffect(() => {
    if (gameState.status === 'playing') {
      if (gameState.playerHand.length === 0) {
        setGameState(prev => ({ ...prev, status: 'game_over', winner: 'player' }));
      } else if (gameState.aiHand.length === 0) {
        setGameState(prev => ({ ...prev, status: 'game_over', winner: 'ai' }));
      }
    }
  }, [gameState.playerHand.length, gameState.aiHand.length, gameState.status]);

  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  return (
    <div className="min-h-screen bg-emerald-800 text-white font-sans selection:bg-emerald-500 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-2xl font-black text-emerald-900">8</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">3355 疯狂8点</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium border border-white/5">
            牌堆剩余: {gameState.deck.length}
          </div>
          <button 
            onClick={initGame}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="重新开始"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      {/* Game Table */}
      <main className="flex-1 relative p-4 flex flex-col justify-between max-w-6xl mx-auto w-full">
        
        {/* AI Hand */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-emerald-300 mb-2">
            <span className="text-sm font-bold uppercase tracking-widest">对手 (电脑)</span>
            {isAiThinking && (
              <motion.span 
                animate={{ opacity: [0.4, 1, 0.4] }} 
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-xs italic"
              >
                思考中...
              </motion.span>
            )}
          </div>
          <div className="flex justify-center -space-x-12 sm:-space-x-16">
            <AnimatePresence>
              {gameState.aiHand.map((card, idx) => (
                <CardComponent 
                  key={card.id} 
                  card={card} 
                  isFaceUp={false} 
                  style={{ zIndex: idx }}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Center Area (Deck & Discard) */}
        <div className="flex justify-center items-center gap-8 sm:gap-16 my-8">
          {/* Draw Pile */}
          <div className="relative group">
            <div className="absolute inset-0 bg-black/20 rounded-xl translate-x-1 translate-y-1"></div>
            <div 
              onClick={() => gameState.turn === 'player' && gameState.status === 'playing' && drawCard('player')}
              className={`relative w-24 h-36 sm:w-28 sm:h-40 bg-indigo-800 rounded-xl border-2 border-indigo-950 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 ${gameState.turn !== 'player' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex flex-col items-center gap-2">
                <Layers className="text-indigo-400 w-8 h-8" />
                <span className="text-xs font-bold text-indigo-300">摸牌</span>
              </div>
            </div>
            {gameState.turn === 'player' && gameState.status === 'playing' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-yellow-400 text-emerald-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg"
              >
                点击摸牌
              </motion.div>
            )}
          </div>

          {/* Discard Pile */}
          <div className="relative">
            <div className="absolute inset-0 bg-black/20 rounded-xl translate-x-1 translate-y-1"></div>
            <AnimatePresence mode="popLayout">
              {gameState.discardPile.length > 0 && (
                <CardComponent 
                  key={topCard.id}
                  card={topCard} 
                  className="relative"
                />
              )}
            </AnimatePresence>
            {gameState.currentSuit && (
              <div className="absolute -right-16 top-1/2 -translate-y-1/2 flex flex-col items-center">
                <span className="text-xs font-bold text-emerald-300 uppercase mb-1">当前花色</span>
                <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-xl border-2 border-emerald-400 ${SUIT_COLORS[gameState.currentSuit]}`}>
                  <span className="text-2xl">{SUIT_SYMBOLS[gameState.currentSuit]}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Player Hand */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-black/30 rounded-full border border-white/10 flex items-center gap-2">
               <HandIcon size={16} className="text-emerald-400" />
               <span className="text-sm font-bold">你的手牌: {gameState.playerHand.length}</span>
             </div>
             <div className={`px-4 py-2 rounded-full border transition-all duration-500 ${gameState.turn === 'player' ? 'bg-yellow-400 text-emerald-900 border-yellow-500' : 'bg-black/30 text-emerald-400 border-white/10'}`}>
               <span className="text-sm font-bold uppercase tracking-widest">
                 {gameState.turn === 'player' ? "轮到你了" : "电脑正在出牌..."}
               </span>
             </div>
          </div>

          <div className="flex justify-center -space-x-12 sm:-space-x-16 pb-8 overflow-x-auto max-w-full px-12">
            <AnimatePresence>
              {gameState.playerHand.map((card) => {
                const playable = gameState.turn === 'player' && 
                                 gameState.status === 'playing' && 
                                 canPlayCard(card, topCard, gameState.currentSuit);
                return (
                  <CardComponent 
                    key={card.id} 
                    card={card} 
                    isPlayable={playable}
                    onClick={() => playCard(card, 'player')}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Status Bar */}
      <footer className="p-4 bg-black/40 backdrop-blur-md border-t border-white/10 flex justify-center">
        <p className="text-emerald-100 font-medium">{message}</p>
      </footer>

      {/* Overlays */}
      <AnimatePresence>
        {gameState.status === 'waiting' && (
          <div className="fixed inset-0 z-50 bg-emerald-950 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md w-full text-center space-y-8"
            >
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="space-y-4"
              >
                <div className="w-24 h-24 bg-yellow-400 rounded-3xl mx-auto flex items-center justify-center shadow-2xl rotate-12">
                  <span className="text-6xl font-black text-emerald-900">8</span>
                </div>
                <h2 className="text-4xl font-black tracking-tighter uppercase">3355 疯狂8点</h2>
                <p className="text-emerald-300/80 leading-relaxed">
                  经典的策略扑克游戏。匹配花色或点数，巧妙使用 8 号万能牌，率先清空手牌即可获胜！
                </p>
              </motion.div>
              
              <button 
                onClick={initGame}
                className="w-full py-4 bg-white text-emerald-900 rounded-2xl font-bold text-xl shadow-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 group"
              >
                开始游戏
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-left">
                  <Info className="text-yellow-400 mb-2" size={20} />
                  <h3 className="text-sm font-bold mb-1">8 号万能</h3>
                  <p className="text-xs text-emerald-300/60">随时打出 8 号牌来改变当前花色。</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-left">
                  <Trophy className="text-yellow-400 mb-2" size={20} />
                  <h3 className="text-sm font-bold mb-1">目标</h3>
                  <p className="text-xs text-emerald-300/60">率先出完手中所有的牌。</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {gameState.status === 'choosing_suit' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-emerald-800 p-8 rounded-3xl border border-white/20 shadow-2xl max-w-sm w-full text-center"
            >
              <h2 className="text-2xl font-bold mb-6">选择新花色</h2>
              <div className="grid grid-cols-2 gap-4">
                {SUITS.map(suit => (
                  <button
                    key={suit}
                    onClick={() => handleSuitSelection(suit)}
                    className="p-6 bg-white rounded-2xl flex flex-col items-center gap-2 hover:bg-emerald-50 transition-colors group"
                  >
                    <span className={`text-4xl ${SUIT_COLORS[suit]}`}>{SUIT_SYMBOLS[suit]}</span>
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-widest opacity-60 group-hover:opacity-100">{translateSuit(suit)}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {gameState.status === 'game_over' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 overflow-hidden"
          >
            {/* Celebration Particles */}
            {gameState.winner === 'player' && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      top: "100%", 
                      left: `${Math.random() * 100}%`,
                      scale: Math.random() * 0.5 + 0.5,
                      opacity: 1
                    }}
                    animate={{ 
                      top: "-10%", 
                      left: `${Math.random() * 100}%`,
                      rotate: 360,
                      opacity: 0
                    }}
                    transition={{ 
                      duration: Math.random() * 2 + 2, 
                      repeat: Infinity,
                      delay: Math.random() * 2
                    }}
                    className={`absolute w-4 h-4 rounded-full ${['bg-red-500', 'bg-yellow-400', 'bg-blue-400', 'bg-pink-500'][Math.floor(Math.random() * 4)]}`}
                  />
                ))}
              </div>
            )}

            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-emerald-900 p-10 rounded-3xl border border-yellow-400/30 shadow-2xl max-w-md w-full text-center space-y-6 relative z-10"
            >
              <div className="w-20 h-20 bg-yellow-400 rounded-full mx-auto flex items-center justify-center shadow-lg">
                <Trophy className="text-emerald-900" size={40} />
              </div>
              <div>
                <h2 className="text-4xl font-black mb-2">
                  {gameState.winner === 'player' ? "你赢了！" : "电脑赢了！"}
                </h2>
                <p className="text-emerald-300 text-lg">
                  {gameState.winner === 'player' 
                    ? "太棒了！你率先出完了所有的牌，获得了最终胜利！" 
                    : "很遗憾，电脑率先出完了所有的牌。再接再厉！"}
                </p>
              </div>
              <button 
                onClick={initGame}
                className="w-full py-4 bg-yellow-400 text-emerald-900 rounded-2xl font-bold text-xl shadow-xl hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} />
                再来一局
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

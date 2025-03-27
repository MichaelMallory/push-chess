import React from 'react'
import { useGameStore } from '@/store/gameStore'
import { motion, AnimatePresence } from 'framer-motion'

const PIECE_SYMBOLS: Record<string, string> = {
  'q': '♛',
  'r': '♜',
  'b': '♝',
  'n': '♞',
}

const promotionPieces = [
  { type: 'q' as const, label: 'Queen', symbol: PIECE_SYMBOLS['q'] },
  { type: 'r' as const, label: 'Rook', symbol: PIECE_SYMBOLS['r'] },
  { type: 'b' as const, label: 'Bishop', symbol: PIECE_SYMBOLS['b'] },
  { type: 'n' as const, label: 'Knight', symbol: PIECE_SYMBOLS['n'] }
]

export function PromotionDialog() {
  const { pendingPromotion, currentPlayer, handlePromotion } = useGameStore()

  if (!pendingPromotion) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed inset-0 flex items-center justify-center z-50"
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => {/* prevent clicks through */}} />
        <motion.div
          className="relative bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
        >
          <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white text-center">
            Choose promotion piece
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {promotionPieces.map(({ type, label, symbol }) => (
              <button
                key={type}
                onClick={() => handlePromotion(type)}
                className="flex flex-col items-center justify-center p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={label}
              >
                <span className={`
                  text-4xl font-['Noto_Chess']
                  ${currentPlayer === 'white' 
                    ? 'text-gray-900 dark:text-white' 
                    : 'text-black dark:text-gray-900'
                  }
                `}>
                  {currentPlayer === 'white' ? symbol.toUpperCase() : symbol}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
} 
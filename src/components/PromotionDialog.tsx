import React from 'react'
import { useGameStore } from '@/store/gameStore'

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-bold mb-4">Choose promotion piece</h2>
        <div className="grid grid-cols-2 gap-4">
          {promotionPieces.map(({ type, label, symbol }) => (
            <button
              key={type}
              onClick={() => handlePromotion(type)}
              className="flex flex-col items-center justify-center p-4 border rounded hover:bg-gray-100"
            >
              <span className={`
                text-5xl font-['Noto_Chess']
                ${currentPlayer === 'white' 
                  ? 'text-gray-900 filter drop-shadow-[2px_2px_2px_rgba(255,255,255,0.7)]'
                  : 'text-black filter drop-shadow-[2px_2px_2px_rgba(255,255,255,0.7)]'
                }
              `}>
                {currentPlayer === 'white' ? symbol.toUpperCase() : symbol}
              </span>
              <span className="mt-2 text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 
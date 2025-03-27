import { motion } from 'framer-motion'
import { Piece as ChessPiece } from 'chess.js'
import { Square } from 'chess.js'

interface PieceProps {
  piece: ChessPiece
  square: Square
  isDraggable: boolean
}

const PIECE_SYMBOLS: Record<string, string> = {
  'p': '♟︎',
  'n': '♞',
  'b': '♝',
  'r': '♜',
  'q': '♛',
  'k': '♚',
  'P': '♙',
  'N': '♘',
  'B': '♗',
  'R': '♖',
  'Q': '♕',
  'K': '♔',
}

export const Piece = ({ piece, square, isDraggable }: PieceProps) => {
  return (
    <motion.div
      className={`
        text-5xl sm:text-6xl md:text-7xl
        select-none
        ${piece.color === 'w' 
          ? 'text-white filter drop-shadow-[2px_2px_2px_rgba(0,0,0,0.7)]' 
          : 'text-gray-900 filter drop-shadow-[2px_2px_2px_rgba(255,255,255,0.7)]'
        }
        ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
        font-['Noto_Chess']
      `}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      whileHover={isDraggable ? { scale: 1.1 } : {}}
      whileTap={isDraggable ? { scale: 0.95 } : {}}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 15
      }}
      layout
    >
      {PIECE_SYMBOLS[piece.type]}
    </motion.div>
  )
} 
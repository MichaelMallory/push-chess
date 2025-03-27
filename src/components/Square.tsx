import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { Square as ChessSquare } from 'chess.js'

interface SquareProps {
  square: ChessSquare
  isLight: boolean
  isSelected: boolean
  isValidMove: boolean
  isPushMove: boolean
  isPushPath: boolean
  isHovered: boolean
  children?: ReactNode
  onClick: () => void
  onHover: (isHovered: boolean) => void
}

export const Square = ({
  square,
  isLight,
  isSelected,
  isValidMove,
  isPushMove,
  isPushPath,
  isHovered,
  children,
  onClick,
  onHover
}: SquareProps) => {
  const baseColor = isLight ? 'bg-amber-100' : 'bg-amber-800'
  const hoverColor = isLight ? 'hover:bg-amber-200' : 'hover:bg-amber-900'
  
  return (
    <div className="relative w-full pt-[100%]">
      <motion.div
        className={`
          absolute inset-0
          ${baseColor}
          ${!isSelected && !isValidMove && !isPushMove && !isPushPath && hoverColor}
          ${isSelected && 'bg-blue-400 dark:bg-blue-600'}
          ${isValidMove && 'bg-green-400 dark:bg-green-600'}
          ${isPushMove && 'bg-purple-400 dark:bg-purple-600'}
          ${isPushPath && 'bg-yellow-400 dark:bg-yellow-600'}
          transition-colors duration-200
          cursor-pointer
          flex items-center justify-center
        `}
        onClick={onClick}
        onHoverStart={() => onHover(true)}
        onHoverEnd={() => onHover(false)}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Square coordinate label */}
        <div className={`
          absolute bottom-1 right-1 text-xs select-none
          ${isLight ? 'text-amber-800' : 'text-amber-100'}
          opacity-75
        `}>
          {square}
        </div>
        
        {/* Piece container */}
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
        
        {/* Valid move indicator */}
        {(isValidMove || isPushMove) && !children && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <div className={`w-4 h-4 rounded-full ${
              isPushMove ? 'bg-purple-600 dark:bg-purple-400' : 'bg-green-600 dark:bg-green-400'
            } opacity-75`} />
          </motion.div>
        )}
        
        {/* Push path indicator */}
        {isPushPath && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-full h-full border-4 border-yellow-500 dark:border-yellow-300 opacity-75" />
          </motion.div>
        )}
      </motion.div>
    </div>
  )
} 
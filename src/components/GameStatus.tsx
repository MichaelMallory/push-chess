import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'

export const GameStatus = () => {
  const { currentPlayer, mode, isGameOver, winner } = useGameStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
    >
      {!isGameOver ? (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100">
            Current Turn
          </h2>
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full ${
                currentPlayer === 'white' ? 'bg-white' : 'bg-black'
              } border-2 border-gray-300`}
            />
            <p className="text-lg capitalize">
              {mode === 'ai' && currentPlayer === 'black' 
                ? 'AI is thinking...' 
                : `${currentPlayer}'s turn`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100">
            Game Over
          </h2>
          <p className="text-lg">
            {winner ? `${winner} wins!` : 'Draw!'}
          </p>
        </div>
      )}
    </motion.div>
  )
} 
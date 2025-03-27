import { useGameStore } from '@/store/gameStore'
import { motion, AnimatePresence } from 'framer-motion'

export const CheckmateDialog = () => {
  const { isGameOver, winner, resetGame } = useGameStore()

  return (
    <AnimatePresence>
      {isGameOver && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 flex items-center justify-center bg-black/70 z-50"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
            <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              Checkmate!
            </h2>
            <p className="text-xl text-center mb-6 text-gray-800 dark:text-gray-200">
              {winner === 'white' ? 'White' : 'Black'} wins!
            </p>
            <div className="flex justify-center">
              <button
                onClick={resetGame}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md"
              >
                Play Again
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 
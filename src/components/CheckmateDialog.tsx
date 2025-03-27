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
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
        >
          <div className="bg-white rounded-lg p-8 shadow-xl max-w-md w-full mx-4">
            <h2 className="text-3xl font-bold text-center mb-4">
              Checkmate!
            </h2>
            <p className="text-xl text-center mb-6">
              {winner === 'white' ? 'White' : 'Black'} wins!
            </p>
            <div className="flex justify-center">
              <button
                onClick={resetGame}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
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
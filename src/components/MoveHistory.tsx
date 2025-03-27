import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'

export const MoveHistory = () => {
  const { moveHistory } = useGameStore()

  const formatMove = (move: string) => {
    const [from, to] = move.split('-')
    return `${from} → ${to}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg w-full max-w-md"
    >
      <h2 className="text-xl font-semibold mb-4 text-amber-900 dark:text-amber-100">
        Move History
      </h2>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        <AnimatePresence>
          {moveHistory.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              className="text-center text-gray-500 dark:text-gray-400 italic"
            >
              No moves yet
            </motion.p>
          ) : (
            moveHistory.map((move, index) => (
              <motion.div
                key={`${move}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className={`
                  flex items-center gap-3 p-2 rounded
                  ${index % 2 === 0 ? 'bg-amber-50 dark:bg-gray-700' : ''}
                `}
              >
                <span className="font-mono text-sm text-gray-500 dark:text-gray-400 w-8">
                  {Math.floor(index / 2) + 1}.
                </span>
                <span className={`flex-1 ${index % 2 === 0 ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {formatMove(move)}
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
} 
'use client'

import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { GameBoard } from '@/components/GameBoard'
import { GameStatus } from '@/components/GameStatus'
import { MoveHistory } from '@/components/MoveHistory'
import { useEffect } from 'react'

export default function Home() {
  const { startGame } = useGameStore()

  // Start local game immediately
  useEffect(() => {
    console.log('Home component mounted - starting game')
    startGame('local')
  }, [startGame])

  console.log('Home component rendering')

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl md:text-5xl font-bold text-center mb-8 text-amber-900 dark:text-amber-100"
        >
          Push Chess
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-8 items-start max-w-[1600px] mx-auto">
          {/* Left sidebar */}
          <div className="w-full space-y-8 order-2 lg:order-1">
            <GameStatus />
            <MoveHistory />
          </div>
          
          {/* Chess board */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="order-1 lg:order-2 w-full min-h-[calc(100vh-300px)] flex items-center justify-center"
          >
            <div className="w-full max-w-[800px] aspect-square">
              <GameBoard />
            </div>
          </motion.div>

          {/* Right sidebar - Game Rules */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg order-3 sticky top-8"
          >
            <h2 className="text-2xl font-bold mb-4 text-amber-900 dark:text-amber-100">
              How to Play
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>All standard chess rules apply</li>
              <li>You can push your own pieces along the path of movement</li>
              <li>Pieces can be pushed to squares they normally couldn't move to</li>
              <li>Pushed pieces move as a "train" and must remain contiguous</li>
              <li>You can't push opponent's pieces</li>
              <li>Knights physically traverse their L-shaped path, pushing pieces as they go</li>
              <li>Pawns can push pieces when moving forward, but not during captures</li>
              <li>A pushed pawn promotes immediately upon reaching the back rank</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

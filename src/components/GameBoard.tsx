import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { Square } from './Square'
import { Piece } from './Piece'
import { PromotionDialog } from './PromotionDialog'
import { CheckmateDialog } from './CheckmateDialog'
import { Square as ChessSquare } from 'chess.js'

const BOARD_SIZE = 8
const SQUARES = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
  const row = Math.floor(i / 8)
  const col = i % 8
  const square = `${String.fromCharCode(97 + col)}${8 - row}` as ChessSquare
  const isLight = (row + col) % 2 === 0
  return { square, isLight }
})

export const GameBoard = () => {
  const { 
    game,
    selectedPiece,
    pushPath,
    currentPlayer,
    selectPiece,
    addToPushPath,
    makeMove,
    isGameOver,
    winner,
    isInCheck,
    lastCheckTime
  } = useGameStore()

  console.log('GameBoard render - game state:', {
    gameExists: !!game,
    currentPlayer,
    isGameOver,
    boardState: game ? game.board() : null,
    isInCheck
  })

  const [validMoves, setValidMoves] = useState<ChessSquare[]>([])
  const [pushMoves, setPushMoves] = useState<ChessSquare[]>([])
  const [hoveredSquare, setHoveredSquare] = useState<ChessSquare | null>(null)
  const [checkAnimation, setCheckAnimation] = useState(false)

  // Memoize the check animation effect dependencies
  const checkAnimationShouldShow = useMemo(() => {
    return isInCheck && lastCheckTime && Date.now() - lastCheckTime < 2000
  }, [isInCheck, lastCheckTime])

  // Monitor check state
  useEffect(() => {
    if (checkAnimationShouldShow) {
      setCheckAnimation(true)
      const timer = setTimeout(() => setCheckAnimation(false), 2000)
      return () => clearTimeout(timer)
    } else {
      setCheckAnimation(false)
    }
  }, [checkAnimationShouldShow])

  // Memoize move calculations
  useEffect(() => {
    if (selectedPiece && game) {
      // Get regular valid moves
      const moves = game.moves({ 
        square: selectedPiece.square,
        verbose: true 
      })
      const regularMoves = moves.map(move => move.to)

      // Get push destinations
      const pushDestinations = game.getValidPushDestinations(selectedPiece.square)
      
      // Filter out regular moves from push destinations
      const uniquePushMoves = pushDestinations.filter(dest => !regularMoves.includes(dest))

      // Calculate final positions for pushed pieces
      const finalPushPositions = uniquePushMoves.map(dest => {
        const nextSquare = game.findNextSquareInPushPath(dest, dest)
        return nextSquare
      })
      
      setValidMoves(regularMoves)
      setPushMoves(finalPushPositions)
    } else {
      setValidMoves([])
      setPushMoves([])
    }
  }, [selectedPiece, game])

  // Memoize the square click handler
  const handleSquareClick = useCallback((square: ChessSquare) => {
    if (isGameOver || !game) return

    const piece = game.get(square)
    const isCurrentPlayerPiece = piece?.color === (currentPlayer === 'white' ? 'w' : 'b')

    // If we have a selected piece, try to move it
    if (selectedPiece) {
      // Check if this is a valid push destination
      const pushDestinations = game.getValidPushDestinations(selectedPiece.square)
      const isValidPushMove = pushDestinations.includes(square)

      if (isValidPushMove) {
        // Execute push move
        makeMove(selectedPiece.square, square)
      } else if (validMoves.includes(square)) {
        // Execute regular move
        makeMove(selectedPiece.square, square)
      } else {
        // If clicking on own piece, select it instead
        if (isCurrentPlayerPiece) {
          selectPiece(square)
        } else {
          selectPiece(null)
        }
      }
      return
    }

    // If no piece was selected and this is our piece, select it
    if (isCurrentPlayerPiece) {
      selectPiece(square)
    }
  }, [game, selectedPiece, isGameOver, currentPlayer, validMoves, makeMove, selectPiece])

  // Memoize the hover handler
  const handleSquareHover = useCallback((isHovered: boolean, square: ChessSquare) => {
    setHoveredSquare(isHovered ? square : null)
  }, [])

  if (!game) return null

  return (
    <div className="relative w-full aspect-square bg-gray-800 p-4 rounded-xl shadow-2xl">
      {/* Promotion Dialog */}
      <PromotionDialog />

      {/* Check display */}
      <AnimatePresence>
        {checkAnimation && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: [1, 1.1, 1],
                transition: { duration: 0.5, repeat: Infinity }
              }}
              className="bg-red-500 text-white px-6 py-2 rounded-b-lg shadow-lg font-bold text-xl"
            >
              CHECK!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game over overlay */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-center"
            >
              <h2 className="text-2xl font-bold mb-4">
                {winner ? `${winner.toUpperCase()} Wins!` : "Game Over!"}
              </h2>
              <button
                onClick={() => useGameStore.getState().resetGame()}
                className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board */}
      <div className="grid grid-cols-8 gap-[2px] w-full h-full bg-gray-700 p-[2px] rounded-lg overflow-hidden">
        {SQUARES.map(({ square, isLight }) => (
          <Square
            key={square}
            square={square}
            isLight={isLight}
            isSelected={selectedPiece?.square === square}
            isValidMove={validMoves.includes(square)}
            isPushMove={pushMoves.includes(square)}
            isPushPath={pushPath.includes(square)}
            isHovered={hoveredSquare === square}
            onClick={() => handleSquareClick(square)}
            onHover={(isHovered: boolean) => handleSquareHover(isHovered, square)}
          >
            {game.get(square) && (
              <Piece
                piece={game.get(square)!}
                square={square}
                isDraggable={game.get(square)!.color === (currentPlayer === 'white' ? 'w' : 'b') && !isGameOver}
              />
            )}
          </Square>
        ))}
      </div>

      <CheckmateDialog />
    </div>
  )
} 
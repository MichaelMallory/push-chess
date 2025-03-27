import { create } from 'zustand'
import { Square } from 'chess.js'
import { makeAiMove } from '@/services/aiPlayer'
import { PushChess } from '@/lib/PushChess'

export type GameMode = 'menu' | 'local' | 'ai'
export type PlayerColor = 'white' | 'black'

interface GameState {
  mode: GameMode
  game: PushChess | null
  selectedPiece: { square: Square } | null
  pushPath: Square[]
  currentPlayer: PlayerColor
  isGameOver: boolean
  winner: PlayerColor | null
  moveHistory: string[]
  isInCheck: boolean
  lastCheckTime: number | null
  boardState: any
  pendingPromotion: { from: Square, to: Square } | null
  
  // Actions
  setMode: (mode: GameMode) => void
  selectPiece: (square: Square | null) => void
  addToPushPath: (square: Square) => void
  clearPushPath: () => void
  makeMove: (from: Square, to: Square) => void
  startGame: (mode: GameMode) => void
  resetGame: () => void
  handlePromotion: (pieceType: 'q' | 'r' | 'b' | 'n') => void
}

export const useGameStore = create<GameState>((set, get) => ({
  mode: 'menu',
  game: null,
  selectedPiece: null,
  pushPath: [],
  currentPlayer: 'white',
  isGameOver: false,
  winner: null,
  moveHistory: [],
  isInCheck: false,
  lastCheckTime: null,
  boardState: null,
  pendingPromotion: null,

  setMode: (mode) => set({ mode }),
  
  startGame: (mode) => {
    console.log('Starting game with mode:', mode)
    try {
      const game = new PushChess()
      console.log('Game initialized:', {
        gameExists: !!game,
        boardState: game.board(),
        fen: game.fen()
      })
      set({
        mode,
        game,
        selectedPiece: null,
        pushPath: [],
        currentPlayer: 'white',
        isGameOver: false,
        winner: null,
        moveHistory: [],
        isInCheck: false,
        lastCheckTime: null,
        boardState: game.board()
      })
      console.log('Game state updated in store')
    } catch (error) {
      console.error('Failed to initialize game:', error)
    }
  },
  
  selectPiece: (square) => {
    const { game } = get()
    if (!game) return
    
    set({ 
      selectedPiece: square ? { square } : null,
      pushPath: []
    })
  },
  
  addToPushPath: (square) => {
    const { game } = get()
    if (!game) return
    
    set((state) => ({
      pushPath: [...state.pushPath, square]
    }))
  },
  
  clearPushPath: () => set({ pushPath: [] }),
  
  makeMove: (from: Square, to: Square) => {
    const { game, currentPlayer, mode } = get()
    if (!game) return
    
    try {
      let success: boolean
      
      // Get the piece that's moving
      const piece = game.get(from)
      if (!piece) return

      // Check if this is a pawn move
      if (piece.type === 'p') {
        // Check if it's a diagonal move by comparing file (column) letters
        const isDiagonalMove = from[0] !== to[0]

        // If it's a diagonal move (capture), don't try to push
        if (isDiagonalMove) {
          success = game.move({ from, to }) !== null
          console.log('Pawn capture executed:', { from, to, success })
        } else {
          // Check if this is a push destination for vertical moves
          const pushDestinations = game.getValidPushDestinations(from)
          if (pushDestinations.includes(to)) {
            success = game.pushMove(from, to)
            console.log('Pawn push move executed:', { from, to, success })
          } else {
            success = game.move({ from, to }) !== null
            console.log('Regular pawn move executed:', { from, to, success })
          }
        }
      } else {
        // Non-pawn moves
        const pushDestinations = game.getValidPushDestinations(from)
        if (pushDestinations.includes(to)) {
          success = game.pushMove(from, to)
          console.log('Push move executed:', { from, to, success })
        } else {
          success = game.move({ from, to }) !== null
          console.log('Regular move executed:', { from, to, success })
        }
      }
      
      if (success) {
        // Check for pending promotion
        const pendingPromotion = game.hasPendingPromotion()
        if (pendingPromotion) {
          // For push moves, we need to find the actual pawn that needs promotion
          const board = game.board()
          let promotionSquare = pendingPromotion
          let fromSquare = from
          
          // If this was a push move, find the actual pawn that needs promotion
          if (piece.type !== 'p' || (piece.type === 'p' && piece.color === 'w' ? to[1] !== '1' : to[1] !== '8')) {
            // Search the board for the pawn that needs promotion
            for (let row = 0; row < 8; row++) {
              for (let col = 0; col < 8; col++) {
                const square = `${String.fromCharCode(97 + col)}${8 - row}` as Square
                const pieceAtSquare = game.get(square)
                if (pieceAtSquare?.type === 'p') {
                  // Check if this pawn is on the promotion rank
                  if ((pieceAtSquare.color === 'w' && row === 0) || 
                      (pieceAtSquare.color === 'b' && row === 7)) {
                    promotionSquare = square
                    // Find the original square by looking one rank back
                    const fromRow = pieceAtSquare.color === 'w' ? 1 : 6
                    fromSquare = `${square[0]}${8 - fromRow}` as Square
                    break
                  }
                }
              }
            }
          }
          
          // Set pending promotion with the correct squares
          set({ pendingPromotion: { from: fromSquare, to: promotionSquare } })
          return
        }

        // Get the next player
        const nextPlayer = currentPlayer === 'white' ? 'black' : 'white'
        
        // Check if the move put the opponent in check
        const isCheck = game.isOpponentInCheck()
        const lastCheckTime = isCheck ? Date.now() : null

        console.log('Check state after move:', {
          movingPlayer: currentPlayer,
          nextPlayer,
          isCheck,
          board: game.board(),
          kings: {
            white: game.board().flat().find(p => p?.type === 'k' && p.color === 'w'),
            black: game.board().flat().find(p => p?.type === 'k' && p.color === 'b')
          }
        })

        // Switch to next player's turn
        // @ts-ignore - Accessing protected property
        game._turn = nextPlayer === 'white' ? 'w' : 'b'

        const isGameOverState = game.isGameOver()
        const isCheckmateState = game.isCheckmate()
        
        console.log('Move state update:', {
          nextPlayer,
          isCheck,
          isGameOver: isGameOverState,
          isCheckmate: isCheckmateState,
          board: game.board(),
          kings: {
            white: game.board().flat().find(p => p?.type === 'k' && p.color === 'w'),
            black: game.board().flat().find(p => p?.type === 'k' && p.color === 'b')
          },
          checkTime: game.getLastCheckTime()
        })

        const newState: Partial<GameState> = {
          currentPlayer: nextPlayer as PlayerColor,
          moveHistory: [...get().moveHistory, `${from}-${to}`],
          selectedPiece: null,
          pushPath: [],
          isGameOver: isGameOverState,
          winner: isCheckmateState ? currentPlayer : null,
          isInCheck: isCheck,
          lastCheckTime,
          boardState: game.board()
        }
        
        set(newState)
        
        // Make AI move if it's AI's turn
        if (mode === 'ai' && !newState.isGameOver && newState.currentPlayer === 'black') {
          setTimeout(() => {
            const aiMove = makeAiMove(game)
            get().makeMove(aiMove.from, aiMove.to)
          }, 500) // Add delay for better UX
        }
      }
    } catch (error) {
      console.error('Invalid move:', error)
    }
  },
  
  handlePromotion: (pieceType: 'q' | 'r' | 'b' | 'n') => {
    const { game, pendingPromotion, currentPlayer, mode } = get()
    if (!game || !pendingPromotion) return

    try {
      // First remove the pawn
      game.remove(pendingPromotion.to)
      // Then place the promoted piece
      const color = currentPlayer === 'white' ? 'w' : 'b'
      game.put({ type: pieceType, color }, pendingPromotion.to)

      // Clear both the game's internal promotion state and our store's state
      // @ts-ignore - Accessing custom property
      game._pendingPromotion = null
      set({ pendingPromotion: null })

      // Get the next player
      const nextPlayer = currentPlayer === 'white' ? 'black' : 'white'
      
      // Switch to next player's turn
      // @ts-ignore - Accessing protected property
      game._turn = nextPlayer === 'white' ? 'w' : 'b'
      
      // Check if the move put the opponent in check
      const isCheck = game.isOpponentInCheck()
      const lastCheckTime = isCheck ? Date.now() : null

      const isGameOverState = game.isGameOver()
      const isCheckmateState = game.isCheckmate()

      const newState: Partial<GameState> = {
        currentPlayer: nextPlayer as PlayerColor,
        selectedPiece: null,
        pushPath: [],
        isGameOver: isGameOverState,
        winner: isCheckmateState ? currentPlayer : null,
        isInCheck: isCheck,
        lastCheckTime,
        boardState: game.board()
      }
      
      set(newState)
      
      // Make AI move if it's AI's turn
      if (mode === 'ai' && !newState.isGameOver && newState.currentPlayer === 'black') {
        setTimeout(() => {
          const aiMove = makeAiMove(game)
          get().makeMove(aiMove.from, aiMove.to)
        }, 500)
      }
    } catch (error) {
      console.error('Failed to promote pawn:', error)
      // If promotion fails, make sure to clear both states
      // @ts-ignore - Accessing custom property
      game._pendingPromotion = null
      set({ pendingPromotion: null })
    }
  },
  
  resetGame: () => {
    const { mode } = get()
    if (mode === 'menu') {
      set({
        game: null,
        selectedPiece: null,
        pushPath: [],
        currentPlayer: 'white',
        isGameOver: false,
        winner: null,
        moveHistory: [],
        isInCheck: false,
        lastCheckTime: null,
        boardState: null
      })
    } else {
      const game = new PushChess()
      set({
        game,
        selectedPiece: null,
        pushPath: [],
        currentPlayer: 'white',
        isGameOver: false,
        winner: null,
        moveHistory: [],
        isInCheck: false,
        lastCheckTime: null,
        boardState: game.board()
      })
    }
  }
})) 
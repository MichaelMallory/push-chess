import { Chess, Move, Square } from 'chess.js'

// Basic piece values for evaluation
const PIECE_VALUES = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0
}

// Position evaluation bonus for controlling center squares
const CENTER_SQUARES = ['d4', 'd5', 'e4', 'e5']
const CENTER_BONUS = 0.3

// Evaluate the current position
const evaluatePosition = (game: Chess): number => {
  let score = 0
  
  // Material count
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const square = `${String.fromCharCode(97 + j)}${8 - i}` as Square
      const piece = game.get(square)
      if (piece) {
        const value = PIECE_VALUES[piece.type.toLowerCase() as keyof typeof PIECE_VALUES]
        score += piece.color === 'w' ? value : -value
        
        // Center control bonus
        if (CENTER_SQUARES.includes(square)) {
          score += piece.color === 'w' ? CENTER_BONUS : -CENTER_BONUS
        }
      }
    }
  }
  
  return score
}

// Minimax algorithm with alpha-beta pruning
const minimax = (
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number => {
  if (depth === 0 || game.isGameOver()) {
    return evaluatePosition(game)
  }

  const moves = game.moves({ verbose: true })
  
  if (isMaximizing) {
    let maxEval = -Infinity
    for (const move of moves) {
      game.move(move)
      const evaluation = minimax(game, depth - 1, alpha, beta, false)
      game.undo()
      maxEval = Math.max(maxEval, evaluation)
      alpha = Math.max(alpha, evaluation)
      if (beta <= alpha) break
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const move of moves) {
      game.move(move)
      const evaluation = minimax(game, depth - 1, alpha, beta, true)
      game.undo()
      minEval = Math.min(minEval, evaluation)
      beta = Math.min(beta, evaluation)
      if (beta <= alpha) break
    }
    return minEval
  }
}

// Find the best move for the AI
export const findBestMove = (game: Chess, depth: number = 3): Move => {
  let bestMove: Move | null = null
  let bestEval = -Infinity
  const moves = game.moves({ verbose: true })
  
  // Randomize moves order for variety in equal positions
  moves.sort(() => Math.random() - 0.5)
  
  for (const move of moves) {
    game.move(move)
    const evaluation = minimax(game, depth - 1, -Infinity, Infinity, false)
    game.undo()
    
    if (evaluation > bestEval) {
      bestEval = evaluation
      bestMove = move
    }
  }
  
  return bestMove!
}

// Make a move for the AI player
export const makeAiMove = (game: Chess): { from: Square, to: Square } => {
  const move = findBestMove(game)
  return { from: move.from, to: move.to }
} 
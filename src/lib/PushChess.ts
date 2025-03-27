import { Chess, Square, Piece, Move, PieceSymbol } from 'chess.js'

export class PushChess extends Chess {
  private pushPath: Square[] = []
  private _isCheck: boolean = false
  private _lastCheckTime: number | null = null
  private _isCheckingForCheck: boolean = false
  private _whiteKingInCheck: boolean = false
  private _blackKingInCheck: boolean = false

  // Helper to check if a square is within bounds
  private isValidSquare(row: number, col: number): boolean {
    return row >= 0 && row < 8 && col >= 0 && col < 8
  }

  // Convert algebraic notation to row/col coordinates
  private squareToCoords(square: Square): [number, number] {
    const row = 8 - parseInt(square[1])
    const col = square.charCodeAt(0) - 97
    return [row, col]
  }

  // Convert row/col coordinates to algebraic notation
  private coordsToSquare(row: number, col: number): Square {
    return `${String.fromCharCode(col + 97)}${8 - row}` as Square
  }

  // Get direction vector between two squares
  private getDirection(from: Square, to: Square): [number, number] {
    const [fromRow, fromCol] = this.squareToCoords(from)
    const [toRow, toCol] = this.squareToCoords(to)
        return [
      Math.sign(toRow - fromRow),
      Math.sign(toCol - fromCol)
    ]
  }

  // Get all squares along a path between two squares
  private getSquaresAlongPath(from: Square, to: Square): Square[] {
    const [fromRow, fromCol] = this.squareToCoords(from)
    const [toRow, toCol] = this.squareToCoords(to)
    const [dRow, dCol] = this.getDirection(from, to)
    
    const path: Square[] = []
    let currentRow = fromRow
    let currentCol = fromCol

    // For all pieces, get squares along the direct path
    while (currentRow !== toRow || currentCol !== toCol) {
      currentRow += dRow
      currentCol += dCol
      if (this.isValidSquare(currentRow, currentCol)) {
        path.push(this.coordsToSquare(currentRow, currentCol))
      }
    }

    return path
  }

  // Get all valid push destinations for a piece
  getValidPushDestinations(from: Square): Square[] {
    const piece = this.get(from)
    if (!piece) return []

    // Get all potential destinations first
    const destinations = this._getValidPushDestinations(from)
    
    // If we're in check, we need to find moves that get us out of check
    if (this.inCheck()) {
      console.log('Filtering push moves while in check:', {
        piece,
        from,
        inCheck: this.inCheck(),
        currentTurn: this.turn(),
        destinations
      })

      return destinations.filter(to => {
        // Store current state
        const currentState = this.fen()
        
        // Try the push move
        const moveResult = this._pushMove(from, to)
        if (!moveResult) {
          this.load(currentState)
          return false
        }

        // Check if we're still in check after the move
        this.updateCheckStates()
        const stillInCheck = piece.color === 'w' ? this._whiteKingInCheck : this._blackKingInCheck
        
        // Restore position
        this.load(currentState)
        
        // Move is valid only if it gets us out of check
        const isValid = !stillInCheck
        console.log('Push move check escape test:', {
          from,
          to,
          isValid,
          stillInCheck
        })
        return isValid
      })
    }

    // If not in check, just filter moves that would put us in check
    return destinations.filter(to => !this.wouldBeInCheck(from, to, true))
  }

  // Rename original getValidPushDestinations to _getValidPushDestinations
  private _getValidPushDestinations(from: Square): Square[] {
    const piece = this.get(from)
    if (!piece || (piece.type !== 'k' && piece.type !== 'b' && piece.type !== 'r' && piece.type !== 'p' && piece.type !== 'q')) return [] 

    const destinations: Square[] = []
    const [fromRow, fromCol] = this.squareToCoords(from)

    const isBishop = piece.type === 'b'
    const isKing = piece.type === 'k'
    const isRook = piece.type === 'r'
    const isPawn = piece.type === 'p'
    const isQueen = piece.type === 'q'
    const isFirstMove = isPawn && ((piece.color === 'w' && fromRow === 6) || (piece.color === 'b' && fromRow === 1))

    // Define directions based on piece type
    let directions: [number, number][] = []
    
    if (isKing) {
      directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],          [0, 1],
        [1, -1],  [1, 0],  [1, 1]
      ]
    } else if (isBishop || (isQueen)) { // bishop and queen diagonal
      directions = [
        [-1, -1], [-1, 1],
        [1, -1],  [1, 1]
      ]
    }
    
    if (isRook || (isQueen)) { // rook and queen straight
      directions = directions.concat([
        [-1, 0], // up
        [1, 0],  // down
        [0, -1], // left
        [0, 1]   // right
      ])
    } else if (isPawn) { // pawn - only vertical pushing
      // Only allow pushing in the pawn's forward direction
      directions = piece.color === 'w' ? [[-1, 0]] : [[1, 0]]
    }

    // Check each direction
    for (const [dRow, dCol] of directions) {
      let currentRow = fromRow + dRow
      let currentCol = fromCol + dCol
      let foundPushablePieces = false
      let pushablePieces: Square[] = []
      let moveCount = 1 // Track how far the piece has moved

      // For bishops, rooks, queens, and pawns, check all squares in their movement direction
      while (this.isValidSquare(currentRow, currentCol)) {
        const targetSquare = this.coordsToSquare(currentRow, currentCol)
        const pieceAtTarget = this.get(targetSquare)

        // For pawns, check if we've exceeded their movement range
        if (isPawn) {
          if ((isFirstMove && moveCount > 2) || (!isFirstMove && moveCount > 1)) {
            break
          }
        }

        if (!pieceAtTarget) {
          // Empty square - valid regular move if we haven't found pushable pieces
          if (!foundPushablePieces) {
            destinations.push(targetSquare)
          } else if (isBishop || isRook || isPawn || isQueen) {
            // Calculate if we have enough space for all pieces after this square
            let spaceAvailable = 0
            let checkRow = currentRow + dRow
            let checkCol = currentCol + dCol
            let validDestination = true

            // We need enough space for all pushed pieces beyond this square
            for (let i = 0; i < pushablePieces.length; i++) {
              if (!this.isValidSquare(checkRow, checkCol)) {
                validDestination = false
                break
              }
              const checkSquare = this.coordsToSquare(checkRow, checkCol)
              const pieceAtCheck = this.get(checkSquare)
              if (pieceAtCheck && pieceAtCheck.color !== piece.color) {
                validDestination = false
                break
              }
              spaceAvailable++
              checkRow += dRow
              checkCol += dCol
            }

            // Only add as valid destination if we have enough space for all pieces
            // and we haven't exceeded the pawn's movement range
            if (validDestination && spaceAvailable >= pushablePieces.length) {
              if (!isPawn || (isFirstMove && moveCount <= 2) || (!isFirstMove && moveCount <= 1)) {
                destinations.push(targetSquare)
              }
            }
          }
          if (isKing) break // King only moves one square
        } else if (pieceAtTarget.color === piece.color) {
          // Found friendly piece - check if we can push the line of pieces
          let lineRow = currentRow
          let lineCol = currentCol
          let canPush = false
          pushablePieces = [targetSquare]

          // Find the line of friendly pieces
          while (true) {
            const nextRow = lineRow + dRow
            const nextCol = lineCol + dCol
            
            if (!this.isValidSquare(nextRow, nextCol)) break
            
            const nextSquare = this.coordsToSquare(nextRow, nextCol)
            const nextPiece = this.get(nextSquare)
            
            if (!nextPiece) {
              // Found empty square after line - can push
              canPush = true
                break
              }

            if (nextPiece.color !== piece.color) break // Stop at opponent piece
            
            pushablePieces.push(nextSquare)
            lineRow = nextRow
            lineCol = nextCol
          }

          if (canPush) {
            foundPushablePieces = true
            // For rook/bishop/queen/pawn, verify we have enough space beyond this point
            if ((isRook || isBishop || isPawn || isQueen) && pushablePieces.length > 0) {
              let spaceAvailable = 0
              let checkRow = currentRow + dRow
              let checkCol = currentCol + dCol
              let validDestination = true

              // Check if we have space for all pieces beyond this point
              for (let i = 0; i < pushablePieces.length; i++) {
                if (!this.isValidSquare(checkRow, checkCol)) {
                  validDestination = false
                  break
                }
                const checkSquare = this.coordsToSquare(checkRow, checkCol)
                const pieceAtCheck = this.get(checkSquare)
                if (pieceAtCheck && pieceAtCheck.color !== piece.color) {
                  validDestination = false
                break
              }
                spaceAvailable++
                checkRow += dRow
                checkCol += dCol
              }

              if (validDestination && spaceAvailable >= pushablePieces.length) {
                // For pawns, check movement range
                if (!isPawn || (isFirstMove && moveCount <= 2) || (!isFirstMove && moveCount <= 1)) {
                  destinations.push(targetSquare)
                }
              }
            } else {
              destinations.push(targetSquare)
            }
            if (isKing) break
          } else {
            // If we can't push these pieces, stop checking this direction
            break
          }
        } else {
          // Opponent piece - stop here
          break
        }

        // For king, only check one square
        if (isKing) break
        currentRow += dRow
        currentCol += dCol
        moveCount++
      }
    }

    return destinations
  }

  // Update check state for both kings
  private updateCheckStates(): void {
    const board = this.board()
    const currentTurn = this.turn()
    
    console.log('Starting updateCheckStates:', {
      currentTurn,
      board: this.board(),
      fen: this.fen()
    })
    
    // Find both kings
    let whiteKingSquare: Square | null = null
    let blackKingSquare: Square | null = null
    
    // Find kings
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece?.type === 'k') {
          if (piece.color === 'w') {
            whiteKingSquare = this.coordsToSquare(row, col)
          } else {
            blackKingSquare = this.coordsToSquare(row, col)
          }
        }
      }
    }

    console.log('Found kings at:', {
      whiteKingSquare,
      blackKingSquare
    })

    // Check if white king is under attack from any black piece
    this._whiteKingInCheck = false
    if (whiteKingSquare) {
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const square = this.coordsToSquare(row, col)
          const piece = this.get(square)
          if (piece && piece.color === 'b') {
            if (this.canPieceAttack(square, whiteKingSquare)) {
              this._whiteKingInCheck = true
              console.log('White king in check:', {
                attackingPiece: piece,
                from: square,
                kingSquare: whiteKingSquare,
                turn: this.turn()
              })
              break
            }
            // Check push moves
            const pushMoves = this._getValidPushDestinations(square)
            if (pushMoves.includes(whiteKingSquare)) {
              this._whiteKingInCheck = true
              console.log('White king in check (push):', {
                attackingPiece: piece,
                from: square,
                kingSquare: whiteKingSquare,
                turn: this.turn()
              })
              break
            }
          }
        }
        if (this._whiteKingInCheck) break
      }
    }

    // Check if black king is under attack from any white piece
    this._blackKingInCheck = false
    if (blackKingSquare) {
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const square = this.coordsToSquare(row, col)
          const piece = this.get(square)
          if (piece && piece.color === 'w') {
            if (this.canPieceAttack(square, blackKingSquare)) {
              this._blackKingInCheck = true
              console.log('Black king in check:', {
                attackingPiece: piece,
                from: square,
                kingSquare: blackKingSquare,
                turn: this.turn()
              })
              break
            }
            // Check push moves
            const pushMoves = this._getValidPushDestinations(square)
            if (pushMoves.includes(blackKingSquare)) {
              this._blackKingInCheck = true
              console.log('Black king in check (push):', {
                attackingPiece: piece,
                from: square,
                kingSquare: blackKingSquare,
                turn: this.turn()
              })
              break
            }
          }
        }
        if (this._blackKingInCheck) break
      }
    }

    console.log('Check states updated:', {
      whiteKingInCheck: this._whiteKingInCheck,
      blackKingInCheck: this._blackKingInCheck,
      turn: this.turn(),
      fen: this.fen()
    })
  }

  // Override inCheck to use our tracked state
  inCheck(): boolean {
    // Update check states
    this.updateCheckStates()
    // Return check state for current player
    return this.turn() === 'w' ? this._whiteKingInCheck : this._blackKingInCheck
  }

  // Override isCheck to check opponent's king
  isCheck(): boolean {
    // Update check states
    this.updateCheckStates()
    // Return check state for opponent
    return this.turn() === 'w' ? this._blackKingInCheck : this._whiteKingInCheck
  }

  // Update pushMove to use new check detection and return check state
  pushMove(from: Square, to: Square): boolean {
    // Store current state in case we need to undo
    const currentState = this.fen()
    const movingPiece = this.get(from)
    if (!movingPiece) return false

    console.log('Starting push move:', {
      from,
      to,
      piece: movingPiece,
      currentTurn: this.turn(),
      currentFen: currentState
    })

    // Execute the push move
    const moveResult = this._pushMove(from, to)
    if (!moveResult) {
      console.log('Push move failed in _pushMove')
      return false
    }

    console.log('Push move executed, checking results:', {
      newFen: this.fen(),
      newTurn: this.turn(),
      board: this.board()
    })

    // Update check states
    this.updateCheckStates()

    // Check if the move puts our own king in check
    // Use the moving piece's color to determine which king to check
    const isInCheck = movingPiece.color === 'w' ? this._whiteKingInCheck : this._blackKingInCheck
    
    console.log('Checking if move puts own king in check:', {
      movingPieceColor: movingPiece.color,
      whiteKingInCheck: this._whiteKingInCheck,
      blackKingInCheck: this._blackKingInCheck,
      isInCheck
    })

    if (isInCheck) {
      console.log('Move cancelled - would put own king in check:', {
        movingPieceColor: movingPiece.color,
        whiteKingInCheck: this._whiteKingInCheck,
        blackKingInCheck: this._blackKingInCheck,
        board: this.board()
      })
      this.load(currentState)
      return false
    }

    // Check if opponent is in check
    const opponentInCheck = movingPiece.color === 'w' ? this._blackKingInCheck : this._whiteKingInCheck
    console.log('Check detection after move:', {
      movingPieceColor: movingPiece.color,
      opponentInCheck,
      whiteKingInCheck: this._whiteKingInCheck,
      blackKingInCheck: this._blackKingInCheck,
      board: this.board()
    })

    // Set check state
    this._isCheck = opponentInCheck
    if (opponentInCheck) {
      this._lastCheckTime = Date.now()
    }

    return true
  }

  // Rename original pushMove to _pushMove
  private _pushMove(from: Square, to: Square): boolean {
    const piece = this.get(from)
    if (!piece || (piece.type !== 'k' && piece.type !== 'b' && piece.type !== 'r' && piece.type !== 'p' && piece.type !== 'q')) return false

    // For pawns, only allow pushing in their normal movement direction
    if (piece.type === 'p') {
      const [fromRow, fromCol] = this.squareToCoords(from)
      const [toRow, toCol] = this.squareToCoords(to)
      const dRow = Math.sign(toRow - fromRow)
      
      // White pawns can only push upward, black pawns can only push downward
      if ((piece.color === 'w' && dRow !== -1) || (piece.color === 'b' && dRow !== 1)) {
        return false
      }
    }

    // Get direction of push
    const [fromRow, fromCol] = this.squareToCoords(from)
    const [toRow, toCol] = this.squareToCoords(to)
    const dRow = Math.sign(toRow - fromRow)
    const dCol = Math.sign(toCol - fromCol)

    // Find all pieces in the path that need to be pushed
    const piecesToPush: { from: Square, piece: Piece }[] = []
    let currentRow = fromRow
    let currentCol = fromCol

    // First, collect all pieces between the start and end position
    while (currentRow !== toRow || currentCol !== toCol) {
      currentRow += dRow
      currentCol += dCol
      
      if (!this.isValidSquare(currentRow, currentCol)) return false
      
      const square = this.coordsToSquare(currentRow, currentCol)
      const pieceAtSquare = this.get(square)
      
      if (pieceAtSquare) {
        if (pieceAtSquare.color !== piece.color) return false // Invalid if opponent piece
        piecesToPush.push({ from: square, piece: pieceAtSquare })
      }
    }

    // Store the current turn
    const currentTurn = this.turn()

    // If there are no pieces to push, just move the piece
    if (piecesToPush.length === 0) {
      // Clear the source square before moving
      this.remove(from)
      this.put(piece, to)

      // Check for pawn promotion
      if (piece.type === 'p') {
        const [row] = this.squareToCoords(to)
        if ((piece.color === 'w' && row === 0) || (piece.color === 'b' && row === 7)) {
          // Set a flag to indicate promotion is needed
          // @ts-ignore - Adding custom property
          this._pendingPromotion = to
        }
      }
    } else {
      // Calculate final positions for all pieces
      const moves: { from: Square, to: Square, piece: Piece }[] = []

      // First, verify the space we need
      let pushRow = toRow + dRow
      let pushCol = toCol + dCol

      // Verify we have enough space for all pushed pieces
      for (let i = 0; i < piecesToPush.length; i++) {
        if (!this.isValidSquare(pushRow + (i * dRow), pushCol + (i * dCol))) {
          return false
        }
        const checkSquare = this.coordsToSquare(pushRow + (i * dRow), pushCol + (i * dCol))
        const pieceAtCheck = this.get(checkSquare)
        if (pieceAtCheck && pieceAtCheck.color !== piece.color) {
          return false
        }
      }

      // Clear all source squares first
      this.remove(from) // Remove moving piece
      piecesToPush.forEach(({ from }) => this.remove(from)) // Remove all pieces being pushed

      // Now place all pieces in their new positions, starting with the furthest piece
      // This prevents any issues with pieces blocking each other's paths
      for (let i = piecesToPush.length - 1; i >= 0; i--) {
        const targetRow = pushRow + (i * dRow)
        const targetCol = pushCol + (i * dCol)
        const targetSquare = this.coordsToSquare(targetRow, targetCol)
        const pushedPiece = piecesToPush[i].piece
        this.put(pushedPiece, targetSquare)

        // Check for pushed pawn promotion
        if (pushedPiece.type === 'p') {
          if ((pushedPiece.color === 'w' && targetRow === 0) || 
              (pushedPiece.color === 'b' && targetRow === 7)) {
            // Set a flag to indicate promotion is needed
            // @ts-ignore - Adding custom property
            this._pendingPromotion = targetSquare
          }
        }
      }

      // Finally, place the moving piece
      this.put(piece, to)

      // Check for moving pawn promotion
      if (piece.type === 'p') {
        if ((piece.color === 'w' && toRow === 0) || (piece.color === 'b' && toRow === 7)) {
          // Set a flag to indicate promotion is needed
          // @ts-ignore - Adding custom property
          this._pendingPromotion = to
        }
      }
    }

    // Clear any push state
    this.pushPath = []

    // Properly update the turn without using dummy moves
    if (currentTurn === 'w') {
      // @ts-ignore - Accessing protected property
      this._turn = 'b'
    } else {
      // @ts-ignore - Accessing protected property
      this._turn = 'w'
    }

    // Update halfmoves and fullmoves if needed
    // @ts-ignore - Accessing protected property
    if (currentTurn === 'b') {
      // @ts-ignore - Accessing protected property
      this._moveNumber++
    }

    return true
  }

  // Helper method to find the next square in push path
  findNextSquareInPushPath(current: Square, target: Square): Square {
    // Calculate direction from current to target
    const currentRow = 8 - parseInt(current[1])
    const currentCol = current.charCodeAt(0) - 97
    const targetRow = 8 - parseInt(target[1])
    const targetCol = target.charCodeAt(0) - 97

    // Get direction
    const dRow = Math.sign(targetRow - currentRow)
    const dCol = Math.sign(targetCol - currentCol)

    // Calculate next square
    const nextRow = currentRow + dRow
    const nextCol = currentCol + dCol

    // Convert back to algebraic notation
    return `${String.fromCharCode(nextCol + 97)}${8 - nextRow}` as Square
  }

  // Helper method to find the previous square in push path
  private findPrevSquareInPath(current: Square, target: Square): Square {
    const currentRow = 8 - parseInt(current[1])
    const currentCol = current.charCodeAt(0) - 97
    const targetRow = 8 - parseInt(target[1])
    const targetCol = target.charCodeAt(0) - 97

    const dRow = Math.sign(targetRow - currentRow)
    const dCol = Math.sign(targetCol - currentCol)

    const prevRow = currentRow + dRow
    const prevCol = currentCol + dCol

    return `${String.fromCharCode(prevCol + 97)}${8 - prevRow}` as Square
  }

  // Check if a push move is valid
  isValidPushMove(from: Square, to: Square, pushPath: Square[]): boolean {
    const piece = this.get(from)
    if (!piece) return false

    // Validate push path
    for (const square of pushPath) {
      const pushPiece = this.get(square)
      if (!pushPiece || pushPiece.color !== piece.color) return false
    }

    // Check if destination is in valid push destinations
    const validDestinations = this.getValidPushDestinations(from)
    if (!validDestinations.includes(to)) return false

    // Clear push path if move is valid
    this.pushPath = []
    
    return true
  }

  // Add a method to check if there's a pending promotion
  hasPendingPromotion(): Square | null {
    // @ts-ignore - Accessing custom property
    return this._pendingPromotion || null
  }

  // Add a method to handle the promotion
  promote(square: Square, pieceType: 'q' | 'r' | 'b' | 'n'): boolean {
    // @ts-ignore - Accessing custom property
    if (!this._pendingPromotion || this._pendingPromotion !== square) {
      return false
    }

    const pawn = this.get(square)
    if (!pawn || pawn.type !== 'p') {
      return false
    }

    // Promote the pawn
    this.remove(square)
    this.put({ type: pieceType, color: pawn.color }, square)

    // Clear the pending promotion
    // @ts-ignore - Accessing custom property
    this._pendingPromotion = null

    return true
  }

  // Helper method to test if a move would result in check
  private wouldBeInCheck(from: Square, to: Square, isPushMove: boolean = false): boolean {
    // Store current board state
    const currentState = this.fen()
    const piece = this.get(from)
    if (!piece) return false

    let moveWasValid = false
    
    // Try the move
    if (isPushMove) {
      moveWasValid = this._pushMove(from, to)
    } else {
      try {
        this.move({ from, to })
        moveWasValid = true
      } catch {
        moveWasValid = false
      }
    }

    // If move was invalid, restore and return
    if (!moveWasValid) {
      this.load(currentState)
      return false
    }

    // Update check states
    this.updateCheckStates()

    // Check if OUR king is in check (not the opponent's)
    const ourColor = piece.color
    const ourKingInCheck = ourColor === 'w' ? this._whiteKingInCheck : this._blackKingInCheck

    // Restore original position
    this.load(currentState)

    return ourKingInCheck
  }

  // Override the moves method to filter out moves that would leave king in check
  moves(): string[]
  moves({ square }: { square: Square }): string[]
  moves({ piece }: { piece: PieceSymbol }): string[]
  moves({ square, piece }: { square: Square; piece: PieceSymbol }): string[]
  moves({ verbose }: { verbose: true }): Move[]
  moves({ verbose, square }: { verbose: true; square: Square }): Move[]
  moves({ verbose, piece }: { verbose: true; piece: PieceSymbol }): Move[]
  moves(options?: any): string[] | Move[] {
    // Get moves from parent without check filtering first
    const legalMoves = super.moves(options) as string[] | Move[]
    
    if (Array.isArray(legalMoves) && legalMoves.length > 0) {
      // If we're in check, we need to find moves that get us out of check
      const currentlyInCheck = this.inCheck()
      console.log('Filtering moves:', {
        currentlyInCheck,
        currentTurn: this.turn(),
        numMoves: legalMoves.length
      })

      if (options?.verbose) {
        // Handle Move[] return type
        const movesArray = legalMoves as Move[]
        return movesArray.filter(move => {
          // Store current state
          const currentState = this.fen()
          const piece = this.get(move.from)
          if (!piece) return false

          // Try the move
          try {
            this.move(move)
          } catch {
            this.load(currentState)
            return false
          }

          // If we were in check, verify the move gets us out of check
          this.updateCheckStates()
          const stillInCheck = piece.color === 'w' ? this._whiteKingInCheck : this._blackKingInCheck

          // Restore position
          this.load(currentState)

          // Move is valid if either:
          // 1. We weren't in check and this move doesn't put us in check
          // 2. We were in check and this move gets us out of check
          const isValid = currentlyInCheck ? !stillInCheck : !this.wouldBeInCheck(move.from, move.to)
          
          if (currentlyInCheck) {
            console.log('Regular move check escape test:', {
              from: move.from,
              to: move.to,
              isValid,
              stillInCheck
            })
          }

          return isValid
        })
      } else {
        // Handle string[] return type
        const movesArray = legalMoves as string[]
        return movesArray.filter(move => {
          const { from, to } = this.moveToSquares(move)
          const piece = this.get(from)
          if (!piece) return false

          // Store current state
          const currentState = this.fen()

          // Try the move
          try {
            this.move({ from, to })
          } catch {
            this.load(currentState)
            return false
          }

          // If we were in check, verify the move gets us out of check
          this.updateCheckStates()
          const stillInCheck = piece.color === 'w' ? this._whiteKingInCheck : this._blackKingInCheck

          // Restore position
          this.load(currentState)

          // Move is valid if either:
          // 1. We weren't in check and this move doesn't put us in check
          // 2. We were in check and this move gets us out of check
          const isValid = currentlyInCheck ? !stillInCheck : !this.wouldBeInCheck(from, to)

          if (currentlyInCheck) {
            console.log('Regular move check escape test:', {
              from,
              to,
              isValid,
              stillInCheck
            })
          }

          return isValid
        })
      }
    }
    return legalMoves
  }

  // Helper to convert move string to from/to squares
  private moveToSquares(move: string): { from: Square, to: Square } {
    // Handle castling moves
    if (move.startsWith('O-O')) {
      const rank = this.turn() === 'w' ? '1' : '8'
      return {
        from: `e${rank}` as Square,
        to: move === 'O-O' ? `g${rank}` as Square : `c${rank}` as Square
      }
    }

    // Regular moves
    const matches = move.match(/([a-h][1-8])([a-h][1-8])/)
    if (matches) {
      return {
        from: matches[1] as Square,
        to: matches[2] as Square
      }
    }

    // Pawn moves/captures
    const fromCol = move.length > 2 ? move[0] : undefined
    const toSquare = move.slice(-2)
    if (fromCol && toSquare) {
      const fromRank = this.turn() === 'w' ? '2' : '7'
      return {
        from: `${fromCol}${fromRank}` as Square,
        to: toSquare as Square
      }
    }

    // Default case
    return { from: 'a1' as Square, to: 'a1' as Square }
  }

  // Helper method to check if a piece can attack a square (without using moves())
  private canPieceAttack(from: Square, to: Square): boolean {
    const piece = this.get(from)
    if (!piece) return false

    const [fromRow, fromCol] = this.squareToCoords(from)
    const [toRow, toCol] = this.squareToCoords(to)
    
    // Get direction and distance
    const dRow = toRow - fromRow
    const dCol = toCol - fromCol
    const distance = Math.max(Math.abs(dRow), Math.abs(dCol))

    // Normalize direction
    const dirRow = dRow === 0 ? 0 : dRow / Math.abs(dRow)
    const dirCol = dCol === 0 ? 0 : dCol / Math.abs(dCol)

    switch (piece.type) {
      case 'p': {
        // Pawns attack diagonally
        const forward = piece.color === 'w' ? -1 : 1
        return Math.abs(dCol) === 1 && dRow === forward
      }
      case 'n':
        // Knights move in L-shape
        return (Math.abs(dRow) === 2 && Math.abs(dCol) === 1) ||
               (Math.abs(dRow) === 1 && Math.abs(dCol) === 2)
      case 'b':
        // Bishops move diagonally
        if (Math.abs(dRow) !== Math.abs(dCol)) return false
        break
      case 'r':
        // Rooks move horizontally or vertically
        if (dRow !== 0 && dCol !== 0) return false
        break
      case 'q':
        // Queens move like rooks or bishops
        if (Math.abs(dRow) !== Math.abs(dCol) && dRow !== 0 && dCol !== 0) return false
        break
      case 'k':
        // Kings move one square in any direction
        return Math.abs(dRow) <= 1 && Math.abs(dCol) <= 1
      default:
        return false
    }

    // Check if path is clear for sliding pieces (bishop, rook, queen)
    for (let i = 1; i < distance; i++) {
      const checkRow = fromRow + dirRow * i
      const checkCol = fromCol + dirCol * i
      if (!this.isValidSquare(checkRow, checkCol)) return false
      const checkSquare = this.coordsToSquare(checkRow, checkCol)
      if (this.get(checkSquare)) return false
    }

    return true
  }

  getLastCheckTime(): number | null {
    return (this._whiteKingInCheck || this._blackKingInCheck) ? this._lastCheckTime : null
  }

  // Add method to check if the game is in checkmate
  isCheckmate(): boolean {
    // First check if king is even on the board
    const board = this.board()
    const currentColor = this.turn()
    const hasKing = board.flat().some(p => p?.type === 'k' && p.color === currentColor)
    
    console.log('Checkmate detection:', {
      currentColor,
      hasKing,
      inCheck: this.inCheck(),
      board: this.board(),
      kings: {
        white: board.flat().find(p => p?.type === 'k' && p.color === 'w'),
        black: board.flat().find(p => p?.type === 'k' && p.color === 'b')
      }
    })

    // If king is missing, that's an immediate checkmate
    if (!hasKing) {
      console.log('Checkmate - king is missing!')
      return true
    }

    // If not in check, can't be checkmate
    if (!this.inCheck()) {
      console.log('Not checkmate - not in check')
      return false
    }

    // Get all pieces of the current player
    const pieces: Square[] = []
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = this.coordsToSquare(row, col)
        const piece = this.get(square)
        if (piece && piece.color === this.turn()) {
          pieces.push(square)
        }
      }
    }

    // Check if any piece has a valid move (including push moves)
    for (const from of pieces) {
      // Check regular moves
      const regularMoves = this.moves({ square: from })
      if (regularMoves.length > 0) {
        console.log('Not checkmate - regular moves available:', { from, moves: regularMoves })
        return false
      }

      // Check push moves
      const pushMoves = this.getValidPushDestinations(from)
      if (pushMoves.length > 0) {
        console.log('Not checkmate - push moves available:', { from, moves: pushMoves })
        return false
      }
    }

    console.log('Checkmate confirmed - no legal moves available')
    return true
  }

  // Add method to check if the game is over
  isGameOver(): boolean {
    const isOver = this.isCheckmate()
    console.log('Game over check:', {
      isOver,
      turn: this.turn(),
      kings: {
        white: this.board().flat().find(p => p?.type === 'k' && p.color === 'w'),
        black: this.board().flat().find(p => p?.type === 'k' && p.color === 'b')
      }
    })
    return isOver
  }

  // Add method to get current check state
  isInCheck(): boolean {
    // Update check states
    this.updateCheckStates()
    // Return check state for current player
    const currentTurn = this.turn()
    return currentTurn === 'w' ? this._whiteKingInCheck : this._blackKingInCheck
  }

  // Add method to get opponent's check state
  isOpponentInCheck(): boolean {
    // Update check states
    this.updateCheckStates()
    // Return check state for opponent
    const currentTurn = this.turn()
    return currentTurn === 'w' ? this._blackKingInCheck : this._whiteKingInCheck
  }

  // Override move method to handle check state
  move(move: { from: Square; to: Square; promotion?: string }): Move {
    // Store current state in case we need to undo
    const currentState = this.fen()

    // Try to make the move
    let result: Move
    try {
      result = super.move(move)
    } catch (e) {
      throw e
    }

    // Update check states
    this.updateCheckStates()

    // If move puts own king in check, undo it
    const currentTurn = this.turn() === 'w' ? 'b' : 'w' // Move has already switched turns
    const isInCheck = currentTurn === 'w' ? this._whiteKingInCheck : this._blackKingInCheck
    
    if (isInCheck) {
      console.log('Move cancelled - would put own king in check')
      this.load(currentState)
      throw new Error('Invalid move: would put own king in check')
    }

    // Check if opponent is in check
    const opponentInCheck = currentTurn === 'w' ? this._blackKingInCheck : this._whiteKingInCheck
    
    // Set check state
    this._isCheck = opponentInCheck
    if (opponentInCheck) {
      this._lastCheckTime = Date.now()
    }

    return result
  }
} 
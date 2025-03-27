# Push Chess

A modern web implementation of Push Chess, a fascinating chess variant where pieces can push their friendly pieces along their path of movement. Built with React, TypeScript, and Tailwind CSS.

## What is Push Chess?

Push Chess follows all standard chess rules with one major addition: pieces can push their friendly pieces along their path of movement. This creates entirely new tactical possibilities and strategies not seen in regular chess.

### Key Features:
- All standard chess rules apply (piece movements, captures, check, checkmate)
- Any piece can push any number of friendly pieces along its path of movement
- Pushed pieces move as a "train" and must remain contiguous
- Pieces can be pushed to squares they normally couldn't move to themselves
- Pawns promote when reaching the opposite rank (through regular moves, captures, or being pushed)

For detailed rules, see [RULES.md](RULES.md).

## Features

- 🎮 Play against AI or another human player
- 🎯 Visual indicators for valid moves and pushes
- ⚡ Real-time move validation
- 🔄 Move history tracking
- 👑 Pawn promotion with piece selection
- ⚔️ Check and checkmate detection
- 🎨 Beautiful, responsive UI with smooth animations
- 🎵 Visual and interactive feedback for moves

## Tech Stack

- **Frontend Framework**: React with Next.js
- **Language**: TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Chess Logic**: Modified chess.js library

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/MichaelMallory/push-chess.git
cd push-chess
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Game Controls

- Click a piece to select it
- Click a valid destination square to move the piece
- For push moves:
  1. Select the pushing piece
  2. Click through the squares along the push path
  3. Click the final destination
- When a pawn reaches the opposite rank, select a piece to promote to

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Chess.js library for the base chess logic
- React and Next.js teams for the excellent frameworks
- The chess community for inspiration and feedback

## Future Plans

- [ ] Online multiplayer support
- [ ] More sophisticated AI opponent
- [ ] Save/load game functionality
- [ ] Opening book for AI
- [ ] Game analysis tools
- [ ] Mobile-responsive design improvements
- [ ] Customizable themes
- [ ] Tournament support

/******************************/
/*      ChessConstants.js     */
/******************************/
// JavaScript Enums @ https://masteringjs.io/tutorials/fundamentals/enum
function createEnum(values) {
  const enumObject = {};
  for (const val of values) {
    enumObject[val] = val;
  }
  return Object.freeze(enumObject);
}

const playerControl = createEnum(['Human', 'Ai']);

// Implementing an Enum in JavaScript @ https://www.codecademy.com/resources/docs/javascript/enums
// TODO: which to use `createEnum` or this one?
const moveType = Object.freeze({ 
  SelectAPiece: 0,
  SelectAPosition: 1,
  PawnPromotion: 'PawnPromotion' // NOTEB: no number associated
});

const pieceType = createEnum(['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King', 'None']);
const pieceColor = createEnum(['White', 'Black', 'None']);

const gameState = Object.freeze({ 
  Normal: 0,
  Check: 2, // NOTEB: no number 1 used
  Checkmate: 3,
  Stalemate: 4
});

const turnState = createEnum(['Pre', 'Play', 'Post']);

class PieceDetails {
  
  constructor(pt=pieceType.None, pc=pieceColor.None, bCanEnPassant=false, bHasMoved=false) {
    this.pieceType = pt;
		this.pieceColor = pc;
		this.bCanEnPassant = bCanEnPassant;
		this.bHasMoved = bHasMoved;
  }
  
  clear() {
    this.pieceType = pieceType.None;
		this.pieceColor = pieceColor.None;
		this.bCanEnPassant = false;
		this.bHasMoved = false;
  }
}

class GridPosition {
  
  constructor(r=null, c=null) {
    this.row = r;
		this.column = c;
  }
}

class Move {
  
  constructor(fromRow, fromCol, toRow, toCol, specialMove=null) {
    this.fromRow = fromRow;
		this.fromCol = fromCol;
		this.toRow = toRow;
		this.toCol = toCol;
    this.specialMove = specialMove;
		this.score = 0; // Required only for ordering moves.
  }
}

const chessMove = Object.freeze({ 
  theMove: null,
  startPosition: null,
  endPosition: null
});

const openings = createEnum(['RuyLopez', 'SicilianDefence', 'QueensGambit', 
                            'AlekhineDefence', 'ModernDefence', 'KingsIndian',
                            'EnglishOpening', 'DutchDefence', 'StonewallAttack']);

/*********************/
/*      Game.js      */
/*********************/
const Game = {
  windowWidth: 400,
	windowExtraY: 40,
  boardDimensions: 8,
  
  assetsAtlas: {
		WhiteKing: 0,
		WhiteQueen: 1,
		WhiteRook: 2,
		WhiteBishop: 3,
		WhiteKnight: 4,
		WhitePawn: 5,
		BlackSquare: 6,
		BlackKing: 7,
		BlackQueen: 8,
		BlackRook: 9,
		BlackBishop: 10,
		BlackKnight: 11,
		BlackPawn: 12,
		PossibleSquare: 13
	},
  assetsKey: 'assets',
	assetsFilePath : 'https://raw.githubusercontent.com/Jexan/ChessJs/master/imgs/assets.png',
  
  turn: pieceColor.White, // White starts first
  turnTextStyle: {
		font: '18pt Segoe UI',
		fill: 'black'
	},
	turnTextColorStyle: {
		font: '18pt Segoe UI',
		fill: '#333'
	}
}

Game.gameState = gameState;
Game.openings = openings;
Game.pieceColor = pieceColor;
Game.pieceType = pieceType;
Game.moveType = moveType;

Game.windowHeigth = Game.windowWidth + Game.windowExtraY;
Game.squareLength = Game.windowWidth/8;

Game.turnTextX = Game.squareLength * 2.5;
Game.turnTextY = Game.windowWidth + 5;

Game.turnColorTextY = Game.turnTextY + Game.squareLength * 0.01;
Game.turnColorTextX = Game.turnTextX + Game.squareLength * 1.5;

var preload = function(){
  Game.scene = this;
  this.backgroundColor= "#eeeeee";
  this.load.spritesheet(Game.assetsKey, Game.assetsFilePath, { frameWidth: 64, frameHeight: 64, endFrame: 14 });
};

var create = function(){
  Game.chessBoard = new ChessBoard();
  Game.chessBoard.start();
  
  Game.chessPlayer = new ChessPlayer(Game.pieceColor.White, Game.chessBoard);
  
  Game.chessPlayerAI = new ChessPlayerAI(Game.pieceColor.Black, Game.chessBoard, false);
  Game.chessPlayerAI.opponentPlayer = Game.chessPlayer;
  Game.chessPlayer.opponentPlayer = Game.chessPlayerAI;
  Game.chessPlayerAI.start();
  
  this.possibleSquares = this.add.group();
  
  this.turnText = this.add.text(
    Game.turnTextX, 
    Game.turnTextY, 
    'TURN:', 
    Game.turnTextStyle
  );

  this.turnColorText = this.add.text(
    Game.turnColorTextX,
    Game.turnColorTextY,
    Game.pieceColor.White,
    Game.turnTextColorStyle
  );
};

var update = function() {
  Game.chessPlayerAI.update();
  Game.chessPlayer.finishTurn();
}

const config = {
	type: Phaser.AUTO,
	width: Game.windowWidth,
	height: Game.windowHeigth,
  backgroundColor: "#eeeeee",
  parent: 'gameDiv',
  scene: {
    preload,
    create,
    update
	}
};

Game.chess = new Phaser.Game(config);

/**************************/
/*      ChessBoard.js     */
/**************************/
class ChessBoard {
  
  // Chess board is always 8x8
  boardDimensions = Game.boardDimensions; // static
  squareLength = Game.squareLength;
  halfSquareLength = Game.squareLength/2;
  
  // This is the actual data - internal for our use.
  boardLayout; // PieceDetails
  
  // This is an array of references to the pieces so we can visually move them when required.
  boardVisuals; // ChessPiece
  
  // NOTEB: in our case, no move highlights. We handle them differently.
  
  start() {
    this.createBoard();
  }
  
  createBoard() {
    // Chess board is always 8x8
    // NOTE: How to create an empty two dimensional array (one-line) @ https://stackoverflow.com/a/49201210
    this.boardLayout = Array.from(Array(this.boardDimensions), () => new Array(this.boardDimensions)); // PieceDetails
    this.boardVisuals = Array.from(Array(this.boardDimensions), () => new Array(this.boardDimensions)); // ChessPiece
    
    // Set all cells to be null.
    for (let iRow = 0; iRow < this.boardDimensions; iRow++) {
      for (let iCol = 0; iCol < this.boardDimensions; iCol++) {
        let startPositionX = (iCol * this.squareLength) + this.halfSquareLength;
        let startPositionY = (iRow * this.squareLength) + this.halfSquareLength;
        
        if (iRow % 2 == 0 && iCol % 2 > 0 || iRow % 2 > 0 && iCol % 2 == 0) {
          let imageSquare = Game.scene.add.sprite(startPositionX, startPositionY, Game.assetsKey, Game.assetsAtlas.BlackSquare);
          imageSquare.scaleX = this.squareLength / imageSquare.width;
          imageSquare.scaleY = this.squareLength / imageSquare.height;
        }
        
        let pieceDetails = this.getStartingPieceAt(iRow, iCol);
        
        // If there is a piece here, let's spawn that piece and position appropriately.
        if (pieceDetails.pieceType != Game.pieceType.None) {
          let chessPiece = new ChessPiece();
          chessPiece.setDetails(pieceDetails, startPositionX, startPositionY);
          this.boardVisuals[iRow][iCol] = chessPiece;
        } else {
          this.boardVisuals[iRow][iCol] = null;
        }
        
        // Internal board data.
        this.boardLayout[iRow][iCol] = pieceDetails;
      }
    }
  }
  
  copyInternalBoard(boardToCopy) {
    // Chess board is always 8x8
    this.boardLayout = [];
    
    // Set all cells to be null.
    boardToCopy.boardLayout.forEach((row, y) => {
      this.boardLayout.push([]);
      row.forEach((pieceDetails, x) => {
        this.boardLayout[y].push(copyPieceDetails(pieceDetails)); 
      });
    });
  }
  
  swapPieceType(iRow, iCol, toType) {
    if (iRow >= 0 && iRow < this.boardDimensions && iCol >= 0 && iCol < this.boardDimensions) {
      this.boardLayout[iRow][iCol].pieceType = toType;
      
      if (this.boardVisuals) {
        // TODO: do the positions calculations right in `setPieceImage()`
        let imagePositionX = (iCol * this.squareLength) + this.halfSquareLength;
        let imagePositionY = (iRow * this.squareLength) + this.halfSquareLength;
        this.boardVisuals[iRow][iCol].destroyPieceImage();
        this.boardVisuals[iRow][iCol].setDetails(copyPieceDetails(this.boardLayout[iRow][iCol]), 
                                                 imagePositionX, imagePositionY);
      }
    }
  }
  
  killPiece(iRow, iCol) {
    if (iRow >= 0 && iRow < this.boardDimensions && iCol >= 0 && iCol < this.boardDimensions) {
      this.boardLayout[iRow][iCol].clear();
      
      if (this.boardVisuals) {
        if (this.boardVisuals[iRow][iCol] !== null) {
          // TODO: delete `ChessPiece`? or just set it to `null`?
          this.boardVisuals[iRow][iCol].destroyPieceImage();
          this.boardVisuals[iRow][iCol] = null;
        }
      }
    }
  }
  
  movePiece(fromRow, fromCol, toRow, toCol) {
    if (fromRow >= 0 && fromRow < this.boardDimensions && fromCol >= 0 && fromCol < this.boardDimensions &&
            toRow >= 0 && toRow < this.boardDimensions && toCol >= 0 && toCol < this.boardDimensions) {
      if (this.boardVisuals) {
        // TODO: do the positions calculations right in `setPieceImage()`
        let imagePositionX = (toCol * this.squareLength) + this.halfSquareLength;
        let imagePositionY = (toRow * this.squareLength) + this.halfSquareLength;

        this.boardVisuals[toRow][toCol] = copyChessPiece(this.boardVisuals[fromRow][fromCol]);
        this.boardVisuals[toRow][toCol].destroyPieceImage();
        this.boardVisuals[toRow][toCol].setPieceImage(imagePositionX, imagePositionY);
        this.boardVisuals[fromRow][fromCol] = null;
      }
      
      // IMPORTANT: work first with `boardVisuals` because of the reference issue in javascript
      this.boardLayout[fromRow][fromCol].bHasMoved = true;
      this.boardLayout[toRow][toCol] = copyPieceDetails(this.boardLayout[fromRow][fromCol]);
      this.boardLayout[fromRow][fromCol].clear();
    }
  }
  
  getStartingPieceAt(row, column) {
    // Default settings
    let piece = new PieceDetails();
    piece.pieceType = Game.pieceType.None;
    piece.pieceColor = Game.pieceColor.None;
    piece.bCanEnPassant = false;
    piece.bHasMoved = false;
    
    // Set type and color:
    if (row == 0) {
      piece.pieceColor = Game.pieceColor.White;
      switch(column){
        case 0:
          piece.pieceType = Game.pieceType.Rook;
          break;
        case 1:
          piece.pieceType = Game.pieceType.Knight;
          break;
        case 2:
          piece.pieceType = Game.pieceType.Bishop;
          break;
        case 3:
          piece.pieceType = Game.pieceType.King;
          break;
        case 4:
          piece.pieceType = Game.pieceType.Queen;
          break;
        case 5:
          piece.pieceType = Game.pieceType.Bishop;
          break;
        case 6:
          piece.pieceType = Game.pieceType.Knight;
          break;
        case 7:
          piece.pieceType = Game.pieceType.Rook;
          break;
      }
    } else if (row == 1) {
      piece.pieceColor = Game.pieceColor.White;
      piece.pieceType = Game.pieceType.Pawn;
    } else if (row == 6) {
      piece.pieceColor = Game.pieceColor.Black;
      //piece.pieceColor = Game.pieceColor.White;
      piece.pieceType = Game.pieceType.Pawn;
    } else if (row == 7) {
      piece.pieceColor = Game.pieceColor.Black;
      switch(column){
        case 0:
          piece.pieceType = Game.pieceType.Rook;
          break;
        case 1:
          piece.pieceType = Game.pieceType.Knight;
          break;
        case 2:
          piece.pieceType = Game.pieceType.Bishop;
          break;
        case 3:
          piece.pieceType = Game.pieceType.King;
          break;
        case 4:
          piece.pieceType = Game.pieceType.Queen;
          break;
        case 5:
          piece.pieceType = Game.pieceType.Bishop;
          break;
        case 6:
          piece.pieceType = Game.pieceType.Knight;
          break;
        case 7:
          piece.pieceType = Game.pieceType.Rook;
          break;
      }
    }
    
    return piece;
  }
  
  selectCell(pointer) {
    let selectedGridPosition = new GridPosition();
    selectedGridPosition.row = Math.floor(pointer.y/this.squareLength);
    selectedGridPosition.column = Math.floor(pointer.x/this.squareLength);
    // Ensure the pointer is on the board.
    if (selectedGridPosition.row < this.boardDimensions && selectedGridPosition.column < this.boardDimensions) {
      return selectedGridPosition;
    }
    return new GridPosition();;
  }
  
  hideHighlight() {
    // Erases highlighted squares
    Game.scene.possibleSquares.clear(true); 
  }
  
  // TODO: doesn't do anything!
  clearMoveOptions() {
    
  }
  
  highlightMoveOptions(moveOptions) {
    _.each(moveOptions, (move) => {
      let image =  Game.scene.add.sprite(
        move.column * this.squareLength + this.halfSquareLength, 
        move.row * this.squareLength + this.halfSquareLength, 
        Game.assetsKey,
        Game.assetsAtlas.PossibleSquare
      );

      // Fires up the move routine when clicked
      image.setInteractive();
      image.on('pointerdown', handleSelectedSquare, this);

      image.scaleX = this.squareLength / image.width;
      image.scaleY = this.squareLength / image.height;

      Game.scene.possibleSquares.add(image);
    });
  }
}

// TODO: use `update()` instead
function handleSelectedSquare(pointer) {
  //console.log('Image clicked! ' + pointer.x + ' ' + pointer.y);
  // `this` is a `ChessPiece`
  if (Game.chessPlayer) {
    Game.chessPlayer.update(pointer); 
  }
}

function copyChessPiece(chessPieceToCopy) {
  let newChessPieceToCopy = new ChessPiece(chessPieceToCopy.pieceImage, copyPieceDetails(chessPieceToCopy.pieceDetails));
  return newChessPieceToCopy;
}

function copyPieceDetails(pieceDetailsToCopy) {
  let newPieceDetails = new PieceDetails(pieceDetailsToCopy.pieceType, pieceDetailsToCopy.pieceColor, 
                                         pieceDetailsToCopy.bCanEnPassant, pieceDetailsToCopy.bHasMoved)
  return newPieceDetails;
}

/**************************/
/*      ChessPiece.js     */
/**************************/
class ChessPiece {
  // NOTEB: private
  pieceImage = null;
  
  pieceDetails;
  
  constructor(pieceImage, pieceDetails) {
    this.pieceImage = pieceImage;
    this.pieceDetails = pieceDetails;
  }
  
  setDetails(details, imagePositionX, imagePositionY) {
    this.pieceDetails = details;
    this.setPieceImage(imagePositionX, imagePositionY);
  }
  
  destroyPieceImage() {
    this.pieceImage.destroy();
  }
  
  setPieceImage(imagePositionX, imagePositionY) {
    let pieceName = this.pieceDetails.pieceColor + this.pieceDetails.pieceType;

    this.pieceImage = Game.scene.add.sprite(imagePositionX, imagePositionY, Game.assetsKey, Game.assetsAtlas[pieceName]);
    // Scales the piece proportional to the squareLength
    this.pieceImage.scaleX = Game.squareLength / this.pieceImage.width;
    this.pieceImage.scaleY = Game.squareLength / this.pieceImage.height;

    this.pieceImage.setInteractive();
    if (this.pieceDetails.pieceColor == Game.pieceColor.White) {
      this.pieceImage.on('pointerdown', handlePossibleMoves, this); 
    }
  }
}

// TODO: use `update()` instead
function handlePossibleMoves (pointer) {
  // `this` is a `ChessPiece`
  if (Game.chessPlayer) {
    console.log(this.pieceDetails.pieceType);
    Game.chessPlayer.update(pointer); 
  }
}

/******************************/
/*      ChessOpenings.js      */
/******************************/
class ChessOpenings {
  color = Game.pieceColor.White;
  selectedOpening = null;
  // Counter to know how many moves have been played so far for the selected chess opening
  currentMove = 0;
  
  moves_RuyLopez = [];
  moves_SicilianDefence = [];
	moves_QueensGambit = [];
	moves_AlekhineDefence = [];
	moves_ModernDefence = [];
	moves_KingsIndian = [];
	moves_EnglishOpening = [];
	moves_DutchDefence = [];
	moves_StonewallAttack = [];
  
  constructor(color) {
    this.color = color
    this.start();
  }
  
  start() {
    this.setUpOpenings();
    this.restartGame();
  }
  
  // TODOB: moves should be a struct
  setUpOpenings() {
    // Classic Openings - Or variations of:
    if (this.color == Game.pieceColor.White) {
      // NOTE: the openings in this `if` are for those pieces that start at the top of the chessboard
      // RuyLopez Opening
      // NOTE: `y` is the row number and `x` is the column
      this.moves_RuyLopez.push(new Move(1, 4, 3, 4));
      this.moves_RuyLopez.push(new Move(0, 6, 2, 5));

			// SicilianDefence
			this.moves_SicilianDefence.push(new Move(1, 4, 3, 4));

			// QueensGambit
			this.moves_QueensGambit.push(new Move(1, 3, 3, 3));
			this.moves_QueensGambit.push(new Move(1, 2, 3, 2));

			// AlekhineDefence
			this.moves_AlekhineDefence.push(new Move(1, 4, 3, 4));
			this.moves_AlekhineDefence.push(new Move(0, 1, 2, 2));

			// ModernDefence
			this.moves_ModernDefence.push(new Move(1, 4, 3, 4));
			this.moves_ModernDefence.push(new Move(1, 3, 3, 3));

			// KingsIndian
			this.moves_KingsIndian.push(new Move(0, 6, 2, 5));
			this.moves_KingsIndian.push(new Move(1, 6, 2, 6));
			this.moves_KingsIndian.push(new Move(0, 5, 1, 6));

			// EnglishOpening
			this.moves_EnglishOpening.push(new Move(1, 2, 3, 2));

			// DutchDefence
			this.moves_DutchDefence.push(new Move(1, 3, 3, 3));

			// StonewallAttack
			this.moves_StonewallAttack.push(new Move(1, 3, 3, 3));
			this.moves_StonewallAttack.push(new Move(1, 4, 2, 4));
			this.moves_StonewallAttack.push(new Move(2, 5, 2, 3));
    } else {
      // TODO: black pieces always play at the bottom of the chessboard, make it so that we can choose the place
      // NOTE: the openings in this `if` are for those pieces that start at the bottom of the chessboard
      // RuyLopez Opening
			this.moves_RuyLopez.push(new Move(6, 4, 4, 4));
			this.moves_RuyLopez.push(new Move(7, 1, 5, 2));

			// SicilianDefence
			this.moves_SicilianDefence.push(new Move(6, 2, 4, 2));

			// QueensGambit
      // TODO: is it missing another move (in the `if`, there are two moves for QueensGambit)?
			this.moves_QueensGambit.push(new Move(6, 3, 4, 3));

			// AlekhineDefence
			this.moves_AlekhineDefence.push(new Move(7, 6, 5, 5));
			this.moves_AlekhineDefence.push(new Move(6, 3, 4, 3));

			// ModernDefence
			this.moves_ModernDefence.push(new Move(6, 3, 5, 3));
			this.moves_ModernDefence.push(new Move(6, 6, 5, 6));

			// KingsIndian
			this.moves_KingsIndian.push(new Move(7, 6, 5, 5));
			this.moves_KingsIndian.push(new Move(6, 6, 5, 6));
			this.moves_KingsIndian.push(new Move(7, 5, 6, 6));

			// EnglishOpening
			this.moves_EnglishOpening.push(new Move(6, 4, 4, 4));

			// DutchDefence
			this.moves_DutchDefence.push(new Move(6, 5, 4, 5));

			// StonewallAttack
			this.moves_StonewallAttack.push(new Move(6, 3, 4, 3));
			this.moves_StonewallAttack.push(new Move(6, 4, 5, 4));
			this.moves_StonewallAttack.push(new Move(7, 6, 5, 5));
    }
  }
  
  restartGame() {
    this.currentMove = 0;
    this.setARandomOpening();
  }
  
  setARandomOpening() {
    this.selectedOpening = randomPropertyValue(Game.openings);
    //this.selectedOpening = Game.openings.ModernDefence;
    this.debugOutput();
  }
  
  // Retuns true if there are still moves to be played for the selected chess opening
  // Returns false otherwise or the selected opening is not supported (which should not normally happen)
  isAnotherMoveAvailable() {
    switch (this.selectedOpening) {
      case Game.openings.RuyLopez:
        return (this.currentMove < this.moves_RuyLopez.length);
        break;
      case Game.openings.SicilianDefence:
        return (this.currentMove < this.moves_SicilianDefence.length);
        break;
      case Game.openings.QueensGambit:
        return (this.currentMove < this.moves_QueensGambit.length);
        break;
      case Game.openings.AlekhineDefence:
        return (this.currentMove < this.moves_AlekhineDefence.length);
        break;
      case Game.openings.ModernDefence:
        return (this.currentMove < this.moves_ModernDefence.length);
        break;
      case Game.openings.KingsIndian:
        return (this.currentMove < this.moves_KingsIndian.length);
        break;
      case Game.openings.EnglishOpening:
        return (this.currentMove < this.moves_EnglishOpening.length);
        break;
      case Game.openings.DutchDefence:
        return (this.currentMove < this.moves_DutchDefence.length);
        break;
      case Game.openings.StonewallAttack:
        return (this.currentMove < this.moves_StonewallAttack.length);
        break;
      default:
        return false;
    }
    
    //Out of moves.
		return false;
  }
  
  // Can return `null` if no more moves available
  getNextMove() {
    // TODO: should be a kind of struct
    let nextMove = null;
    
    switch (this.selectedOpening) {
      case Game.openings.RuyLopez:
        if (this.currentMove < this.moves_RuyLopez.length) {
					nextMove = this.moves_RuyLopez[this.currentMove];
				}
        break;
      case Game.openings.SicilianDefence:
        if (this.currentMove < this.moves_SicilianDefence.length) {
          nextMove = this.moves_SicilianDefence[this.currentMove];
        }
        break;
      case Game.openings.QueensGambit:
        if (this.currentMove < this.moves_QueensGambit.length) {
          nextMove = this.moves_QueensGambit[this.currentMove];
        }
        break;
      case Game.openings.AlekhineDefence:
        if (this.currentMove < this.moves_AlekhineDefence.length) {
          nextMove = this.moves_AlekhineDefence[this.currentMove];
        }
        break;
      case Game.openings.ModernDefence:
        if (this.currentMove < this.moves_ModernDefence.length) {
          nextMove = this.moves_ModernDefence[this.currentMove];
        }
        break;
      case Game.openings.KingsIndian:
        if (this.currentMove < this.moves_KingsIndian.length) {
          nextMove = this.moves_KingsIndian[this.currentMove];
        }
        break;
      case Game.openings.EnglishOpening:
        if (this.currentMove < this.moves_EnglishOpening.length) {
          nextMove = this.moves_EnglishOpening[this.currentMove];
        }
        break;
      case Game.openings.DutchDefence:
        if (this.currentMove < this.moves_DutchDefence.length) {
          nextMove = this.moves_DutchDefence[this.currentMove];
        }
        break;
      case Game.openings.StonewallAttack:
        if (this.currentMove < this.moves_StonewallAttack.length) {
          nextMove = this.moves_StonewallAttack[this.currentMove];
        }
        break;
      default:
        break;
    }
    
    // Increment to next move.
		this.currentMove++;
    
    // Out of moves if `nextMove` is `null`.
		return nextMove; 
  }
  
  debugOutput() {
    let col = 'White';
    if (this.color == 'Black') {
      col = 'Black';
    }
    
    switch (this.selectedOpening) {
      case Game.openings.RuyLopez:
        console.log('Color: ' + col + ', Opening: RuyLopez');
        break;
      case Game.openings.SicilianDefence:
        console.log('Color: ' + col + ', Opening: SicilianDefence');
        break;
      case Game.openings.QueensGambit:
        console.log('Color: ' + col + ', Opening: QueensGambit');
        break;
      case Game.openings.AlekhineDefence:
        console.log('Color: ' + col + ', Opening: AlekhineDefence');
        break;
      case Game.openings.ModernDefence:
        console.log('Color: ' + col + ', Opening: ModernDefence');
        break;
      case Game.openings.KingsIndian:
        console.log('Color: ' + col + ', Opening: KingsIndian');
        break;
      case Game.openings.EnglishOpening:
        console.log('Color: ' + col + ', Opening: EnglishOpening');
        break;
      case Game.openings.DutchDefence:
        console.log('Color: ' + col + ', Opening: DutchDefence');
        break;
      case Game.openings.StonewallAttack:
        console.log('Color: ' + col + ', Opening: StonewallAttack');
        break;
      default:
        console.log('Invalid opening.');
    }
  }
}

// Returns random property value of a given object
// https://stackoverflow.com/a/15106541
var randomPropertyValue = function (obj) {
    var keys = Object.keys(obj);
    return obj[keys[ keys.length * Math.random() << 0]];
};

/******************************/
/*      ChessPlayer.js        */
/******************************/
class ChessPlayer {
  kTotalNumberOfStartingPieces = 16;
  gameOverOptions = null;

  // TODO: set following as private
  chessBoard = null;
  // TODO: set 
  opponentPlayer = null;
  
  bMyTurn = true;
  color = Game.pieceColor.White;
  
  // TODO: protected with #?
  #iNumberOfLivingPieces = this.kTotalNumberOfStartingPieces;
  #bInCheck = false;
  
  // TODO: protected with #? 
  eCurrentMoveType = Game.moveType.SelectAPiece;
  moveOptions = []; // GridPosition
  
  selectedPiecePosition = new GridPosition();	// `GridPosition`; Position to move piece to.
  
  moves = [];
  minimaxMoves = [];
  
  constructor(color, chessBoard, bMyTurn=true) {
    this.color = color;
    this.chessBoard = chessBoard;
    this.bMyTurn = bMyTurn;
  }
  
  setTurn(bturn) { 
    this.bMyTurn = bturn; 
  }
  
  update(pointer) {
    // NOTEB: they check `chessBoard != null && chessBoard.boardLayout != null`
    if (this.bMyTurn) {
      let gameState = this.preTurn();
      if (gameState == Game.gameState.Normal || gameState == Game.gameState.Check) {
        let selectedGridPosition = this.chessBoard.selectCell(pointer);
        this.getNumberOfLivingPieces();
        if (this.makeAMove(selectedGridPosition)) {
          this.postMove();
        }
      } else if (gameState == Game.gameState.Checkmate || gameState == Game.gameState.Stalemate) {
        // We have an end to the game, so let the game over canvas show the player.
        console.log('GAME OVER');
      }
    } 
  }
  
  finishTurn() {
    if (this.eCurrentMoveType == Game.moveType.PawnPromotion && this.bMyTurn) {
      if (this.makeAMove(this.selectedPiecePosition)) {
        this.postMove();
      }
    }
  }
  
  postMove() {
    this.bMyTurn = false;
    this.opponentPlayer.setTurn(true);
    // Indicators to help the human player.
    // TODO
    //this.showCheckWarning();
    this.setTurnIndicator();
  }
  
  showCheckWarning() {
    
  }
  
  setTurnIndicator() {
    if(this.bMyTurn) {
      Game.turn = this.color;
    }
    else {
      Game.turn = this.opponentPlayer.color;	
    }

    Game.scene.turnColorText.text = Game.turn;
  }
  
  // Returns gameState = Checkmate|Check|Normal|
  preTurn() {
    // Check whether this player is in CHECK, CHECKMATE or STALEMATE.
    this.#bInCheck = this.checkForCheck(this.chessBoard, this.color);
   
    // Remove any highlight position as we have yet to select a piece.
		this.chessBoard.hideHighlight();
    
    // If we are in CHECK, can we actually make a move to get us out of it?
    if (this.#bInCheck) {
      if (this.checkForCheckmate(this.chessBoard, this.color)){
				return Game.gameState.Checkmate;
      } else {
				return Game.gameState.Check;
      }
    } else {
      if (this.checkForStalemate(this.chessBoard, this.color)) {
				return Game.gameState.Stalemate;
      } else {
				return Game.gameState.Normal;
      }
    }
    
    // Return normal if none of the above conditions have been met.
		return Game.gameState.Normal;
  }
  
  makeAMove(gridPosition) {
    // Ensure the position passed in is within the board dimensions.
    if (gridPosition.row <= this.chessBoard.boardDimensions && gridPosition.column <= this.chessBoard.boardDimensions){
      if (this.eCurrentMoveType == Game.moveType.SelectAPiece) {
        // If the piece selected is of the same color as the current player - Deal with it.
        if (this.chessBoard.boardLayout[gridPosition.row][gridPosition.column].pieceColor == this.color) {
          // Valid position so store it and get possible moves.
          this.selectedPiecePosition.row = gridPosition.row;
          this.selectedPiecePosition.column = gridPosition.column;
          let boardPiece = this.chessBoard.boardLayout[gridPosition.row][gridPosition.column];
          
          // Clear all highlighted move options before repopulating in `getMoveOptions()` function.
					this.moveOptions = [];
          
          let moves = [];
          moves = this.getMoveOptions(this.selectedPiecePosition, boardPiece, this.chessBoard); 
          
          // Is this a valid move?
          for (let currentMove = 0; currentMove < moves.length; currentMove++) {
            let boardToTest = new ChessBoard();
            boardToTest.copyInternalBoard(this.chessBoard);
            boardToTest.movePiece(moves[currentMove].fromRow, moves[currentMove].fromCol,
                                  moves[currentMove].toRow, moves[currentMove].toCol);
            
            if (!this.checkForCheck(boardToTest, this.color)) {
							this.moveOptions.push(new GridPosition(moves[currentMove].toRow, moves[currentMove].toCol));
						}
          }
          
          this.chessBoard.highlightMoveOptions(this.moveOptions);
          
          // Change move type.
					this.eCurrentMoveType = Game.moveType.SelectAPosition;
        } else {
          // Clear highlights.
					this.chessBoard.clearMoveOptions();

					// Clear move options.
					this.moveOptions = [];
        }
      } else if (this.eCurrentMoveType == Game.moveType.SelectAPosition) {
        // Check if this position is actually another piece of the current players color.
				// If so, switch the turn type and recall this function.
        if (this.chessBoard.boardLayout[gridPosition.row][gridPosition.column].pieceColor == this.color) {
          this.eCurrentMoveType = Game.moveType.SelectAPiece;
					this.makeAMove(gridPosition);
        } else {
          let validPosition = false;
          
          // Check if this is a position within the highlighted options.
					for (let i = 0; i < this.moveOptions.length; i++) {
            let highlightPos = this.moveOptions[i];
            if (gridPosition.row == highlightPos.row && gridPosition.column == highlightPos.column) {
							validPosition = true;
							break;
						}
          }
          
          // If we selected a valid position from the highlighted options, then move the piece.
					if (validPosition == true) {
            // If this was an en'passant move the taken piece will not be in the square we moved to.
						if (this.chessBoard.boardLayout[this.selectedPiecePosition.row][ this.selectedPiecePosition.column].pieceType == Game.pieceType.Pawn){
              // If the pawn is on its start position and it double jumps, then en'passant may be available for opponent.
							if ((this.selectedPiecePosition.row == 1 && gridPosition.row == 3) ||
								(this.selectedPiecePosition.row == 6 && gridPosition.row == 4)) {
                this.chessBoard.boardLayout[this.selectedPiecePosition.row][this.selectedPiecePosition.column].bCanEnPassant = true;
              }
            }
            
            // En'Passant removal of enemy pawn.
						// If our pawn moved into an empty position to the left or right, then must be En'Passant.
						if (this.chessBoard.boardLayout[this.selectedPiecePosition.row][this.selectedPiecePosition.column].pieceType == Game.pieceType.Pawn &&
                this.chessBoard.boardLayout[gridPosition.row][gridPosition.column].pieceType == Game.pieceType.None) {
              let pawnDirectionOpposite = this.color == Game.pieceColor.White ? -1 : 1;
              
              // If we end up on a different column, but there was no piece in the target cell - Must be En'Passant.
							if (gridPosition.column != this.selectedPiecePosition.column) {
								this.chessBoard.killPiece(gridPosition.row + pawnDirectionOpposite, gridPosition.column);
							}
            }
            
            // CASTLING - Move the rook.
            if (this.chessBoard.boardLayout[this.selectedPiecePosition.row, this.selectedPiecePosition.column].pieceType == Game.pieceType.King) {
              // Are we moving 2 spaces??? This indicates CASTLING.
							if (gridPosition.column - this.selectedPiecePosition.column == 2) {
                // Moving 2 spaces to the right - Move the ROOK on the right into its new position.
                this.chessBoard.movePiece(this.selectedPiecePosition.row, this.selectedPiecePosition.column + 4, this.selectedPiecePosition.row, this.selectedPiecePosition.column + 1);
              } else if (gridPosition.column - this.selectedPiecePosition.column == -2) {
                // Moving 2 spaces to the left - Move the ROOK on the left into its new position.
								this.chessBoard.movePiece(this.selectedPiecePosition.row, this.selectedPiecePosition.column - 3, this.selectedPiecePosition.row, this.selectedPiecePosition.column - 1);
              }
            }
            
            // Kill any piece in this new position.
            this.chessBoard.killPiece(gridPosition.row, gridPosition.column);
            
            // Move the piece into new position.
						this.chessBoard.movePiece(this.selectedPiecePosition.row, this.selectedPiecePosition.column, gridPosition.row, gridPosition.column);
            
            // Save new selected piece position
            // NOTEB: not done
            this.selectedPiecePosition.row = gridPosition.row;
            this.selectedPiecePosition.column = gridPosition.column;
            
            // Check if we need to promote a pawn.
						if (this.chessBoard.boardLayout[gridPosition.row][gridPosition.column].pieceType == Game.pieceType.Pawn &&
							(gridPosition.row == 0 || gridPosition.row == 7)) {
							// Time to promote.
							this.eCurrentMoveType = Game.moveType.PawnPromotion;
						} else {
              // NOTEB: didn't do it
              this.eCurrentMoveType = Game.moveType.SelectAPiece;
              
							// Clear highlights.
							this.chessBoard.clearMoveOptions();

							// Clear move options.
							this.moveOptions = [];

							// Turn finished.
							return true;
						}
          } else{
            this.eCurrentMoveType = Game.moveType.SelectAPiece;

						// Clear highlights.
						this.chessBoard.clearMoveOptions();

						// Clear move options.
						this.moveOptions = [];  
          }
        }
      } else if (this.eCurrentMoveType == Game.moveType.PawnPromotion) {
        // NOTEB: didn't do it
        this.eCurrentMoveType = Game.moveType.SelectAPiece;
        
        // Change the PAWN into the selected piece - Queen for this example
				this.chessBoard.swapPieceType(this.selectedPiecePosition.row, this.selectedPiecePosition.column, Game.pieceType.Queen);

				// Turn finished.
				return true;
      }
    }
    
    // Not finished turn yet.
		return false;
  }
  
  getNumberOfLivingPieces() {
    this.iNumberOfLivingPieces = 0;
    
    for (let iRow = 0; iRow < this.chessBoard.boardDimensions; iRow++) {
			for (let iCol = 0; iCol < this.chessBoard.boardDimensions; iCol++) {
				// Check for pieces.
				let currentPiece = this.chessBoard.boardLayout[iRow][iCol];
				if (currentPiece.pieceColor == this.color && currentPiece.pieceType != Game.pieceType.None) {
					this.iNumberOfLivingPieces++;
				}
			}
		}
    return this.iNumberOfLivingPieces;
  }
  
  // NOTEB: `moves` passed by reference
  getAllMoveOptions(boardToTest, teamColor) {
    let moves = [];
    let numberOfPiecesFound = 0;
    
    // Go through the board and get the moves for all pieces of our color.
    for (let iRow = 0; iRow < this.chessBoard.boardDimensions; iRow++) {
			for (let iCol = 0; iCol < this.chessBoard.boardDimensions; iCol++) {
        // Check for pieces.
        let currentPiece = boardToTest.boardLayout[iRow][iCol];
        if (currentPiece.pieceColor == teamColor && currentPiece.pieceType != Game.pieceType.None) {
          numberOfPiecesFound++;
          
          switch (currentPiece.pieceType) {
						case Game.pieceType.Pawn:
							moves.push(...this.getPawnMoveOptions(new GridPosition(iRow, iCol), currentPiece, boardToTest));
							break;

						case Game.pieceType.Knight:
							moves.push(...this.getKnightMoveOptions(new GridPosition(iRow, iCol), currentPiece, boardToTest));
							break;

						case Game.pieceType.Bishop:
							moves.push(...this.getDiagonalMoveOptions(new GridPosition(iRow, iCol), currentPiece, boardToTest));
							break;

						case Game.pieceType.Rook:
							moves.push(...this.getHorizontalAndVerticalMoveOptions(new GridPosition(iRow, iCol), currentPiece, boardToTest));
							break;

						case Game.pieceType.Queen:
							moves.push(...this.getHorizontalAndVerticalMoveOptions(new GridPosition(iRow, iCol), currentPiece, boardToTest));
							moves.push(...this.getDiagonalMoveOptions(new GridPosition(iRow, iCol), currentPiece, boardToTest));
							break;

						case Game.pieceType.King:
							moves.push(...this.getKingMoveOptions(new GridPosition(iRow, iCol), currentPiece, boardToTest));
							break;

						case Game.pieceType.None:
							break;

						default:
							break;
					}
          
          // Early exit - No point searching when we have already found all our pieces.
					if (numberOfPiecesFound == this.iNumberOfLivingPieces) {
						return moves;
					}
        }
      }
    }
    
    return moves;
  }
  
  // NOTEB: `moves` passed by reference
  getMoveOptions(gridPosition, boardPiece, boardToTest) {
    let moves;
    
    // All pieces move differently.
		switch (boardPiece.pieceType) {
			case Game.pieceType.Pawn:
				moves = this.getPawnMoveOptions(gridPosition, boardPiece, boardToTest);
				break;

			case Game.pieceType.Knight:
				moves = this.getKnightMoveOptions(gridPosition, boardPiece, boardToTest);
				break;

			case Game.pieceType.Bishop:
				moves = this.getDiagonalMoveOptions(gridPosition, boardPiece, boardToTest);
				break;

			case Game.pieceType.Rook:
				moves = this.getHorizontalAndVerticalMoveOptions(gridPosition, boardPiece, boardToTest);
				break;

			case Game.pieceType.Queen:
				moves = this.getHorizontalAndVerticalMoveOptions(gridPosition, boardPiece, boardToTest);
				moves.push(...this.getDiagonalMoveOptions(gridPosition, boardPiece, boardToTest));
				break;

			case Game.pieceType.King:
				moves = this.getKingMoveOptions(gridPosition, boardPiece, boardToTest);
				break;

			case Game.pieceType.None:
				break;

			default:
				break;
		}
    
    return moves;
  }
  
  // NOTEB: `moves` passed by reference
  checkMoveOptionValidityAndReturnMove(moveToCheck, pieceColor, boardToTest) {
    let moves = [];
    let tempBoard = new ChessBoard();
    tempBoard.copyInternalBoard(boardToTest);
    if (moveToCheck.toCol >= 0 && moveToCheck.toCol < this.chessBoard.boardDimensions 
        && moveToCheck.toRow >= 0 && moveToCheck.toRow < this.chessBoard.boardDimensions) {
			// We check with color passed in to enable the same functions to construct attacked spaces
			// as well as constructing the positions we can move to.
      if (tempBoard.boardLayout[moveToCheck.toRow][moveToCheck.toCol].pieceType == Game.pieceType.None) {
        // Will this leave us in check?
				tempBoard.movePiece(moveToCheck.fromRow, moveToCheck.fromCol, moveToCheck.toRow, moveToCheck.toCol);
        
        if (!this.checkForCheck(tempBoard, pieceColor)){
					moves.push(moveToCheck);
				}
      } else {
        // A piece so no more moves after this, but can we take it?
        if (tempBoard.boardLayout[moveToCheck.toRow][moveToCheck.toCol].pieceColor != pieceColor) {
          // Will this leave us in check?
					tempBoard.movePiece(moveToCheck.fromRow, moveToCheck.fromCol, moveToCheck.toRow, moveToCheck.toCol);

					if (!this.checkForCheck(tempBoard, pieceColor)){
						moves.push(moveToCheck);
					}
        }
        
        // Hit a piece, so no more moves in this direction.
				return [false, moves];
      }
      
      return [true, moves];
		}

		return [false, moves];
  }
  
  // NOTEB: `moves` passed by reference
  getPawnMoveOptions(gridPosition, boardPiece, boardToTest) {
    let moves = [];
    let tempBoard = new ChessBoard();
    tempBoard.copyInternalBoard(boardToTest);
    let pawnDirection = boardPiece.pieceColor == Game.pieceColor.White ? 1 : -1;
    
    // Single step FORWARD.
    let col = gridPosition.column;
		let row = gridPosition.row + pawnDirection;
		if (row >= 0 && row < this.chessBoard.boardDimensions && tempBoard.boardLayout[row][col].pieceType == Game.pieceType.None) {
      // Will this leave us in check? Only interested in check if its one of our moves.
      tempBoard.movePiece(gridPosition.row, gridPosition.column, row, col);
      
      if (!this.checkForCheck(tempBoard, boardPiece.pieceColor)) {
				moves.push(new Move(gridPosition.row, gridPosition.column, row, col));
			}
    }
    
    // Double step FORWARD.
    if (gridPosition.row == 1 || gridPosition.row == 6) {
      // Reset the board.
      tempBoard.copyInternalBoard(boardToTest);
      
      let row2 = gridPosition.row + pawnDirection * 2;
			if (row2 >= 0 && row2 < this.chessBoard.boardDimensions && 
          tempBoard.boardLayout[row2][col].pieceType == Game.pieceType.None && 
          tempBoard.boardLayout[row2][col].pieceType == Game.pieceType.None) {
				// Will this leave us in check? Only interested in check if its one of our moves.
				tempBoard.movePiece(gridPosition.row, gridPosition.column, row2, col);

				if (!this.checkForCheck(tempBoard, boardPiece.pieceColor)) {
					moves.push(new Move(gridPosition.row, gridPosition.column, row2, col));
				}
			}
    }
    
    // En'Passant move.
    if ((gridPosition.row == 4 && boardPiece.pieceColor == Game.pieceColor.White) ||
			(gridPosition.row == 3 && boardPiece.pieceColor == Game.pieceColor.Black)) {
      // Reset the board.
      tempBoard.copyInternalBoard(boardToTest);
      
      // Pawn beside us, can we en'passant.
      // IMPORTANT: if I don't do `let`, "ReferenceError: Cannot access 'col' before initialization"
			let col = gridPosition.column - 1;
			let row = gridPosition.row;
			if (col >= 0) {
        let leftPiece = tempBoard.boardLayout[row][col];
        if (leftPiece.pieceType == Game.pieceType.Pawn && leftPiece.bCanEnPassant) {
          // Will this leave us in check? Only interested in check if its one of our moves.
					tempBoard.killPiece(row, col);
					tempBoard.movePiece(gridPosition.row, gridPosition.column, row + pawnDirection, col);

					if (!this.checkForCheck(tempBoard, boardPiece.pieceColor)) {
						moves.push(new Move(gridPosition.row, gridPosition.column, row + pawnDirection, col));
					}
        }
      }
      
      // Reset the board.
      tempBoard.copyInternalBoard(boardToTest);
      
      col = gridPosition.column + 1;
      if (col < this.chessBoard.boardDimensions) {
        let rightPiece = tempBoard.boardLayout[row][col];
        if (rightPiece.pieceType == Game.pieceType.Pawn && rightPiece.bCanEnPassant) {
          // Will this leave us in check? Only interested in check if its one of our moves.
          tempBoard.killPiece(row, col);
          tempBoard.movePiece(gridPosition.row, gridPosition.column, row + pawnDirection, col);

          if (!this.checkForCheck(tempBoard, boardPiece.pieceColor)) {
            moves.push(new Move(gridPosition.row, gridPosition.column, row + pawnDirection, col));
          }
        }
      }
    }
    
    // Take a piece move.
    if (gridPosition.row > 0 && gridPosition.row < this.chessBoard.boardDimensions - 1) {
      // Ahead of selected pawn to the LEFT.
			if (gridPosition.column > 0) {
        // Reset the board.
        tempBoard.copyInternalBoard(boardToTest);
        
        let col = gridPosition.column - 1;
				let row = gridPosition.row + pawnDirection;
        
        let aheadLeftPiece = tempBoard.boardLayout[row][col];
        if (aheadLeftPiece.pieceType != Game.pieceType.None && aheadLeftPiece.pieceColor != boardPiece.pieceColor) {
          // Will this leave us in check? Only interested in check if its one of our moves.
					tempBoard.movePiece(gridPosition.row, gridPosition.column, row, col);

					if (!this.checkForCheck(tempBoard, boardPiece.pieceColor)) {
						moves.push(new Move(gridPosition.row, gridPosition.column, row, col));
					}
        }
      }
      
      // Ahead of selected pawn to the RIGHT.
			if (gridPosition.column < this.chessBoard.boardDimensions - 1) {
        // Reset the board.
        tempBoard.copyInternalBoard(boardToTest);
        
        let col = gridPosition.column + 1;
				let row = gridPosition.row + pawnDirection;
        if (col >= 0 && col < this.chessBoard.boardDimensions && row >= 0 && row < this.chessBoard.boardDimensions) {
          let aheadRightPiece = tempBoard.boardLayout[row][col];
          if (aheadRightPiece.pieceType != Game.pieceType.None && aheadRightPiece.pieceColor != boardPiece.pieceColor) {
            // Will this leave us in check? Only interested in check if its one of our moves.
						tempBoard.movePiece(gridPosition.row, gridPosition.column, row, col);

						if (!this.checkForCheck(tempBoard, boardPiece.pieceColor)) {
							moves.push(new Move(gridPosition.row, gridPosition.column, row, col));
						}
          }
        }
      }
    }
    
    return moves;
  }
  
  // NOTEB: `moves` passed by reference
  getHorizontalAndVerticalMoveOptions(gridPosition, boardPiece, boardToTest) {
    let results, move, moves = [];
    
    //Vertical DOWN the board.
		for (let row = gridPosition.row + 1; row < this.chessBoard.boardDimensions; row++) {
			// Keep checking moves until one is invalid.
			move = new Move(gridPosition.row, gridPosition.column, row, gridPosition.column);
      results = this.checkMoveOptionValidityAndReturnMove(move, boardPiece.pieceColor, boardToTest);
      moves.push(...results[1]);
			if (results[0] == false) {
				break;
			}
		}

		// Vertical UP the board.
		for (let row = gridPosition.row - 1; row >= 0; row--) {
			// Keep checking moves until one is invalid.
			move = new Move(gridPosition.row, gridPosition.column, row, gridPosition.column);
      results = this.checkMoveOptionValidityAndReturnMove(move, boardPiece.pieceColor, boardToTest);
      moves.push(...results[1]);
			if (results[0] == false) {
				break;
			}
		}

		// Horizontal LEFT of the board.
		for (let col = gridPosition.column - 1; col >= 0; col--) {
			// Keep checking moves until one is invalid.
			move = new Move(gridPosition.row, gridPosition.column, gridPosition.row, col);
			results = this.checkMoveOptionValidityAndReturnMove(move, boardPiece.pieceColor, boardToTest);
      moves.push(...results[1]);
			if (results[0] == false) {
				break;
			}
		}

		// Horizontal RIGHT of the board.
		for (let col = gridPosition.column + 1; col < this.chessBoard.boardDimensions; col++) {
			// Keep checking moves until one is invalid.
			move = new Move(gridPosition.row, gridPosition.column, gridPosition.row, col);
			results = this.checkMoveOptionValidityAndReturnMove(move, boardPiece.pieceColor, boardToTest);
      moves.push(...results[1]);
			if (results[0] == false) {
				break;
			}
		}
    
    return moves;
  }
  
  // NOTEB: `moves` passed by reference
  getDiagonalMoveOptions(gridPosition, boardPiece, boardToTest) {
    let results, move, moves = [];
    
    // ABOVE & LEFT
		for (let row = gridPosition.row - 1, col = gridPosition.column - 1; row >= 0 && col >= 0; row--, col--) {
			// Keep checking moves until one is invalid.
			move = new Move(gridPosition.row, gridPosition.column, row, col);
			results = this.checkMoveOptionValidityAndReturnMove(move, boardPiece.pieceColor, boardToTest);
      moves.push(...results[1]);
			if (results[0] == false) {
				break;
			}
		}

		// ABOVE & RIGHT
		for (let row = gridPosition.row - 1, col = gridPosition.column + 1; row >= 0 && col < this.chessBoard.boardDimensions; 
         row--, col++) {
			// Keep checking moves until one is invalid.
			move = new Move(gridPosition.row, gridPosition.column, row, col);
			results = this.checkMoveOptionValidityAndReturnMove(move, boardPiece.pieceColor, boardToTest);
      moves.push(...results[1]);
			if (results[0] == false) {
				break;
			}
		}

		// BELOW & LEFT
		for (let row = gridPosition.row + 1, col = gridPosition.column - 1; row < this.chessBoard.boardDimensions && col >= 0; 
         row++, col--) {
			// Keep checking moves until one is invalid.
			move = new Move(gridPosition.row, gridPosition.column, row, col);
			results = this.checkMoveOptionValidityAndReturnMove(move, boardPiece.pieceColor, boardToTest);
      moves.push(...results[1]);
			if (results[0] == false) {
				break;
			}
		}

		// BELOW & RIGHT
		for (let row = gridPosition.row + 1, col = gridPosition.column + 1; 
         row < this.chessBoard.boardDimensions && col < this.chessBoard.boardDimensions; row++, col++) {
			// Keep checking moves until one is invalid.
			move = new Move(gridPosition.row, gridPosition.column, row, col);
			results = this.checkMoveOptionValidityAndReturnMove(move, boardPiece.pieceColor, boardToTest);
      moves.push(...results[1]);
			if (results[0] == false) {
				break;
			}
		}
    
    return moves;
  }
  
  // NOTEB: `moves` passed by reference
  getKnightMoveOptions(gridPosition, boardPiece, boardToTest) {
    let results, move, moves = [];
    
    // Moves to the RIGHT.
    move = new Move(gridPosition.row, gridPosition.column, gridPosition.row+1, gridPosition.column+2);
    results = this.checkMoveOptionValidityAndReturnMove(move, boardPiece.pieceColor, boardToTest);
    moves.push(...results[1]);
    
    // IMPORTANT: create same kind of object everytime because if I don't and the reference is changed, then 
    // the change gets propagated henceforth
    move = new Move(gridPosition.row, gridPosition.column, gridPosition.row - 1, gridPosition.column+2);
		results = this.checkMoveOptionValidityAndReturnMove(move, boardPiece.pieceColor, boardToTest);
    moves.push(...results[1]);

		// Moves to the LEFT.
    move = new Move(gridPosition.row, gridPosition.column, gridPosition.row + 1, gridPosition.column - 2);
		results = this.checkMoveOptionValidityAndReturnMove(move, boardPiece.pieceColor, boardToTest);
    moves.push(...results[1]);

    move = new Move(gridPosition.row, gridPosition.column, gridPosition.row - 1, gridPosition.column - 2);
		results = this.checkMoveOptionValidityAndReturnMove(move, boardPiece.pieceColor, boardToTest);
    moves.push(...results[1]);

		// Moves ABOVE.
    move = new Move(gridPosition.row, gridPosition.column, gridPosition.row - 2, gridPosition.column + 1);
		results = this.checkMoveOptionValidityAndReturnMove(move, boardPiece.pieceColor, boardToTest);
    moves.push(...results[1]);

    move = new Move(gridPosition.row, gridPosition.column, gridPosition.row - 2, gridPosition.column - 1);
		results = this.checkMoveOptionValidityAndReturnMove(move, boardPiece.pieceColor, boardToTest);
    moves.push(...results[1]);

		// Moves BELOW.
    move = new Move(gridPosition.row, gridPosition.column, gridPosition.row + 2, gridPosition.column + 1);
		results = this.checkMoveOptionValidityAndReturnMove(move, boardPiece.pieceColor, boardToTest);
    moves.push(...results[1]);

    move = new Move(gridPosition.row, gridPosition.column, gridPosition.row + 2, gridPosition.column - 1);
		results = this.checkMoveOptionValidityAndReturnMove(move, boardPiece.pieceColor, boardToTest);
    moves.push(...results[1]);
    
    return moves;
  }
  
  // NOTEB: `moves` passed by reference
  getKingMoveOptions(gridPosition, boardPiece, boardToTest) {
    let results, move, moves = [];
    
    // Start at position top left of king and move across and down.
    for (let row = gridPosition.row - 1; row <= gridPosition.row + 1; row++) {
			for (let col = gridPosition.column - 1; col <= gridPosition.column + 1; col++) {
				if ((row >= 0 && row < this.chessBoard.boardDimensions) && (col >= 0 && col < this.chessBoard.boardDimensions)) {
					// Check if move is valid and store it. We don't care about the return value as we are only
					// checking one move in each direction.
					move = new Move(gridPosition.row, gridPosition.column, row, col);
					results = this.checkMoveOptionValidityAndReturnMove(move, boardPiece.pieceColor, boardToTest);
          moves.push(...results[1]);
				}
			}
		}
    
    if (boardPiece.pieceColor == this.color) {
      let opponentColor = this.color == Game.pieceColor.White ? Game.pieceColor.Black : Game.pieceColor.White;
      
      // Compile all the moves available to our opponent.
      let allOpponentMoves;
      allOpponentMoves = this.getAllMoveOptions(boardToTest, opponentColor);
      
      // Can CASTLE if not in CHECK.
      if (!this.#bInCheck) {
        // CASTLE to the right.
        let king = boardToTest.boardLayout[gridPosition.row][gridPosition.column];
        if (!king.bHasMoved) {
          if (gridPosition.column + 4 < this.chessBoard.boardDimensions) {
            let rightRook = boardToTest.boardLayout[gridPosition.row][gridPosition.column + 4];
            
            if (rightRook.pieceType == Game.pieceType.Rook && !rightRook.bHasMoved) {
              if (boardToTest.boardLayout[gridPosition.row][gridPosition.column + 1].pieceType == Game.pieceType.None &&
								boardToTest.boardLayout[gridPosition.row][gridPosition.column + 2].pieceType == Game.pieceType.None &&
								boardToTest.boardLayout[gridPosition.row][gridPosition.column + 3].pieceType == Game.pieceType.None) {
                // Cannot CASTLE through a CHECK position.
							  let canCastle = true;
                for (let i = 0; i < allOpponentMoves.length; i++) {
                  if ((allOpponentMoves[i].toCol == gridPosition.column + 2 && 
                       allOpponentMoves[i].toRow == gridPosition.row) ||
										(allOpponentMoves[i].toCol == gridPosition.column + 1 && 
                     allOpponentMoves[i].toRow == gridPosition.row)) {
                    canCastle = false;
                  }
                }
                
                // Check if the final position is valid.
                if (canCastle){
                  results = this.checkMoveOptionValidityAndReturnMove(
                    new Move(gridPosition.row, gridPosition.column, gridPosition.row, gridPosition.column + 2), 
                    boardPiece.pieceColor, boardToTest);
                  moves.push(...results[1]);
                }
              }
            }
          }
          
          // CASTLE to the left.
          let leftRook = boardToTest.boardLayout[gridPosition.row][gridPosition.column - 3];
          
          if (leftRook.pieceType == Game.pieceType.Rook && !leftRook.bHasMoved) {
            if (gridPosition.column - 3 >= 0) {
              if (boardToTest.boardLayout[gridPosition.row][gridPosition.column - 1].pieceType == Game.pieceType.None &&
							boardToTest.boardLayout[gridPosition.row][gridPosition.column - 2].pieceType == Game.pieceType.None) {
                // Cannot CASTLE through a CHECK position.
                let canCastle = true;
                for (let i = 0; i < allOpponentMoves.Count; i++){
                  if ((allOpponentMoves[i].toCol == gridPosition.column - 1 && 
                       allOpponentMoves[i].toRow == gridPosition.row) ||
										(allOpponentMoves[i].toCol == gridPosition.column - 2 && 
                     allOpponentMoves[i].toRow == gridPosition.row) ||
										(allOpponentMoves[i].toCol == gridPosition.column - 3 
                     && allOpponentMoves[i].toRow == gridPosition.row)) {
										canCastle = false;
									}
                }
                
                // Check if the final position is valid.
								if (canCastle) {
									results = this.checkMoveOptionValidityAndReturnMove(
                    new Move(gridPosition.row, gridPosition.column, gridPosition.row, gridPosition.column - 2), 
                    boardPiece.pieceColor, boardToTest);
                  moves.push(...results[1]);
								}
              }
            }
          }
        }
      }
    }
    
    return moves;
  }
  
  checkForCheck(boardToTest, teamColor) {
    // TODOB: use struct
    let ourKingPosition = new GridPosition();
    
    // Go through the board and find our KING's position.
    // TODO: use `every` (see https://stackoverflow.com/a/34425841), need to do double loop exit
    for (let iRow = 0; iRow < this.chessBoard.boardDimensions; iRow++) {
      for (let iCol = 0; iCol < this.chessBoard.boardDimensions; iCol++) {
        let currentPiece = boardToTest.boardLayout[iRow][iCol];
        if (currentPiece.pieceColor == teamColor && currentPiece.pieceType == Game.pieceType.King) {
					// Store our KING's position whilst we go through the board.
					ourKingPosition.row = iRow;
					ourKingPosition.column = iCol;

					// Force double loop exit.
					iRow = this.chessBoard.boardDimensions;
					iCol = this.chessBoard.boardDimensions;
				}
      }
    }
      
    // Now we have our king's position; lets check if it is under attack from anywhere.
		// Horizontal - Right
    let col = ourKingPosition.column;
    while(++col < this.chessBoard.boardDimensions) {
      
      let currentPiece;
      try {
        currentPiece = boardToTest.boardLayout[ourKingPosition.row][col];
      }
      catch(err) {
        console.log('test');
      }
      
      if (currentPiece.pieceType != Game.pieceType.None) {
				if (currentPiece.pieceColor == teamColor) {
					break;
				} else if (currentPiece.pieceType == Game.pieceType.Queen || currentPiece.pieceType == Game.pieceType.Rook) {
					return true;
				} else {
					break;
				}
			}
    }
      
    // Horizontal - Left
    col = ourKingPosition.column;
    while (--col >= 0) {
      let currentPiece = boardToTest.boardLayout[ourKingPosition.row][col];
      if (currentPiece.pieceType != Game.pieceType.None) {
				if (currentPiece.pieceColor == teamColor) {
					break;
				} else if (currentPiece.pieceType == Game.pieceType.Queen || currentPiece.pieceType == Game.pieceType.Rook) {
					return true;
				} else {
					break;
				}
			}
    }
      
    // Vertical - Up
    let row = ourKingPosition.row;
    while (--row >= 0) {
      let currentPiece = boardToTest.boardLayout[row][ourKingPosition.column];
      if (currentPiece.pieceType != Game.pieceType.None) {
				if (currentPiece.pieceColor == teamColor) {
					break;
				} else if (currentPiece.pieceType == Game.pieceType.Queen || currentPiece.pieceType == Game.pieceType.Rook) {
					return true;
				} else {
					break;
				}
			}
    }
    
    // Vertical - Down
    row = ourKingPosition.row;
    while (++row < this.chessBoard.boardDimensions) {
      let currentPiece = boardToTest.boardLayout[row][ourKingPosition.column];
      if (currentPiece.pieceType != Game.pieceType.None) {
				if (currentPiece.pieceColor == teamColor) {
					break;
				} else if (currentPiece.pieceType == Game.pieceType.Queen || currentPiece.pieceType == Game.pieceType.Rook) {
					return true;
				} else {
					break;
				}
			}
    } 
      
    // Diagonal - Right Down
    row = ourKingPosition.row;
		col = ourKingPosition.column;
    while (++col < this.chessBoard.boardDimensions && ++row < this.chessBoard.boardDimensions) {
      let currentPiece = boardToTest.boardLayout[row][col];
      if (currentPiece.pieceType != Game.pieceType.None) {
				if (currentPiece.pieceColor == teamColor) {
					break;
				} else if (currentPiece.pieceType == Game.pieceType.Queen || currentPiece.pieceType == Game.pieceType.Bishop) {
					return true;
				} else {
					break;
				}
			}
    } 
    
    // Diagonal - Right Up  
    row = ourKingPosition.row;
		col = ourKingPosition.column;
    while (--row >= 0 && ++col < this.chessBoard.boardDimensions) {
      let currentPiece = boardToTest.boardLayout[row][col];
      if (currentPiece.pieceType != Game.pieceType.None) {
				if (currentPiece.pieceColor == teamColor) {
					break;
				} else if (currentPiece.pieceType == Game.pieceType.Queen || currentPiece.pieceType == Game.pieceType.Bishop) {
					return true;
				} else {
					break;
				}
			}
    } 
      
    // Diagonal - Left Down  
    row = ourKingPosition.row;
		col = ourKingPosition.column;
    while (++row < this.chessBoard.boardDimensions && --col >= 0) {
      let currentPiece = boardToTest.boardLayout[row][col];
      if (currentPiece.pieceType != Game.pieceType.None) {
				if (currentPiece.pieceColor == teamColor) {
					break;
				} else if (currentPiece.pieceType == Game.pieceType.Queen || currentPiece.pieceType == Game.pieceType.Bishop) {
					return true;
				} else {
					break;
				}
			}
    }   
      
    // Diagonal - Left Up
    row = ourKingPosition.row;
		col = ourKingPosition.column;
    while (--row >= 0 && --col >= 0) {
      let currentPiece = boardToTest.boardLayout[row][col];
      if (currentPiece.pieceType != Game.pieceType.None) {
				if (currentPiece.pieceColor == teamColor) {
					break;
				} else if (currentPiece.pieceType == Game.pieceType.Queen || currentPiece.pieceType == Game.pieceType.Bishop) {
					return true;
				} else {
					break;
				}
			}
    }     
    
    // Awkward Knight moves 
    // #1
    row = ourKingPosition.row + 1;
		col = ourKingPosition.column + 2;
    if (col < this.chessBoard.boardDimensions && row < this.chessBoard.boardDimensions) {
      let currentPiece = boardToTest.boardLayout[row][col];
      if (currentPiece.pieceColor != teamColor && currentPiece.pieceType == Game.pieceType.Knight) {
        return true;
			}
    }       
    
    // #2
    row = ourKingPosition.row - 1;
		col = ourKingPosition.column + 2;
    if (col < this.chessBoard.boardDimensions && row >= 0) {
      let currentPiece = boardToTest.boardLayout[row][col];
      if (currentPiece.pieceColor != teamColor && currentPiece.pieceType == Game.pieceType.Knight) {
        return true;
			}
    } 
    
    // #3
    row = ourKingPosition.row + 2;
		col = ourKingPosition.column + 1;
    if (col < this.chessBoard.boardDimensions && row < this.chessBoard.boardDimensions) {
      let currentPiece = boardToTest.boardLayout[row][col];
      if (currentPiece.pieceColor != teamColor && currentPiece.pieceType == Game.pieceType.Knight) {
        return true;
			}
    } 
    
    // #4
    row = ourKingPosition.row + 2;
		col = ourKingPosition.column - 1;
    if (col >= 0 && row < this.chessBoard.boardDimensions) {
      let currentPiece = boardToTest.boardLayout[row][col];
      if (currentPiece.pieceColor != teamColor && currentPiece.pieceType == Game.pieceType.Knight) {
        return true;
			}
    }  
    
    // #5
    row = ourKingPosition.row + 1;
		col = ourKingPosition.column - 2;
    if (col >= 0 && row < this.chessBoard.boardDimensions) {
      let currentPiece = boardToTest.boardLayout[row][col];
      if (currentPiece.pieceColor != teamColor && currentPiece.pieceType == Game.pieceType.Knight) {
        return true;
			}
    }  
      
    // #6
    row = ourKingPosition.row - 1;
		col = ourKingPosition.column - 2;
    if (col >= 0 && row >= 0) {
      let currentPiece = boardToTest.boardLayout[row][col];
      if (currentPiece.pieceColor != teamColor && currentPiece.pieceType == Game.pieceType.Knight) {
        return true;
			}
    } 
      
    // #7
    row = ourKingPosition.row - 2;
		col = ourKingPosition.column - 1;
    if (col >= 0 && row >= 0) {
      let currentPiece = boardToTest.boardLayout[row][col];
      if (currentPiece.pieceColor != teamColor && currentPiece.pieceType == Game.pieceType.Knight) {
        return true;
			}
    }
      
    // #8
    row = ourKingPosition.row - 2;
		col = ourKingPosition.column + 1;
    if (col < this.chessBoard.boardDimensions && row >= 0) {
      let currentPiece = boardToTest.boardLayout[row][col];
      if (currentPiece.pieceColor != teamColor && currentPiece.pieceType == Game.pieceType.Knight) {
        return true;
			}
    }
      
    // Opponent King positions
    for (let row = ourKingPosition.row - 1; row < ourKingPosition.row + 1; row++) {
      for(let col = ourKingPosition.col - 1; col < ourKingPosition.column + 2; col++) {
        if ((col >= 0 && col < this.chessBoard.boardDimensions) && (row >= 0 && row < this.chessBoard.boardDimensions)) {
          let currentPiece = boardToTest.boardLayout[row][col];
          if (currentPiece.pieceColor != teamColor && currentPiece.pieceType == Game.pieceType.King) {
            return true;
          }
        }
      }
    }
      
    // Opponent Pawns
    let opponentPawnDirection = teamColor == Game.pieceColor.White ? 1 : -1;
		row = ourKingPosition.row + opponentPawnDirection;
		col = ourKingPosition.column + 1;
		if (col < this.chessBoard.boardDimensions && row >= 0 && row < this.chessBoard.boardDimensions) {
			let currentPiece = boardToTest.boardLayout[row][col];
			if (currentPiece.pieceColor != teamColor && currentPiece.pieceType == Game.pieceType.Pawn) {
				return true;
			}
		}

		row = ourKingPosition.row + opponentPawnDirection;
		col = ourKingPosition.column - 1;
		if (col >= 0 && row >= 0 && row < this.chessBoard.boardDimensions) {
			let currentPiece = boardToTest.boardLayout[row][col];
			if (currentPiece.pieceColor != teamColor && currentPiece.pieceType == Game.pieceType.Pawn) {
				return true;
			}
		}
      
    return false;
  }
  
  checkForCheckmate(boardToCheck, teamColor) {
    // If we are in CHECK, can we actually make a move to get us out of it?
		if (this.#bInCheck) {
      // NOTEB: `moves` passed by reference
		  let moves = this.getAllMoveOptions(boardToCheck, teamColor);

			// If there are no valid moves then this unfortunately is CHECKMATE.
			if (moves.length == 0) {
        console.log("Checkmate for " + teamColor + " players");
				return true;
			}
		}
      
    return false;
  }
  
  checkForStalemate(boardToCheck, teamColor) {
    // If we are not in CHECK, can we actually make a move? If not then we are in a STALEMATE.
		if (!this.#bInCheck) {
      // TODO: we only need to get one possible move, not all moves to check if we are in stalemate or not
      // NOTEB: `moves` passed by reference
      let moves = this.getAllMoveOptions(boardToCheck, teamColor);

			// If there are no valid moves then this unfortunately is a STALEMATE.
			if (moves.length == 0) {
        //console.log("Stalemate!");
				return true;
			}
		}
    
    return false;
  }
}

/******************************/
/*      ChessPlayerAI.js      */
/******************************/
class ChessPlayerAI extends ChessPlayer {
  searchDepth = 3;
  chessOpenings = null;
  useChessOpenings = true;
  bestMove = null;
  
  //--------------------------------------------------------------------------------------------------
  /* Private */
  #maxInt = 99999;
  
  #kPawnScore        = 2;
  #kKnightScore      = 10;
  #kBishopScore      = 10;
  #kRookScore        = 25;
  #kQueenScore       = 50;
  #kKingScore        = 100;
  
  #kCheckScore       = 20; // 20
  #kCheckmateScore   = 1000; // 1000
  #kStalemateScore   = 25; // Tricky one because sometimes you want this, sometimes you don't. (25)

  #kPieceWeight      = 4; // Scores as above. (4)
  #kMoveWeight       = 2; // Number of moves available to pieces. (2)
  #kPositionalWeight = 1; // Whether in CHECK, CHECKMATE or STALEMATE. (1)
  //--------------------------------------------------------------------------------------------------
  playing = false;
  
  constructor(color, chessBoard, bMyTurn) {
    super(color, chessBoard, bMyTurn);
  }
  
  start() {
    if (this.useChessOpenings) {
      this.chessOpenings = new ChessOpenings(this.color);
    }
  }
  
  update() {
    // NOTEB: do we need to check if the chessboard is setup?
    if (this.chessBoard != null && this.chessBoard.boardLayout != null) {
      var that = this;
      if (!this.playing && this.bMyTurn) {
        this.playing = true;
        console.log('Computing...');
        setTimeout(function () {
          let gameState = that.preTurn();
          if (gameState == Game.gameState.Normal || gameState == Game.gameState.Check) {
            that.takeATurn();
            //Indicators to help the human player.
            // TODO
            //that.showCheckWarning();
            that.setTurnIndicator();
          } else if (gameState == Game.gameState.Checkmate || gameState == Game.gameState.Stalemate) {
            // We have an end to the game, so let the game over canvas show the player.
            if (that.gameOverOptions != null) {
              let opponentColor = that.color == Game.pieceColor.White ? Game.pieceColor.Black : Game.pieceColor.White;
              // TODO
              //that.gameOverOptions.setWinner(gameState, opponentColor);
              //that.gameOverOptions.showGameOverCanvas();
            }
          }
          console.log('End of computations');
          that.playing = false;
          // IMPORTANT: `this` = window within `setTimeout()`
        }, 1000);
      }
    }
  }
  
  makeAMove(move) {
    // If this was an en'passant move the taken piece will not be in the square we moved to.
		if (this.chessBoard.boardLayout[move.fromRow][move.fromCol].pieceType == Game.pieceType.Pawn) {
      // If the pawn is on its start position and it double jumps, then en'passant may be available for opponent.
			if ((move.fromRow == 1 && move.toRow == 3) || (move.fromRow == 6 && move.toRow == 4)) {
        this.chessBoard.boardLayout[move.fromRow, move.fromCol].bCanEnPassant = true;
      }
    }
    
    // En'Passant removal of enemy pawn.
		// If our pawn moved into an empty position to the left or right, then must be En'Passant.
		if (this.chessBoard.boardLayout[move.fromRow][move.fromCol].pieceType == Game.pieceType.Pawn &&
			this.chessBoard.boardLayout[move.toRow][move.toCol].pieceType == Game.pieceType.None) {
      let pawnDirectionOpposite = this.color == Game.pieceColor.White ? -1 : 1;

			if ((move.fromCol < move.toCol) || (move.fromCol > move.toCol)) {
				this.chessBoard.killPiece(move.toRow + pawnDirectionOpposite, move.toCol);
			}
    }
    
    // CASTLING - Move the rook.
		if (this.chessBoard.boardLayout[move.fromRow, move.fromCol].pieceType == Game.pieceType.King) {
      // Are we moving 2 spaces??? This indicates CASTLING.
			if (move.toCol - move.fromCol == 2) {
        // Moving 2 spaces to the right - Move the ROOK on the right into its new position.
				this.chessBoard.movePiece(move.fromRow, move.fromCol + 4, move.fromRow, move.fromCol + 1);
      } else if (move.toCol - move.fromCol == -2) {
        // Moving 2 spaces to the left - Move the ROOK on the left into its new position.
				this.chessBoard.movePiece(move.fromRow, move.fromCol - 3, move.fromRow, move.fromCol - 1);
      }
    }
    
    // Kill any piece in this new position.
		this.chessBoard.killPiece(move.toRow, move.toCol);

		// Move the piece into new position.
		this.chessBoard.movePiece(move.fromRow, move.fromCol, move.toRow, move.toCol);
  }
  
  takeATurn() {
    // Play opening book, or calculate best move.
    let score = 0;
    this.bestMove = new Move();
    
    if (this.chessOpenings !== null && this.chessOpenings.isAnotherMoveAvailable()) {
      // Play opening.
      // `GetNextMove` could return a `null` move but within this `if` condition, it is
      // not possible because in the `if` condition, we call `isAnotherMoveAvailable`
      this.bestMove = this.chessOpenings.getNextMove();
    } else {
      // Do the MiniMax Algorithm.
      this.getNumberOfLivingPieces();
      score = this.miniMax(this.chessBoard);
      console.log('takeATurn(), score = ' + score)
    }
    
    // Now we have the best move, do it.
    this.makeAMove(this.bestMove);
    
    // Allow opponent to take their turn.
		this.bMyTurn = false;
		this.opponentPlayer.setTurn(true);
  }
  
  miniMax(boardToTest) {
    return this.maximise(boardToTest, this.searchDepth, this.#maxInt);
  }
  
  maximise(boardToTest, currentSearchDepth, parentLow) {
    // Reach terminal node so return the heuristic.
		if (currentSearchDepth == 0) {
			return this.scoreTheBoard(boardToTest);
		}

		let bestValue = -this.#maxInt;
		let tempBoard = new ChessBoard();
		tempBoard.copyInternalBoard(boardToTest);

    let key = 'max + searchDepth=' + currentSearchDepth;
    this.minimaxMoves[key] = this.getAllMoveOptions(tempBoard, this.color);

		if (this.minimaxMoves[key].length > 0) {
			//Go through all move options and return the one with the maximum score.
			for (let i = 0; i < this.minimaxMoves[key].length; i++) {
        let opponentPiece = boardToTest.boardLayout[this.minimaxMoves[key][i].toRow][this.minimaxMoves[key][i].toCol];
        if (opponentPiece.pieceType == Game.pieceType.King && opponentPiece.pieceColor != this.color) {
          continue;
        }
        
				//Only check if our best highest is less than parent's low, otherwise stop.
				//Any further checks resulting positively will only get higher and therefore be
				//higher than the parent low, which means they will be discarded.
				if (bestValue > parentLow) {
					//console.log("MAXIMISE: Pruned");
					return bestValue;
				}
				else {
					// Reconfigure the board using this move.
					tempBoard.copyInternalBoard(boardToTest);
					tempBoard.movePiece(this.minimaxMoves[key][i].fromRow, this.minimaxMoves[key][i].fromCol, 
                              this.minimaxMoves[key][i].toRow, this.minimaxMoves[key][i].toCol);

					// Dig deeper with the board constructed in this new configuration.
					let value = this.minimise(tempBoard, currentSearchDepth - 1, bestValue);
					if (value > bestValue) {
						bestValue = value;
            //console.log('Max: bestValue = ' + bestValue);

						// Only store moves that are determined at the starting depth.
						if (currentSearchDepth == this.searchDepth) {
							this.bestMove = this.minimaxMoves[key][i];
						}
					}
				}
			}
		}

		return bestValue;
  }
  
  minimise(boardToTest, currentSearchDepth, parentHigh) {
    // Reach terminal node so return the heuristic.
		if (currentSearchDepth == 0) {
			return this.scoreTheBoard(boardToTest);
		}

		let bestValue = this.#maxInt;
		let tempBoard = new ChessBoard();
		tempBoard.copyInternalBoard(boardToTest);

    let key = 'min + searchDepth=' + currentSearchDepth;
    this.minimaxMoves[key] = [];
    this.minimaxMoves[key] = this.getAllMoveOptions(tempBoard, this.color);

		if (this.minimaxMoves[key].length > 0) {
			// Go through all move options and return the one with the minimum score.
			for (let i = 0; i < this.minimaxMoves[key].length; i++) {
        let opponentPiece = boardToTest.boardLayout[this.minimaxMoves[key][i].toRow][this.minimaxMoves[key][i].toCol];
        if (opponentPiece.pieceType == Game.pieceType.King && opponentPiece.pieceColor != this.color) {
          continue;
        }
        
				// Only check if our best lowest is greater than parent's high, otherwise stop.
				// Any further checks resulting positively will only get lower and therefore be
				// lower than the parent high, which means they will be discarded.
				if (bestValue < parentHigh) {
					//console.log("MINIMISE: Pruned");
					return bestValue;
        } else {
					// Reconfigure the board using this move.
					tempBoard.copyInternalBoard(boardToTest);
					tempBoard.movePiece(this.minimaxMoves[key][i].fromRow, this.minimaxMoves[key][i].fromCol, 
                              this.minimaxMoves[key][i].toRow, this.minimaxMoves[key][i].toCol);

					// Dig deeper with the board constructed in this new configuration.
					let value = this.maximise(tempBoard, currentSearchDepth - 1, bestValue);

					bestValue = Math.min(bestValue, value);
          //console.log('Min: bestValue = ' + bestValue);
				}
			}
		}

		return bestValue;
  }
  
  scoreTheBoard(boardToScore) {
    let pieceScore = 0;
		let moveScore = 0;
		let positionalScore = 0;
		let availableMoves = [];

		//------------------------------------------------------------------------------------------------------------------------
		// Individual piece scoring
		//------------------------------------------------------------------------------------------------------------------------
		for (let iCol = 0; iCol < this.chessBoard.boardDimensions; iCol++) {
			for (let iRow = 0; iRow < this.chessBoard.boardDimensions; iRow++) {
				let currentPiece = boardToScore.boardLayout[iRow][iCol];

				// All pieces score differently.
				let gridPosition = new GridPosition(iRow, iCol);

				switch (currentPiece.pieceType) {
					case Game.pieceType.Pawn:
						if (currentPiece.pieceColor == this.color) {
							pieceScore += this.#kPawnScore;

							// Extra points for getting close to promotion.
							if (this.color == Game.pieceColor.White && gridPosition.row >= 4) {
								moveScore += 8 - (8 - gridPosition.row);
							} else if (this.color == Game.pieceColor.Black && gridPosition.row <= 3) {
								moveScore += 8 - gridPosition.row;
							}
						} else {
							pieceScore -= this.#kPawnScore;
						}
						break; 

					case Game.pieceType.Knight:
						if (currentPiece.pieceColor == this.color) {
							pieceScore += this.#kKnightScore;

							// Extra points for the more move options available.
							this.getKnightMoveOptions(gridPosition, currentPiece, boardToScore);
							moveScore += availableMoves.length;
						}
						else
							pieceScore -= this.#kKnightScore;
						break;

					case Game.pieceType.Bishop:
						if (currentPiece.pieceColor == this.color) {
							pieceScore += this.#kBishopScore;

							// Extra points for the more move options available.
							availableMoves = this.getDiagonalMoveOptions(gridPosition, currentPiece, boardToScore);
							moveScore += availableMoves.length;
						}
						else
							pieceScore -= this.#kBishopScore;
						break;

					case Game.pieceType.Rook:
						if (currentPiece.pieceColor == this.color) {
							pieceScore += this.#kRookScore;

							// Extra points for the more move options available.
							availableMoves = this.getHorizontalAndVerticalMoveOptions(gridPosition, currentPiece, boardToScore);
							moveScore += availableMoves.length;
						}
						else
							pieceScore -= this.#kRookScore;
						break;

					case Game.pieceType.Queen:
						if (currentPiece.pieceColor == this.color) {
							pieceScore += this.#kQueenScore;

							// Extra points for the more move options available.
							availableMoves = this.getDiagonalMoveOptions(gridPosition, currentPiece, boardToScore);
							moveScore += availableMoves.length;
							availableMoves = this.getHorizontalAndVerticalMoveOptions(gridPosition, currentPiece, boardToScore);
							moveScore += availableMoves.length;
						}
						else
							pieceScore -= this.#kQueenScore;
						break;

					case Game.pieceType.King:
						if (currentPiece.pieceColor == this.color) {
							pieceScore += this.#kKingScore;
						} else {
							pieceScore -= this.#kKingScore;
						}
						break;

					case Game.pieceType.None:
						break;

					default:
						break;
				}
			}
		}

		//------------------------------------------------------------------------------------------------------------------------
		// CHECK, CHECKMATE & STALEMATE checks
		//------------------------------------------------------------------------------------------------------------------------

		// Lets see if we are putting the opponent in check.
		let opponentInCheck = false;
		let opponentColor = this.color == Game.pieceColor.White ? Game.pieceColor.Black : Game.pieceColor.White;
		if (this.checkForCheck(boardToScore, opponentColor)) {
			opponentInCheck = true;
			positionalScore += this.#kCheckScore;

			// If they are in CHECK they may actually be in CHECKMATE.
			if (this.checkForCheckmate(boardToScore, opponentColor)) {
				positionalScore += this.#kCheckmateScore;
			}
		}

		// Can't both be in CHECK, so don't bother checking self if opponent is.
		if (!opponentInCheck) {
			// Are we in CHECK?
			if (this.checkForCheck(boardToScore, this.color)) {
				positionalScore -= this.#kCheckScore;

				// If we are in CHECK we could also be in CHECKMATE.
				if (this.checkForCheckmate(boardToScore, this.color)) {
					positionalScore -= this.#kCheckmateScore;
				}
			} else {
				// If we are in not in CHECK are we in STALEMATE?
				if (this.checkForStalemate(boardToScore, this.color)) {
					positionalScore -= this.#kStalemateScore; // NEVER want a STALEMATE!!!
				}
			}
		}

		//Return the overall score for this board.
		return (pieceScore * this.#kPieceWeight) + (moveScore * this.#kMoveWeight) + (positionalScore * this.#kPositionalWeight);
	}
}

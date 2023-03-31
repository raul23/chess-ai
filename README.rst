========
Chess-AI
========
Exploring AI applied to chess

.. contents:: **Contents**
   :depth: 5
   :local:
   :backlinks: top

JavaScript implementation: [Work-in-Progress 🚧]
================================================
.. raw:: html

   <div align="center">
    <a href="https://codepen.io/raul23/full/WNgPJJj" target="_blank">
      <img src="./images/chess_fullscreen.png">
    </a>
    <p align="center">AI controls the black pieces and the user, the white ones.
    <br/><a href="https://codepen.io/raul23/full/WNgPJJj">Test it live.</a></p>
  </div>

Introduction
------------
I started from `Jexan <https://github.com/Jexan>`_'s 
`ChessJs <https://github.com/Jexan/ChessJs>`_ which is based on the following two JavaScript libraries:

- `Phaser v2.0.5 <https://github.com/Jexan/ChessJs/blob/master/lib/phaser.min.js>`_
- `Underscore.js 1.6.0 <https://github.com/Jexan/ChessJs/blob/master/lib/underscore-min.js>`_

I tried to run their actual project with these old libraries but couldn't make the game work
as it can be seen here: `codepen.io <https://codepen.io/raul23/pen/NWLYZOm>`_

Therefore I decided to use more recent libraries (``phaser@3.55.2`` and ``underscore@1.13.6``) which resulted
in modifying some parts of the codebase such as these:

- ``add.sprite`` instead of ``add.image``
- ``group.clear(true)`` instead of ``group.removeAll()``
- ``image.destroy()`` instead of ``image.kill()``
- ``image.on('pointerdown', () => {})`` instead of ``image.events.onInputDown.add(() => {})``
- ``image.scaleX`` instead of ``image.scale.x``
- ``image.setInteractive()`` instead of ``image.inputEnabled = true``

Thereafter, I implemented the game AI in the form of `Minimax with AlphaBeta pruning <#game-ai>`_ based on the
C# code by Paul Roberts from his book `Artificial Intelligence in Games <https://www.routledge.com/Artificial-Intelligence-in-Games/Roberts/p/book/9781032033228>`_. 

Unfortunately, I wasn't able to to make most of **ChessJs** code to work with the game AI from the book which used
a different way of coding the chess game. Thus, I decided to abandon **ChessJs** codebase and ported the whole C# 
chess code from Paul Roberts' book `Artificial Intelligence in Games 
<https://www.routledge.com/Artificial-Intelligence-in-Games/Roberts/p/book/9781032033228>`_.  

The game now runs fine but there are still `things to be done <#things-to-be-done>`_.

`:information_source:`

 I am using the pieces and chessboard images from `ChessJs <https://github.com/Jexan/ChessJs>`_ 
 
 .. raw:: html
 
    <div align="center">
       <a href="https://github.com/Jexan/ChessJs/blob/master/imgs/assets.png" target="_blank">
         <img src="./images/assets.png">
       </a>
    </div>

Test it live and source code ⭐
-------------------------------
- `codepen.io <https://codepen.io/raul23/full/WNgPJJj>`_ (**Test it live** with fullscreen)
- `github.com <./code/javascript>`_ (source code)

Source code
"""""""""""
`:information_source:` 

 - `script.js <./code/javascript/script.js>`_ (JavaScript source code)
 - It is a JavaScript port of the C# chess program from Paul Roberts' 
   book `Artificial Intelligence in Games <https://www.routledge.com/Artificial-Intelligence-in-Games/Roberts/p/book/9781032033228>`_. 

Here are the changes that I made when porting the C# chess program to JavaScript:

- After selecting one of the highlighted positions, it is important to update the selected piece position's row and column to 
  reflect the new position of the chess piece that just moved:
  
  .. code-block:: javascript
  
     // Save new selected piece position
     this.selectedPiecePosition.row = gridPosition.row;
     this.selectedPiecePosition.column = gridPosition.column;

- After moving a piece (except when moving a piece to the other end of the chessboard, i.e. pawn promotion), it is necessary
  to update the current move type to ``SelectAPiece``:
  
  .. code-block:: javascript
  
     this.eCurrentMoveType = Game.moveType.SelectAPiece;
     
- Same after promoting a pawn, the move type needs to be updated to ``SelectAPiece``:

  .. code-block:: javascript
  
     } else if (this.eCurrentMoveType == Game.moveType.PawnPromotion) {
       this.eCurrentMoveType = Game.moveType.SelectAPiece;

- I am not passing ``moves`` as reference to the various methods (e.g. ``getAllMoveOptions``). Instead, the methods
  return the list of moves ``moves``.
  
  Thus ``checkMoveOptionValidityAndStoreMove`` was renamed to ``checkMoveOptionValidityAndReturnMove`` since this method
  now returns the list of moves ``moves`` after checking their validity (e.g. not putting the user in check) along with
  a boolean value that tells you whether there are more valid moves in the current direction (e.g. the selected move 
  hits an opponent piece).

- I am adding a delay of 1 second before the AI agent starts its turn in order to be able to draw the human player's
  move before the AI's turn. If there is not this delay, the human player's move will get drawn at the same time as the
  AI player's move.

Instructions
------------
- The AI controls the black pieces and the user, the white ones.
- **Highlighted moves:** when clicking on one of your game pieces, squares get highlighted on the chessboard to let
  you know which possible moves you can make with the given piece. Click on one of the highlighted squares to move the piece.
  
  .. raw:: html

      <div align="center">
       <a href="https://codepen.io/raul23/full/WNgPJJj" target="_blank">
         <img src="./images/chess_highlighted.png">
       </a>
       <p align="center">Highlighted moves for the Bishop</p>
     </div>
     
  Only possibles moves that are valid get highlighted, in particular those that could put you in check are not shown.
  
  .. raw:: html

      <div align="center">
       <a href="https://codepen.io/raul23/full/WNgPJJj" target="_blank">
         <img src="./images/chess_highlighted_valid_only.png">
       </a>
       <p align="center">Highlighted moves for the white Queen: those that could put you in check are not shown</p>
     </div>
  
- Each pawn has the possibility to move two squares in front when it is moved for the first time.

  .. raw:: html

      <div align="center">
       <a href="https://codepen.io/raul23/full/eYLLJbJ" target="_blank">
         <img src="./images/chess_pawn_two_squares.png">
       </a>
     </div>

- Once a pawn gets completely to the other side of the chess board, it gets promoted to queen.

  .. raw:: html

      <div align="center">
       <a href="https://codepen.io/raul23/full/WNgPJJj" target="_blank">
         <img src="./images/pawn_promotion1.png">
       </a>
     </div>
     <div align="center">
       <a href="https://codepen.io/raul23/full/WNgPJJj" target="_blank">
         <img src="./images/pawn_promotion2.png" width="434" height="170">
       </a>
       <p align="center">Pawn promoted to Queen</p>
     </div>

Game AI
-------
`:warning:`

 When playing against the AI player, there will be a noticeable delay before the AI player makes its move (you can check
 the console to know what is going on) because the default search depth used for the minimax algorithm is 3. A search depth
 of 2 makes the AI player computes its moves quicker but I don't think such a small search depth can give the AI player 
 plenty of good moves to choose from.

I ported the chess game AI implemented as C# (+ Unity) from Paul Roberts' book 
`Artificial Intelligence in Games <https://www.routledge.com/Artificial-Intelligence-in-Games/Roberts/p/book/9781032033228>`_ to 
JavaScript using the ``phaser.js`` 2D game development library.

The game AI consists of the following two elements:

- Minimax with AlphaBeta pruning

  - Search depth (by default is 3)
  - Game scoring: every possible move is scored based on the following parameters
    
    Scores for each game piece:
    
    - ``PawnScore        = 2``
    - ``KnightScore      = 10``
    - ``BishopScore      = 10``
    - ``RookScore        = 25``
    - ``QueenScore       = 50``
    - ``KingScore        = 100``
    
    Scores based on the state of the game:
    
    - ``CheckScore       = 20``
    - ``CheckmateScore   = 1000``
    - ``StalemateScore   = 25``: "Tricky one because sometimes you want this, sometimes you don't."
    
    Weights for each type of scores:
    
    - ``PieceWeight      = 4``: "Scores as above."
    - ``MoveWeight       = 2``: "Number of moves available to pieces."
    - ``PositionalWeight = 1``: "Whether in CHECK, CHECKMATE or STALEMATE."
    
    Then, the scores are combined into one overall score as follows: 
    
    ``(PieceScore * PieceWeight) + (moveScore * MoveWeight) + (PositionalScore * PositionalWeight)``
- Playbook with the following chess openings:

  - Ruy Lopez
  - Sicilian Defense
  - Queen's Gambit
  - Alekhine Defense
  - Modern Defense
  - King's Indian Defense
  - English Opening
  - Dutch Defense
  - Stonewall Attack
  
  `:information_source:` 
  
   One of these openings is choosen randomly by the AI to start its game.

Things to be done
-----------------
In order of importance, these are the things still to be done for this Chess project:
  
- Add ending code: right now the game doesn't end when you do checkmate

  These are the game states that need to be checked:
  
  - check
  - checkmate
  - stalemate
- Test the following moves:

  - Encastling
  - En passant
- Add restart button: right now on `codepen.io <https://codepen.io/raul23/pen/eYLLJbJ>`_, you 
  have to click on Run (if not on fullscreen) or refresh the page
- Highlight the clicked piece: when the user clicks on a piece, it should be highlighted and if they click another piece, then
  the new piece should be the only one highlighted
- Add score
- Add an options menu
- Add a timer
- ...

Books
=====
- Roberts, Paul. `Artificial Intelligence in Games 
  <https://www.routledge.com/Artificial-Intelligence-in-Games/Roberts/p/book/9781032033228>`_. CRC Press, 2022.
  
  **Chapter 8: Chess AI**, pp.195-225
  
- Sadler, Matthew, and Natasha Regan. `Game Changer: AlphaZero’s Groundbreaking Chess Strategies and the Promise of AI 
  <https://www.amazon.com/Game-Changer-AlphaZeros-Groundbreaking-Strategies/dp/9056918184>`_. New In Chess,Csi, 2019.

========
Chess-AI
========
Exploring AI applied to chess

.. contents:: **Contents**
   :depth: 5
   :local:
   :backlinks: top

JavaScript implementation: upgraded ChessJs to Phaser 3 [Work-in-Progress 🚧]
=============================================================================
.. raw:: html

   <div align="center">
    <a href="https://codepen.io/raul23/full/eYLLJbJ" target="_blank">
      <img src="./images/chess_fullscreen.png">
    </a>
    <p align="center">Work-in-Progress: AI controls the black pieces and the user, the white ones.
    <br/><a href="https://codepen.io/raul23/full/eYLLJbJ">Test it live.</a></p>
  </div>

Introduction
------------
`:information_source:`

 `ChessJs <https://github.com/Jexan/ChessJs>`_: A simple chess game made with Javascript and Phaser
 
 Developed by `Jexan <https://github.com/Jexan>`_
 
I started from Jexan's **ChessJs** which is based on the following two JavaScript libraries:

- `Phaser v2.0.5 <https://github.com/Jexan/ChessJs/blob/master/lib/phaser.min.js>`_
- `Underscore.js 1.6.0 <https://github.com/Jexan/ChessJs/blob/master/lib/underscore-min.js>`_

I tried to run the actual project with these old libraries but couldn't make the game work
as it can be seen here: `codepen.io <https://codepen.io/raul23/pen/NWLYZOm>`_

Therefore I decided to use the latest libraries (``phaser@3.55.2`` and ``underscore@1.13.6``) which resulted
in modifying some parts of the code such as these:

- ``add.sprite`` instead of ``add.image``
- ``group.clear(true)`` instead of ``group.removeAll()``
- ``image.destroy()`` instead of ``image.kill()``
- ``image.on('pointerdown', () => {})`` instead of ``image.events.onInputDown.add(() => {})``
- ``image.scaleX`` instead of ``image.scale.x``
- ``image.setInteractive()`` instead of ``image.inputEnabled = true``

Thereafter, I implemented the game AI in the form of `Minimax with AlphaBeta pruning <#game-ai>`_ based on the
C# code by Paul Roberts' book `Artificial Intelligence in Games <https://www.routledge.com/Artificial-Intelligence-in-Games/Roberts/p/book/9781032033228>`_. 

The game now runs "fine" but there are still `some things to be done <#things-still-missing>`_.

Test it live and source code ⭐
-------------------------------
- `codepen.io <https://codepen.io/raul23/full/eYLLJbJ>`_ (**Test it live** with fullscreen)
- `codepen.io <https://codepen.io/raul23/pen/eYLLJbJ>`_ (source code)

`:information_source:`
 
 Obviously, on `codepen.io <https://codepen.io/raul23/full/eYLLJbJ>`_, the whole code is in one file. However, 
 the source code on GitHub will be divided into
 different files (e.g. Game.js, Piece.js) just like the original chess project `ChessJs <https://github.com/Jexan/ChessJs>`_.
 
 I will add the source code divided into multiple files on GitHub later.

Instructions
------------
- **Highlighted moves:** when clicking on one of your game pieces, squares get highlighted on the chessboard to let
  you know which possible moves you can make with the given piece. Click on one of the highlighted square to move the piece.
  
  .. raw:: html

      <div align="center">
       <a href="https://codepen.io/raul23/full/eYLLJbJ" target="_blank">
         <img src="./images/chess_highlighted.png">
       </a>
       <p align="center">Highlighted moves for the black bishop</p>
     </div>
- Each pawn has the possibility to move two squares in front when it is moved for the first time

  .. raw:: html

      <div align="center">
       <a href="https://codepen.io/raul23/full/eYLLJbJ" target="_blank">
         <img src="./images/chess_pawn_two_squares.png">
       </a>
     </div>

Game AI
-------
I ported the game AI implemented as C# (+ Unity) code from Paul Roberts' book 
`Artificial Intelligence in Games <https://www.routledge.com/Artificial-Intelligence-in-Games/Roberts/p/book/9781032033228>`_ to 
JavaScript using the ``phase.js`` 2D game development library.

The game AI consists of the following two elements:

- Minimax with AlphaBeta pruning

  - Search depth (by default is 1)
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
- Playbook with chess openings

Things still missing
--------------------
In order of importance, these are the things missing in this Chess project:

- Game AI stills needs to be fixed for search depths greater than 2: at these search depths, the
  agent doesn't make good decisions for very basic plays
- Add ending code: right now the game doesn't end when you do checkmate

  These are the game states that need to be checked:
  
  - check
  - checkmate
  - stalemate
- Add restart button: right now on `codepen.io <https://codepen.io/raul23/pen/eYLLJbJ>`_, you 
  have to click on Run (if not on fullscreen) or refresh the page
- Test the following moves:

  - Encastling
  - En passant
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

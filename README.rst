========
Chess-AI
========
Exploring AI applied to chess

.. contents:: **Contents**
   :depth: 5
   :local:
   :backlinks: top

JavaScript implementation: upgraded Jexan's ChessJs to Phaser 3 [Work-in-Progress]
==================================================================================
.. raw:: html

   <div align="center">
    <a href="https://codepen.io/raul23/full/xxaWEzy" target="_blank">
      <img src="./images/chess_fullscreen.png">
    </a>
    <p align="center">Work-in-Progress: no game AI implemented yet!</p>
  </div>

Introduction
------------
I started from Jexan's `ChessJs <https://github.com/Jexan/ChessJs>`_ which is 
based on the following two JavaScript libraries:

- `Phaser v2.0.5 <https://github.com/Jexan/ChessJs/blob/master/lib/phaser.min.js>`_
- `Underscore.js 1.6.0 <https://github.com/Jexan/ChessJs/blob/master/lib/underscore-min.js>`_

I tried to run the actual project with these old libraries but couldn't make the game work
as can be seen here: `codepen.io <https://codepen.io/raul23/pen/NWLYZOm>`_

Therefore I decided to use the latest libraries (``phaser@3.55.2`` and ``underscore@1.13.6``) which resulted
in modifying some parts of the code such as these:

- ``add.sprite`` instead of ``add.image``
- ``image.scaleX`` instead of ``image.scale.x``
- ``image.destroy()`` instead of ``image.kill()``
- ``group.clear(true)`` instead of ``group.removeAll()``
- ``image.setInteractive()`` instead of ``image.inputEnabled = true``
- ``image.on('pointerdown', () => {})`` instead of ``image.events.onInputDown.add(() => {})``

The game now runs "fine" but there are still `some things to be done <#things-still-missing>`_ with the most important element missing
being the game AI.

Test it live and source code
----------------------------
- `codepen.io <https://codepen.io/raul23/full/xxaWEzy>`_ (**Test it live** with fullscreen)
- `codepen.io <https://codepen.io/raul23/pen/xxaWEzy>`_ (source code)

`:information_source:`

 I will add the source code on GitHub later

Instructions
------------
- **Highlighted moves:** when clicking on one of your game pieces, squares get highlighted on the chessboard to let
  you know which possible moves you can make with the given piece. Click on one of the highlighted square to move the piece.
  
  .. raw:: html

      <div align="center">
       <a href="https://codepen.io/raul23/full/xxaWEzy" target="_blank">
         <img src="./images/chess_highlighted.png">
       </a>
       <p align="center">Highlighted moves for the black bishop</p>
     </div>
- Each pawn has the possibility to move two squares in front when it is the first time it is moved

  .. raw:: html

      <div align="center">
       <a href="https://codepen.io/raul23/full/xxaWEzy" target="_blank">
         <img src="./images/chess_pawn_two_squares.png">
       </a>
     </div>

Things still missing
--------------------
In order of importance, these are the things missing in this Chess project:

- No game AI yet!
- Add ending code: right now the game doesn't end when you do checkmate
- Add restart button: right now on `codepen.io <https://codepen.io/raul23/pen/xxaWEzy>`_, you 
  have to click on Run (if not on fullscreen) or refresh the page
- Test the following moves:

  - Encastling
  - En passant
- Highlight the clicked piece: when the user click on a piece, it should be highlighted and if they click another piece, then
  the new piece should be the only highlighted
- Add score
- Add an options menu
- Add a timer
- ...

Books
=====
- Sadler, Matthew, and Natasha Regan. `Game Changer: AlphaZero’s Groundbreaking Chess Strategies and the Promise of AI 
  <https://www.amazon.com/Game-Changer-AlphaZeros-Groundbreaking-Strategies/dp/9056918184>`_. New In Chess,Csi, 2019.

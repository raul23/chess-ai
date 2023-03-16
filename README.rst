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
Jexan's `ChessJs <https://github.com/Jexan/ChessJs>`_ is based on the following two libraries:

- `Phaser v2.0.5 <https://github.com/Jexan/ChessJs/blob/master/lib/phaser.min.js>`_
- `Underscore.js 1.6.0 <https://github.com/Jexan/ChessJs/blob/master/lib/underscore-min.js>`_

I tried to run the actual project with these outdated libraries but couldn't make the game work
as can be seen here: `codepen.io <https://codepen.io/raul23/pen/NWLYZOm>`_

Therefore I decided to use the latest libraries (phaser@3.55.2 and underscore@1.13.6) which resulted
in modifying some parts of the code such as these:

- ``add.sprite`` instead of ``add.image``
- ``image.scaleX`` instead of ``image.scale.x``
- ``image.destroy()`` instead of ``image.kill()``
- ``group.clear(true)`` instead of ``group.removeAll()``
- ``image.setInteractive()`` instead of ``image.inputEnabled = true``
- ``image.on('pointerdown', () => {})`` instead of ``image.events.onInputDown.add(() => {})``

Test it live and source code
----------------------------
- `codepen.io <https://codepen.io/raul23/full/xxaWEzy>`_ (fullscreen; **Test it live!**)
- `codepen.io <https://codepen.io/raul23/pen/xxaWEzy>`_ (source code)

`:information_source:`

 I will add the source code on GitHub later

Features [TODO]
---------------

Instructions [TODO]
-------------------

Things still missing
--------------------
In order of importance, these are the things missing in this Chess project:

- Add ending code: right now the game doesn't end when you do checkmate
- Add score
- ...

Books
=====
- Sadler, Matthew, and Natasha Regan. `Game Changer: AlphaZero’s Groundbreaking Chess Strategies and the Promise of AI 
  <https://www.amazon.com/Game-Changer-AlphaZeros-Groundbreaking-Strategies/dp/9056918184>`_. New In Chess,Csi, 2019.

# Wolfensvelte 3D

Yes, it's a Svelte "port" of Wolfenstein 3D.

No, there's no WebGL, or canvas.

Live Site: https://wolfensvelte-3d.vercel.app/

## What? Why? How?

> What do you mean, it's a Svelte port of Wolfenstein 3D?

Well, it's Wolfenstein 3D... but entirely rendered with Svelte! [1]

> _Why?_

A better question would be "why not?"

But, the primary reason this project exists is because of [Svelte Hack 2023](http://hack.sveltesociety.dev/). But also because it seemed very interesting to work on!

> How?

A lot of alcohol, and even more CSS 3D Transforms.

<sup>[1] it's not Wolfenstein 3D, of course. It's not 1:1, but it's familiar enough when you play. Plus, Wolfensvelte is a cool name.

## Overview

Wolfensvelte 3D is a Svelte reimagining of the classic PC game Wolfenstein 3D. The entire game is made up from HTML DOM elements that have CSS 3D transforms applied to render the graphics.

The only tech used can be summed up as: Svelte, HTML, (S)CSS, and TypeScript/JavaScript.

### Features

- Enemies (Guards + Guard Dogs)
- Weapons and ammo system
- Secrets (pushwalls)
- Item pickups
- Full E1M1 map
- Player Health
- Basically, everything you'd expect

### Technical Overview

This game attempts to push Svelte and the DOM to their limits, since _everything_ is done through DOM Elements and CSS. Every "world object" in the game is made from a set of Svelte components: `Door.svelte`, `Elevator.svelte`, `Pushwall.svelte`, `Wall.svelte`, `MapObject.svelte`. These components will manage their state through their props, functions exported from the component instance, or through the `item` object that gets passed to them. Any state changes that will change the map in some way (picking up an item, opening a pushwall or door, etc.) will 'bubble' the change up to the top level `CurrentLevel` store, so that the change can be reflected accordingly from the POV of the level.

The core of the game is of course the game loop, which is found in `src/lib/utils/raf.ts`. Using a single loop globally is the optimum way of doing a `requestAnimationFrame` game loop, since only one frame is requested per render.

The bulk of the code is dedicated to managing game objects, calculations (such as distance, position, converting 'real' positions to 'local' positions), and asset management.

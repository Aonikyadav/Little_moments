# Little Moments — Android Application

Native Android application for **Little Moments (포토부스 / 인생네컷)** designed for mobile phones, foldables, and tablets.

## Overview
This directory contains the complete Android application architecture, UI components, camera pipeline, and studio engine designed to deliver the tactile Korean photobooth & scrapbook experience natively on Android devices.

## Design System & Theme
Preserving the exact Little Moments identity generated and refined in Stitch AI:
- **Palette**: Warm Textured Ivory (`#f8f6f0`), Pressed Cream (`#faf8f2`), Rich Maroon (`#42131b`), Warm Amber (`#f59e0b`), Soft Coral (`#d97762`), Crisp Ink (`#1f1d1a`).
- **Typography**: Epilogue / Playfair Display (Headlines), Plus Jakarta Sans / DM Sans (Body), Space Grotesk / Caveat (Metadata & Handwritten accents).
- **Style**: Tactile Editorial Skeuomorphism with 1.5px ink outlines, 2px mechanical offset shadows, washi tape badges, and paper textures.

## Directory Structure
- `app/`
  - `src/main/`
    - `java/com/littlemoments/app/`
      - `ui/` (Home, Photobooth, Studio, Keepsakes)
      - `camera/` (CameraX, Multi-shot burst, Flash, Timer)
      - `engine/` (Canvas renderer, Filters, Frames, Stickers, QR generator)
      - `data/` (Template registry, Project state, Local database)
      - `theme/` (Color, Type, Shape, Elevation)
    - `res/` (Drawables, Values, Layouts, Fonts)
  - `architecture-plan.md` (Detailed system architecture and Stitch AI design hand-off)

# Little Moments — Android Application

Native Android application for **Little Moments (포토부스 / 인생네컷)**, bringing tactile Korean photobooth strips, 90s Purikura arcade customization, and scrapbook studio editing to mobile phones, foldables, and tablets.

---

## 📱 9-Screen Flow (Hand-Drawn & Blueprint Implementation)

The Android application implements the exact 9-screen flow designed in the hand-drawn blueprints:
1. **Starting Page (Splash Screen)**: Centered tactile `LM✦` brand badge card with pulse loading dots and auto-transition to Home.
2. **Front Page (Home Screen)**: Top bar with `K-Booth` & `Setting` shortcut pills, hero card with app showcase, 2-column featured templates, "Slide up to see Template & Template section" CTA banner, and 5-tab bottom navigation.
3. **Template Catalog**: 2-column grid of all 61+ photobooth strip layouts (1 to 6 cuts) with category filters and search.
4. **Camera Viewfinder**: Live camera feed with countdown timer selectors (`OFF`, `3s`, `5s`), camera switch, image upload, and large tactile arcade shutter button.
5. **Saved Bookmarks**: 2-column keepsake gallery (`grid-cols-2`) for all saved strips and memories.
6. **Setting Screen**: 8 tactile Android toggle switches:
   - Shutter Sound Effects
   - Mirror Front Camera
   - Photobooth Flash
   - Visual Countdown
   - 4K High-Resolution Export
   - Tactile Haptic Feedback
   - Safe Area Print Margins
   - Auto-Save to Bookmarks
7. **K-Booth Keepsakes**: 2-column photobooth strip gallery (인생네컷 / Haru Film / Photoism).
8. **Mobile Studio Screen**:
   - Top action bar (`[✕]` close, `[↩]` undo, `[↪]` redo, `[↓]` save, `[✓]` export).
   - Canvas with slot frames and `+ Tap to add` placeholders.
   - **Floating Quick-Tools Rail** on canvas right edge (`Layers` with layer count badge, `Crop`, `Safe`, `Fit`).
   - **Floating Dark Layers Card** (matching reference image): layer thumbnails with checkered transparency, cyan active outline, eye toggle, lock toggle, ▲/▼ reorder arrows, 0–100% opacity slider, duplicate (`Copy`), `Replace`, `Rotate` 90°, and `Delete`.
   - **Mobile Bottom Tool Dock**: `Grid`, `Templates`, `Adjust`, `Filter`, `Text`, `Background`, `Stickers`.
9. **Bottom Sheet Drawer View**:
   - Interactive bottom sheet sliding smoothly up when any dock tool is tapped.
   - Rounded pill drag handle, tool title indicator, and `[⌵]` chevron dismiss button, maintaining 100% canvas visibility on mobile.

---

## 🛠️ Project Structure

- **`android/`**: Full Android Studio Gradle project.
  - `android/app/src/main/AndroidManifest.xml`: Configured with Camera, Storage, Audio, and Vibration permissions.
  - `android/app/src/main/java/com/littlemoments/app/MainActivity.java`: Native Android activity bridge.
  - `android/app/src/main/assets/public/`: Bundled offline application assets (390+ stickers, 61+ templates, 48 filters).
  - `android/build.gradle` & `android/app/build.gradle`: Android SDK 35 build configuration.
- **`app/`**:
  - `architecture-plan.md`: Comprehensive system blueprint and Stitch AI design system specification.
  - `README.md`: This guide.

---

## 🚀 Building & Running the Android App

### 1. Build and Sync Web Assets
```bash
npm run cap:sync
```

### 2. Open in Android Studio
```bash
npm run android:open
```
Or open the `android/` folder directly in Android Studio and click **Run (Shift + F10)** to launch on a connected Android phone or emulator.

### 3. Generate Installable Debug APK via Terminal
```bash
npm run android:build
```
The output `.apk` file will be generated at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 4. Install APK onto Connected Android Device via ADB
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🎨 Design System Palette

- **Base Paper Canvas**: `#f8f6f0` (Warm textured ivory)
- **Pressed Cardstock**: `#faf8f2` (Cream photo cards and bottom sheets)
- **Primary Ink**: `#1f1d1a` (Crisp carbon line)
- **Arcade Accent**: `#853b43` / `#42131b` (Rich Photobooth maroon)
- **Golden Halo**: `#f59e0b` (Warm Amber countdown timer)
- **Selected Layer Glow**: `#22d3ee` (Cyan outline on active layer)

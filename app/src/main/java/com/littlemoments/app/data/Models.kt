package com.littlemoments.app.data

enum class AppScreen {
    SPLASH,       // Screen 1: Starting Page with LM✦ badge
    HOME,         // Screen 2: Front Page with K-Booth, Setting pills, Hero, 2-col templates, Slide up banner
    TEMPLATES,    // Screen 3: Slide up to see Template & Template section
    CAMERA,       // Screen 4: Viewfinder, countdown timer OFF/3s/5s, arcade shutter
    BOOKMARKS,    // Screen 5: Saved Bookmarks 2-col grid
    SETTINGS,     // Screen 6: 8 tactile Android toggle switches
    KBOOTH,       // Screen 7: Korean photobooth strips
    STUDIO        // Screen 8 & 9: Mobile Studio & Bottom Sheet Drawer
}

data class TemplateItem(
    val id: String,
    val name: String,
    val count: Int,
    val category: String,
    val aspect: Float = 0.5f,
    val description: String = ""
)

data class FilterPreset(
    val id: String,
    val name: String,
    val category: String,
    val description: String = ""
)

data class StickerItem(
    val id: String,
    val name: String,
    val pack: String,
    val symbol: String
)

data class LayerItem(
    val id: String,
    val label: String,
    val kind: String, // "photo", "sticker", "text", "frame"
    val opacity: Float = 1f,
    val isHidden: Boolean = false,
    val isLocked: Boolean = false,
    val previewUrl: String? = null
)

data class BoothSettings(
    val sound: Boolean = true,
    val mirror: Boolean = true,
    val flash: Boolean = false,
    val countdown: Boolean = true,
    val highResExport: Boolean = true,
    val haptic: Boolean = true,
    val safeAreaGuide: Boolean = true,
    val autoSaveBookmarks: Boolean = true
)

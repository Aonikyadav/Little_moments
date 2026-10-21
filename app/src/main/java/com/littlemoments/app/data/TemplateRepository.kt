package com.littlemoments.app.data

object TemplateRepository {
    val templates = listOf(
        TemplateItem("kbooth-classic-noir", "Classic Noir 4-Cut", 4, "K-Booth Strip", 0.5f, "인생네컷 Timeless Black"),
        TemplateItem("kbooth-haru-cloud", "Haru Film Cloud Mist", 4, "K-Booth Strip", 0.5f, "Signature Soft Sky Cyan"),
        TemplateItem("kbooth-photoism-warm", "Photoism Warm Amber", 4, "K-Booth Strip", 0.5f, "Authentic Self-Studio Grain"),
        TemplateItem("kbooth-mono-contrast", "K-Mono Contrast High", 4, "K-Booth Strip", 0.5f, "Dramatic Silver Halide"),
        TemplateItem("purikura-arcade-90s", "Purikura 90s Arcade Deco", 4, "Purikura", 0.5f, "Kanji Stamps & Sparkles"),
        TemplateItem("purikura-y2k-glitter", "Purikura Y2K Glitter", 3, "Purikura", 0.55f, "Tokyo Shibuya Flash"),
        TemplateItem("grid-classic-4cut", "Classic 2x2 Grid", 4, "Grid", 1.0f, "Square Keepsake Card"),
        TemplateItem("grid-6cut-story", "Story 6-Cut Collage", 6, "Grid", 0.67f, "Full Day Memories"),
        TemplateItem("single-portrait", "Single Cut Solo Portrait", 1, "Solo", 0.75f, "Clean Studio Master")
    )

    val filters = listOf(
        FilterPreset("haru-film", "Haru Cloud", "K-Film", "Dreamy Korean pastel highlights"),
        FilterPreset("classic-noir", "Classic Noir", "Monochrome", "Deep silver carbon tones"),
        FilterPreset("photoism-warm", "Photoism", "K-Film", "Warm self-studio portrait grade"),
        FilterPreset("purikura-bright", "Purikura Pink", "Retro", "High key glossy skin glow"),
        FilterPreset("fuji-90s", "90s Disposable", "Vintage", "Authentic color fringing and warm halation")
    )

    val stickers = listOf(
        StickerItem("kanji-kawaii", "かわいい", "Purikura Kanji", "可愛い"),
        StickerItem("kanji-daisuki", "だいすき", "Purikura Kanji", "大好き"),
        StickerItem("hangul-chuu", "하트 뿅", "Korean Deco", "💖"),
        StickerItem("hangul-moment", "인생네컷", "Korean Deco", "📸"),
        StickerItem("sparkle-star", "Sparkle Star", "Y2K", "✦"),
        StickerItem("bow-ribbon", "Pink Ribbon", "Kawaii", "🎀")
    )
}

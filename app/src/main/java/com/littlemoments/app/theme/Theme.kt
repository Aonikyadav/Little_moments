package com.littlemoments.app.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = ArcadeMaroon,
    onPrimary = BaseCanvas,
    primaryContainer = SurfaceRecessed,
    onPrimaryContainer = PrimaryInk,
    secondary = GoldenAmber,
    onSecondary = PrimaryInk,
    background = BaseCanvas,
    onBackground = PrimaryInk,
    surface = SurfaceCard,
    onSurface = PrimaryInk,
    surfaceVariant = SurfaceRecessed,
    onSurfaceVariant = SecondaryInk,
    outline = PrimaryInk
)

@Composable
fun LittleMomentsTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}

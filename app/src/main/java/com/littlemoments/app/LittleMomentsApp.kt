package com.littlemoments.app

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.littlemoments.app.data.AppScreen
import com.littlemoments.app.theme.*
import com.littlemoments.app.ui.bookmarks.BookmarksScreen
import com.littlemoments.app.ui.booth.PhotoboothScreen
import com.littlemoments.app.ui.home.HomeScreen
import com.littlemoments.app.ui.kbooth.KBoothScreen
import com.littlemoments.app.ui.settings.SettingsScreen
import com.littlemoments.app.ui.studio.StudioWorkbenchScreen
import com.littlemoments.app.ui.templates.TemplateCatalogScreen
import kotlinx.coroutines.delay

@Composable
fun LittleMomentsApp() {
    var currentScreen by remember { mutableStateOf(AppScreen.HOME) }
    var showSplash by remember { mutableStateOf(true) }

    // Auto-fade splash screen after 1.5s (Screen 1: Starting Page)
    LaunchedEffect(Unit) {
        delay(1500)
        showSplash = false
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            bottomBar = {
                if (currentScreen != AppScreen.STUDIO && !showSplash) {
                    // 5-Tab Bottom Navigation Bar (Blueprint Screen 2)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(SurfaceCard)
                            .border(1.dp, PrimaryInk.copy(alpha = 0.2f))
                            .navigationBarsPadding()
                            .height(64.dp)
                            .padding(horizontal = 4.dp),
                        horizontalArrangement = Arrangement.SpaceAround,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        NavTabItem("Home", Icons.Default.Home, currentScreen == AppScreen.HOME) { currentScreen = AppScreen.HOME }
                        NavTabItem("Template", Icons.Default.AutoAwesome, currentScreen == AppScreen.TEMPLATES) { currentScreen = AppScreen.TEMPLATES }

                        // Center Elevated Red Arcade Shutter Button
                        Box(
                            modifier = Modifier
                                .offset(y = (-14).dp)
                                .size(54.dp)
                                .background(ArcadeMaroon, CircleShape)
                                .border(2.dp, PrimaryInk, CircleShape)
                                .clickable { currentScreen = AppScreen.CAMERA },
                            contentAlignment = Alignment.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .border(1.5.dp, GoldenAmber, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.CameraAlt, contentDescription = "Camera", tint = BaseCanvas, modifier = Modifier.size(22.dp))
                            }
                        }

                        NavTabItem("Bookmark", Icons.Default.Bookmark, currentScreen == AppScreen.BOOKMARKS) { currentScreen = AppScreen.BOOKMARKS }
                        NavTabItem("Setting", Icons.Default.Settings, currentScreen == AppScreen.SETTINGS) { currentScreen = AppScreen.SETTINGS }
                    }
                }
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                when (currentScreen) {
                    AppScreen.SPLASH -> HomeScreen(onNavigate = { currentScreen = it })
                    AppScreen.HOME -> HomeScreen(onNavigate = { currentScreen = it })
                    AppScreen.TEMPLATES -> TemplateCatalogScreen(onSelectTemplate = { currentScreen = AppScreen.STUDIO })
                    AppScreen.CAMERA -> PhotoboothScreen(onCapture = { currentScreen = AppScreen.STUDIO })
                    AppScreen.BOOKMARKS -> BookmarksScreen(onOpenStrip = { currentScreen = AppScreen.STUDIO })
                    AppScreen.SETTINGS -> SettingsScreen()
                    AppScreen.KBOOTH -> KBoothScreen(onSelectTemplate = { currentScreen = AppScreen.STUDIO })
                    AppScreen.STUDIO -> StudioWorkbenchScreen(onClose = { currentScreen = AppScreen.HOME })
                }
            }
        }

        // Screen 1: Starting Page (Splash Screen Overlay)
        AnimatedVisibility(
            visible = showSplash,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(BaseCanvas)
                    .clickable { showSplash = false },
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(110.dp)
                            .background(SurfaceCard, RoundedCornerShape(28.dp))
                            .border(2.dp, PrimaryInk, RoundedCornerShape(28.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("LM✦", color = ArcadeMaroon, fontSize = 32.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Serif)
                    }
                    Spacer(Modifier.height(16.dp))
                    Text("Little Moments", color = PrimaryInk, fontSize = 22.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Serif)
                    Text("포토부스 · K-PHOTO STUDIO", color = SecondaryInk, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                    Spacer(Modifier.height(16.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Box(modifier = Modifier.size(7.dp).background(GoldenAmber, CircleShape))
                        Box(modifier = Modifier.size(7.dp).background(ArcadeMaroon, CircleShape))
                        Box(modifier = Modifier.size(7.dp).background(PrimaryInk, CircleShape))
                    }
                }
            }
        }
    }
}

@Composable
private fun NavTabItem(
    label: String,
    icon: ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = if (isSelected) ArcadeMaroon else SecondaryInk,
            modifier = Modifier.size(20.dp)
        )
        Text(
            text = label,
            color = if (isSelected) ArcadeMaroon else SecondaryInk,
            fontSize = 10.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
        )
    }
}

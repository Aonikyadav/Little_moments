package com.littlemoments.app.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.littlemoments.app.data.BoothSettings
import com.littlemoments.app.theme.*
import com.littlemoments.app.ui.components.TactilePaperCard

@Composable
fun SettingsScreen(
    modifier: Modifier = Modifier
) {
    var settings by remember { mutableStateOf(BoothSettings()) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(BaseCanvas)
            .padding(14.dp)
    ) {
        Text(
            text = "Settings",
            color = PrimaryInk,
            fontSize = 20.sp,
            fontWeight = FontWeight.ExtraBold,
            fontFamily = FontFamily.Serif,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            item {
                ToggleCard(
                    title = "Shutter Sound Effects",
                    desc = "Authentic Korean kiosk multi-shot beeps & mechanical click",
                    checked = settings.sound,
                    onCheckedChange = { settings = settings.copy(sound = it) }
                )
            }
            item {
                ToggleCard(
                    title = "Mirror Front Camera",
                    desc = "Flip selfie preview horizontally like a physical mirror",
                    checked = settings.mirror,
                    onCheckedChange = { settings = settings.copy(mirror = it) }
                )
            }
            item {
                ToggleCard(
                    title = "Photobooth Flash",
                    desc = "Screen flash illumination during shutter capture",
                    checked = settings.flash,
                    onCheckedChange = { settings = settings.copy(flash = it) }
                )
            }
            item {
                ToggleCard(
                    title = "Visual Countdown",
                    desc = "Show glowing yellow numeric countdown on screen",
                    checked = settings.countdown,
                    onCheckedChange = { settings = settings.copy(countdown = it) }
                )
            }
            item {
                ToggleCard(
                    title = "4K High-Resolution Export",
                    desc = "Render strips at 300 DPI for crisp physical print quality",
                    checked = settings.highResExport,
                    onCheckedChange = { settings = settings.copy(highResExport = it) }
                )
            }
            item {
                ToggleCard(
                    title = "Tactile Haptic Feedback",
                    desc = "Vibrate on shutter click and sticker snapping",
                    checked = settings.haptic,
                    onCheckedChange = { settings = settings.copy(haptic = it) }
                )
            }
            item {
                ToggleCard(
                    title = "Safe Area Print Margins",
                    desc = "Display dotted boundary lines for social safe zones",
                    checked = settings.safeAreaGuide,
                    onCheckedChange = { settings = settings.copy(safeAreaGuide = it) }
                )
            }
            item {
                ToggleCard(
                    title = "Auto-Save to Bookmarks",
                    desc = "Automatically store finished photo strips in your collection",
                    checked = settings.autoSaveBookmarks,
                    onCheckedChange = { settings = settings.copy(autoSaveBookmarks = it) }
                )
            }
        }
    }
}

@Composable
private fun ToggleCard(
    title: String,
    desc: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    TactilePaperCard(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f).padding(end = 12.dp)) {
                Text(title, color = PrimaryInk, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                Spacer(Modifier.height(2.dp))
                Text(desc, color = SecondaryInk, fontSize = 11.sp, lineHeight = 14.sp)
            }
            Switch(
                checked = checked,
                onCheckedChange = onCheckedChange,
                colors = SwitchDefaults.colors(
                    checkedThumbColor = BaseCanvas,
                    checkedTrackColor = ArcadeMaroon,
                    uncheckedThumbColor = SecondaryInk,
                    uncheckedTrackColor = SurfaceRecessed
                )
            )
        }
    }
}

package com.littlemoments.app.ui.booth

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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.littlemoments.app.theme.*
import com.littlemoments.app.ui.components.ArcadeShutterButton

@Composable
fun PhotoboothScreen(
    onCapture: () -> Unit,
    modifier: Modifier = Modifier
) {
    var timerOption by remember { mutableStateOf("3s") }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF141311))
            .padding(14.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Top Toolbar: Switch Camera & Upload buttons (Blueprint Screen 4)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = { /* switch lens */ },
                modifier = Modifier
                    .size(40.dp)
                    .background(Color(0xFF27272A), CircleShape)
            ) {
                Icon(Icons.Default.FlipCameraAndroid, contentDescription = "Switch camera", tint = Color.White)
            }

            // Countdown timer pills (OFF, 3s, 5s)
            Row(
                modifier = Modifier
                    .background(Color(0xFF27272A), CircleShape)
                    .padding(3.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                listOf("OFF", "3s", "5s").forEach { opt ->
                    val isSel = timerOption == opt
                    Box(
                        modifier = Modifier
                            .background(if (isSel) GoldenAmber else Color.Transparent, CircleShape)
                            .clickable { timerOption = opt }
                            .padding(horizontal = 12.dp, vertical = 5.dp)
                    ) {
                        Text(
                            text = opt,
                            color = if (isSel) PrimaryInk else Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }

            IconButton(
                onClick = { /* upload photo */ },
                modifier = Modifier
                    .size(40.dp)
                    .background(Color(0xFF27272A), CircleShape)
            ) {
                Icon(Icons.Default.AddPhotoAlternate, contentDescription = "Upload image", tint = Color.White)
            }
        }

        // Live Viewfinder (Aspect 4:5 with crosshairs)
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .background(Color(0xFF1F1D1A), RoundedCornerShape(20.dp))
                .border(2.dp, Color(0xFF3F3F46), RoundedCornerShape(20.dp)),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.PhotoCamera, contentDescription = null, tint = Color(0xFF71717A), modifier = Modifier.size(54.dp))
                Spacer(Modifier.height(8.dp))
                Text("CAMERA VIEW COUNTER", color = GoldenAmber, fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                Text("🔴 SENSOR READY • 4-CUT BURST", color = Color(0xFFA1A1AA), fontSize = 10.sp, fontFamily = FontFamily.Monospace)
            }
        }

        Spacer(Modifier.height(16.dp))

        // Large Arcade Shutter Button (Blueprint Screen 4)
        ArcadeShutterButton(
            onClick = onCapture,
            sizeDp = 78
        )

        Spacer(Modifier.height(12.dp))
    }
}

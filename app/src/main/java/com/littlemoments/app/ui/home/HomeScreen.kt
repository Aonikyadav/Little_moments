package com.littlemoments.app.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.littlemoments.app.data.AppScreen
import com.littlemoments.app.data.TemplateRepository
import com.littlemoments.app.theme.*
import com.littlemoments.app.ui.components.TactilePaperCard

@Composable
fun HomeScreen(
    onNavigate: (AppScreen) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(BaseCanvas)
            .padding(horizontal = 14.dp)
    ) {
        // Top Bar with K-Booth & Setting shortcut pills (Blueprint Screen 2)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Little Moments ✦",
                color = PrimaryInk,
                fontSize = 18.sp,
                fontWeight = FontWeight.ExtraBold,
                fontFamily = FontFamily.Serif
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                // K-Booth shortcut pill
                Box(
                    modifier = Modifier
                        .background(SurfaceCard, CircleShape)
                        .border(1.5.dp, PrimaryInk, CircleShape)
                        .clickable { onNavigate(AppScreen.KBOOTH) }
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Text("인생네컷", color = ArcadeMaroon, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
                // Setting shortcut pill
                Box(
                    modifier = Modifier
                        .background(SurfaceCard, CircleShape)
                        .border(1.5.dp, PrimaryInk, CircleShape)
                        .clickable { onNavigate(AppScreen.SETTINGS) }
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Text("Setting", color = PrimaryInk, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Hero Showcase Card
        TactilePaperCard(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 6.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.size(8.dp).background(GoldenAmber, CircleShape))
                    Spacer(Modifier.width(6.dp))
                    Text("PHOTOBOOTH STUDIO", color = SecondaryInk, fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                }
                Spacer(Modifier.height(4.dp))
                Text("Create your moments", color = PrimaryInk, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(4.dp))
                Text(
                    "Capture timeless photobooth strips, Purikura doodles, and scrapbook keepsakes with tactile analog warmth.",
                    color = SecondaryInk,
                    fontSize = 12.sp
                )
                Spacer(Modifier.height(10.dp))
                Button(
                    onClick = { onNavigate(AppScreen.CAMERA) },
                    colors = ButtonDefaults.buttonColors(containerColor = ArcadeMaroon),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Take 4-Cut Strip", color = BaseCanvas, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }

        // Slide up to see Template banner (Blueprint Screen 2 CTA)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp)
                .background(GoldenAmber.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                .border(1.5.dp, GoldenAmber, RoundedCornerShape(12.dp))
                .clickable { onNavigate(AppScreen.TEMPLATES) }
                .padding(vertical = 10.dp, horizontal = 12.dp),
            contentAlignment = Alignment.Center
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("✦ Slide up to see Template & Template section", color = PrimaryInk, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.width(6.dp))
                Icon(Icons.Default.KeyboardArrowUp, contentDescription = null, tint = PrimaryInk, modifier = Modifier.size(18.dp))
            }
        }

        // 2-Column Featured Templates (Blueprint Screen 2)
        Text(
            text = "Featured Templates",
            color = PrimaryInk,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(top = 8.dp, bottom = 6.dp)
        )

        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.weight(1f)
        ) {
            items(TemplateRepository.templates.take(4)) { tmpl ->
                TactilePaperCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onNavigate(AppScreen.STUDIO) }
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(90.dp)
                                .background(SurfaceRecessed, RoundedCornerShape(8.dp))
                                .border(1.dp, PrimaryInk.copy(alpha = 0.2f), RoundedCornerShape(8.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("${tmpl.count} CUT", color = ArcadeMaroon, fontWeight = FontWeight.Black, fontSize = 16.sp)
                        }
                        Spacer(Modifier.height(6.dp))
                        Text(tmpl.name, color = PrimaryInk, fontWeight = FontWeight.Bold, fontSize = 12.sp, maxLines = 1)
                        Text(tmpl.category, color = SecondaryInk, fontSize = 10.sp)
                    }
                }
            }
        }
    }
}

package com.littlemoments.app.ui.kbooth

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.littlemoments.app.data.TemplateRepository
import com.littlemoments.app.theme.*
import com.littlemoments.app.ui.components.TactilePaperCard

@Composable
fun KBoothScreen(
    onSelectTemplate: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(BaseCanvas)
            .padding(14.dp)
    ) {
        Column(modifier = Modifier.padding(bottom = 12.dp)) {
            Text(
                text = "인생네컷 · K-Booth",
                color = PrimaryInk,
                fontSize = 20.sp,
                fontWeight = FontWeight.ExtraBold,
                fontFamily = FontFamily.Serif
            )
            Text(
                text = "Authentic Korean Photobooth strips (Haru Film, Photoism, Life Four Cuts)",
                color = SecondaryInk,
                fontSize = 12.sp
            )
        }

        // 2-Column Strip Grid (Blueprint Screen 7)
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            items(TemplateRepository.templates.filter { it.category == "K-Booth Strip" || it.category == "Purikura" }) { strip ->
                TactilePaperCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSelectTemplate(strip.id) }
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(160.dp)
                                .background(SurfaceRecessed, RoundedCornerShape(8.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("✦ ${strip.count}-CUT ✦", color = ArcadeMaroon, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                Text("인생네컷", color = SecondaryInk, fontSize = 11.sp)
                            }
                        }
                        Spacer(Modifier.height(6.dp))
                        Text(strip.name, color = PrimaryInk, fontWeight = FontWeight.Bold, fontSize = 12.sp, maxLines = 1)
                        Text(strip.description, color = SecondaryInk, fontSize = 10.sp, maxLines = 1)
                    }
                }
            }
        }
    }
}

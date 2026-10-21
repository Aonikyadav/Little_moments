package com.littlemoments.app.ui.templates

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material3.Icon
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
fun TemplateCatalogScreen(
    onSelectTemplate: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(BaseCanvas)
            .padding(14.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = GoldenAmber, modifier = Modifier.size(20.dp))
            Spacer(Modifier.width(6.dp))
            Text(
                text = "Template Catalog",
                color = PrimaryInk,
                fontSize = 20.sp,
                fontWeight = FontWeight.ExtraBold,
                fontFamily = FontFamily.Serif
            )
        }

        // 2-Column Catalog Grid (Blueprint Screen 3)
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            items(TemplateRepository.templates) { tmpl ->
                TactilePaperCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSelectTemplate(tmpl.id) }
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(110.dp)
                                .background(SurfaceRecessed, RoundedCornerShape(8.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("${tmpl.count} CUTS", color = ArcadeMaroon, fontWeight = FontWeight.Black, fontSize = 15.sp)
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

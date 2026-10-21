package com.littlemoments.app.ui.studio

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
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
import com.littlemoments.app.data.LayerItem
import com.littlemoments.app.data.TemplateRepository
import com.littlemoments.app.theme.*
import com.littlemoments.app.ui.components.*

@Composable
fun StudioWorkbenchScreen(
    onClose: () -> Unit,
    modifier: Modifier = Modifier
) {
    var isLayersOpen by remember { mutableStateOf(false) }
    var isSafeOn by remember { mutableStateOf(true) }
    var activeDrawerTool by remember { mutableStateOf<String?>(null) }
    var selectedLayerId by remember { mutableStateOf<String?>("slot-1") }

    var layers by remember {
        mutableStateOf(
            listOf(
                LayerItem("slot-1", "Photo Cut 1", "photo"),
                LayerItem("slot-2", "Photo Cut 2", "photo"),
                LayerItem("sticker-1", "Sparkle Deco", "sticker"),
                LayerItem("text-1", "2026.10.21 LM", "text")
            )
        )
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFFEFECE4))
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Top Bar: [✕] [↩] [↪] [↓] [✓] (Blueprint Screen 8)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceCard)
                    .border(1.dp, PrimaryInk.copy(alpha = 0.2f))
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onClose) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = PrimaryInk)
                    }
                    IconButton(onClick = { /* undo */ }) {
                        Icon(Icons.Default.Undo, contentDescription = "Undo", tint = PrimaryInk)
                    }
                    IconButton(onClick = { /* redo */ }) {
                        Icon(Icons.Default.Redo, contentDescription = "Redo", tint = PrimaryInk)
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = { /* save project */ }) {
                        Icon(Icons.Default.FileDownload, contentDescription = "Save", tint = PrimaryInk)
                    }
                    Button(
                        onClick = { /* export */ },
                        colors = ButtonDefaults.buttonColors(containerColor = ArcadeMaroon),
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null, tint = BaseCanvas, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Export", color = BaseCanvas, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Canvas Area with Slot placeholders & Safe Guide
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(12.dp),
                contentAlignment = Alignment.Center
            ) {
                // Photobooth Strip Canvas
                TactilePaperCard(
                    modifier = Modifier
                        .fillMaxHeight(0.92f)
                        .aspectRatio(0.48f)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(8.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        for (i in 1..4) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxWidth()
                                    .background(Color(0xFFE8E4DA), RoundedCornerShape(4.dp))
                                    .border(1.dp, PrimaryInk.copy(alpha = 0.3f), RoundedCornerShape(4.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(Icons.Default.Add, contentDescription = null, tint = SecondaryInk, modifier = Modifier.size(18.dp))
                                    Text("Slot $i", color = SecondaryInk, fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                    Text("+ Tap to add", color = Color(0xFF9E998E), fontSize = 8.5.sp)
                                }
                            }
                        }
                    }
                }

                // Floating Quick-Tools Rail on Canvas Right Edge (Blueprint Screen 8)
                FloatingQuickToolsRail(
                    layerCount = layers.size,
                    isLayersOpen = isLayersOpen,
                    onToggleLayers = { isLayersOpen = !isLayersOpen },
                    onToggleCrop = { /* crop toggle */ },
                    isSafeOn = isSafeOn,
                    onToggleSafe = { isSafeOn = !isSafeOn },
                    onFitCanvas = { /* reset fit */ },
                    modifier = Modifier.align(Alignment.CenterEnd)
                )

                // Floating Layers Card (Reference Image 5 & Blueprint Screen 8)
                if (isLayersOpen) {
                    FloatingLayersCard(
                        layers = layers,
                        selectedId = selectedLayerId,
                        onSelectLayer = { selectedLayerId = it },
                        onClose = { isLayersOpen = false },
                        onDuplicate = {
                            val active = layers.find { it.id == selectedLayerId } ?: return@FloatingLayersCard
                            val newLayer = active.copy(id = "layer-${System.currentTimeMillis()}", label = "${active.label} (Copy)")
                            layers = layers + newLayer
                            selectedLayerId = newLayer.id
                        },
                        onRotate = { /* rotate 90 */ },
                        onDelete = {
                            layers = layers.filterNot { it.id == selectedLayerId }
                            selectedLayerId = layers.lastOrNull()?.id
                        },
                        onOpacityChange = { op ->
                            layers = layers.map { if (it.id == selectedLayerId) it.copy(opacity = op) else it }
                        },
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(end = 56.dp, top = 8.dp)
                    )
                }
            }

            // Mobile Bottom Tool Dock (Blueprint Screen 8: Grid, Templates, Adjust, Filter, Text, Background, Stickers)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceCard)
                    .border(1.5.dp, PrimaryInk)
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                val tools = listOf(
                    Triple("Grid", Icons.Default.GridOn, "Grid"),
                    Triple("Templates", Icons.Default.AutoAwesome, "Templates"),
                    Triple("Adjust", Icons.Default.Tune, "Adjust"),
                    Triple("Filter", Icons.Default.Wand, "Filter"),
                    Triple("Text", Icons.Default.TextFields, "Text"),
                    Triple("Background", Icons.Default.FormatPaint, "Background"),
                    Triple("Stickers", Icons.Default.EmojiEmotions, "Stickers")
                )
                tools.forEach { (name, icon, label) ->
                    val isActive = activeDrawerTool == name
                    Column(
                        modifier = Modifier
                            .clickable {
                                activeDrawerTool = if (activeDrawerTool == name) null else name
                            }
                            .padding(horizontal = 6.dp, vertical = 2.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .background(if (isActive) ArcadeMaroon.copy(alpha = 0.12f) else Color.Transparent, RoundedCornerShape(8.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(icon, contentDescription = label, tint = if (isActive) ArcadeMaroon else SecondaryInk, modifier = Modifier.size(17.dp))
                        }
                        Text(label, color = if (isActive) ArcadeMaroon else SecondaryInk, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Bottom Sheet Drawer View (Blueprint Screen 9)
        BottomDrawerSheet(
            isOpen = activeDrawerTool != null,
            title = activeDrawerTool ?: "",
            onDismiss = { activeDrawerTool = null },
            modifier = Modifier.align(Alignment.BottomCenter)
        ) {
            when (activeDrawerTool) {
                "Filter" -> {
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(vertical = 8.dp)
                    ) {
                        items(TemplateRepository.filters) { flt ->
                            TactilePaperCard(modifier = Modifier.width(90.dp).clickable { activeDrawerTool = null }) {
                                Column(modifier = Modifier.padding(8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                    Box(modifier = Modifier.size(60.dp).background(GoldenAmber.copy(alpha = 0.3f), RoundedCornerShape(6.dp)))
                                    Spacer(Modifier.height(4.dp))
                                    Text(flt.name, fontSize = 10.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                                }
                            }
                        }
                    }
                }
                "Stickers" -> {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(3),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(TemplateRepository.stickers) { stk ->
                            TactilePaperCard(modifier = Modifier.clickable { activeDrawerTool = null }) {
                                Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(stk.symbol, fontSize = 24.sp)
                                    Spacer(Modifier.height(4.dp))
                                    Text(stk.name, fontSize = 10.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                                }
                            }
                        }
                    }
                }
                else -> {
                    Text(
                        text = "Options for ${activeDrawerTool} will appear here.",
                        color = SecondaryInk,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        }
    }
}

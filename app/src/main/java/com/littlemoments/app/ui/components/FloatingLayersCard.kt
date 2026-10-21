package com.littlemoments.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
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
import com.littlemoments.app.data.LayerItem
import com.littlemoments.app.theme.*

@Composable
fun FloatingLayersCard(
    layers: List<LayerItem>,
    selectedId: String?,
    onSelectLayer: (String) -> Unit,
    onClose: () -> Unit,
    onDuplicate: () -> Unit,
    onRotate: () -> Unit,
    onDelete: () -> Unit,
    onOpacityChange: (Float) -> Unit,
    modifier: Modifier = Modifier
) {
    val activeLayer = layers.find { it.id == selectedId }

    Column(
        modifier = modifier
            .width(280.dp)
            .background(DarkPanel, RoundedCornerShape(16.dp))
            .border(1.dp, DarkBorder, RoundedCornerShape(16.dp))
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(DarkCard)
                .padding(horizontal = 12.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Layers, contentDescription = null, tint = SelectedCyan, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text("Layers", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                Spacer(Modifier.width(4.dp))
                Text("(${layers.size})", color = Color(0xFFA1A1AA), fontSize = 11.sp, fontFamily = FontFamily.Monospace)
            }
            IconButton(onClick = onClose, modifier = Modifier.size(24.dp)) {
                Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White, modifier = Modifier.size(14.dp))
            }
        }

        // Layer List
        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(max = 200.dp)
                .padding(8.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            itemsIndexed(layers.reversed()) { _, layer ->
                val isSelected = layer.id == selectedId
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            if (isSelected) SelectedCyan.copy(alpha = 0.12f) else DarkCard,
                            RoundedCornerShape(8.dp)
                        )
                        .border(
                            1.5.dp,
                            if (isSelected) SelectedCyan else Color.Transparent,
                            RoundedCornerShape(8.dp)
                        )
                        .clickable { onSelectLayer(layer.id) }
                        .padding(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .background(Color(0xFF3F3F46), RoundedCornerShape(4.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(layer.kind.take(1).uppercase(), color = SelectedCyan, fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.width(8.dp))
                    Column(Modifier.weight(1f)) {
                        Text(layer.label, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Medium, maxLines = 1)
                        Text(layer.kind.uppercase(), color = Color(0xFFA1A1AA), fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                    }
                }
            }
        }

        // Opacity Slider
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF202023))
                .padding(horizontal = 12.dp, vertical = 6.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Opacity", color = Color(0xFFD4D4D8), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                Text(
                    "${((activeLayer?.opacity ?: 1f) * 100).toInt()}%",
                    color = SelectedCyan,
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold
                )
            }
            Slider(
                value = activeLayer?.opacity ?: 1f,
                onValueChange = onOpacityChange,
                colors = SliderDefaults.colors(
                    thumbColor = SelectedCyan,
                    activeTrackColor = SelectedCyan,
                    inactiveTrackColor = Color(0xFF3F3F46)
                ),
                modifier = Modifier.height(24.dp)
            )
        }

        // Action Buttons Row (Copy, Replace, Rotate, Delete)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(DarkPanel)
                .padding(horizontal = 6.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            LayerActionButton("Copy", Icons.Default.ContentCopy, onClick = onDuplicate)
            LayerActionButton("Rotate", Icons.Default.RotateRight, onClick = onRotate)
            LayerActionButton("Delete", Icons.Default.Delete, isDestructive = true, onClick = onDelete)
        }
    }
}

@Composable
private fun LayerActionButton(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isDestructive: Boolean = false,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = if (isDestructive) Color(0xFFFB7185) else Color(0xFFD4D4D8),
            modifier = Modifier.size(15.dp)
        )
        Text(
            text = label,
            color = if (isDestructive) Color(0xFFFB7185) else Color(0xFFD4D4D8),
            fontSize = 9.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}

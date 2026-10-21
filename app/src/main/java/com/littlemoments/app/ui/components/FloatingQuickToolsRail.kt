package com.littlemoments.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Crop
import androidx.compose.material.icons.filled.FitScreen
import androidx.compose.material.icons.filled.GridOn
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.littlemoments.app.theme.*

@Composable
fun FloatingQuickToolsRail(
    layerCount: Int,
    isLayersOpen: Boolean,
    onToggleLayers: () -> Unit,
    onToggleCrop: () -> Unit,
    isSafeOn: Boolean,
    onToggleSafe: () -> Unit,
    onFitCanvas: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .background(Color(0xE01F1D1A), RoundedCornerShape(20.dp))
            .border(1.dp, Color(0x33FFFFFF), RoundedCornerShape(20.dp))
            .padding(horizontal = 6.dp, vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        FloatingToolItem(
            icon = Icons.Default.Layers,
            label = "Layers",
            badge = "$layerCount",
            isActive = isLayersOpen,
            onClick = onToggleLayers
        )
        FloatingToolItem(
            icon = Icons.Default.Crop,
            label = "Crop",
            onClick = onToggleCrop
        )
        FloatingToolItem(
            icon = Icons.Default.GridOn,
            label = "Safe",
            isActive = isSafeOn,
            onClick = onToggleSafe
        )
        FloatingToolItem(
            icon = Icons.Default.FitScreen,
            label = "Fit",
            onClick = onFitCanvas
        )
    }
}

@Composable
private fun FloatingToolItem(
    icon: ImageVector,
    label: String,
    badge: String? = null,
    isActive: Boolean = false,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(44.dp)
            .background(if (isActive) ArcadeMaroon else Color.Transparent, RoundedCornerShape(12.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = Color.White,
                modifier = Modifier.size(17.dp)
            )
            Text(
                text = label,
                color = Color.White,
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold
            )
        }
        if (badge != null) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .offset(x = 2.dp, y = (-2).dp)
                    .size(15.dp)
                    .background(SelectedCyan, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = badge,
                    color = Color.Black,
                    fontSize = 8.5.sp,
                    fontWeight = FontWeight.Black
                )
            }
        }
    }
}

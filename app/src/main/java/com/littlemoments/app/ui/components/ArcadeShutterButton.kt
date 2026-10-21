package com.littlemoments.app.ui.components

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material3.Icon
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.littlemoments.app.theme.ArcadeMaroon
import com.littlemoments.app.theme.BaseCanvas
import com.littlemoments.app.theme.GoldenAmber
import com.littlemoments.app.theme.PrimaryInk

@Composable
fun ArcadeShutterButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    sizeDp: Int = 74
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val elevationOffset by animateDpAsState(if (isPressed) 1.dp else 4.dp, label = "pressAnim")

    Box(
        modifier = modifier
            .size(sizeDp.dp)
            .drawBehind {
                drawCircle(
                    color = PrimaryInk,
                    radius = (sizeDp.dp.toPx() / 2f),
                    center = Offset(size.width / 2f, (size.height / 2f) + elevationOffset.toPx())
                )
            }
            .offset(y = if (isPressed) 2.dp else 0.dp)
            .background(ArcadeMaroon, CircleShape)
            .border(2.5.dp, PrimaryInk, CircleShape)
            .clickable(interactionSource = interactionSource, indication = null, onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        // Inner concentric golden ring
        Box(
            modifier = Modifier
                .size((sizeDp - 14).dp)
                .border(2.dp, GoldenAmber, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.CameraAlt,
                contentDescription = "Capture Shot",
                tint = BaseCanvas,
                modifier = Modifier.size(24.dp)
            )
        }
    }
}

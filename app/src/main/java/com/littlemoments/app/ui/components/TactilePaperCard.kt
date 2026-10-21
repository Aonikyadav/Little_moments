package com.littlemoments.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.littlemoments.app.theme.PrimaryInk
import com.littlemoments.app.theme.SurfaceCard

@Composable
fun TactilePaperCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 14.dp,
    borderWidth: Dp = 1.5.dp,
    shadowOffset: Dp = 2.dp,
    backgroundColor: Color = SurfaceCard,
    content: @Composable BoxScope.() -> Unit
) {
    Box(
        modifier = modifier
            .drawBehind {
                // Mechanical tactile offset shadow
                drawRoundRect(
                    color = PrimaryInk.copy(alpha = 0.15f),
                    topLeft = Offset(shadowOffset.toPx(), shadowOffset.toPx()),
                    size = size,
                    cornerRadius = androidx.compose.ui.geometry.CornerRadius(cornerRadius.toPx())
                )
            }
            .background(backgroundColor, RoundedCornerShape(cornerRadius))
            .border(borderWidth, PrimaryInk, RoundedCornerShape(cornerRadius))
    ) {
        content()
    }
}

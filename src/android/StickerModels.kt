package com.littlemoments.studio.model

import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import kotlinx.serialization.Serializable
import kotlin.math.roundToInt

/**
 * Little Moments - Sticker Pack Specification
 * Compatible with React Studio Editor & Scrapbook Album models.
 */
@Serializable
data class StickerPack(
    val id: String,
    val slug: String,
    val title: String,
    val description: String,
    val count: Int,
    val coverSrc: String
)

/**
 * Individual PNG Sticker Item metadata
 */
@Serializable
data class PngSticker(
    val id: String,
    val name: String,
    val pack: String,
    val packSlug: String,
    val src: String,
    val width: Int,
    val height: Int,
    val aspectRatio: Float,
    val tags: List<String>
)

/**
 * Placed Sticker in Scrapbook Page Customization
 */
@Serializable
data class PlacedStickerItem(
    val id: String,
    val stickerId: String,
    val src: String,
    val name: String,
    val pack: String,
    val x: Float, // Percentage 0-100
    val y: Float, // Percentage 0-100
    val rotation: Float, // Degrees -180 to 180
    val scale: Float // 0.3 to 3.0
)

/**
 * Sticker Layer in Studio Composition
 */
@Serializable
data class StickerLayer(
    val id: String,
    val assetId: String,
    val name: String,
    val src: String? = null,
    val x: Float,
    val y: Float,
    val scale: Float = 1.0f,
    val rotation: Float = 0.0f,
    val opacity: Float = 1.0f,
    val locked: Boolean = false
)

/**
 * Jetpack Compose Composable for rendering and manipulating a sticker layer with
 * translation, free 360-degree rotation, and pinch-to-scale.
 */
@Composable
fun StickerLayerComposable(
    sticker: PlacedStickerItem,
    modifier: Modifier = Modifier,
    onTransformChange: (x: Float, y: Float, rotation: Float, scale: Float) -> Unit = { _, _, _, _ -> },
    onDelete: (id: String) -> Unit = {},
    onDuplicate: (id: String) -> Unit = {}
) {
    var offsetX by remember { mutableFloatStateOf(sticker.x) }
    var offsetY by remember { mutableFloatStateOf(sticker.y) }
    var rotation by remember { mutableFloatStateOf(sticker.rotation) }
    var scale by remember { mutableFloatStateOf(sticker.scale) }

    Box(
        modifier = modifier
            .offset { IntOffset(offsetX.roundToInt(), offsetY.roundToInt()) }
            .graphicsLayer(
                scaleX = scale,
                scaleY = scale,
                rotationZ = rotation
            )
            .pointerInput(sticker.id) {
                detectTransformGestures { _, pan, zoom, rot ->
                    offsetX += pan.x
                    offsetY += pan.y
                    scale = (scale * zoom).coerceIn(0.3f, 3.0f)
                    rotation = (rotation + rot) % 360f
                    onTransformChange(offsetX, offsetY, rotation, scale)
                }
            }
    ) {
        AsyncImage(
            model = sticker.src,
            contentDescription = sticker.name,
            contentScale = ContentScale.Fit,
            modifier = Modifier.size(90.dp)
        )
    }
}

Add-Type -AssemblyName System.Drawing

function Create-RoundedRectanglePath($rect, $radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
    $path.AddArc($rect.X + $rect.Width - $d, $rect.Y, $d, $d, 270, 90)
    $path.AddArc($rect.X + $rect.Width - $d, $rect.Y + $rect.Height - $d, $d, $d, 0, 90)
    $path.AddArc($rect.X, $rect.Y + $rect.Height - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

function Generate-LM-Icon($size, $outputPath) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # 1. Dark Rounded Card Background (#141418)
    $radius = [int]($size * 0.22)
    $margin = [int]($size * 0.04)
    $rect = New-Object System.Drawing.Rectangle $margin, $margin, ($size - 2 * $margin), ($size - 2 * $margin)
    $path = Create-RoundedRectanglePath $rect $radius
    
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 20, 20, 24))
    $g.FillPath($bgBrush, $path)

    # Outer border
    $borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 45, 45, 52)), ([Math]::Max(1.0, $size * 0.015))
    $g.DrawPath($borderPen, $path)

    # 2. Draw Calligraphic "LM"
    $scale = $size / 512.0
    $penWhite = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 255, 255, 255)), (22.0 * $scale)
    $penWhite.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penWhite.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penWhite.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    # Cyan shadow pen
    $penCyan = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(180, 56, 189, 248)), (26.0 * $scale)
    $penCyan.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penCyan.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penCyan.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    # Gold shadow pen
    $penGold = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(180, 254, 240, 138)), (26.0 * $scale)
    $penGold.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penGold.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penGold.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    $L_points = @(
        New-Object System.Drawing.PointF ((145 * $scale), (180 * $scale)),
        New-Object System.Drawing.PointF ((175 * $scale), (140 * $scale)),
        New-Object System.Drawing.PointF ((165 * $scale), (230 * $scale)),
        New-Object System.Drawing.PointF ((135 * $scale), (340 * $scale)),
        New-Object System.Drawing.PointF ((128 * $scale), (378 * $scale)),
        New-Object System.Drawing.PointF ((150 * $scale), (375 * $scale)),
        New-Object System.Drawing.PointF ((205 * $scale), (345 * $scale))
    )

    $M_points = @(
        New-Object System.Drawing.PointF ((205 * $scale), (260 * $scale)),
        New-Object System.Drawing.PointF ((235 * $scale), (235 * $scale)),
        New-Object System.Drawing.PointF ((245 * $scale), (348 * $scale)),
        New-Object System.Drawing.PointF ((285 * $scale), (238 * $scale)),
        New-Object System.Drawing.PointF ((295 * $scale), (348 * $scale)),
        New-Object System.Drawing.PointF ((340 * $scale), (242 * $scale)),
        New-Object System.Drawing.PointF ((345 * $scale), (350 * $scale)),
        New-Object System.Drawing.PointF ((370 * $scale), (345 * $scale))
    )

    # Offset Cyan
    $g.TranslateTransform(-2.5 * $scale, 0)
    $g.DrawCurve($penCyan, $L_points, 0.5)
    $g.DrawCurve($penCyan, $M_points, 0.5)
    $g.ResetTransform()

    # Offset Gold
    $g.TranslateTransform(2.5 * $scale, 0)
    $g.DrawCurve($penGold, $L_points, 0.5)
    $g.DrawCurve($penGold, $M_points, 0.5)
    $g.ResetTransform()

    # White core
    $g.DrawCurve($penWhite, $L_points, 0.5)
    $g.DrawCurve($penWhite, $M_points, 0.5)

    # 3. 4-point glowing sparkle star (✦)
    $cx = 395.0 * $scale
    $cy = 256.0 * $scale
    $starR = 72.0 * $scale
    $innerR = 14.0 * $scale

    $starPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    # 4 tips
    $starPath.AddBezier($cx, ($cy - $starR), ($cx + $innerR), ($cy - $innerR), ($cx + $innerR), ($cy - $innerR), ($cx + $starR), $cy)
    $starPath.AddBezier(($cx + $starR), $cy, ($cx + $innerR), ($cy + $innerR), ($cx + $innerR), ($cy + $innerR), $cx, ($cy + $starR))
    $starPath.AddBezier($cx, ($cy + $starR), ($cx - $innerR), ($cy + $innerR), ($cx - $innerR), ($cy + $innerR), ($cx - $starR), $cy)
    $starPath.AddBezier(($cx - $starR), $cy, ($cx - $innerR), ($cy - $innerR), ($cx - $innerR), ($cy - $innerR), $cx, ($cy - $starR))
    $starPath.CloseFigure()

    $starBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $g.FillPath($starBrush, $starPath)

    $starPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(200, 254, 240, 138)), (2.5 * $scale)
    $g.DrawPath($starPen, $starPath)

    # Ensure parent directory exists
    $dir = [System.IO.Path]::GetDirectoryName($outputPath)
    if (-not [System.IO.Directory]::Exists($dir)) {
        [System.IO.Directory]::CreateDirectory($dir) | Out-Null
    }

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $outputPath ($size x $size)"
}

# Generate Android Mipmap icons
Generate-LM-Icon 48  "android\app\src\main\res\mipmap-mdpi\ic_launcher.png"
Generate-LM-Icon 48  "android\app\src\main\res\mipmap-mdpi\ic_launcher_round.png"
Generate-LM-Icon 72  "android\app\src\main\res\mipmap-hdpi\ic_launcher.png"
Generate-LM-Icon 72  "android\app\src\main\res\mipmap-hdpi\ic_launcher_round.png"
Generate-LM-Icon 96  "android\app\src\main\res\mipmap-xhdpi\ic_launcher.png"
Generate-LM-Icon 96  "android\app\src\main\res\mipmap-xhdpi\ic_launcher_round.png"
Generate-LM-Icon 144 "android\app\src\main\res\mipmap-xxhdpi\ic_launcher.png"
Generate-LM-Icon 144 "android\app\src\main\res\mipmap-xxhdpi\ic_launcher_round.png"
Generate-LM-Icon 192 "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png"
Generate-LM-Icon 192 "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher_round.png"

# Generate Splash & High-Res Public Icons
Generate-LM-Icon 512 "public\icon.png"
Generate-LM-Icon 512 "public\lm-logo.png"
Generate-LM-Icon 512 "android\app\src\main\res\drawable\splash.png"
Generate-LM-Icon 512 "android\app\src\main\res\drawable-port-xxxhdpi\splash.png"
Generate-LM-Icon 512 "android\app\src\main\res\drawable-land-xxxhdpi\splash.png"

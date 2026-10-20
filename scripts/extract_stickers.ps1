Add-Type -AssemblyName System.IO.Compression.FileSystem

$packs = @(
    @{
        Zip = "src/assets/stickers/little_moments_anime_ninja_stickers.zip"
        Slug = "anime-ninja"
        Title = "Anime Ninja"
        Description = "Stealthy shinobi, chibi ninjas, red clouds, and martial action emblems"
    },
    @{
        Zip = "src/assets/stickers/little_moments_coffee_scrapbook_stickers.zip"
        Slug = "coffee-scrapbook"
        Title = "Coffee & Scrapbook"
        Description = "Warm latte art, cafe typography, bows, baby breath bouquets, and vintage cameras"
    },
    @{
        Zip = "src/assets/stickers/little_moments_maroon_romance_stickers.zip"
        Slug = "maroon-romance"
        Title = "Maroon Romance"
        Description = "Deep rose bouquets, maroon velvet bows, heart locks, teacups, and floral lace"
    },
    @{
        Zip = "src/assets/stickers/little_moments_midnight_bloom_stickers.zip"
        Slug = "midnight-bloom"
        Title = "Midnight Bloom"
        Description = "Crescent moons, purple floral clusters, gothic lace, starry quotes, and black cats"
    },
    @{
        Zip = "src/assets/stickers/little_moments_midnight_bloom_vol2.zip"
        Slug = "midnight-bloom-vol2"
        Title = "Midnight Bloom Vol. 2"
        Description = "Moon mirrors, black candles, ornate charms, dark vintage books, and dark romance notes"
    },
    @{
        Zip = "src/assets/stickers/little_moments_spider_hero_stickers.zip"
        Slug = "spider-hero"
        Title = "Spider Hero"
        Description = "Webs, spider emblems, comic panels, webbed hero poses, and comic book action elements"
    }
)

$allStickers = @()
$pngSignature = [byte[]]@(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)

foreach ($pack in $packs) {
    $zipPath = $pack.Zip
    if (-not (Test-Path $zipPath)) {
        Write-Warning "Archive not found: $zipPath"
        continue
    }

    $srcTargetDir = "src/assets/stickers/$($pack.Slug)"
    $pubTargetDir = "public/stickers/$($pack.Slug)"
    New-Item -ItemType Directory -Force -Path $srcTargetDir | Out-Null
    New-Item -ItemType Directory -Force -Path $pubTargetDir | Out-Null

    $zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $zipPath).Path)
    Write-Host "Extracting and validating $($pack.Title) ($($zip.Entries.Count) items)..."

    $index = 1
    foreach ($entry in $zip.Entries) {
        # Only process PNG files
        if (-not $entry.Name.EndsWith(".png", [System.StringComparison]::OrdinalIgnoreCase)) {
            continue
        }

        # Guard against directory traversal
        $safeFileName = [System.IO.Path]::GetFileName($entry.Name)
        if ([string]::IsNullOrWhiteSpace($safeFileName) -or $safeFileName.Contains("..")) {
            Write-Warning "Skipping suspicious entry: $($entry.FullName)"
            continue
        }

        # Read into memory
        $stream = $entry.Open()
        $ms = New-Object System.IO.MemoryStream
        $stream.CopyTo($ms)
        $stream.Dispose()
        $bytes = $ms.ToArray()
        $ms.Dispose()

        # Validate PNG signature (magic bytes)
        if ($bytes.Length -lt 24) {
            Write-Warning "File too small for valid PNG: $safeFileName"
            continue
        }
        $validSig = $true
        for ($i = 0; $i -lt 8; $i++) {
            if ($bytes[$i] -ne $pngSignature[$i]) {
                $validSig = $false
                break
            }
        }
        if (-not $validSig) {
            Write-Warning "Invalid PNG signature in $safeFileName"
            continue
        }

        # Parse IHDR chunk
        $width = ($bytes[16] -shl 24) -bor ($bytes[17] -shl 16) -bor ($bytes[18] -shl 8) -bor $bytes[19]
        $height = ($bytes[20] -shl 24) -bor ($bytes[21] -shl 16) -bor ($bytes[22] -shl 8) -bor $bytes[23]
        $bitDepth = $bytes[24]
        $colorType = $bytes[25] # 4 = Greyscale+Alpha, 6 = Truecolour+Alpha, 3 = Indexed

        # Determine clean readable name
        $baseName = [System.IO.Path]::GetFileNameWithoutExtension($safeFileName)
        # Strip leading numbers e.g. "01_cloaked_ninja" -> "cloaked ninja"
        $cleanedName = ($baseName -replace '^\d+[_\-\s]*', '') -replace '[_\-]+', ' '
        # Title case
        $humanName = (Get-Culture).TextInfo.ToTitleCase($cleanedName)

        # Write to src/assets/stickers/<slug>/<file>
        $srcPath = Join-Path $srcTargetDir $safeFileName
        [System.IO.File]::WriteAllBytes($srcPath, $bytes)

        # Write to public/stickers/<slug>/<file>
        $pubPath = Join-Path $pubTargetDir $safeFileName
        [System.IO.File]::WriteAllBytes($pubPath, $bytes)

        $stickerId = "png-$($pack.Slug)-$('{0:D2}' -f $index)"
        $publicSrc = "/stickers/$($pack.Slug)/$safeFileName"

        $allStickers += @{
            id = $stickerId
            name = $humanName
            pack = $pack.Title
            packSlug = $pack.Slug
            src = $publicSrc
            fileName = $safeFileName
            width = $width
            height = $height
            aspectRatio = [Math]::Round($width / [Math]::Max(1, $height), 3)
            sizeBytes = $bytes.Length
            hasAlpha = ($colorType -eq 4 -or $colorType -eq 6 -or $colorType -eq 3)
        }

        $index++
    }

    $zip.Dispose()
}

Write-Host "Extracted and validated $($allStickers.Count) stickers in total across 6 packs!"
$allStickers | Select-Object id, pack, name, width, height, sizeBytes | Select-Object -First 10 | Format-Table -AutoSize

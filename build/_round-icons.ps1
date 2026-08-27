Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$srcBytes = [System.IO.File]::ReadAllBytes((Join-Path $root '..\public\favicon.png'))
$srcMs = New-Object System.IO.MemoryStream(,$srcBytes)
$src = New-Object System.Drawing.Bitmap($srcMs)

function New-Rounded([int]$size, [int]$radius) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $bmp.SetResolution(96.0, 96.0)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $d = $radius * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc(0, 0, $d, $d, 180, 90)
  $path.AddArc($size - $d, 0, $d, $d, 270, 90)
  $path.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
  $path.AddArc(0, $size - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $g.SetClip($path)
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.FillRectangle([System.Drawing.Brushes]::White, 0, 0, $size, $size)
  $g.DrawImage($script:src, 0, 0, $size, $size)
  $g.Dispose()
  $path.Dispose()
  return $bmp
}

$outMain = Join-Path $root '..\public\favicon.png'
$m = New-Rounded 512 96
$m.Save($outMain, [System.Drawing.Imaging.ImageFormat]::Png)
$m.Dispose()
Write-Host "favicon.png -> 512px, radius 96px"

$f32 = New-Rounded 32 6
$f32.Save((Join-Path $root '..\public\favicon-32.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$f32.Dispose()
Write-Host "favicon-32.png -> 32px, radius 6px"

foreach ($s in @(16, 32, 48, 256)) {
  $r = [Math]::Max(1, [int][Math]::Round($s * 96 / 512))
  $b = New-Rounded $s $r
  $b.Save((Join-Path $root "_t$s.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $b.Dispose()
  Write-Host "temp _t$s.png ($r px radius)"
}
$src.Dispose()
Write-Host 'DONE'

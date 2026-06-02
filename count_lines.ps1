$ErrorActionPreference = 'Stop'
$root = 'C:\finaldoprojeto'
$files = Get-ChildItem -Recurse -File -Path $root | Where-Object { $_.FullName -notmatch '\\__pycache__\\' }
$out = foreach($f in $files){
  $content = Get-Content -LiteralPath $f.FullName -Raw
  $lines = ($content -split "`r?`n", -1).Count
  [pscustomobject]@{ File = $f.FullName; Lines = $lines }
}
$total = ($out | Measure-Object -Property Lines -Sum).Sum
$total
$out | Sort-Object Lines -Descending | Select-Object -First 15 | Format-Table -AutoSize


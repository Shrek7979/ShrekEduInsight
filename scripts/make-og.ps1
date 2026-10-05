# 링크 미리보기 이미지 만들기: design/og.html 을 크롬으로 1200×630 그대로 찍어 public/og.jpg 로 저장
# 실행: powershell -File scripts/make-og.ps1
$root = Split-Path $PSScriptRoot -Parent
$chrome = @(
  "C:\Program Files\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
$png = Join-Path $root 'design\og.png'
$html = 'file:///' + ((Join-Path $root 'design\og.html') -replace '\\', '/')
# 글꼴을 내려받을 시간을 줌 (virtual-time-budget)
& $chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=8000 "--screenshot=$png" $html | Out-Null
python -c "from PIL import Image; Image.open(r'$png').convert('RGB').save(r'$root\public\og.jpg', quality=90, optimize=True)"
Write-Output "public/og.jpg 저장"

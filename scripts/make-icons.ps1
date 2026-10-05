# 앱 아이콘 만들기: design/icon.html 을 크롬으로 찍어 public/icon-*.png, favicon.ico, design/shrek-edu-stem.ico 저장
# 실행: powershell -File scripts/make-icons.ps1
$root = Split-Path $PSScriptRoot -Parent
$chrome = @(
  "C:\Program Files\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
$page = 'file:///' + ((Join-Path $root 'design\icon.html').Replace([string][char]92, '/'))
# 세 가지 모양: 둥근 모서리(바탕화면·PC), 꽉 찬 사각형(휴대폰 홈 화면), 단순한 모양(브라우저 탭)
foreach ($v in @('round', 'square', 'simple')) {
  $out = Join-Path $root "design\icon-$v.png"
  & $chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=512,512 --default-background-color=00000000 "--screenshot=$out" "$page#$v" 2>$null | Out-Null
}
python (Join-Path $PSScriptRoot 'icons.py') $root

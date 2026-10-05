# make-icons.ps1 이 찍은 그림으로 아이콘 파일들을 만듦
import os
import sys
from PIL import Image

root = sys.argv[1]
design = os.path.join(root, 'design')
public = os.path.join(root, 'public')
round_ = Image.open(os.path.join(design, 'icon-round.png')).convert('RGBA')
square = Image.open(os.path.join(design, 'icon-square.png')).convert('RGBA')
simple = Image.open(os.path.join(design, 'icon-simple.png')).convert('RGBA')

# 휴대폰 홈 화면·앱: 꽉 찬 사각형 (모서리는 휴대폰이 자름)
square.save(os.path.join(public, 'icon-512.png'), optimize=True)
square.resize((180, 180), Image.LANCZOS).save(os.path.join(public, 'icon-180.png'), optimize=True)
# 브라우저 탭: 작을수록 단순한 모양
simple.resize((256, 256), Image.LANCZOS).save(os.path.join(public, 'favicon.ico'), sizes=[(48, 48), (32, 32), (16, 16)])
# 바탕화면 바로가기: 크게는 자세한 모양, 작게는 단순한 모양
big = round_.resize((256, 256), Image.LANCZOS)
small = [simple.resize((s, s), Image.LANCZOS) for s in (48, 32, 16)]
big.save(os.path.join(design, 'shrek-edu-stem.ico'), sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)], append_images=small)
print('아이콘 저장 완료')

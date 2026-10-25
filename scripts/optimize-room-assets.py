"""Small delivery copies; preserve original art, dimensions and transparent silhouettes."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'public/assets/home'
before = after = 0
for source in root.glob('*.png'):
    image = Image.open(source).convert('RGBA')
    target = source.with_suffix('.webp')
    image.save(target, 'WEBP', quality=82, method=6)
    decoded = Image.open(target).convert('RGBA')
    assert decoded.size == image.size
    assert decoded.getchannel('A').tobytes() == image.getchannel('A').tobytes()
    before += source.stat().st_size
    after += target.stat().st_size
print(f'Room: {before:,} -> {after:,} bytes; dimensions and alpha preserved')

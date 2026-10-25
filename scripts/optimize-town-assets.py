"""Delivery copies: preserve original dimensions, alpha and scene transforms."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'public' / 'assets' / 'town'
before = after = 0
for source in root.glob('*.png'):
    target = source.with_suffix('.webp')
    original = Image.open(source).convert('RGBA')
    atlas = original.width <= 192
    original.save(target, 'WEBP', lossless=atlas, exact=True, quality=82, method=6)
    decoded = Image.open(target).convert('RGBA')
    assert decoded.size == original.size
    assert decoded.getchannel('A').tobytes() == original.getchannel('A').tobytes()
    if atlas:
        assert decoded.tobytes() == original.tobytes()
    before += source.stat().st_size
    after += target.stat().st_size
print(f'Town: {before:,} -> {after:,} bytes; dimensions/alpha identical, tile atlases lossless')

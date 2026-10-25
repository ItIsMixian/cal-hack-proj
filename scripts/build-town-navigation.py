"""Derive a conservative walk mask from authored terrain paths and solid artwork alpha.
Reads original art only; emits data, never modifies art. Re-run after scene/art changes.
"""
import json
from collections import deque
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw

root = Path(__file__).resolve().parents[1]
assets = root / 'public/assets/town'
scene = json.loads((assets / 'scene.json').read_text())
size = (960, 672)
terrain = Image.new('RGBA', size)
obstacles = Image.new('L', size)
for node in scene['nodes']:
    if node['type'] == 'sprite':
        if node['name'].startswith('Cloud'):
            continue
        image = Image.open(assets / node['texture']).convert('RGBA')
        sx, sy = node['scale']
        assert node['rotation'] == 0 and node['skew'] == 0
        image = image.resize((round(image.width * sx), round(image.height * sy)), Image.Resampling.NEAREST)
        x = round(440 + node['position'][0] - image.width / 2)
        y = round(310 + node['position'][1] - image.height / 2)
        if node['name'] in ('floor', 'Park'):
            terrain.alpha_composite(image, (x, y))
            if node['name'] == 'Park':
                # Trees/benches are baked into this illustration, not separate Godot
                # nodes. Conservative source-space masks keep feet clear of them.
                original = Image.open(assets / node['texture'])
                for box in [(375, 0, 735, 270), (30, 250, 350, 535), (1100, 570, 1448, 955),
                            (865, 205, 1045, 300), (445, 830, 630, 915), (1115, 680, 1240, 830)]:
                    scaled = tuple(round(v * (sx if i % 2 == 0 else sy)) for i, v in enumerate(box))
                    ImageDraw.Draw(obstacles).rectangle((x + scaled[0], y + scaled[1], x + scaled[2], y + scaled[3]), fill=255)
        else:
            alpha = image.getchannel('A').point(lambda a: 255 if a >= 128 else 0)
            obstacles.paste(255, (x, y, x + image.width, y + image.height), alpha)
    else:
        for cell in node['cells']:
            tile = Image.open(assets / cell['texture']).convert('RGBA').crop((cell['ax'] * 16, cell['ay'] * 16, cell['ax'] * 16 + 16, cell['ay'] * 16 + 16))
            alpha = tile.getchannel('A').point(lambda a: 255 if a >= 128 else 0)
            x, y = 440 + cell['x'] * 16, 310 + cell['y'] * 16
            obstacles.paste(255, (x, y, x + 16, y + 16), alpha)

# A four-pixel margin for feet avoids grazing solid edges. Paths are deliberately
# conservative: cream/peach terrain, never water/grass/roofs/clouds.
obstacles = obstacles.filter(ImageFilter.MaxFilter(9))
cell_size = 4
width, height = size[0] // cell_size, size[1] // cell_size
walk = set()
roads = set()
for y in range(height):
    for x in range(width):
        px, py = x * cell_size + 2, y * cell_size + 2
        r, g, b, a = terrain.getpixel((px, py))
        water = b > r * 1.08 and g > r * 1.08
        if a > 200 and not water and not obstacles.getpixel((px, py)):
            walk.add(y * width + x)
            if r > 190 and r > g * 1.055 and b > 105 and r > b * 1.12:
                roads.add(y * width + x)

# Discard isolated flower-colour specks and disconnected pockets. All venues
# must resolve to the same connected street network; never fall back to a straight line.
remaining = set(walk)
largest = set()
while remaining:
    start = remaining.pop()
    component, queue = {start}, deque([start])
    while queue:
        i = queue.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            x, y = i % width + dx, i // width + dy
            j = y * width + x
            if 0 <= x < width and 0 <= y < height and j in remaining:
                remaining.remove(j); component.add(j); queue.append(j)
    if len(component) > len(largest):
        largest = component
data = {'cellSize': cell_size, 'width': width, 'height': height,
        'rows': [''.join(('1' if y * width + x in roads else '2') if y * width + x in largest else '0' for x in range(width)) for y in range(height)]}
(root / 'src/townNavigation.json').write_text(json.dumps(data, separators=(',', ':')) + '\n')
print(f'Connected street mask: {len(largest)} / {len(walk)} candidate cells; {width}x{height}')

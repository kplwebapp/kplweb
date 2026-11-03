from pathlib import Path
from PIL import Image

DIRS = [
    Path(r"e:\Projects\KPL\Application\kplweb\mobile\src\assets\teams"),
    Path(r"e:\Projects\KPL\Application\kplweb\frontend\src\assets\teams"),
]


def is_bg(px, threshold=28):
    r, g, b, a = px
    if a < 8:
        return True
    return r <= threshold and g <= threshold and b <= threshold


def clear_black_background(path: Path):
    im = Image.open(path).convert("RGBA")
    pixels = im.load()
    w, h = im.size
    visited = set()
    stack = []
    for x in range(w):
        stack.append((x, 0))
        stack.append((x, h - 1))
    for y in range(h):
        stack.append((0, y))
        stack.append((w - 1, y))

    removed = 0
    while stack:
        x, y = stack.pop()
        if (x, y) in visited:
            continue
        if x < 0 or y < 0 or x >= w or y >= h:
            continue
        visited.add((x, y))
        px = pixels[x, y]
        if not is_bg(px):
            continue
        pixels[x, y] = (0, 0, 0, 0)
        removed += 1
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    im.save(path, optimize=True)
    print(f"{path.name}: cleared {removed} bg pixels")


def main():
    for d in DIRS:
        for p in sorted(d.glob("*.png")):
            clear_black_background(p)
    print("done")


if __name__ == "__main__":
    main()

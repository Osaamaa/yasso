"""Build the original Universe Pixel TrueType font using only Python's stdlib.

Run from any directory: python tools/create_pixel_font.py
The hand-drawn bitmaps below are the editable source. A cell is 100 font units;
capitals are 700 units high. Lowercase has a 500-unit x-height and true descenders.
No font, font library, network service, or external artwork is used.
"""
from pathlib import Path
import math
import struct

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "site" / "assets" / "universe-pixel.ttf"

# Each slash separates one row; 1 is ink and 0 is empty. Row seven is the baseline.
BITMAPS = {
    "A": "01110/10001/10001/11111/10001/10001/10001",
    "B": "11110/10001/10001/11110/10001/10001/11110",
    "C": "01111/10000/10000/10000/10000/10000/01111",
    "D": "11110/10001/10001/10001/10001/10001/11110",
    "E": "11111/10000/10000/11110/10000/10000/11111",
    "F": "11111/10000/10000/11110/10000/10000/10000",
    "G": "01111/10000/10000/10111/10001/10001/01111",
    "H": "10001/10001/10001/11111/10001/10001/10001",
    "I": "111/010/010/010/010/010/111",
    "J": "00111/00010/00010/00010/10010/10010/01100",
    "K": "10001/10010/10100/11000/10100/10010/10001",
    "L": "10000/10000/10000/10000/10000/10000/11111",
    "M": "10001/11011/10101/10101/10001/10001/10001",
    "N": "10001/11001/11001/10101/10011/10011/10001",
    "O": "01110/10001/10001/10001/10001/10001/01110",
    "P": "11110/10001/10001/11110/10000/10000/10000",
    "Q": "01110/10001/10001/10001/10101/10010/01101",
    "R": "11110/10001/10001/11110/10100/10010/10001",
    "S": "01111/10000/10000/01110/00001/00001/11110",
    "T": "11111/00100/00100/00100/00100/00100/00100",
    "U": "10001/10001/10001/10001/10001/10001/01110",
    "V": "10001/10001/10001/10001/10001/01010/00100",
    "W": "10001/10001/10001/10101/10101/11011/10001",
    "X": "10001/10001/01010/00100/01010/10001/10001",
    "Y": "10001/10001/01010/00100/00100/00100/00100",
    "Z": "11111/00001/00010/00100/01000/10000/11111",
    "a": "00000/00000/01110/00001/01111/10001/01111",
    "b": "10000/10000/11110/10001/10001/10001/11110",
    "c": "0000/0000/0111/1000/1000/1000/0111",
    "d": "00001/00001/01111/10001/10001/10001/01111",
    "e": "00000/00000/01110/10001/11111/10000/01111",
    "f": "0011/0100/1110/0100/0100/0100/0100",
    "g": "00000/00000/01111/10001/10001/01111/00001/10001/01110",
    "h": "10000/10000/11110/10001/10001/10001/10001",
    "i": "1/0/1/1/1/1/1",
    "j": "001/000/001/001/001/001/001/101/010",
    "k": "1000/1000/1001/1010/1100/1010/1001",
    "l": "10/10/10/10/10/10/01",
    "m": "00000/00000/11010/10101/10101/10101/10101",
    "n": "00000/00000/11110/10001/10001/10001/10001",
    "o": "00000/00000/01110/10001/10001/10001/01110",
    "p": "00000/00000/11110/10001/10001/10001/11110/10000/10000",
    "q": "00000/00000/01111/10001/10001/10001/01111/00001/00001",
    "r": "0000/0000/1011/1100/1000/1000/1000",
    "s": "0000/0000/0111/1000/0110/0001/1110",
    "t": "0100/0100/1110/0100/0100/0100/0011",
    "u": "00000/00000/10001/10001/10001/10001/01111",
    "v": "00000/00000/10001/10001/10001/01010/00100",
    "w": "00000/00000/10001/10001/10101/10101/01010",
    "x": "00000/00000/10001/01010/00100/01010/10001",
    "y": "00000/00000/10001/10001/10001/01111/00001/10001/01110",
    "z": "0000/0000/1111/0001/0110/1000/1111",
    "0": "01110/10001/10011/10101/11001/10001/01110",
    "1": "010/110/010/010/010/010/111",
    "2": "01110/10001/00001/00010/00100/01000/11111",
    "3": "11110/00001/00001/01110/00001/00001/11110",
    "4": "00010/00110/01010/10010/11111/00010/00010",
    "5": "11111/10000/10000/11110/00001/00001/11110",
    "6": "01110/10000/10000/11110/10001/10001/01110",
    "7": "11111/00001/00010/00100/01000/01000/01000",
    "8": "01110/10001/10001/01110/10001/10001/01110",
    "9": "01110/10001/10001/01111/00001/00001/01110",
    "!": "1/1/1/1/1/0/1",
    '"': "101/101/101/000/000/000/000",
    "#": "01010/01010/11111/01010/11111/01010/01010",
    "$": "00100/01111/10100/01110/00101/11110/00100",
    "%": "11001/11010/00010/00100/01000/01011/10011",
    "&": "01100/10010/10100/01000/10101/10010/01101",
    "'": "1/1/1/0/0/0/0",
    "(": "01/10/10/10/10/10/01",
    ")": "10/01/01/01/01/01/10",
    "*": "00000/10101/01110/11111/01110/10101/00000",
    "+": "00000/00100/00100/11111/00100/00100/00000",
    ",": "00/00/00/00/00/01/01/10",
    "-": "0000/0000/0000/1111/0000/0000/0000",
    ".": "0/0/0/0/0/0/1",
    "/": "00001/00001/00010/00100/01000/10000/10000",
    ":": "0/0/1/0/0/1/0",
    ";": "00/00/01/00/00/01/01/10",
    "<": "0001/0010/0100/1000/0100/0010/0001",
    "=": "0000/0000/1111/0000/1111/0000/0000",
    ">": "1000/0100/0010/0001/0010/0100/1000",
    "?": "01110/10001/00001/00010/00100/00000/00100",
    "@": "01110/10001/10111/10101/10111/10000/01111",
    "[": "111/100/100/100/100/100/111",
    "\\": "10000/10000/01000/00100/00010/00001/00001",
    "]": "111/001/001/001/001/001/111",
    "^": "00100/01010/10001/00000/00000/00000/00000",
    "_": "00000/00000/00000/00000/00000/00000/11111",
    "`": "10/01/00/00/00/00/00",
    "{": "0011/0100/0100/1000/0100/0100/0011",
    "|": "1/1/1/1/1/1/1",
    "}": "1100/0010/0010/0001/0010/0010/1100",
    "~": "00000/00000/01001/10110/00000/00000/00000",
    "‘": "01/10/10/00/00/00/00",
    "’": "01/01/10/00/00/00/00",
    "“": "0101/1010/1010/0000/0000/0000/0000",
    "”": "0101/0101/1010/0000/0000/0000/0000",
    "–": "00000/00000/00000/11111/00000/00000/00000",
    "—": "0000000/0000000/0000000/1111111/0000000/0000000/0000000",
    "…": "00000/00000/00000/00000/00000/00000/10101",
    "∞": "0000000/0000000/0110110/1001001/1001001/0110110/0000000",
    "×": "00000/10001/01010/00100/01010/10001/00000",
    "·": "0/0/0/1/0/0/0",
    "•": "000/000/010/111/010/000/000",
    "♥": "00000/01010/11111/11111/11111/01110/00100",
    "→": "00000/00100/00010/11111/00010/00100/00000",
    "←": "00000/00100/01000/11111/01000/00100/00000",
    "↑": "00100/01110/10101/00100/00100/00100/00000",
    "↓": "00000/00100/00100/00100/10101/01110/00100",
}


def u16(*values):
    return struct.pack(">" + "H" * len(values), *values)


def s16(*values):
    return struct.pack(">" + "h" * len(values), *values)


def u32(*values):
    return struct.pack(">" + "I" * len(values), *values)


def pad(data):
    return data + b"\0" * (-len(data) % 4)


def checksum(data):
    data = pad(data)
    return sum(struct.unpack(">" + "I" * (len(data) // 4), data)) & 0xFFFFFFFF


def bitmap_glyph(pattern):
    """Convert each horizontal ink run to a clockwise rectangular contour."""
    rows = pattern.split("/")
    width = len(rows[0])
    assert all(len(row) == width for row in rows), pattern
    points, contours = [], []
    for row_index, row in enumerate(rows):
        col = 0
        while col < width:
            if row[col] != "1":
                col += 1
                continue
            end = col + 1
            while end < width and row[end] == "1":
                end += 1
            left, right = 50 + col * 100, 50 + end * 100
            bottom, top = (6 - row_index) * 100, (7 - row_index) * 100
            points.extend([(left, bottom), (left, top), (right, top), (right, bottom)])
            contours.append(len(points) - 1)
            col = end
    if not points:
        return b"", width * 100 + 100, 0, 0
    xs, ys = zip(*points)
    data = s16(len(contours), min(xs), min(ys), max(xs), max(ys))
    data += u16(*contours) + u16(0) + bytes([1] * len(points))
    last_x = last_y = 0
    x_deltas, y_deltas = [], []
    for x, y in points:
        x_deltas.append(x - last_x)
        y_deltas.append(y - last_y)
        last_x, last_y = x, y
    data += s16(*x_deltas) + s16(*y_deltas)
    return data, width * 100 + 100, len(points), len(contours)


def make_font():
    codepoints = sorted([32, 160] + [ord(char) for char in BITMAPS])
    assert len(set(codepoints)) == len(codepoints)
    notdef = "11111/10001/10101/10101/10101/10001/11111"
    glyph_patterns = [notdef] + ["00/00/00/00/00/00/00" if cp in (32, 160) else BITMAPS[chr(cp)] for cp in codepoints]
    glyphs = [bitmap_glyph(pattern) for pattern in glyph_patterns]
    num_glyphs = len(glyphs)
    glyf, offsets, hmtx = b"", [], b""
    for data, advance, _, _ in glyphs:
        offsets.append(len(glyf))
        glyf += pad(data)
        hmtx += u16(advance) + s16(50 if data else 0)
    offsets.append(len(glyf))
    max_points = max(g[2] for g in glyphs)
    max_contours = max(g[3] for g in glyphs)

    head = struct.pack(">IIIIHHQQhhhhHHhhh", 0x10000, 0x10000, 0, 0x5F0F3CF5,
                       3, 1000, 3873571200, 3873571200, 0, -200, 750, 700,
                       0, 8, 2, 1, 0)
    hhea = (u32(0x10000) + s16(800, -200, 100) + u16(800)
            + s16(0, 50, 750) + s16(1, 0, 0) + s16(0, 0, 0, 0)
            + s16(0) + u16(num_glyphs))
    maxp = u32(0x10000) + u16(num_glyphs, max_points, max_contours, 0, 0,
                            1, 0, 0, 0, 0, 0, 0, 0, 0)

    # Unicode BMP cmap, format 4: singleton segments allow all authored symbols.
    segments = codepoints + [0xFFFF]
    count = len(segments)
    selector = int(math.log2(count))
    search_range = 2 * (2 ** selector)
    cmap4 = u16(4, 16 + 8 * count, 0, count * 2, search_range, selector,
                2 * count - search_range)
    cmap4 += u16(*segments) + u16(0) + u16(*segments)
    cmap4 += u16(*[((index + 1 - cp) & 0xFFFF) for index, cp in enumerate(codepoints)], 1)
    cmap4 += u16(*([0] * count))
    cmap = u16(0, 2) + u16(0, 3) + u32(20) + u16(3, 1) + u32(20) + cmap4

    names = {
        0: "Original pixel artwork created for Yasso's Gaming Universe. CC0 1.0.",
        1: "Universe Pixel", 2: "Regular", 3: "UniversePixel-Regular-1.000",
        4: "Universe Pixel Regular", 5: "Version 1.000", 6: "UniversePixel-Regular",
        13: "Dedicated to the public domain under CC0 1.0 Universal.",
        14: "https://creativecommons.org/publicdomain/zero/1.0/",
    }
    name_records, name_strings = b"", b""
    for name_id, value in sorted(names.items()):
        encoded = value.encode("utf-16-be")
        name_records += u16(3, 1, 0x0409, name_id, len(encoded), len(name_strings))
        name_strings += encoded
    name = u16(0, len(names), 6 + len(name_records)) + name_records + name_strings

    os2 = (u16(0) + s16(530) + u16(400, 5, 0)
           + s16(650, 650, 0, 75, 650, 650, 0, 350, 100, 300, 0)
           + bytes([2, 11, 6, 3, 0, 0, 0, 0, 0, 0])
           + u32(3, 0, 0, 0) + b"YGUN" + u16(0x40, 32, max(codepoints))
           + s16(800, -200, 100) + u16(800, 200))
    post = u32(0x30000, 0) + s16(-100, 50) + u32(0, 0, 0, 0, 0)
    tables = {"OS/2": os2, "cmap": cmap, "glyf": glyf, "head": head,
              "hhea": hhea, "hmtx": hmtx, "loca": u32(*offsets),
              "maxp": maxp, "name": name, "post": post}
    assert len(head) == 54 and len(hhea) == 36 and len(maxp) == 32
    assert len(os2) == 78 and len(post) == 32

    num_tables = len(tables)
    selector = int(math.log2(num_tables))
    search_range = 16 * (2 ** selector)
    result = u32(0x10000) + u16(num_tables, search_range, selector,
                               num_tables * 16 - search_range)
    directory, payload = b"", b""
    data_start = 12 + 16 * num_tables
    head_offset = 0
    for tag, data in sorted(tables.items()):
        offset = data_start + len(payload)
        if tag == "head":
            head_offset = offset
        directory += tag.encode("ascii") + u32(checksum(data), offset, len(data))
        payload += pad(data)
    result += directory + payload
    adjustment = (0xB1B0AFBA - checksum(result)) & 0xFFFFFFFF
    result = result[:head_offset + 8] + u32(adjustment) + result[head_offset + 12:]
    assert checksum(result) == 0xB1B0AFBA
    return result, num_glyphs


if __name__ == "__main__":
    font, count = make_font()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_bytes(font)
    print(f"Created {OUTPUT}: {len(font):,} bytes; {count} original glyphs.")

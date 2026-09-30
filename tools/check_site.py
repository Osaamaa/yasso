"""Offline source/media verification. Does not launch a browser or access the network."""
from pathlib import Path
from html.parser import HTMLParser
import json
import re
import hashlib
import struct
import xml.etree.ElementTree as ET
from PIL import Image, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
checks = []

def check(condition, message):
    if not condition:
        raise AssertionError(message)
    checks.append(message)

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids, self.refs, self.anchors = [], [], []
        self.attrs = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
            self.attrs[attrs['id']] = attrs
        for name in ('src', 'href', 'poster'):
            value = attrs.get(name, '')
            if value.startswith('#'):
                self.anchors.append(value[1:])
            elif value and not value.startswith(('http:', 'https:', 'data:')):
                self.refs.append(value)
        if 'aria-controls' in attrs:
            self.anchors.extend(attrs['aria-controls'].split())

html = (SITE / 'index.html').read_text('utf-8-sig')
css = (SITE / 'styles.css').read_text('utf-8-sig')
js = (SITE / 'app.js').read_text('utf-8-sig')
content = json.loads((ROOT / 'verification/content-snapshot.json').read_text('utf-8'))
page = PageParser()
page.feed(html)
check(len(page.ids) == len(set(page.ids)), 'No duplicate HTML IDs')
check(all(target in page.ids for target in page.anchors), 'Every navigation, SVG symbol, and ARIA target exists')
for file in page.refs + re.findall(r'url\([\'"]?([^\)\'\"]+)', css):
    check((SITE / file).is_file(), f'Local asset exists: {file}')
js_ids = re.findall(r"(?:\$|on|setText|hide)\('#([\w-]+)'", js)
optional = {'quiz-score'}
check(all(value in page.ids or value in optional for value in js_ids), 'JavaScript ID hooks match the HTML contract')
runtime_html = html.replace('http://www.w3.org/2000/svg', '')
check('http://' not in runtime_html and 'https://' not in runtime_html, 'No remote runtime scripts, media, or stylesheets')
check(len(content['photos']) == 21, 'Exactly 21 supplied photos configured')
check(len(content['videos']) == 1, 'Supplied MP4 configured')
check(len(content['quiz']) == 5, 'Five quiz questions configured')
check(content['name'] == 'Yasso' and content['age'] == 14, 'Approved name and age configured')
check('[my message' not in content['message'], 'Final message has no placeholder text')
for index, photo in enumerate(content['photos'], 1):
    check(bool(photo['caption']) and bool(photo['alt']), f'Photo {index:02}: caption and alternative text present')
    check(photo['rarity'] in {'common', 'uncommon', 'rare', 'epic', 'legendary'}, f'Photo {index:02}: valid rarity')
    for key in ('src', 'thumb', 'full'):
        path = SITE / photo[key]
        check(path.is_file(), f'Photo {index:02}: {key} exists')
        with Image.open(path) as image:
            image.load()
            if key == 'src':
                check(image.size == (photo['width'], photo['height']), f'Photo {index:02}: display dimensions correct')
                check(max(image.size) <= 1440, f'Photo {index:02}: display size is bounded')
            elif key == 'thumb':
                check(max(image.size) <= 240, f'Photo {index:02}: thumbnail size is bounded')

for index, question in enumerate(content['quiz'], 1):
    check(len(question['answers']) == 3 and 0 <= question['correct'] < 3, f'Question {index}: three valid choices and correct answer')
    check(all(question.get(key) for key in ('code', 'question', 'feedback')), f'Question {index}: complete wording')

for svg in (SITE / 'assets').glob('*.svg'):
    ET.parse(svg)
    check(True, f'SVG XML parses: {svg.name}')

font = ImageFont.truetype(str(SITE / 'assets/universe-pixel.ttf'), 55)
check(font.getlength('UNIVERSE.') - 0.035 * 55 * 8 <= 292, 'Mobile hero heading fits its 320px layout text width by font metrics')
check(font.getmask('Yasso’s Gaming Universe ∞').getbbox() is not None, 'Original pixel font loads and renders through FreeType')

# Remove strings/comments before verifying stylesheet structure.
clean = re.sub(r'/\*.*?\*/|"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'', '', css, flags=re.S)
for opening, closing in (('{', '}'), ('(', ')'), ('[', ']')):
    depth = 0
    for char in clean:
        if char == opening:
            depth += 1
        elif char == closing:
            depth -= 1
            check(depth >= 0, f'CSS {opening}{closing} never closes before opening') if depth < 0 else None
    check(depth == 0, f'CSS {opening}{closing} pairs are balanced')
check('prefers-reduced-motion' in css and 'prefers-reduced-motion' in js, 'Reduced motion is handled in styles and behavior')
check(page.attrs['cinema-video'].get('preload') == 'none' and 'autoplay' not in page.attrs['cinema-video'], 'Video has no automatic download/playback request')
check('loading = \'lazy\'' in js, 'Gallery thumbnail lazy loading configured')

video = SITE / content['videos'][0]['src']
check(video.is_file(), 'Video file exists')
data = video.read_bytes()
check(b'avc1' in data, 'Video contains the widely supported H.264 video codec')
check(b'soun' not in data or b'mp4a' in data, 'Video is silent or contains MPEG-4 audio; supplied clip is silent')
original_video = next(ROOT.glob('*.mp4'))
check(hashlib.sha256(data).digest() == hashlib.sha256(original_video.read_bytes()).digest(), 'Video original is byte-for-byte preserved')
root_hashes = sorted(hashlib.sha256(path.read_bytes()).hexdigest() for path in ROOT.glob('*.jpeg'))
copy_hashes = sorted(hashlib.sha256(path.read_bytes()).hexdigest() for path in (SITE / 'media/originals').glob('*.jpeg'))
check(root_hashes == copy_hashes and len(root_hashes) == 21, 'All 21 original JPEGs are byte-for-byte preserved')

report = {'status': 'PASS', 'checks': len(checks), 'results': checks,
          'browser_verification': 'NOT RUN: browser access blocked by automatic approval service failure (404).',
          'limitations': ['These checks do not execute browser DOM interactions, audio playback, touch input, or measure rendered responsive layout.']}
(ROOT / 'verification/static-checks.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(f'PASS: {len(checks)} offline source and media checks. Browser verification remains unverified.')

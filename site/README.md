# Yasso’s Gaming Universe

A surprise from Uncle Osama. The complete website is in this folder: no account, installation, backend, or build step is needed to open it.

## Open the gift

Double-click `index.html` in a current Chrome, Edge, Firefox, or Safari browser. Press **PRESS START** to enter. All games are optional; the final message is always reachable. **Replay** resets the activities and preserves the sound preference.

Sound starts only after an interaction. The persistent sound button controls music, effects, and video sound. Videos require a tap and pause background music. A missing music file never blocks the gift.

## Make it yours

Open `content.js` in a text editor. It contains the final and secret messages, activity messages, gallery captions and rarity labels, video list, and all five quiz questions. Keep the quotes and commas when editing. In quiz entries, `correct: 0` means the first answer, `1` the second, and `2` the third. Every completed quiz earns a win. The name, age, and uncle fields document who the gift is for; visible names, headings, and labels are written in `index.html` if you want to change those too.

The single `photos` array drives both galleries. Reorder or remove complete photo objects to change both. Change each `caption` for the visible label and `alt` for a description used by screen readers. Rarity values are `common`, `uncommon`, `rare`, `epic`, and `legendary`.

To add a photo or a screenshot of a game world:

1. Copy the image into `media/` using a simple filename, such as `my-build.webp` or `my-build.jpg`.
2. Copy a photo object in `content.js`, then set `src: 'media/my-build.webp'` and edit its `caption`, `alt`, `rarity`, `width`, and `height` to match the image.
3. For faster loading, add a small image in `media/thumbs/` and point `thumb` to it. Point `full` to a larger version if available. Either field can be omitted; the site falls back to `src`.

For best phone performance, use display images no larger than 1440 pixels on their longest side and thumbnails around 240 pixels. The site preserves the whole image in its viewer; no image is stretched.

To replace the cinema video, copy an MP4 into `media/` and edit the first entry in `videos`. Set its `src`, readable `title`, and optional `poster` image. The cinema uses this first entry. Prefer H.264 video with AAC audio for broad browser support. The supplied video remains byte-for-byte unchanged. It has no audio track, so it is naturally silent even when sound is enabled.

To add music, put a file named `song.mp3` in `music/`. To choose another filename, change `music` in `content.js`. No music is bundled. Use media you have permission to share.

## What is included

```text
site/
  index.html            Page and original game scenery
  styles.css            Responsive layout and animations
  app.js                Interactions and accessibility
  content.js            All editable gift content and media lists
  assets/               Original artwork and local fonts
  media/
    photo-01.webp …     21 compressed display photos
    thumbs/             21 small gallery thumbnails
    originals/          21 untouched JPEG copies
    full/               Two upright full-resolution viewing copies
    video-01.mp4         Supplied video
    source-map.json      Original filenames and verification hashes
  music/                Add optional song.mp3 here
  README.md             This guide
```

The raw files in the parent project folder are untouched. The two sideways selfies (photos 04 and 15) have upright display, thumbnail, and full-resolution viewing copies; their original bytes are still preserved in `media/originals/`.

An optional authoring utility, `../tools/prepare_media.py`, recreates these photo derivatives from the original project media. It requires Python and Pillow only if you choose to run it again. Neither is needed to view or publish the finished gift.

## Put it online for free

Publishing makes the uploaded photos and video accessible to anyone who has the website link. The gift has no login or access gate.

**Netlify drag and drop**

1. Sign in to [Netlify](https://app.netlify.com/) and use its manual deployment / drag-and-drop option.
2. Drag this complete `site` folder into the upload area. `index.html` must be at the top of the uploaded folder.
3. Open the resulting HTTPS address, test the start button and a photo/video on your phone, and share the link. To update it, upload the complete revised folder again to that same site.

**GitHub Pages**

1. Create a public GitHub repository named `yasso`.
2. Upload the **contents** of `site/` to the repository root, so `index.html`, `content.js`, `media/`, and the other website files sit at the top level. You do not need to upload the original raw project files outside `site/`.
3. In the repository’s **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/(root)`, then save.
4. Wait for the Pages deployment, open the address GitHub provides, test it on a phone, and share it. Future commits to the same branch update the gift.

All asset URLs are relative, so the site also works below a project path such as `https://your-name.github.io/yasso/`. Keep the folders together and preserve filename capitalization.

The page respects reduced-motion preferences. It includes no advertising, analytics, tracking, or external runtime requests.

## Verification status

JavaScript syntax, asset references, photo dimensions, original media hashes, SVGs, font loading, and configuration checks pass. The bug-arena positioning and image fallback functions also passed isolated logic checks.

Automated browser access was blocked by an approval-service error during delivery. Rendered mobile layouts, native dialog focus, actual touch gestures, and media playback still need a real-browser check. Before sharing, open the site on your phone, start the adventure, open a photo and the video, try the three games, and test mute and replay. The missing optional music file and the supplied silent video are expected.

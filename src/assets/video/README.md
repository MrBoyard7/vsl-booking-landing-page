# Video sales letter — place your file here

This repository ships without the actual video, since that's your content
to provide.

1. Export your VSL as `vsl.mp4` (H.264, target under ~15 MB for a
   sub-3-second load on 4G — compress with HandBrake or ffmpeg if needed).
2. Drop it in this folder as `src/assets/video/vsl.mp4`.
3. Replace `src/assets/images/vsl-poster.svg` with a real poster frame
   (a `.jpg` works fine — just update the `poster` attribute in
   `src/index.html` accordingly).

Until you do, the player will detect the missing file and show a clean
"video coming soon" fallback instead of a broken player — see
`src/js/video-player.js`.

## ffmpeg compression example

```bash
ffmpeg -i source.mov -vcodec libx264 -crf 23 -preset veryfast \
  -acodec aac -b:a 128k -movflags +faststart vsl.mp4
```

`-movflags +faststart` matters most: it moves metadata to the front of the
file so the video can start playing before it's fully downloaded.

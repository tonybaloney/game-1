# Music Files

Put optional game music files in this folder, then set `customization.music.src` in `js/student-challenges.js`.

Example:

```javascript
music: {
  src: "assets/music/theme.mp3",
  volume: 0.45,
  loop: true
}
```

Browsers only start audio after a click, so the game shows a Music button when `src` is not empty.

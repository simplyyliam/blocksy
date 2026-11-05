# 5. Two looks: Modern and Minecraft

Blocksy ships with two themes, switchable at any time in Settings.

- **Modern (default):** calm, clean, neutral surfaces, soft radii, generous spacing. Built from the inspiration in `docs/design/`.
- **Minecraft:** the whole app reskinned in a playful block style: pixel borders, stone and wood panel tones, chunky buttons, a pixel font.

How it stays maintainable:

- Both themes are **token sets** (colour, radius, border style, shadow, font, sound) over the same components. A theme never changes layout or behaviour.
- The Minecraft theme uses **original** pixel art and an openly licensed pixel font. It must not reuse Mojang's textures or font in the app's own UI.
- The Minecraft theme lands as a baseline in v0.2, so every later component is designed and tested in both themes from day one.

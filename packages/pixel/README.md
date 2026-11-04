# @blocksy/pixel

Pixel painting for Blocksy: an image model, PNG helpers, **brushes** and the texture editor.

- Brushes (pencil, eraser, fill, picker) and the mirror modifier paint on a `PaintSurface`
  (read and write one pixel). They never know what the surface is.
- The texture editor gives them a flat 16x16 image (one per animation frame).
- Model Studio (v0.5) will give them a surface that maps a model's faces onto its texture,
  so the same brushes paint on 3D models (ADR 0009).

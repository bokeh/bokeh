/*
Copyright notice: many of the awesome techniques and  GLSL code contained in
this module are based on work by Nicolas Rougier as part of the Glumpy and
Vispy projects. The algorithms are published in
http://jcgt.org/published/0003/04/01/ and http://jcgt.org/published/0002/02/08/

This module contains all gl-specific code to add gl support for the glyphs.
By implementing it separetely, the GL functionality can be spun off in a
separate library.
Other locations where we work with GL, or prepare for GL-rendering:
- canvas.ts
- plot.ts
- glyph.ts
- glyph_renderer.ts
*/

export * from "./line"
export * from "./markers"

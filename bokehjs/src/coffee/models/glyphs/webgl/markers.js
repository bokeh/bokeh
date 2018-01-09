/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Program, VertexBuffer, IndexBuffer} from "./gloo2";
import {BaseGLGlyph, attach_float, attach_color} from "./base";
import {logger} from "core/logging"
;

class MarkerGLGlyph extends BaseGLGlyph {
  static initClass() {
    // Base class for markers. All markers share the same GLSL, except for one
    // function that defines the marker geometry.

    this.prototype.VERT = `\
precision mediump float;
const float SQRT_2 = 1.4142135623730951;
//
uniform float u_pixel_ratio;
uniform vec2 u_canvas_size;
uniform vec2 u_offset;
uniform vec2 u_scale;
uniform float u_antialias;
//
attribute float a_x;
attribute float a_y;
attribute float a_size;
attribute float a_angle;  // in radians
attribute float a_linewidth;
attribute vec4  a_fg_color;
attribute vec4  a_bg_color;
//
varying float v_linewidth;
varying float v_size;
varying vec4  v_fg_color;
varying vec4  v_bg_color;
varying vec2  v_rotation;

void main (void)
{
    v_size = a_size * u_pixel_ratio;
    v_linewidth = a_linewidth * u_pixel_ratio;
    v_fg_color = a_fg_color;
    v_bg_color = a_bg_color;
    v_rotation = vec2(cos(-a_angle), sin(-a_angle));
    // Calculate position - the -0.5 is to correct for canvas origin
    vec2 pos = (vec2(a_x, a_y) + u_offset) * u_scale; // in pixels
    pos += 0.5;  // make up for Bokeh's offset
    pos /= u_canvas_size / u_pixel_ratio;  // in 0..1
    gl_Position = vec4(pos*2.0-1.0, 0.0, 1.0);
    gl_Position.y *= -1.0;
    gl_PointSize = SQRT_2 * v_size + 2.0 * (v_linewidth + 1.5*u_antialias);
}\
`;

    this.prototype.FRAG = `\
precision mediump float;
const float SQRT_2 = 1.4142135623730951;
const float PI = 3.14159265358979323846264;
//
uniform float u_antialias;
//
varying vec4  v_fg_color;
varying vec4  v_bg_color;
varying float v_linewidth;
varying float v_size;
varying vec2  v_rotation;

MARKERCODE

vec4 outline(float distance, float linewidth, float antialias, vec4 fg_color, vec4 bg_color)
{
    vec4 frag_color;
    float t = linewidth/2.0 - antialias;
    float signed_distance = distance;
    float border_distance = abs(signed_distance) - t;
    float alpha = border_distance/antialias;
    alpha = exp(-alpha*alpha);

    // If fg alpha is zero, it probably means no outline. To avoid a dark outline
    // shining through due to aa, we set the fg color to the bg color. Avoid if (i.e. branching).
    float select = float(bool(fg_color.a));
    fg_color.rgb = select * fg_color.rgb + (1.0  - select) * bg_color.rgb;
    // Similarly, if we want a transparent bg
    select = float(bool(bg_color.a));
    bg_color.rgb = select * bg_color.rgb + (1.0  - select) * fg_color.rgb;

    if( border_distance < 0.0)
        frag_color = fg_color;
    else if( signed_distance < 0.0 ) {
        frag_color = mix(bg_color, fg_color, sqrt(alpha));
    } else {
        if( abs(signed_distance) < (linewidth/2.0 + antialias) ) {
            frag_color = vec4(fg_color.rgb, fg_color.a * alpha);
        } else {
            discard;
        }
    }
    return frag_color;
}

void main()
{
    vec2 P = gl_PointCoord.xy - vec2(0.5, 0.5);
    P = vec2(v_rotation.x*P.x - v_rotation.y*P.y,
             v_rotation.y*P.x + v_rotation.x*P.y);
    float point_size = SQRT_2*v_size  + 2.0 * (v_linewidth + 1.5*u_antialias);
    float distance = marker(P*point_size, v_size);
    gl_FragColor = outline(distance, v_linewidth, u_antialias, v_fg_color, v_bg_color);
    //gl_FragColor.rgb *= gl_FragColor.a;  // pre-multiply alpha
}\
`;

    this.prototype.MARKERCODE = "<defined in subclasses>";
  }

  init() {

    const { gl } = this;
    const frag = this.FRAG.replace(/MARKERCODE/, this.MARKERCODE);

    this.last_trans = {};  // Keep track of transform

    // The program
    this.prog = new Program(gl);
    this.prog.set_shaders(this.VERT, frag);
    // Real attributes
    this.vbo_x = new VertexBuffer(gl);
    this.prog.set_attribute('a_x', 'float', this.vbo_x);
    this.vbo_y = new VertexBuffer(gl);
    this.prog.set_attribute('a_y', 'float', this.vbo_y);
    this.vbo_s = new VertexBuffer(gl);
    this.prog.set_attribute('a_size', 'float', this.vbo_s);
    this.vbo_a = new VertexBuffer(gl);
    this.prog.set_attribute('a_angle', 'float', this.vbo_a);
    // VBO's for attributes (they may not be used if value is singleton)
    this.vbo_linewidth = new VertexBuffer(gl);
    this.vbo_fg_color = new VertexBuffer(gl);
    this.vbo_bg_color = new VertexBuffer(gl);
    return this.index_buffer = new IndexBuffer(gl);
  }

  draw(indices, mainGlyph, trans) {

    // The main glyph has the data, *this* glyph has the visuals.
    const mainGlGlyph = mainGlyph.glglyph;
    const { nvertices } = mainGlGlyph;

    // Upload data if we must. Only happens for main glyph.
    if (mainGlGlyph.data_changed) {
      if (!(isFinite(trans.dx) && isFinite(trans.dy))) {
          return;  // not sure why, but it happens on init sometimes (#4367)
        }
      mainGlGlyph._baked_offset = [trans.dx, trans.dy];  // float32 precision workaround; used in _set_data() and below
      mainGlGlyph._set_data(nvertices);
      mainGlGlyph.data_changed = false;
    } else if ((this.glyph._radius != null) && ((trans.sx !== this.last_trans.sx) || (trans.sy !== this.last_trans.sy))) {
      // Keep screen radius up-to-date for circle glyph. Only happens when a radius is given
      this.last_trans = trans;
      this.vbo_s.set_data(0, new Float32Array((Array.from(this.glyph.sradius).map((s) => s*2))));
    }

    // Update visuals if we must. Can happen for all glyphs.
    if (this.visuals_changed) {
      this._set_visuals(nvertices);
      this.visuals_changed = false;
    }

    // Handle transformation to device coordinates
    // Note the baked-in offset to avoid float32 precision problems
    const baked_offset = mainGlGlyph._baked_offset;
    this.prog.set_uniform('u_pixel_ratio', 'float', [trans.pixel_ratio]);
    this.prog.set_uniform('u_canvas_size', 'vec2', [trans.width, trans.height]);
    this.prog.set_uniform('u_offset', 'vec2', [trans.dx - baked_offset[0], trans.dy - baked_offset[1]]);
    this.prog.set_uniform('u_scale', 'vec2', [trans.sx, trans.sy]);

    // Select buffers from main glyph
    // (which may be this glyph but maybe not if this is a (non)selection glyph)
    this.prog.set_attribute('a_x', 'float', mainGlGlyph.vbo_x);
    this.prog.set_attribute('a_y', 'float', mainGlGlyph.vbo_y);
    this.prog.set_attribute('a_size', 'float', mainGlGlyph.vbo_s);
    this.prog.set_attribute('a_angle', 'float', mainGlGlyph.vbo_a);

    // Draw directly or using indices. Do not handle indices if they do not
    // fit in a uint16; WebGL 1.0 does not support uint32.
    if (indices.length === 0) {
      return;
    } else if (indices.length === nvertices) {
      return this.prog.draw(this.gl.POINTS, [0, nvertices]);
    } else if (nvertices < 65535) {
      // On IE the marker size is reduced to 1 px when using an index buffer
      // A MS Edge dev on Twitter said on 24-04-2014: "gl_PointSize > 1.0 works
      // in DrawArrays; gl_PointSize > 1.0 in DrawElements is coming soon in the
      // next renderer update.
      const ua = window.navigator.userAgent;
      if ((ua.indexOf("MSIE ") + ua.indexOf("Trident/") + ua.indexOf("Edge/")) > 0) {
         logger.warn('WebGL warning: IE is known to produce 1px sprites whith selections.');
       }
      this.index_buffer.set_size(indices.length*2);
      this.index_buffer.set_data(0, new Uint16Array(indices));
      return this.prog.draw(this.gl.POINTS, this.index_buffer);
    } else {
      // Work around the limit that the indexbuffer must be uint16. We draw in chunks.
      // First collect indices in chunks
      let chunk, i;
      let asc, end;
      let asc1, end1;
      const chunksize = 64000;  // 65536
      const chunks = [];
      for (i = 0, end = Math.ceil(nvertices/chunksize), asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
         chunks.push([]);
      }
      for (i = 0, end1 = indices.length, asc1 = 0 <= end1; asc1 ? i < end1 : i > end1; asc1 ? i++ : i--) {
        const uint16_index = indices[i] % chunksize;
        chunk = Math.floor(indices[i] / chunksize);
        chunks[chunk].push(uint16_index);
      }
      // Then draw each chunk
      let asc2, end2;
      for (chunk = 0, end2 = chunks.length, asc2 = 0 <= end2; asc2 ? chunk < end2 : chunk > end2; asc2 ? chunk++ : chunk--) {
        const these_indices = new Uint16Array(chunks[chunk]);
        const offset = chunk * chunksize * 4;
        if (these_indices.length === 0) {
          continue;
        }
        this.prog.set_attribute('a_x', 'float', mainGlGlyph.vbo_x, 0, offset);
        this.prog.set_attribute('a_y', 'float', mainGlGlyph.vbo_y, 0, offset);
        this.prog.set_attribute('a_size', 'float', mainGlGlyph.vbo_s, 0, offset);
        this.prog.set_attribute('a_angle', 'float', mainGlGlyph.vbo_a, 0, offset);
        if (this.vbo_linewidth.used) {
          this.prog.set_attribute('a_linewidth', 'float', this.vbo_linewidth, 0, offset);
        }
        if (this.vbo_fg_color.used) {
          this.prog.set_attribute('a_fg_color', 'vec4', this.vbo_fg_color, 0, offset * 4);
        }
        if (this.vbo_bg_color.used) {
          this.prog.set_attribute('a_bg_color', 'vec4', this.vbo_bg_color, 0, offset * 4);
        }
        // The actual drawing
        this.index_buffer.set_size(these_indices.length*2);
        this.index_buffer.set_data(0, these_indices);
        this.prog.draw(this.gl.POINTS, this.index_buffer);
      }
    }
  }

  _set_data(nvertices) {
    const n = nvertices * 4;  // in bytes
    // Set buffer size
    this.vbo_x.set_size(n);
    this.vbo_y.set_size(n);
    this.vbo_a.set_size(n);
    this.vbo_s.set_size(n);
    // Upload data for x and y, apply a baked-in offset for float32 precision (issue #3795)
    // The exact value for the baked_offset does not matter, as long as it brings the data to less extreme values
    const xx = new Float64Array(this.glyph._x);
    const yy = new Float64Array(this.glyph._y);
    for (let i = 0, end = nvertices, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
       xx[i] += this._baked_offset[0];
       yy[i] += this._baked_offset[1];
    }
    this.vbo_x.set_data(0, new Float32Array(xx));
    this.vbo_y.set_data(0, new Float32Array(yy));
    // Angle if available; circle does not have angle. If we don't set data, angle is default 0 in glsl
    if (this.glyph._angle != null) {
      this.vbo_a.set_data(0, new Float32Array(this.glyph._angle));
    }
    // Radius is special; some markes allow radius in data-coords instead of screen coords
    // @radius tells us that radius is in units, sradius is the pre-calculated screen radius
    if (this.glyph._radius != null) {
      return this.vbo_s.set_data(0, new Float32Array((Array.from(this.glyph.sradius).map((s) => s*2))));
    } else {
      return this.vbo_s.set_data(0, new Float32Array(this.glyph._size));
    }
  }

  _set_visuals(nvertices) {
    attach_float(this.prog, this.vbo_linewidth, 'a_linewidth', nvertices, this.glyph.visuals.line, 'line_width');
    attach_color(this.prog, this.vbo_fg_color, 'a_fg_color', nvertices, this.glyph.visuals.line, 'line');
    attach_color(this.prog, this.vbo_bg_color, 'a_bg_color', nvertices, this.glyph.visuals.fill, 'fill');
    // Static value for antialias. Smaller aa-region to obtain crisper images
    return this.prog.set_uniform('u_antialias', 'float', [0.8]);
  }
}
MarkerGLGlyph.initClass();


export class CircleGLGlyph extends MarkerGLGlyph {
  static initClass() {

    this.prototype.GLYPH = 'circle';

    this.prototype.MARKERCODE = `\
// --- disc
float marker(vec2 P, float size)
{
    return length(P) - size/2.0;
}\
`;
  }
}
CircleGLGlyph.initClass();

export class SquareGLGlyph extends MarkerGLGlyph {
  static initClass() {

    this.prototype.GLYPH = 'square';

    this.prototype.MARKERCODE = `\
// --- square
float marker(vec2 P, float size)
{
    return max(abs(P.x), abs(P.y)) - size/2.0;
}\
`;
  }
}
SquareGLGlyph.initClass();

export class AnnulusGLGlyph extends MarkerGLGlyph {
  static initClass() {

    this.prototype.GLYPH = 'annulus';

    this.prototype.MARKERCODE = `\
float marker(vec2 P, float size)
{
    float r1 = length(P) - size/2.0;
    float r2 = length(P) - size/4.0;  // half width
    return max(r1, -r2);
}\
`;
  }
}
AnnulusGLGlyph.initClass();

export class DiamondGLGlyph extends MarkerGLGlyph {
  static initClass() {

    this.prototype.GLYPH = 'diamond';

    this.prototype.MARKERCODE = `\
// --- diamond
float marker(vec2 P, float size)
{
    float x = SQRT_2 / 2.0 * (P.x * 1.5 - P.y);
    float y = SQRT_2 / 2.0 * (P.x * 1.5 + P.y);
    float r1 = max(abs(x), abs(y)) - size / (2.0 * SQRT_2);
    return r1 / SQRT_2;
}\
`;
  }
}
DiamondGLGlyph.initClass();

export class TriangleGLGlyph extends MarkerGLGlyph {
  static initClass() {

    this.prototype.GLYPH = 'triangle';

    this.prototype.MARKERCODE = `\
float marker(vec2 P, float size)
{
    P.y -= size * 0.3;
    float x = SQRT_2 / 2.0 * (P.x * 1.7 - P.y);
    float y = SQRT_2 / 2.0 * (P.x * 1.7 + P.y);
    float r1 = max(abs(x), abs(y)) - size / 1.6;
    float r2 = P.y;
    return max(r1 / SQRT_2, r2);  // Instersect diamond with rectangle
}\
`;
  }
}
TriangleGLGlyph.initClass();

export class InvertedTriangleGLGlyph extends MarkerGLGlyph {
  static initClass() {

    this.prototype.GLYPH = 'invertedtriangle';

    this.prototype.MARKERCODE = `\
float marker(vec2 P, float size)
{
    P.y += size * 0.3;
    float x = SQRT_2 / 2.0 * (P.x * 1.7 - P.y);
    float y = SQRT_2 / 2.0 * (P.x * 1.7 + P.y);
    float r1 = max(abs(x), abs(y)) - size / 1.6;
    float r2 = - P.y;
    return max(r1 / SQRT_2, r2);  // Instersect diamond with rectangle
}\
`;
  }
}
InvertedTriangleGLGlyph.initClass();

export class CrossGLGlyph extends MarkerGLGlyph {
  static initClass() {

    this.prototype.GLYPH = 'cross';

    this.prototype.MARKERCODE = `\
float marker(vec2 P, float size)
{
    float square = max(abs(P.x), abs(P.y)) - size / 2.5;  // 2.5 is a tweak
    float cross = min(abs(P.x), abs(P.y)) - size / 100.0;  // bit of "width" for aa
    return max(square, cross);
}\
`;
  }
}
CrossGLGlyph.initClass();

export class CircleCrossGLGlyph extends MarkerGLGlyph {
  static initClass() {

    this.prototype.GLYPH = 'circlecross';

    this.prototype.MARKERCODE = `\
float marker(vec2 P, float size)
{
    // Define quadrants
    float qs = size / 2.0;  // quadrant size
    float s1 = max(abs(P.x - qs), abs(P.y - qs)) - qs;
    float s2 = max(abs(P.x + qs), abs(P.y - qs)) - qs;
    float s3 = max(abs(P.x - qs), abs(P.y + qs)) - qs;
    float s4 = max(abs(P.x + qs), abs(P.y + qs)) - qs;
    // Intersect main shape with quadrants (to form cross)
    float circle = length(P) - size/2.0;
    float c1 = max(circle, s1);
    float c2 = max(circle, s2);
    float c3 = max(circle, s3);
    float c4 = max(circle, s4);
    // Union
    return min(min(min(c1, c2), c3), c4);
}\
`;
  }
}
CircleCrossGLGlyph.initClass();

export class SquareCrossGLGlyph extends MarkerGLGlyph {
  static initClass() {

    this.prototype.GLYPH = 'squarecross';

    this.prototype.MARKERCODE = `\
float marker(vec2 P, float size)
{
    // Define quadrants
    float qs = size / 2.0;  // quadrant size
    float s1 = max(abs(P.x - qs), abs(P.y - qs)) - qs;
    float s2 = max(abs(P.x + qs), abs(P.y - qs)) - qs;
    float s3 = max(abs(P.x - qs), abs(P.y + qs)) - qs;
    float s4 = max(abs(P.x + qs), abs(P.y + qs)) - qs;
    // Intersect main shape with quadrants (to form cross)
    float square = max(abs(P.x), abs(P.y)) - size/2.0;
    float c1 = max(square, s1);
    float c2 = max(square, s2);
    float c3 = max(square, s3);
    float c4 = max(square, s4);
    // Union
    return min(min(min(c1, c2), c3), c4);
}\
`;
  }
}
SquareCrossGLGlyph.initClass();

export class DiamondCrossGLGlyph extends MarkerGLGlyph {
  static initClass() {

    this.prototype.GLYPH = 'diamondcross';

    this.prototype.MARKERCODE = `\
float marker(vec2 P, float size)
{
    // Define quadrants
    float qs = size / 2.0;  // quadrant size
    float s1 = max(abs(P.x - qs), abs(P.y - qs)) - qs;
    float s2 = max(abs(P.x + qs), abs(P.y - qs)) - qs;
    float s3 = max(abs(P.x - qs), abs(P.y + qs)) - qs;
    float s4 = max(abs(P.x + qs), abs(P.y + qs)) - qs;
    // Intersect main shape with quadrants (to form cross)
    float x = SQRT_2 / 2.0 * (P.x * 1.5 - P.y);
    float y = SQRT_2 / 2.0 * (P.x * 1.5 + P.y);
    float diamond = max(abs(x), abs(y)) - size / (2.0 * SQRT_2);
    diamond /= SQRT_2;
    float c1 = max(diamond, s1);
    float c2 = max(diamond, s2);
    float c3 = max(diamond, s3);
    float c4 = max(diamond, s4);
    // Union
    return min(min(min(c1, c2), c3), c4);
}\
`;
  }
}
DiamondCrossGLGlyph.initClass();

export class XGLGlyph extends MarkerGLGlyph {
  static initClass() {

    this.prototype.GLYPH = 'x';

    this.prototype.MARKERCODE = `\
float marker(vec2 P, float size)
{
    float circle = length(P) - size / 1.6;
    float X = min(abs(P.x - P.y), abs(P.x + P.y)) - size / 100.0;  // bit of "width" for aa
    return max(circle, X);
}\
`;
  }
}
XGLGlyph.initClass();

export class CircleXGLGlyph extends MarkerGLGlyph {
  static initClass() {

    this.prototype.GLYPH = 'circlex';

    this.prototype.MARKERCODE = `\
float marker(vec2 P, float size)
{
    float x = P.x - P.y;
    float y = P.x + P.y;
    // Define quadrants
    float qs = size / 2.0;  // quadrant size
    float s1 = max(abs(x - qs), abs(y - qs)) - qs;
    float s2 = max(abs(x + qs), abs(y - qs)) - qs;
    float s3 = max(abs(x - qs), abs(y + qs)) - qs;
    float s4 = max(abs(x + qs), abs(y + qs)) - qs;
    // Intersect main shape with quadrants (to form cross)
    float circle = length(P) - size/2.0;
    float c1 = max(circle, s1);
    float c2 = max(circle, s2);
    float c3 = max(circle, s3);
    float c4 = max(circle, s4);
    // Union
    float almost = min(min(min(c1, c2), c3), c4);
    // In this case, the X is also outside of the main shape
    float Xmask = length(P) - size / 1.6;  // a circle
    float X = min(abs(P.x - P.y), abs(P.x + P.y)) - size / 100.0;  // bit of "width" for aa
    return min(max(X, Xmask), almost);
}\
`;
  }
}
CircleXGLGlyph.initClass();

export class SquareXGLGlyph extends MarkerGLGlyph {
  static initClass() {

    this.prototype.GLYPH = 'squarex';

    this.prototype.MARKERCODE = `\
float marker(vec2 P, float size)
{
    float x = P.x - P.y;
    float y = P.x + P.y;
    // Define quadrants
    float qs = size / 2.0;  // quadrant size
    float s1 = max(abs(x - qs), abs(y - qs)) - qs;
    float s2 = max(abs(x + qs), abs(y - qs)) - qs;
    float s3 = max(abs(x - qs), abs(y + qs)) - qs;
    float s4 = max(abs(x + qs), abs(y + qs)) - qs;
    // Intersect main shape with quadrants (to form cross)
    float square = max(abs(P.x), abs(P.y)) - size/2.0;
    float c1 = max(square, s1);
    float c2 = max(square, s2);
    float c3 = max(square, s3);
    float c4 = max(square, s4);
    // Union
    return min(min(min(c1, c2), c3), c4);
}\
`;
  }
}
SquareXGLGlyph.initClass();

export class AsteriskGLGlyph extends MarkerGLGlyph {
  static initClass() {

    this.prototype.GLYPH = 'asterisk';

    this.prototype.MARKERCODE = `\
float marker(vec2 P, float size)
{
    // Masks
    float diamond = max(abs(SQRT_2 / 2.0 * (P.x - P.y)), abs(SQRT_2 / 2.0 * (P.x + P.y))) - size / (2.0 * SQRT_2);
    float square = max(abs(P.x), abs(P.y)) - size / (2.0 * SQRT_2);
    // Shapes
    float X = min(abs(P.x - P.y), abs(P.x + P.y)) - size / 100.0;  // bit of "width" for aa
    float cross = min(abs(P.x), abs(P.y)) - size / 100.0;  // bit of "width" for aa
    // Result is union of masked shapes
    return min(max(X, diamond), max(cross, square));
}\
`;
  }
}
AsteriskGLGlyph.initClass();

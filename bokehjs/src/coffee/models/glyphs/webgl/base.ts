/* XXX: partial */
// This module implements the Base GL Glyph and some utilities
import {color2rgba} from "core/util/color"

export class BaseGLGlyph {
  static initClass() {

    this.prototype.GLYPH = '';  // name of the glyph that this gl-glyph applies to

    this.prototype.VERT = '';
    this.prototype.FRAG = '';
  }

  constructor(gl, glyph) {
    this.gl = gl;
    this.glyph = glyph;

    this.nvertices = 0;
    this.size_changed = false;
    this.data_changed = false;
    this.visuals_changed = false;

    this.init();
  }

  set_data_changed(n) {
    if (n !== this.nvertices) {
      this.nvertices = n;
      this.size_changed = true;
    }
    return this.data_changed = true;
  }

  set_visuals_changed() {
    return this.visuals_changed = true;
  }

  render(ctx, indices, mainglyph) {
    // Get transform
    let wy;
    let wx = (wy = 1);  // Weights to scale our vectors
    let [dx, dy] = this.glyph.renderer.map_to_screen([0*wx, 1*wx, 2*wx], [0*wy, 1*wy, 2*wy]);
    // Try again, but with weighs so we're looking at ~100 in screen coordinates
    wx = 100 / Math.min(Math.max(Math.abs(dx[1] - dx[0]), 1e-12), 1e12);
    wy = 100 / Math.min(Math.max(Math.abs(dy[1] - dy[0]), 1e-12), 1e12);
    [dx, dy] = this.glyph.renderer.map_to_screen([0*wx, 1*wx, 2*wx], [0*wy, 1*wy, 2*wy]);
    // Test how linear it is
    if ((Math.abs((dx[1] - dx[0]) - (dx[2] - dx[1])) > 1e-6) ||
        (Math.abs((dy[1] - dy[0]) - (dy[2] - dy[1])) > 1e-6)) {
      return false;
    }
    const [sx, sy] = [(dx[1]-dx[0]) / wx, (dy[1]-dy[0]) / wy];
    const trans = {
        pixel_ratio: ctx.pixel_ratio,  // pass pixel_ratio to webgl
        width: ctx.glcanvas.width, height: ctx.glcanvas.height,
        dx: dx[0]/sx, dy: dy[0]/sy, sx, sy
      };
    this.draw(indices, mainglyph, trans);
    return true;
  }
}
BaseGLGlyph.initClass();  // success

export const line_width = function(width) {
    // Increase small values to make it more similar to canvas
    if (width < 2) {
      width = Math.sqrt(width*2);
    }
    return width;
  };

export const fill_array_with_float = function(n, val) {
    const a = new Float32Array(n);
    for (let i = 0, end = n; i < end; i++) {
      a[i] = val;
    }
    return a;
  };

export const fill_array_with_vec = function(n, m, val) {
    const a = new Float32Array(n*m);
    for (let i = 0, end = n; i < end; i++) {
      for (let j = 0, endj = m; j < endj; j++) {
        a[(i*m)+j] = val[j];
      }
    }
    return a;
  };

export const visual_prop_is_singular = (visual, propname) =>
    // This touches the internals of the visual, so we limit use in this function
    // See renderer.coffee:cache_select() for similar code
    visual[propname].spec.value !== undefined
  ;

export const attach_float = function(prog, vbo, att_name, n, visual, name) {
    // Attach a float attribute to the program. Use singleton value if we can,
    // otherwise use VBO to apply array.
    if (!visual.doit) {
      vbo.used = false;
      return prog.set_attribute(att_name, 'float', [0]);
    } else if (visual_prop_is_singular(visual, name)) {
      vbo.used = false;
      return prog.set_attribute(att_name, 'float', visual[name].value());
    } else {
      vbo.used = true;
      const a = new Float32Array(visual.cache[name + '_array']);
      vbo.set_size(n*4);
      vbo.set_data(0, a);
      return prog.set_attribute(att_name, 'float', vbo);
    }
  };

export const attach_color = function(prog, vbo, att_name, n, visual, prefix) {
    // Attach the color attribute to the program. If there's just one color,
    // then use this single color for all vertices (no VBO). Otherwise we
    // create an array and upload that to the VBO, which we attahce to the prog.
    let rgba;
    const m = 4;
    const colorname = prefix + '_color';
    const alphaname = prefix + '_alpha';

    if (!visual.doit) {
      // Don't draw (draw transparent)
      vbo.used = false;
      return prog.set_attribute(att_name, 'vec4', [0,0,0,0]);
    } else if (visual_prop_is_singular(visual, colorname) && visual_prop_is_singular(visual, alphaname)) {
      // Nice and simple; both color and alpha are singular
      vbo.used = false;
      rgba = color2rgba(visual[colorname].value(), visual[alphaname].value());
      return prog.set_attribute(att_name, 'vec4', rgba);
    } else {
      // Use vbo; we need an array for both the color and the alpha
      let alphas, colors;
      vbo.used = true;
      // Get array of colors
      if (visual_prop_is_singular(visual, colorname)) {
        colors = ((() => {
          const result = [];
          for (let i = 0, end = n; i < end; i++) {
            result.push(visual[colorname].value());
          }
          return result;
        })());
      } else {
        colors = visual.cache[colorname+'_array'];
      }
      // Get array of alphas
      if (visual_prop_is_singular(visual, alphaname)) {
        alphas = fill_array_with_float(n, visual[alphaname].value());
      } else {
        alphas = visual.cache[alphaname+'_array'];
      }
      // Create array of rgbs
      const a = new Float32Array(n*m);
      for (let i = 0, end = n; i < end; i++) {
        rgba = color2rgba(colors[i], alphas[i]);
        for (let j = 0, endj = m; j < endj; j++) {
          a[(i*m)+j] = rgba[j];
        }
      }
      // Attach vbo
      vbo.set_size(n*m*4);
      vbo.set_data(0, a);
      return prog.set_attribute(att_name, 'vec4', vbo);
    }
  };

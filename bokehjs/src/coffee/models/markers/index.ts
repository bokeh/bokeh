/* XXX: partial */
import {Marker, MarkerView} from "./marker"
import {Context2d} from "core/util/canvas"

const SQ3 = Math.sqrt(3);

const _one_x =  function(ctx: Context2d, r) {
  ctx.moveTo(-r,  r);
  ctx.lineTo( r, -r);
  ctx.moveTo(-r, -r);
  return ctx.lineTo( r,  r);
};

const _one_cross = function(ctx: Context2d, r) {
  ctx.moveTo( 0,  r);
  ctx.lineTo( 0, -r);
  ctx.moveTo(-r,  0);
  return ctx.lineTo( r,  0);
};

const _one_diamond = function(ctx: Context2d, r) {
  ctx.moveTo(0, r);
  ctx.lineTo(r/1.5, 0);
  ctx.lineTo(0, -r);
  ctx.lineTo(-r/1.5, 0);
  return ctx.closePath();
};

const _one_tri = function(ctx: Context2d, r) {
  const h = r * SQ3;
  const a = h/3;

  // TODO (bev) use viewstate to take y-axis inversion into account
  ctx.moveTo(-r, a);
  ctx.lineTo(r, a);
  ctx.lineTo(0, a-h);
  return ctx.closePath();
};

const asterisk = function(ctx: Context2d, i, _sx, _sy, r, line, _fill) {
  const r2 = r*0.65;

  _one_cross(ctx, r);
  _one_x(ctx, r2);

  if (line.doit) {
    line.set_vectorize(ctx, i);
    ctx.stroke();
  }

};

const circle_cross = function(ctx: Context2d, i, _sx, _sy, r, line, fill)  {
  ctx.arc(0, 0, r, 0, 2*Math.PI, false);

  if (fill.doit) {
    fill.set_vectorize(ctx, i);
    ctx.fill();
  }

  if (line.doit) {
    line.set_vectorize(ctx, i);
    _one_cross(ctx, r);
    ctx.stroke();
  }

};

const circle_x = function(ctx: Context2d, i, _sx, _sy, r, line, fill) {
  ctx.arc(0, 0, r, 0, 2*Math.PI, false);

  if (fill.doit) {
    fill.set_vectorize(ctx, i);
    ctx.fill();
  }

  if (line.doit) {
    line.set_vectorize(ctx, i);
    _one_x(ctx, r);
    ctx.stroke();
  }

};

const cross = function(ctx: Context2d, i, _sx, _sy, r, line, _fill) {
  _one_cross(ctx, r);

  if (line.doit) {
    line.set_vectorize(ctx, i);
    ctx.stroke();
  }

};

const diamond = function(ctx: Context2d, i, _sx, _sy, r, line, fill) {
  _one_diamond(ctx, r);

  if (fill.doit) {
    fill.set_vectorize(ctx, i);
    ctx.fill();
  }

  if (line.doit) {
    line.set_vectorize(ctx, i);
    ctx.stroke();
  }

};

const diamond_cross = function(ctx: Context2d, i, _sx, _sy, r, line, fill) {
  _one_diamond(ctx, r);

  if (fill.doit) {
    fill.set_vectorize(ctx, i);
    ctx.fill();
  }

  if (line.doit) {
    line.set_vectorize(ctx, i);
    _one_cross(ctx, r);
    ctx.stroke();
  }

};

const inverted_triangle = function(ctx: Context2d, i, _sx, _sy, r, line, fill) {
  ctx.rotate(Math.PI);
  _one_tri(ctx, r);
  ctx.rotate(-Math.PI);

  if (fill.doit) {
    fill.set_vectorize(ctx, i);
    ctx.fill();
  }

  if (line.doit) {
    line.set_vectorize(ctx, i);
    ctx.stroke();
  }

};

const square = function(ctx: Context2d, i, _sx, _sy, r, line, fill) {
  const size = 2*r;
  ctx.rect(-r, -r, size, size);

  if (fill.doit) {
    fill.set_vectorize(ctx, i);
    ctx.fill();
  }

  if (line.doit) {
    line.set_vectorize(ctx, i);
    ctx.stroke();
  }

};

const square_cross = function(ctx: Context2d, i, _sx, _sy, r, line, fill) {
  const size = 2*r;
  ctx.rect(-r, -r, size, size);

  if (fill.doit) {
    fill.set_vectorize(ctx, i);
    ctx.fill();
  }

  if (line.doit) {
    line.set_vectorize(ctx, i);
    _one_cross(ctx, r);
    ctx.stroke();
  }

};

const square_x = function(ctx: Context2d, i, _sx, _sy, r, line, fill) {
  const size = 2*r;
  ctx.rect(-r, -r, size, size);

  if (fill.doit) {
    fill.set_vectorize(ctx, i);
    ctx.fill();
  }

  if (line.doit) {
    line.set_vectorize(ctx, i);
    _one_x(ctx, r);
    ctx.stroke();
  }

};

const triangle = function(ctx: Context2d, i, _sx, _sy, r, line, fill) {
  _one_tri(ctx, r);

  if (fill.doit) {
    fill.set_vectorize(ctx, i);
    ctx.fill();
  }

  if (line.doit) {
    line.set_vectorize(ctx, i);
    ctx.stroke();
  }

};

const x = function(ctx: Context2d, i, _sx, _sy, r, line, _fill) {
  _one_x(ctx, r);

  if (line.doit) {
    line.set_vectorize(ctx, i);
    ctx.stroke();
  }

};

const _mk_model = function(type, f) {
  class view extends MarkerView {
    static initClass(): void {
      this.prototype._render_one = f;
    }
  }
  view.initClass();

  class model extends Marker {
    static initClass(): void {
      this.prototype.default_view = view;
      this.prototype.type = type;
    }
  }
  model.initClass();

  return model;
};

// markers are final, so no need to export views
export const Asterisk         = _mk_model('Asterisk',         asterisk);
export const CircleCross      = _mk_model('CircleCross',      circle_cross);
export const CircleX          = _mk_model('CircleX',          circle_x);
export const Cross            = _mk_model('Cross',            cross);
export const Diamond          = _mk_model('Diamond',          diamond);
export const DiamondCross     = _mk_model('DiamondCross',     diamond_cross);
export const InvertedTriangle = _mk_model('InvertedTriangle', inverted_triangle);
export const Square           = _mk_model('Square',           square);
export const SquareCross      = _mk_model('SquareCross',      square_cross);
export const SquareX          = _mk_model('SquareX',          square_x);
export const Triangle         = _mk_model('Triangle',         triangle);
export const X                = _mk_model('X',                x);

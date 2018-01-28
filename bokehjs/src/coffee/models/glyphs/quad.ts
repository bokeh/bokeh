/* XXX: partial */
import {Box, BoxView} from "./box"
import {NumberSpec} from "core/vectorization"
import {RBush} from "core/util/spatial"

export class QuadView extends BoxView {
  model: Quad

  get_anchor_point(anchor, i, _spt) {
    const left = Math.min(this.sleft[i], this.sright[i]);
    const right = Math.max(this.sright[i], this.sleft[i]);
    const top = Math.min(this.stop[i], this.sbottom[i]);     // screen coordinates !!!
    const bottom = Math.max(this.sbottom[i], this.stop[i]);  //

    switch (anchor) {
      case 'top_left':      return {x: left,             y: top              };
      case 'top_center':    return {x: (left + right)/2, y: top              };
      case 'top_right':     return {x: right,            y: top              };
      case 'center_right':  return {x: right,            y: (top + bottom)/2 };
      case 'bottom_right':  return {x: right,            y: bottom           };
      case 'bottom_center': return {x: (left + right)/2, y: bottom           };
      case 'bottom_left':   return {x: left,             y: bottom           };
      case 'center_left':   return {x: left,             y: (top + bottom)/2 };
      case 'center':        return {x: (left + right)/2, y: (top + bottom)/2 };
    }
  }

  scx(i) {
    return (this.sleft[i] + this.sright[i])/2;
  }

  scy(i) {
    return (this.stop[i] + this.sbottom[i])/2;
  }

  _index_data(): RBush {
    return this._index_box(this._right.length);
  }

  _lrtb(i) {
    const l = this._left[i];
    const r = this._right[i];
    const t = this._top[i];
    const b = this._bottom[i];
    return [l, r, t, b];
  }
}

export namespace Quad {
  export interface Attrs extends Box.Attrs {
    right: NumberSpec
    bottom: NumberSpec
    left: NumberSpec
    top: NumberSpec
  }

  export interface Opts extends Box.Opts {}
}

export interface Quad extends Quad.Attrs {}

export class Quad extends Box {

  constructor(attrs?: Partial<Quad.Attrs>, opts?: Quad.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = 'Quad';
    this.prototype.default_view = QuadView;

    this.coords([['right', 'bottom'], ['left', 'top']]);
  }
}
Quad.initClass();

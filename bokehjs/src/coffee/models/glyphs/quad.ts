/* XXX: partial */
import {Box, BoxView} from "./box"

export class QuadView extends BoxView {

  get_anchor_point(anchor, i, spt) {
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

  _index_data() {
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

export class Quad extends Box {
  static initClass() {
    this.prototype.default_view = QuadView;
    this.prototype.type = 'Quad';

    this.coords([['right', 'bottom'], ['left', 'top']]);
  }
}
Quad.initClass();

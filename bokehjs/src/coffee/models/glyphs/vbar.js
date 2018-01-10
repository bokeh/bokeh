import {Box, BoxView} from "./box";
import * as p from "core/properties"
;

export class VBarView extends BoxView {

  scy(i) { return (this.stop[i] + this.sbottom[i])/2; }

  _index_data() {
    return this._index_box(this._x.length);
  }

  _lrtb(i) {
    const l = this._x[i] - (this._width[i]/2);
    const r = this._x[i] + (this._width[i]/2);
    const t = Math.max(this._top[i], this._bottom[i]);
    const b = Math.min(this._top[i], this._bottom[i]);
    return [l, r, t, b];
  }

  _map_data() {
    this.sx = this.renderer.xscale.v_compute(this._x);
    this.stop = this.renderer.yscale.v_compute(this._top);
    this.sbottom = this.renderer.yscale.v_compute(this._bottom);

    this.sleft = [];
    this.sright = [];
    this.sw = this.sdist(this.renderer.xscale, this._x, this._width, 'center');
    for (let i = 0, end = this.sx.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      this.sleft.push(this.sx[i] - (this.sw[i]/2));
      this.sright.push(this.sx[i] + (this.sw[i]/2));
    }
    return null;
  }
}

export class VBar extends Box {
  static initClass() {
    this.prototype.default_view = VBarView;
    this.prototype.type = 'VBar';

    this.coords([['x', 'bottom']]);
    this.define({
      width:  [ p.DistanceSpec  ],
      top:    [ p.NumberSpec    ]
    });
    this.override({ bottom: 0 });
  }
}
VBar.initClass();

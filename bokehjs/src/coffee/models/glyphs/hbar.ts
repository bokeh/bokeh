/* XXX: partial */
import {Box, BoxView} from "./box";
import {DistanceSpec, NumberSpec} from "core/vectorization"
import * as p from "core/properties"
import {RBush} from "core/util/spatial"

export class HBarView extends BoxView {
  model: HBar

  scx(i) { return (this.sleft[i] + this.sright[i])/2; }

  _index_data(): RBush {
    return this._index_box(this._y.length);
  }

  _lrtb(i) {
    const l = Math.min(this._left[i], this._right[i]);
    const r = Math.max(this._left[i], this._right[i]);
    const t = this._y[i] + (0.5 * this._height[i]);
    const b = this._y[i] - (0.5 * this._height[i]);
    return [l, r, t, b];
  }

  _map_data() {
    this.sy = this.renderer.yscale.v_compute(this._y);
    this.sright = this.renderer.xscale.v_compute(this._right);
    this.sleft = this.renderer.xscale.v_compute(this._left);

    this.stop = [];
    this.sbottom = [];
    this.sh = this.sdist(this.renderer.yscale, this._y, this._height, 'center');
    for (let i = 0, end = this.sy.length; i < end; i++) {
      this.stop.push(this.sy[i] - (this.sh[i]/2));
      this.sbottom.push(this.sy[i] + (this.sh[i]/2));
    }
    return null;
  }
}

export namespace HBar {
  export interface Attrs extends Box.Attrs {
    height: DistanceSpec
    right: NumberSpec
  }
}

export interface HBar extends Box, HBar.Attrs {}

export class HBar extends Box {
  static initClass() {
    this.prototype.type = 'HBar';
    this.prototype.default_view = HBarView;

    this.coords([['left', 'y']]);
    this.define({
      height: [ p.DistanceSpec  ],
      right:  [ p.NumberSpec    ],
    });
    this.override({ left: 0 });
  }
}
HBar.initClass();

/* XXX: partial */
import {Box, BoxView, BoxData} from "./box";
import {NumberSpec, DistanceSpec} from "core/vectorization"
import * as p from "core/properties"
import {SpatialIndex} from "core/util/spatial"

export interface VBarData extends BoxData {
}

export interface VBarView extends VBarData {}

export class VBarView extends BoxView {
  model: VBar
  visuals: VBar.Visuals

  scy(i) { return (this.stop[i] + this.sbottom[i])/2; }

  protected _index_data(): SpatialIndex {
    return this._index_box(this._x.length);
  }

  _lrtb(i) {
    const l = this._x[i] - (this._width[i]/2);
    const r = this._x[i] + (this._width[i]/2);
    const t = Math.max(this._top[i], this._bottom[i]);
    const b = Math.min(this._top[i], this._bottom[i]);
    return [l, r, t, b];
  }

  protected _map_data(): void {
    this.sx = this.renderer.xscale.v_compute(this._x);
    this.stop = this.renderer.yscale.v_compute(this._top);
    this.sbottom = this.renderer.yscale.v_compute(this._bottom);

    this.sleft = [];
    this.sright = [];
    this.sw = this.sdist(this.renderer.xscale, this._x, this._width, 'center');
    for (let i = 0, end = this.sx.length; i < end; i++) {
      this.sleft.push(this.sx[i] - (this.sw[i]/2));
      this.sright.push(this.sx[i] + (this.sw[i]/2));
    }
    return null;
  }
}

export namespace VBar {
  export interface Attrs extends Box.Attrs {
    x: NumberSpec
    bottom: NumberSpec
    width: DistanceSpec
    top: NumberSpec
  }

  export interface Visuals extends Box.Visuals {}
}

export interface VBar extends VBar.Attrs {}

export class VBar extends Box {

  constructor(attrs?: Partial<VBar.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'VBar';
    this.prototype.default_view = VBarView;

    this.coords([['x', 'bottom']]);
    this.define({
      width:  [ p.DistanceSpec  ],
      top:    [ p.NumberSpec    ],
    });
    this.override({
      bottom: 0,
    });
  }
}
VBar.initClass();

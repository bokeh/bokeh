/* XXX: partial */
import {Annotation} from "./annotation";
import {Visuals} from "core/visuals";
import * as p from "core/properties"

export class ArrowHead extends Annotation {
  static initClass() {
    this.prototype.type = 'ArrowHead';
  }

  initialize(options: any): void {
    super.initialize(options);
    this.visuals = new Visuals(this);
  }

  render(ctx, i) {
    return null;
  }

  clip(ctx, i) {
    // This method should not begin or close a path
    return null;
  }
}
ArrowHead.initClass();

export class OpenHead extends ArrowHead {
  static initClass() {
    this.prototype.type = 'OpenHead';

    this.mixins(['line']);

    this.define({
        size: [ p.Number, 25 ]
      });
  }

  clip(ctx, i) {
    // This method should not begin or close a path
    this.visuals.line.set_vectorize(ctx, i);
    ctx.moveTo(0.5*this.size, this.size);
    ctx.lineTo(0.5*this.size, -2);
    ctx.lineTo(-0.5*this.size, -2);
    ctx.lineTo(-0.5*this.size, this.size);
    ctx.lineTo(0, 0);
    return ctx.lineTo(0.5*this.size, this.size);
  }

  render(ctx, i) {
    if (this.visuals.line.doit) {
      this.visuals.line.set_vectorize(ctx, i);

      ctx.beginPath();
      ctx.moveTo(0.5*this.size, this.size);
      ctx.lineTo(0, 0);
      ctx.lineTo(-0.5*this.size, this.size);
      return ctx.stroke();
    }
  }
}
OpenHead.initClass();

export class NormalHead extends ArrowHead {
  static initClass() {
    this.prototype.type = 'NormalHead';

    this.mixins(['line', 'fill']);

    this.define({
      size: [ p.Number, 25 ]
    });

    this.override({
      fill_color: 'black'
    });
  }

  clip(ctx, i) {
    // This method should not begin or close a path
    this.visuals.line.set_vectorize(ctx, i);
    ctx.moveTo(0.5*this.size, this.size);
    ctx.lineTo(0.5*this.size, -2);
    ctx.lineTo(-0.5*this.size, -2);
    ctx.lineTo(-0.5*this.size, this.size);
    return ctx.lineTo(0.5*this.size, this.size);
  }

  render(ctx, i) {
    if (this.visuals.fill.doit) {
      this.visuals.fill.set_vectorize(ctx, i);
      this._normal(ctx, i);
      ctx.fill();
    }

    if (this.visuals.line.doit) {
      this.visuals.line.set_vectorize(ctx, i);
      this._normal(ctx, i);
      return ctx.stroke();
    }
  }

  _normal(ctx, i) {
    ctx.beginPath();
    ctx.moveTo(0.5*this.size, this.size);
    ctx.lineTo(0, 0);
    ctx.lineTo(-0.5*this.size, this.size);
    return ctx.closePath();
  }
}
NormalHead.initClass();

export class VeeHead extends ArrowHead {
  static initClass() {
    this.prototype.type = 'VeeHead';

    this.mixins(['line', 'fill']);

    this.define({
      size: [ p.Number, 25 ]
    });

    this.override({
      fill_color: 'black'
    });
  }

  clip(ctx, i) {
    // This method should not begin or close a path
    this.visuals.line.set_vectorize(ctx, i);
    ctx.moveTo(0.5*this.size, this.size);
    ctx.lineTo(0.5*this.size, -2);
    ctx.lineTo(-0.5*this.size, -2);
    ctx.lineTo(-0.5*this.size, this.size);
    ctx.lineTo(0, 0.5*this.size);
    return ctx.lineTo(0.5*this.size, this.size);
  }

  render(ctx, i) {
    if (this.visuals.fill.doit) {
      this.visuals.fill.set_vectorize(ctx, i);
      this._vee(ctx, i);
      ctx.fill();
    }

    if (this.visuals.line.doit) {
      this.visuals.line.set_vectorize(ctx, i);
      this._vee(ctx, i);
      return ctx.stroke();
    }
  }

  _vee(ctx, i) {
    ctx.beginPath();
    ctx.moveTo(0.5*this.size, this.size);
    ctx.lineTo(0, 0);
    ctx.lineTo(-0.5*this.size, this.size);
    ctx.lineTo(0, 0.5*this.size);
    return ctx.closePath();
  }
}
VeeHead.initClass();

export class TeeHead extends ArrowHead {
  static initClass() {
    this.prototype.type = 'TeeHead';

    this.mixins(['line']);

    this.define({
      size: [ p.Number, 25 ]
    });
  }

  render(ctx, i) {
    if (this.visuals.line.doit) {
      this.visuals.line.set_vectorize(ctx, i);
      ctx.beginPath();
      ctx.moveTo(0.5*this.size, 0);
      ctx.lineTo(-0.5*this.size, 0);
      return ctx.stroke();
    }
  }
}
TeeHead.initClass();

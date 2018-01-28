import {Annotation} from "./annotation"
import {Visuals, Line, Fill} from "core/visuals"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"

export namespace ArrowHead {
  export interface Attrs extends Annotation.Attrs {
    size: number
  }

  export interface Opts extends Annotation.Opts {}
}

export interface ArrowHead extends ArrowHead.Attrs {}

export abstract class ArrowHead extends Annotation {

  static initClass() {
    this.prototype.type = 'ArrowHead'

    this.define({
      size: [ p.Number, 25 ],
    })
  }

  visuals: Visuals

  initialize(): void {
    super.initialize()
    this.visuals = new Visuals(this)
  }

  abstract render(ctx: Context2d, i: number): void

  abstract clip(ctx: Context2d, i: number): void // This method should not begin or close a path
}
ArrowHead.initClass()

export namespace OpenHead {
  export interface Attrs extends ArrowHead.Attrs {
  }

  export interface Opts extends ArrowHead.Opts {}
}

export interface OpenHead extends OpenHead.Attrs {}

export class OpenHead extends ArrowHead {

  static initClass() {
    this.prototype.type = 'OpenHead'

    this.mixins(['line'])
  }

  visuals: Visuals & {line: Line}

  clip(ctx: Context2d, i: number): void {
    // This method should not begin or close a path
    this.visuals.line.set_vectorize(ctx, i)
    ctx.moveTo(0.5*this.size, this.size)
    ctx.lineTo(0.5*this.size, -2)
    ctx.lineTo(-0.5*this.size, -2)
    ctx.lineTo(-0.5*this.size, this.size)
    ctx.lineTo(0, 0)
    ctx.lineTo(0.5*this.size, this.size)
  }

  render(ctx: Context2d, i: number): void {
    if (this.visuals.line.doit) {
      this.visuals.line.set_vectorize(ctx, i)

      ctx.beginPath()
      ctx.moveTo(0.5*this.size, this.size)
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*this.size, this.size)
      ctx.stroke()
    }
  }
}
OpenHead.initClass()

export namespace NormalHead {
  export interface Attrs extends ArrowHead.Attrs {
  }

  export interface Opts extends ArrowHead.Opts {}
}

export interface NormalHead extends NormalHead.Attrs {}

export class NormalHead extends ArrowHead {

  static initClass() {
    this.prototype.type = 'NormalHead'

    this.mixins(['line', 'fill'])

    this.override({
      fill_color: 'black',
    })
  }

  visuals: Visuals & {line: Line, fill: Fill}

  clip(ctx: Context2d, i: number): void {
    // This method should not begin or close a path
    this.visuals.line.set_vectorize(ctx, i)
    ctx.moveTo(0.5*this.size, this.size)
    ctx.lineTo(0.5*this.size, -2)
    ctx.lineTo(-0.5*this.size, -2)
    ctx.lineTo(-0.5*this.size, this.size)
    ctx.lineTo(0.5*this.size, this.size)
  }

  render(ctx: Context2d, i: number): void {
    if (this.visuals.fill.doit) {
      this.visuals.fill.set_vectorize(ctx, i)
      this._normal(ctx, i)
      ctx.fill()
    }

    if (this.visuals.line.doit) {
      this.visuals.line.set_vectorize(ctx, i)
      this._normal(ctx, i)
      ctx.stroke()
    }
  }

  _normal(ctx: Context2d, _i: number): void {
    ctx.beginPath()
    ctx.moveTo(0.5*this.size, this.size)
    ctx.lineTo(0, 0)
    ctx.lineTo(-0.5*this.size, this.size)
    ctx.closePath()
  }
}
NormalHead.initClass()

export namespace VeeHead {
  export interface Attrs extends ArrowHead.Attrs {
  }

  export interface Opts extends ArrowHead.Opts {}
}

export interface VeeHead extends VeeHead.Attrs {}

export class VeeHead extends ArrowHead {

  static initClass() {
    this.prototype.type = 'VeeHead'

    this.mixins(['line', 'fill'])

    this.override({
      fill_color: 'black',
    })
  }

  visuals: Visuals & {line: Line, fill: Fill}

  clip(ctx: Context2d, i: number): void {
    // This method should not begin or close a path
    this.visuals.line.set_vectorize(ctx, i)
    ctx.moveTo(0.5*this.size, this.size)
    ctx.lineTo(0.5*this.size, -2)
    ctx.lineTo(-0.5*this.size, -2)
    ctx.lineTo(-0.5*this.size, this.size)
    ctx.lineTo(0, 0.5*this.size)
    ctx.lineTo(0.5*this.size, this.size)
  }

  render(ctx: Context2d, i: number): void {
    if (this.visuals.fill.doit) {
      this.visuals.fill.set_vectorize(ctx, i)
      this._vee(ctx, i)
      ctx.fill()
    }

    if (this.visuals.line.doit) {
      this.visuals.line.set_vectorize(ctx, i)
      this._vee(ctx, i)
      ctx.stroke()
    }
  }

  _vee(ctx: Context2d, _i: number): void {
    ctx.beginPath()
    ctx.moveTo(0.5*this.size, this.size)
    ctx.lineTo(0, 0)
    ctx.lineTo(-0.5*this.size, this.size)
    ctx.lineTo(0, 0.5*this.size)
    ctx.closePath()
  }
}
VeeHead.initClass()

export namespace TeeHead {
  export interface Attrs extends ArrowHead.Attrs {
  }

  export interface Opts extends ArrowHead.Opts {}
}

export interface TeeHead extends TeeHead.Attrs {}

export class TeeHead extends ArrowHead {

  static initClass() {
    this.prototype.type = 'TeeHead'

    this.mixins(['line'])
  }

  visuals: Visuals & {line: Line}

  render(ctx: Context2d, i: number): void {
    if (this.visuals.line.doit) {
      this.visuals.line.set_vectorize(ctx, i)
      ctx.beginPath()
      ctx.moveTo(0.5*this.size, 0)
      ctx.lineTo(-0.5*this.size, 0)
      ctx.stroke()
    }
  }

  clip(_ctx: Context2d, _i: number): void {}
}
TeeHead.initClass()

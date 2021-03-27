import {Expression} from "../expressions/expression"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Arrayable} from "core/types"
import {Direction} from "core/enums"
import * as p from "core/properties"

export namespace PolarTransform {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Expression.Props & {
    radius: p.DistanceSpec
    angle: p.AngleSpec
    direction: p.Property<Direction>
  }
}

export interface PolarTransform extends PolarTransform.Attrs {}

export class PolarTransform extends Expression<{x: Float64Array, y: Float64Array}> {
  properties: PolarTransform.Props

  constructor(attrs?: Partial<PolarTransform.Attrs>) {
    super(attrs)
  }

  static init_PolarTransform(): void {
    this.define<PolarTransform.Props>(({}) => ({
      radius: [ p.DistanceSpec, {field: "radius"} ],
      angle: [ p.AngleSpec, {field: "angle"} ],
      direction: [ Direction, "anticlock" ],
    }))
  }

  get x(): XComponent {
    return new XComponent({transform: this})
  }

  get y(): YComponent {
    return new YComponent({transform: this})
  }

  protected _v_compute(source: ColumnarDataSource) {
    const radius = this.properties.radius.uniform(source)
    const angle = this.properties.angle.uniform(source)

    const coeff = this.direction == "anticlock" ? -1 : 1

    const n = Math.min(radius.length, angle.length)
    const x = new Float64Array(n)
    const y = new Float64Array(n)

    for (let i = 0; i < n; i++) {
      const radius_i = radius.get(i)
      const angle_i = angle.get(i)*coeff

      x[i] = radius_i*Math.cos(angle_i)
      y[i] = radius_i*Math.sin(angle_i)
    }

    return {x, y}
  }
}

export namespace XYComponent {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Expression.Props & {
    transform: p.Property<PolarTransform>
  }
}

export interface XYComponent extends XYComponent.Attrs {}

export abstract class XYComponent extends Expression {
  properties: XYComponent.Props

  constructor(attrs?: Partial<XYComponent.Attrs>) {
    super(attrs)
  }

  static init_XYComponent(): void {
    this.define<XYComponent.Props>(({Ref}) => ({
      transform: [ Ref(PolarTransform) ],
    }))
  }
}

export namespace XComponent {
  export type Attrs = p.AttrsOf<Props>
  export type Props = XYComponent.Props
}

export interface XComponent extends XComponent.Attrs {}

export class XComponent extends XYComponent {
  properties: XComponent.Props

  constructor(attrs?: Partial<XComponent.Attrs>) {
    super(attrs)
  }

  protected _v_compute(source: ColumnarDataSource): Arrayable<number> {
    return this.transform.v_compute(source).x
  }
}

export namespace YComponent {
  export type Attrs = p.AttrsOf<Props>
  export type Props = XYComponent.Props
}

export interface YComponent extends YComponent.Attrs {}

export class YComponent extends XYComponent {
  properties: YComponent.Props

  constructor(attrs?: Partial<YComponent.Attrs>) {
    super(attrs)
  }

  protected _v_compute(source: ColumnarDataSource): Arrayable<number> {
    return this.transform.v_compute(source).y
  }
}

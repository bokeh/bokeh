import {Expression} from "../expressions/expression"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Arrayable} from "core/types"
import * as p from "core/properties"

export namespace CoordinateTransform {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Expression.Props
}

export interface CoordinateTransform extends CoordinateTransform.Attrs {}

export abstract class CoordinateTransform extends Expression<{x: Float64Array, y: Float64Array}> {
  override properties: CoordinateTransform.Props

  constructor(attrs?: Partial<CoordinateTransform.Attrs>) {
    super(attrs)
  }

  static init_CoordinateTransform(): void {}

  get x(): XComponent {
    return new XComponent({transform: this})
  }

  get y(): YComponent {
    return new YComponent({transform: this})
  }
}

export namespace XYComponent {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Expression.Props & {
    transform: p.Property<CoordinateTransform>
  }
}

export interface XYComponent extends XYComponent.Attrs {}

export abstract class XYComponent extends Expression {
  override properties: XYComponent.Props

  constructor(attrs?: Partial<XYComponent.Attrs>) {
    super(attrs)
  }

  static init_XYComponent(): void {
    this.define<XYComponent.Props>(({Ref}) => ({
      transform: [ Ref(CoordinateTransform) ],
    }))
  }
}

export namespace XComponent {
  export type Attrs = p.AttrsOf<Props>
  export type Props = XYComponent.Props
}

export interface XComponent extends XComponent.Attrs {}

export class XComponent extends XYComponent {
  override properties: XComponent.Props

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
  override properties: YComponent.Props

  constructor(attrs?: Partial<YComponent.Attrs>) {
    super(attrs)
  }

  protected _v_compute(source: ColumnarDataSource): Arrayable<number> {
    return this.transform.v_compute(source).y
  }
}

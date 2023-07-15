import {Expression} from "../expressions/expression"
import type {ColumnarDataSource} from "../sources/columnar_data_source"
import type {Arrayable} from "core/types"
import type * as p from "core/properties"

export namespace CoordinateTransform {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Expression.Props
}

export interface CoordinateTransform extends CoordinateTransform.Attrs {}

type CoordinateType = Arrayable<number> | Arrayable<number>[]

export abstract class CoordinateTransform extends Expression<{x: CoordinateType, y: CoordinateType}> {
  declare properties: CoordinateTransform.Props

  constructor(attrs?: Partial<CoordinateTransform.Attrs>) {
    super(attrs)
  }

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
  declare properties: XYComponent.Props

  constructor(attrs?: Partial<XYComponent.Attrs>) {
    super(attrs)
  }

  static {
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
  declare properties: XComponent.Props

  constructor(attrs?: Partial<XComponent.Attrs>) {
    super(attrs)
  }

  protected _v_compute(source: ColumnarDataSource): CoordinateType {
    return this.transform.v_compute(source).x
  }
}

export namespace YComponent {
  export type Attrs = p.AttrsOf<Props>
  export type Props = XYComponent.Props
}

export interface YComponent extends YComponent.Attrs {}

export class YComponent extends XYComponent {
  declare properties: YComponent.Props

  constructor(attrs?: Partial<YComponent.Attrs>) {
    super(attrs)
  }

  protected _v_compute(source: ColumnarDataSource): CoordinateType {
    return this.transform.v_compute(source).y
  }
}

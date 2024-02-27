import {Coordinate} from "./coordinate"
import {Model} from "../../model"
import type * as p from "core/properties"
import {Enum, Or, Ref} from "core/kinds"

export const ImplicitTarget = Enum("canvas", "plot", "frame", "parent")
export type ImplicitTarget = typeof ImplicitTarget["__type__"]

export const NodeTarget = Or(Ref(Model), ImplicitTarget)
export type NodeTarget = typeof NodeTarget["__type__"]

type BoxSymbol = "left" | "right" | "top" | "bottom"

export class BoxNodes {
  constructor(readonly target: ImplicitTarget, readonly frozen: boolean = false) {}

  private _node(symbol: BoxSymbol): Node {
    const {target, frozen} = this
    const node = new Node({target, symbol})
    if (frozen) {
      this[`_${symbol}`] = node
    }
    return node
  }

  private _left: Node | null = null
  get left(): Node {
    return this._left ?? this._node("left")
  }

  private _right: Node | null = null
  get right(): Node {
    return this._right ?? this._node("right")
  }

  private _top: Node | null = null
  get top(): Node {
    return this._top ?? this._node("top")
  }

  private _bottom: Node | null = null
  get bottom(): Node {
    return this._bottom ?? this._node("bottom")
  }

  freeze(): BoxNodes {
    return new BoxNodes(this.target, true)
  }
}

export namespace Node {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Coordinate.Props & {
    target: p.Property<NodeTarget> // TODO Canvas, Plot, CartesianFrame, Renderer ???
    symbol: p.Property<string>
    offset: p.Property<number>
  }
}

export interface Node extends Node.Attrs {}

export class Node extends Coordinate {
  declare properties: Node.Props

  constructor(attrs?: Partial<Node.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Node.Props>(({Str, Int}) => ({
      target: [ NodeTarget ],
      symbol: [ Str ],
      offset: [ Int, 0 ],
    }))
  }

  private static _frame_nodes = new BoxNodes("frame")
  static get frame(): BoxNodes {
    return this._frame_nodes
  }

  private static _canvas_nodes = new BoxNodes("canvas")
  static get canvas(): BoxNodes {
    return this._canvas_nodes
  }
}

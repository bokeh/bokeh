import {Coordinate} from "./coordinate"
import {Model} from "../../model"
import type * as p from "core/properties"
import {Enum, Or, Ref} from "../../core/kinds"

export const ImplicitTarget = Enum("canvas", "plot", "frame", "parent")
export type ImplicitTarget = typeof ImplicitTarget["__type__"]

export const NodeTarget = Or(Ref(Model), ImplicitTarget)
export type NodeTarget = typeof NodeTarget["__type__"]

export namespace Node {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Coordinate.Props & {
    target: p.Property<NodeTarget> // TODO Canvas, Plot, CartesianFrame, Renderer ???
    term: p.Property<string>
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
    this.define<Node.Props>(({String, Int}) => ({
      target: [ NodeTarget ],
      term: [ String ],
      offset: [ Int, 0 ],
    }))
  }
}

export const frame_left = new Node({target: "frame", term: "left"})
export const frame_right = new Node({target: "frame", term: "right"})
export const frame_top = new Node({target: "frame", term: "top"})
export const frame_bottom = new Node({target: "frame", term: "bottom"})

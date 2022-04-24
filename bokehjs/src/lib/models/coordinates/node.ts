import {Coordinate} from "./coordinate"
import {type Renderer} from "../renderers/renderer"
import * as p from "core/properties"

export namespace Node {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Coordinate.Props & {
    target: p.Property<Renderer>
    term: p.Property<string>
  }
}

export interface Node extends Node.Attrs {}

export class Node extends Coordinate {
  override properties: Node.Props

  constructor(attrs?: Partial<Node.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Node.Props>(({String, AnyRef}) => ({
      target: [ AnyRef() ],
      term: [ String ],
    }))
  }
}

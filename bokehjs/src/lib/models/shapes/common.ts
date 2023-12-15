import {Struct, Ref, Enum} from "../../core/kinds"
import {ArrowHead} from "./arrow_heads"

export type Decoration = typeof Decoration["__type__"]
export const Decoration = Struct({
  marker: Ref(ArrowHead),
  node: Enum("start", "middle", "end"),
})

import {HasProps} from "./has_props"
import {HitTestResult} from "./hittest"
import * as p from "./properties"

export class Selector extends HasProps {

  indices: HitTestResult
  final: boolean
  timestamp: Date

  update(indices: HitTestResult, final: boolean, append: boolean, silent: boolean = false): void {
    this.setv('timestamp', new Date(), {silent: silent})
    this.setv('final', final, {silent: silent})
    if (append)
      indices.update_through_union(this.indices)
    this.setv('indices', indices, {silent: silent})
  }

  clear(): void {
    this.timestamp = new Date()
    this.final = true
    this.indices = new HitTestResult()
  }
}

Selector.prototype.type = "Selector"

Selector.internal({
  indices:   [ p.Any, () => new HitTestResult() ],
  final:     [ p.Boolean ],
  timestamp: [ p.Any ],
})

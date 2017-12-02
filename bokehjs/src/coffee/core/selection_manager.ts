import {HasProps} from "./has_props"
import {Selector} from "./selector"
import {Geometry} from "./geometry"
import * as hittest from "./hittest"
import * as p from "./properties"

import {DataSource} from "models/sources/data_source"

// XXX: temporary types
export type Renderer = any
export type RendererView = any

export class SelectionManager extends HasProps {

  source: DataSource

  selector: Selector
  inspectors: {[key: string]: HasProps}

  initialize(attrs: any, options: any): void {
    super.initialize(attrs, options)
    this.selector = new Selector()
    this.inspectors = {}
  }

  select(renderer_views: RendererView[], geometry: Geometry, final: boolean, append: boolean = false): boolean {
    let did_hit = false
    for (const r of renderer_views) {
      did_hit = did_hit || r.hit_test(geometry, final, append)
    }
    return did_hit
  }

  inspect(renderer_view: RendererView, geometry: Geometry): boolean {
    let did_hit = false
    did_hit = did_hit || renderer_view.hit_test(geometry, false, false, "inspect")
    return did_hit
  }

  clear(_rview: RendererView): void {
    this.selector.clear()
    this.source.selected = hittest.create_hit_test_result()
  }

  get_or_create_inspector(rmodel: Renderer): HasProps {
    if (this.inspectors[rmodel.id] == null)
      this.inspectors[rmodel.id] = new Selector()
    return this.inspectors[rmodel.id]
  }
}

SelectionManager.prototype.type = "SelectionManager"

SelectionManager.internal({
  source: [ p.Any ]
})

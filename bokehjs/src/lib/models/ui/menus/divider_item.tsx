import {Model} from "../../../model"
import {DOMComponentView} from "core/dom_view"
import type {VNode} from "core/vdom"
import {UIComponent} from "core/vdom"
import type * as p from "core/properties"

import * as menus from "styles/menus.css"

/**
 * A divider between items of menus and toolbars. Its appearance is determined by
 * stylesheets of its container (using `.bk-divider` class), because it depends
 * on the container's orientation.
 */
export class DividerItemView extends DOMComponentView {
  declare model: DividerItem

  override initialize(): void {
    super.initialize()
    // Nothing to wait for.
    this.mark_finished()
  }

  override component(): VNode {
    return <UIComponent parent={this.resolved_props} class={menus.divider}/>
  }
}

export namespace DividerItem {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface DividerItem extends DividerItem.Attrs {}

export class DividerItem extends Model {
  declare properties: DividerItem.Props
  declare __view_type__: DividerItemView

  static {
    this.prototype.default_view = DividerItemView
  }
}

/**
 * Removes dividers that don't separate anything, i.e. leading and trailing
 * dividers and all but one of consecutive dividers.
 */
export function collapse_dividers<T>(items: Iterable<T>, is_divider: (item: T) => boolean): T[] {
  const result: T[] = []
  let pending: {divider: T} | null = null
  for (const item of items) {
    if (is_divider(item)) {
      if (result.length != 0) {
        pending ??= {divider: item}
      }
    } else {
      if (pending != null) {
        result.push(pending.divider)
        pending = null
      }
      result.push(item)
    }
  }
  return result
}

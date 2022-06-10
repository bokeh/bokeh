import {MenuItem, MenuItemView} from "./menu_item"
import * as p from "core/properties"

export class SectionView extends MenuItemView {
  override model: Section

  override render(): void {
    super.render()
  }
}

export namespace Section {
  export type Attrs = p.AttrsOf<Props>

  export type Props = MenuItem.Props & {
    items: p.Property<MenuItem[]>
  }
}

export interface Section extends Section.Attrs {}

export class Section extends MenuItem {
  override properties: Section.Props
  override __view_type__: SectionView

  constructor(attrs?: Partial<Section.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SectionView

    this.define<Section.Props>(({Array, Ref}) => ({
      items: [ Array(Ref(MenuItem)), [] ],
    }))
  }
}

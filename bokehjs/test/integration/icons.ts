import {display} from "./_util"

import icons_css, * as icons from "@bokehjs/styles/icons.css"
import {entries} from "@bokehjs/core/util/object"
import {UIElement, UIElementView} from "@bokehjs/models/ui/ui_element"
import {div} from "@bokehjs/core/dom"
import type * as p from "@bokehjs/core/properties"

export class FlexDivView extends UIElementView {
  declare model: FlexDiv
  static override tag_name = "div" as const

  override render(): void {
    super.render()

    for (const child of this.model.children) {
      this.shadow_el.appendChild(child)
    }
  }
}

export namespace FlexDiv {
  export type Attrs = p.AttrsOf<Props>
  export type Props = UIElement.Props & {
    children: p.Property<Node[]>
  }
}

export interface FlexDiv extends FlexDiv.Attrs {}

export class FlexDiv extends UIElement {
  declare properties: FlexDiv.Props
  declare __view_type__: FlexDivView

  constructor(attrs?: Partial<FlexDiv.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = FlexDivView

    this.define<FlexDiv.Props>(({List, Node}) => ({
      children: [ List(Node), [] ],
    }))
  }
}

describe("Icons", () => {
  it("should support all icons defined in less/icons.less", async () => {
    const size = 24

    const css = `
      :host {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        width: 300px;
        height: max-content;
        background-color: white;
        gap: 10px;
      }

      .test-icon {
        width: ${size}px;
        height: ${size}px;

        mask-size: 100% 100%;
        mask-position: center center;
        mask-repeat: no-repeat;
        -webkit-mask-size: 100% 100%;
        -webkit-mask-position: center center;
        -webkit-mask-repeat: no-repeat;

        /* for PNG icons; remove when dropped */
        background-size: 100% 100%;
        background-origin: border-box;
        background-color: transparent;
        background-position: center center;
        background-repeat: no-repeat;
      }
    `

    const children = entries(icons)
      .filter(([name]) => name != "default")
      .map(([, icon]) => div({class: ["test-icon", icon]}))

    const container = new FlexDiv({stylesheets: [css, icons_css], children})
    await display(container, null)
  })
})

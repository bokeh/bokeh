import {display, fig} from "./_util"

import {PanTool, SaveTool} from "@bokehjs/models"
import {stylesheet} from "@bokehjs/core/dom"

function svg_data_url(svg: string): string {
  return `data:image/svg+xml;utf-8,${svg}`
}

describe("Feature", () => {
  describe("in issue #10914", () => {
    const both = svg_data_url(`\
<svg version="1.1" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <path d="M 4,16 12,10 20,10 28,16 20,22 12,22 Z" fill="black" />
  <path d="M 16,4 10,12 10,20 16,28 22,20 22,12 Z" fill="black" />
</svg>
`)
    const width = svg_data_url(`\
<svg version="1.1" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <path d="M 4,16 12,10 20,10 28,16 20,22 12,22 Z" fill="black" />
</svg>
`)
    const height = svg_data_url(`\
<svg version="1.1" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <path d="M 16,4 10,12 10,20 16,28 22,20 22,12 Z" fill="black" />
</svg>
`)

    before_each(() => {
      // this will append exactly once; don't remove for manual review
      stylesheet.append(`
        .pan-tool-custom-icon-both {
          background-image: url("${encodeURI(both)}");
        }
        .pan-tool-custom-icon-width {
          background-image: url("${encodeURI(width)}");
        }
        .pan-tool-custom-icon-height {
          background-image: url("${encodeURI(height)}");
        }
      `)
    })

    it("should allow customizing tool icons", async () => {
      const tools = [
        new PanTool({icon: null, dimensions: "both"}),
        new PanTool({icon: null, dimensions: "width"}),
        new PanTool({icon: null, dimensions: "height"}),
        new PanTool({icon: both, dimensions: "both"}),
        new PanTool({icon: width, dimensions: "width"}),
        new PanTool({icon: height, dimensions: "height"}),
        new PanTool({icon: ".pan-tool-custom-icon-both", dimensions: "both"}),
        new PanTool({icon: ".pan-tool-custom-icon-width", dimensions: "width"}),
        new PanTool({icon: ".pan-tool-custom-icon-height", dimensions: "height"}),
        new SaveTool({icon: "copy_to_clipboard"}),
      ]
      const p = fig([400, 100], {toolbar_location: "above", tools})
      p.line([1, 2, 3], [1, 2, 3])
      await display(p)
    })
  })
})

import {display, fig} from "./_util"
import {PlotActions, xy} from "./_interactive"

import {PanTool, SaveTool, CrosshairTool, Span, GridBox} from "@bokehjs/models"
import {paint} from "@bokehjs/core/util/defer"
import {assert} from "@bokehjs/core/util/assert"

function svg_data_url(svg: string): string {
  return `data:image/svg+xml;utf-8,${svg}`
}

describe("Feature", () => {
  describe("in issue #10914", () => {
    const both = svg_data_url(`\
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
      <g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15.7001 12.3748L12.4685 16.4143C12.2283 16.7146 11.7717 16.7146 11.5315 16.4143L8.29985 12.3748C8.12455 12.1557 8.12455 11.8443 8.29985 11.6252L11.5315 7.58565C11.7717 7.28541 12.2283 7.28541 12.4685 7.58565L15.7001 11.6252C15.8755 11.8443 15.8755 12.1557 15.7001 12.3748Z"/>
        <path d="M12 22V20"/>
        <path d="M12 4V2"/>
        <path d="M4 12H2"/>
        <path d="M22 12H20"/>
      </g>
    </svg>
    `)

    const width = svg_data_url(`\
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
      <g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15.7001 12.3748L12.4685 16.4143C12.2283 16.7146 11.7717 16.7146 11.5315 16.4143L8.29985 12.3748C8.12455 12.1557 8.12455 11.8443 8.29985 11.6252L11.5315 7.58565C11.7717 7.28541 12.2283 7.28541 12.4685 7.58565L15.7001 11.6252C15.8755 11.8443 15.8755 12.1557 15.7001 12.3748Z"/>
        <path d="M4 12H2"/>
        <path d="M22 12H20"/>
      </g>
    </svg>
    `)

    const height = svg_data_url(`\
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
      <g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15.7001 12.3748L12.4685 16.4143C12.2283 16.7146 11.7717 16.7146 11.5315 16.4143L8.29985 12.3748C8.12455 12.1557 8.12455 11.8443 8.29985 11.6252L11.5315 7.58565C11.7717 7.28541 12.2283 7.28541 12.4685 7.58565L15.7001 11.6252C15.8755 11.8443 15.8755 12.1557 15.7001 12.3748Z"/>
        <path d="M12 22V20"/>
        <path d="M12 4V2"/>
      </g>
    </svg>
    `)

    it("should allow customizing tool icons", async () => {
      const tools = [
        new PanTool({icon: null, dimensions: "both"}),
        new PanTool({icon: null, dimensions: "width"}),
        new PanTool({icon: null, dimensions: "height"}),
        new PanTool({icon: both, dimensions: "both"}),
        new PanTool({icon: width, dimensions: "width"}),
        new PanTool({icon: height, dimensions: "height"}),
        new PanTool({icon: "--pan-tool-custom-icon-both", dimensions: "both"}),
        new PanTool({icon: "--pan-tool-custom-icon-width", dimensions: "width"}),
        new PanTool({icon: "--pan-tool-custom-icon-height", dimensions: "height"}),
        new SaveTool({icon: "copy"}),
      ]

      const p = fig([400, 100], {toolbar_location: "above", tools})
      p.line([1, 2, 3], [1, 2, 3])

      p.stylesheets.push(`
        :host {
          --pan-tool-custom-icon-both: url("${encodeURI(both)}");
          --pan-tool-custom-icon-width: url("${encodeURI(width)}");
          --pan-tool-custom-icon-height: url("${encodeURI(height)}");
        }
      `)

      await display(p)
    })
  })

  describe("in issue #4698", () => {
    it("should allow to undo zoom with dblclick gesture", async () => {
      const p = fig([300, 300], {tools: ["box_zoom", "reset"], toolbar_location: "right"})
      p.circle({x: [1, 2, 3, 4], y: [1, 2, 3, 4], radius: [0.25, 0.50, 0.75, 1.00], fill_alpha: 0.8})
      const {view} = await display(p)
      await paint()

      const actions = new PlotActions(view)
      await actions.pan(xy(1, 1), xy(4, 4))
      await actions.pan(xy(2, 2), xy(3, 3))
      await actions.double_tap(xy(2.5, 2.5))
    })
  })

  describe("in issue #3799", () => {
    it("should allow to linked crosshairs", async () => {
      const width = new Span({dimension: "width", line_dash: "dashed"})
      const height = new Span({dimension: "height", line_dash: "dotted"})

      const tool0 = new CrosshairTool({overlay: [width, height]})
      const tool1 = new CrosshairTool({overlay: [width, height]})

      const p0 = fig([200, 400], {tools: [tool0], toolbar_location: "above"})
      p0.circle({x: [1, 2, 3, 4], y: [1, 2, 3, 4], radius: [0.25, 0.50, 0.75, 1.00], fill_alpha: 0.8})

      const p1 = fig([400, 200], {tools: [tool1], toolbar_location: "right"})
      p1.circle({x: [1, 2, 3, 4], y: [1, 2, 3, 4], radius: [0.25, 0.50, 0.75, 1.00], fill_alpha: 0.8})

      const grid = new GridBox({
        children: [
          [p0, 0, 0],
          [p1, 1, 1],
        ],
        cols: "min",
        rows: "min",
      })

      const {view} = await display(grid)
      await paint()

      const pv0 = view.owner.find_one(p0)
      assert(pv0 != null, "view not found")

      const actions = new PlotActions(pv0)
      await actions.hover(xy(1, 1), xy(4, 4))
    })
  })
})

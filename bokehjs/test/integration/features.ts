import {display, fig} from "./_util"

import {PanTool, SaveTool} from "@bokehjs/models"
//import {stylesheet} from "@bokehjs/core/dom"

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
})

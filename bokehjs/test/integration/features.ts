import {display, fig} from "./_util"

import {PanTool, SaveTool} from "@bokehjs/models"
import {MouseButton, offset_bbox} from "@bokehjs/core/dom"
import {paint, delay} from "@bokehjs/core/util/defer"
import {linspace, zip} from "@bokehjs/core/util/array"

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

      async function trigger() {
        const el = view.canvas.events_el

        type Point = {x: number, y: number}
        function screen({x, y}: Point): {clientX: number, clientY: number} {
          const {x_scale, y_scale} = view.frame
          const {left, top} = offset_bbox(el)
          return {
            clientX: left + x_scale.compute(x),
            clientY: top + y_scale.compute(y),
          }
        }

        const common: Partial<PointerEventInit> = {
          bubbles: true,
          composed: true,
          isPrimary: true,
          pointerType: "mouse",
          pointerId: 1,
          ctrlKey: false,
          shiftKey: false,
          view: window,
        }

        const MOVE_PRESSURE = 0.0
        const DRAG_PRESSURE = 0.5

        function* move(start: Point, end: Point, n: number = 5, pressure: number = MOVE_PRESSURE): Iterable<PointerEvent> {
          const xs = linspace(start.x, end.x, n)
          const ys = linspace(start.y, end.y, n)
          for (const [x, y] of zip(xs, ys)) {
            yield new PointerEvent("pointermove",  {...common, ...screen({x, y}), pressure, buttons: MouseButton.Left})
          }
        }

        function* pan(start: Point, end: Point, n: number = 5): Iterable<PointerEvent> {
          yield new PointerEvent("pointerdown", {...common, ...screen(start), pressure: DRAG_PRESSURE, buttons: MouseButton.Left})
          yield* move(start, end, n, DRAG_PRESSURE)
          yield new PointerEvent("pointerup",   {...common, ...screen(end), pressure: MOVE_PRESSURE})
        }

        function* tap(xy: Point): Iterable<PointerEvent> {
          const sxy = screen(xy)
          yield new PointerEvent("pointerdown", {...common, ...sxy, pressure: DRAG_PRESSURE, buttons: MouseButton.Left})
          yield new PointerEvent("pointerup",   {...common, ...sxy, pressure: MOVE_PRESSURE})
        }

        function* dbltap(xy: Point): Iterable<PointerEvent> {
          yield* tap(xy)
          yield* tap(xy)
        }

        function xy(x: number, y: number): Point {
          return {x, y}
        }

        const events = [
          pan(xy(1, 1), xy(4, 4)),
          pan(xy(2, 2), xy(3, 3)),
          dbltap(xy(2.5, 2.5)),
        ]

        for (const seq of events) {
          for (const ev of seq) {
            el.dispatchEvent(ev)
            await delay(5)
          }
        }
      }

      await trigger()
    })
  })
})

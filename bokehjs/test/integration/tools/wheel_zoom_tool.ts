import {display, fig, row} from "../_util"
import {PlotActions, actions, xy} from "../../interactive"

import type {Plot} from "@bokehjs/models"
import {Range1d, FactorRange, WheelZoomTool, LinearScale, CategoricalScale, GroupByModels, GroupByName} from "@bokehjs/models"
import {DataRenderer} from "@bokehjs/models/renderers/data_renderer"
import {enumerate} from "@bokehjs/core/util/iterator"
import {Category10_10} from "@bokehjs/api/palettes"

describe("WheelZoomTool", () => {
  it("should support zooming sub-coordinates", async () => {
    const factors = ["A", "B", "C"]

    function plot(title: string) {
      const x_range = new Range1d({start: 0, end: 10})
      const y_range = new FactorRange({factors})

      const p = fig([300, 300], {x_range, y_range, title, tools: ["hover"]})

      for (const [color, i] of enumerate(["red", "green", "blue"])) {
        const xy = p.subplot({
          x_source: p.x_range,
          y_source: new FactorRange({factors: ["u", "v", "w"]}),
          x_target: p.x_range,
          y_target: new Range1d({start: i, end: i + 1}),
          x_scale: new LinearScale(),
          y_scale: new CategoricalScale(),
        })

        xy.scatter({
          x: [1, 2, 3, 4, 5, 6, 7, 8, 9],
          y: ["u", "v", "w", "u", "v", "w", "u", "v", "w"],
          size: 10,
          color,
        })
      }

      return p
    }

    const p0 = plot("Before zoom")
    const p1 = plot("Sub-coordinate zoom level 0")
    const p2 = plot("Sub-coordinate zoom level 1")

    function data_renderers(p: Plot): DataRenderer[] {
      return p.renderers.filter((r) => r instanceof DataRenderer)
    }

    const wheel_zoom1 = new WheelZoomTool({renderers: data_renderers(p1), level: 0})
    p1.add_tools(wheel_zoom1)
    p1.toolbar.active_scroll = wheel_zoom1

    const wheel_zoom2 = new WheelZoomTool({renderers: data_renderers(p2), level: 1})
    p2.add_tools(wheel_zoom2)
    p2.toolbar.active_scroll = wheel_zoom2

    const {view} = await display(row([p0, p1, p2]))

    const pv1 = view.owner.get_one(p1)
    const actions1 = new PlotActions(pv1)
    await actions1.scroll_down(xy(5, factors.indexOf("B") + 0.5), 5)
    await pv1.ready

    const pv2 = view.owner.get_one(p2)
    const actions2 = new PlotActions(pv2)
    await actions2.scroll_down(xy(5, factors.indexOf("B") + 0.5), 5)
    await pv2.ready
  })

  describe("should support zooming sub-coordinates", () => {
    describe("with hit_test=true", () => {
      const factors = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]

      function plot(fn: (renderers: DataRenderer[]) => WheelZoomTool) {
        const x_range = new Range1d({start: 0, end: 10})
        const y_range = new FactorRange({factors})

        const p = fig([300, 300], {x_range, y_range, tools: []})

        const renderers = []
        for (const [color, i] of enumerate(Category10_10)) {
          const xy = p.subplot({
            x_source: p.x_range,
            y_source: new FactorRange({factors: ["u", "v", "w"]}),
            x_target: p.x_range,
            y_target: new Range1d({start: i, end: i + 1}),
            x_scale: new LinearScale(),
            y_scale: new CategoricalScale(),
          })

          const gr = xy.line({
            x: [1, 2, 3, 4, 5, 6, 7, 8, 9],
            y: ["u", "v", "w", "u", "v", "w", "u", "v", "w"],
            color,
            line_width: 2,
            name: i % 2 == 0 ? "even" : "odd",
          })
          renderers.push(gr)
        }

        const wheel_zoom = fn(renderers)
        p.add_tools(wheel_zoom)
        p.toolbar.active_scroll = wheel_zoom

        return p
      }

      describe("with hit_test_mode=hline", async () => {
        it("and hit_test_behavior='only_hit'", async () => {
          const p = plot((renderers) => {
            return new WheelZoomTool({
              renderers,
              level: 1,
              dimensions: "height",
              hit_test: true,
              hit_test_mode: "hline",
              hit_test_behavior: "only_hit",
            })
          })

          const {view: pv} = await display(p)
          await actions(pv).scroll_up(xy(5, factors.indexOf("B") + 0.5), 3)
          await pv.ready
        })

        it("and hit_test_behavior=GroupByName()", async () => {
          const p = plot((renderers) => {
            return new WheelZoomTool({
              renderers,
              level: 1,
              dimensions: "height",
              hit_test: true,
              hit_test_mode: "hline",
              hit_test_behavior: new GroupByName(),
            })
          })

          const {view: pv} = await display(p)
          await actions(pv).scroll_up(xy(5, factors.indexOf("B") + 0.5), 3)
          await pv.ready
        })

        it("and hit_test_behavior=GroupByModels()", async () => {
          const p = plot((renderers) => {
            const even = renderers.filter((_, i) => i % 2 == 0)
            const odd = renderers.filter((_, i) => i % 2 == 1)
            return new WheelZoomTool({
              renderers,
              level: 1,
              dimensions: "height",
              hit_test: true,
              hit_test_mode: "hline",
              hit_test_behavior: new GroupByModels({groups: [even, odd]}),
            })
          })

          const {view: pv} = await display(p)
          await actions(pv).scroll_up(xy(5, factors.indexOf("B") + 0.5), 3)
          await pv.ready
        })
      })
    })
  })

  it("should notify when modifiers aren't satisfied", async () => {
    const wheel_zoom = new WheelZoomTool({modifiers: {ctrl: true}})
    const p = fig([200, 200], {tools: [wheel_zoom]})
    p.scatter({x: [1, 2, 3], y: [1, 2, 3], size: 20})
    const {view} = await display(p)

    const actions1 = new PlotActions(view)
    await actions1.scroll_down(xy(2, 2), 1)
    await view.ready
  })
})

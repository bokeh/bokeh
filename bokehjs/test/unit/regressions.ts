import sinon from "sinon"

import {expect} from "assertions"
import {display, fig} from "./_util"

import {
  HoverTool, BoxAnnotation, ColumnDataSource, CDSView, BooleanFilter, GlyphRenderer, Circle,
  Legend, LegendItem, Line, Title, Row, Column, GridBox,
} from "@bokehjs/models"
import {Div} from "@bokehjs/models/widgets"
import {assert} from "@bokehjs/core/util/assert"
import {build_view} from "@bokehjs/core/build_views"
import {offset} from "@bokehjs/core/dom"
import {gridplot} from "@bokehjs/api/gridplot"
import {Document, DocJson} from "@bokehjs/document"

describe("Bug", () => {
  describe("in issue #10612", () => {
    it("prevents hovering over dynamically added glyphs", async () => {
      const hover = new HoverTool({renderers: "auto"})
      const plot = fig([200, 200], {tools: [hover]})
      plot.circle([1, 2, 3], [4, 5, 6])
      const {view} = await display(plot)
      const hover_view = view.tool_views.get(hover)! as HoverTool["__view_type__"]
      expect(hover_view.computed_renderers.length).to.be.equal(1)

      plot.circle([2, 3, 4], [4, 5, 6])
      plot.circle([3, 4, 5], [4, 5, 6])
      await view.ready
      expect(hover_view.computed_renderers.length).to.be.equal(3)
    })
  })

  describe("in issue #10784", () => {
    it("doesn't allow to repaint an individual layer of a plot", async () => {
      const plot = fig([200, 200])
      const r0 = plot.circle([0, 1, 2], [3, 4, 5], {fill_color: "blue", level: "glyph"})
      const r1 = plot.circle(1, 3, {fill_color: "red", level: "overlay"})
      const r2 = new BoxAnnotation({left: 0, right: 2, bottom: 3, top: 5, level: "overlay"})
      plot.add_layout(r2)
      const {view} = await display(plot)

      const rv0 = view.renderer_view(r0)!
      const rv1 = view.renderer_view(r1)!
      const rv2 = view.renderer_view(r2)!

      const rv0_spy = sinon.spy(rv0, "render")
      const rv1_spy = sinon.spy(rv1, "render")
      const rv2_spy = sinon.spy(rv2, "render")

      r1.glyph.x = 2
      await view.ready

      expect(rv0_spy.callCount).to.be.equal(0)
      expect(rv1_spy.callCount).to.be.equal(1)
      expect(rv2_spy.callCount).to.be.equal(1)

      r1.glyph.y = 4
      await view.ready

      expect(rv0_spy.callCount).to.be.equal(0)
      expect(rv1_spy.callCount).to.be.equal(2)
      expect(rv2_spy.callCount).to.be.equal(2)

      r2.left = 1
      await view.ready

      expect(rv0_spy.callCount).to.be.equal(0)
      expect(rv1_spy.callCount).to.be.equal(3)
      expect(rv2_spy.callCount).to.be.equal(3)
    })
  })

  describe("in issue #10853", () => {
    it("prevents initializing GlyphRenderer with an empty data source", async () => {
      const plot = fig([200, 200])
      const data_source = new ColumnDataSource({data: {}})
      const glyph = new Circle({x: {field: "x_field"}, y: {field: "y_field"}})
      const renderer = new GlyphRenderer({data_source, glyph})
      plot.add_renderers(renderer)
      const {view} = await display(plot)
      // XXX: no data (!= empty arrays) implies 1 data point, required for
      // scalar glyphs. This doesn't account for purely expression glyphs.
      // This needs to be refined in future.
      expect(view.renderer_view(renderer)!.glyph.data_size).to.be.equal(1)
    })

    // TODO: this should test WebDataSource
  })

  describe("in issue #10935", () => {
    it("prevents to render a plot with a legend and an empty view", async () => {
      const plot = fig([200, 200])
      const filter = new BooleanFilter({booleans: [false, false]})
      const view = new CDSView({filters: [filter]})
      plot.square([1, 2], [3, 4], {fill_color: ["red", "green"], view, legend_label: "square"})
      await display(plot)
    })

    it("prevents to render a plot with a legend and a subset of indices", async () => {
      const plot = fig([200, 200])
      const filter = new BooleanFilter({booleans: [true, true, false, false]})
      const view = new CDSView({filters: [filter]})
      const data_source = new ColumnDataSource({data: {x: [1, 2, 3, 4], y: [5, 6, 7, 8], fld: ["a", "a", "b", "b"]}})
      const r = plot.square("x", "y", {fill_color: ["red", "red", "green", "green"], view, source: data_source})
      const legend = new Legend({items: [new LegendItem({label: {field: "fld"}, renderers: [r]})]})
      plot.add_layout(legend)
      await display(plot)
    })
  })

  describe("in issue #11038", () => {
    it("doesn't allow for setting plot.title.text when string title was previously set", async () => {
      const plot = fig([200, 200])
      function set_title() {
        plot.title = "some title"
      }
      set_title()                         // indirection to deal with type narrowing to string
      assert(plot.title instanceof Title) // expect() can't narrow types
      plot.title.text = "other title"
      expect(plot.title).to.be.instanceof(Title)
      expect(plot.title.text).to.be.equal("other title")
    })
  })

  describe("in issue #11035", () => {
    it("doesn't allow to use non-Plot models in gridplot()", async () => {
      const p0 = fig([200, 200])
      const p1 = new Div({text: "some text"})
      const grid0 = gridplot([[p0, p1]], {merge_tools: true, toolbar_location: "above"})
      expect(grid0).to.be.instanceof(Column)
      const grid1 = gridplot([[p0, p1]], {merge_tools: true, toolbar_location: "below"})
      expect(grid1).to.be.instanceof(Column)
      const grid2 = gridplot([[p0, p1]], {merge_tools: true, toolbar_location: "left"})
      expect(grid2).to.be.instanceof(Row)
      const grid3 = gridplot([[p0, p1]], {merge_tools: true, toolbar_location: "right"})
      expect(grid3).to.be.instanceof(Row)
      const grid4 = gridplot([[p0, p1]], {merge_tools: true, toolbar_location: null})
      expect(grid4).to.be.instanceof(GridBox)
      const grid5 = gridplot([[p0, p1]], {merge_tools: false, toolbar_location: "above"})
      expect(grid5).to.be.instanceof(GridBox)
      const grid6 = gridplot([[p0, p1]], {merge_tools: false, toolbar_location: "below"})
      expect(grid6).to.be.instanceof(GridBox)
      const grid7 = gridplot([[p0, p1]], {merge_tools: false, toolbar_location: "left"})
      expect(grid7).to.be.instanceof(GridBox)
      const grid8 = gridplot([[p0, p1]], {merge_tools: false, toolbar_location: "right"})
      expect(grid8).to.be.instanceof(GridBox)
      const grid9 = gridplot([[p0, p1]], {merge_tools: false, toolbar_location: null})
      expect(grid9).to.be.instanceof(GridBox)
    })
  })

  describe("in issue #11750", () => {
    it("makes plots render uncecessarily when hover glyph wasn't defined", async () => {
      async function test(hover_glyph: Line | null) {
        const data_source = new ColumnDataSource({data: {x: [0, 1], y: [0.1]}})
        const glyph = new Line({line_color: "red"})
        const renderer = new GlyphRenderer({data_source, glyph, hover_glyph})
        const plot = fig([200, 200], {tools: [new HoverTool({mode: "vline"})]})
        plot.add_renderers(renderer)

        const {view} = await display(plot)

        const lnv = view.renderer_views.get(renderer)!
        const ln_spy = sinon.spy(lnv, "request_render")
        const ui = view.canvas_view.ui_event_bus
        const {left, top} = offset(ui.hit_area)

        for (let i = 0; i <= 1; i += 0.2) {
          const [[sx], [sy]] = lnv.coordinates.map_to_screen([i], [i])
          const ev = new MouseEvent("mousemove", {clientX: left + sx, clientY: top + sy})
          ui._mouse_move(ev)
        }

        return ln_spy.callCount
      }

      expect(await test(null)).to.be.equal(0)
      expect(await test(new Line({line_color: "blue"}))).to.be.equal(6)
    })
  })

  describe("in issue #11803", () => {
    it("makes properties containing ndarrays always dirty", async () => {
      const doc_json: DocJson = {
        defs: [],
        roots: {
          references: [{
            id: "1003",
            type: "ColumnDataSource",
            attributes: {
              data: {
                x: {
                  __ndarray__: "AAAAAAAAAACHROdKGFfWP4dE50oYV+Y/ZXMtOFLB8D+HROdKGFf2P6kVoV3e7Ps/ZXMtOFLBAED2W4pBNYwDQIdE50oYVwZAGC1EVPshCUA=",
                  dtype: "float64",
                  order: "little",
                  shape: [10],
                },
                y0: {
                  __ndarray__: "AAAAAAAA8D+Mcwt+GjrGPxstUkL2Ee6/BAAAAAAA4L83UM+ib4PoPzpQz6Jvg+g/8v//////378eLVJC9hHuv3NzC34aOsY/AAAAAAAA8D8=",
                  dtype: "float64",
                  order: "little",
                  shape: [10],
                },
                y1: {
                  __ndarray__: "AAAAAAAAAAAcFjxSt5HkPxccgYyLg+8/q0xY6Hq26z/4C4p0qOPVP/QLinSo49W/qExY6Hq2678YHIGMi4Pvvx8WPFK3keS/B1wUMyamsbw=",
                  dtype: "float64",
                  order: "little",
                  shape: [10],
                },
              },
            },
          }, {
            id: "1006",
            type: "Line",
            attributes: {
              x: {field: "x"},
              y: {field: "y0"},
            },
          }, {
            id: "1005",
            type: "GlyphRenderer",
            attributes: {
              data_source: {id: "1003"},
              glyph: {id: "1004"},
            },
          }, {
            id: "1004",
            type: "Line",
            attributes: {
              x: {field: "x"},
              y: {field: "y1"},
            },
          }, {
            id: "1007",
            type: "GlyphRenderer",
            attributes: {
              data_source: {id: "1003"},
              glyph: {id: "1006"},
            },
          }, {
            id: "1008",
            type: "DataRange1d",
            attributes: {},
          }, {
            id: "1009",
            type: "DataRange1d",
            attributes: {},
          }, {
            id: "1010",
            type: "LinearScale",
            attributes: {},
          }, {
            id: "1011",
            type: "LinearScale",
            attributes: {},
          }, {
            id: "1002",
            type: "Plot",
            attributes: {
              renderers: [{id: "1005"}, {id: "1007"}],
              x_range: {id: "1008"},
              x_scale: {id: "1010"},
              y_range: {id: "1009"},
              y_scale: {id: "1011"},
            },
          }],
          root_ids: ["1002"],
        },
        title: "Bokeh Application",
        version: "3.0.0",
      }

      const doc = Document.from_json(doc_json)

      const patch0 = Document._compute_patch_since_json(doc_json, doc)
      expect(patch0.events).to.be.empty

      expect(doc.roots().length).to.be.equal(1)
      await build_view(doc.roots()[0], {parent: null})

      const patch1 = Document._compute_patch_since_json(doc_json, doc)
      expect(patch1.events).to.be.similar([
        {kind: "ModelChanged", model: {id: "1008"}, attr: "start", new: -0.15707963267948988},
        {kind: "ModelChanged", model: {id: "1008"}, attr: "end", new: 3.2986722862692828},
        {kind: "ModelChanged", model: {id: "1009"}, attr: "start", new: -1.0840481406628186},
        {kind: "ModelChanged", model: {id: "1009"}, attr: "end", new: 1.0992403876506105},
      ])
    })
  })
})

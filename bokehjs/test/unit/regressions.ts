import sinon from "sinon"

import {expect} from "assertions"
import {display, fig} from "./_util"

import {
  HoverTool, BoxAnnotation, ColumnDataSource, CDSView, BooleanFilter, GlyphRenderer, Circle,
  Legend, LegendItem, Line, Rect, Title,
} from "@bokehjs/models"
import {assert} from "@bokehjs/core/util/assert"
import {build_view} from "@bokehjs/core/build_views"
import {base64_to_buffer} from "@bokehjs/core/util/buffer"
import {offset} from "@bokehjs/core/dom"
import {Document, DocJson, DocumentEvent, ModelChangedEvent} from "@bokehjs/document"

import {ImageURLView} from "@bokehjs/models/glyphs/image_url"

function data_url(data: string, mime: string, encoding: string = "base64") {
  return `data:${mime};${encoding},${data}`
}

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
      const view = new CDSView({filter})
      plot.square([1, 2], [3, 4], {fill_color: ["red", "green"], view, legend_label: "square"})
      await display(plot)
    })

    it("prevents to render a plot with a legend and a subset of indices", async () => {
      const plot = fig([200, 200])
      const filter = new BooleanFilter({booleans: [true, true, false, false]})
      const view = new CDSView({filter})
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

  describe("in issue #11750", () => {
    it("makes plots render uncecessarily when hover glyph wasn't defined", async () => {
      async function test(hover_glyph: Line | null) {
        const data_source = new ColumnDataSource({data: {x: [0, 1], y: [0.1, 0.1]}})
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
          ui.hit_area.dispatchEvent(ev)
        }

        return ln_spy.callCount
      }

      expect(await test(null)).to.be.equal(0)
      expect(await test(new Line({line_color: "blue"}))).to.be.equal(1)
    })
  })

  describe("in issue #11999", () => {
    it("makes plots render uncecessarily when inspection indices don't change", async () => {
      const data_source = new ColumnDataSource({data: {x: [0, 0.6], y: [0.6, 0], width: [0.4, 0.4], height: [0.4, 0.4]}})
      const glyph = new Rect({line_color: "red"})
      const hover_glyph = new Rect({line_color: "blue"})
      const renderer = new GlyphRenderer({data_source, glyph, hover_glyph})
      const plot = fig([200, 200], {tools: [new HoverTool()]})
      plot.add_renderers(renderer)

      const {view} = await display(plot)

      const gv = view.renderer_views.get(renderer)!
      const gv_spy = sinon.spy(gv, "request_render")
      const ui = view.canvas_view.ui_event_bus
      const {left, top} = offset(ui.hit_area)

      for (let i = 0; i <= 1; i += 0.2) {
        const [[sx], [sy]] = gv.coordinates.map_to_screen([i], [i])
        const ev = new MouseEvent("mousemove", {clientX: left + sx, clientY: top + sy})
        ui.hit_area.dispatchEvent(ev)
      }

      expect(gv_spy.callCount).to.be.equal(0)

      for (let i = 1; i >= 0; i -= 0.2) {
        const [[sx], [sy]] = gv.coordinates.map_to_screen([0.8], [i])
        const ev = new MouseEvent("mousemove", {clientX: left + sx, clientY: top + sy})
        ui.hit_area.dispatchEvent(ev)
      }

      expect(gv_spy.callCount).to.be.equal(1)
    })
  })

  describe("in issue #11803", () => {
    it("makes properties containing ndarrays always dirty", async () => {
      const doc_json: DocJson = {
        defs: [],
        roots: [{
          type: "object",
          name: "Plot",
          id: "1002",
          attributes: {
            renderers: [{
              type: "object",
              name: "GlyphRenderer",
              id: "1005",
              attributes: {
                data_source: {
                  type: "object",
                  name: "ColumnDataSource",
                  id: "1003",
                  attributes: {
                    data: {
                      x: {
                        type: "ndarray",
                        array: {
                          type: "bytes",
                          data: "AAAAAAAAAACHROdKGFfWP4dE50oYV+Y/ZXMtOFLB8D+HROdKGFf2P6kVoV3e7Ps/ZXMtOFLBAED2W4pBNYwDQIdE50oYVwZAGC1EVPshCUA=",
                        },
                        dtype: "float64",
                        order: "little",
                        shape: [10],
                      },
                      y0: {
                        type: "ndarray",
                        array: {
                          type: "bytes",
                          data: "AAAAAAAA8D+Mcwt+GjrGPxstUkL2Ee6/BAAAAAAA4L83UM+ib4PoPzpQz6Jvg+g/8v//////378eLVJC9hHuv3NzC34aOsY/AAAAAAAA8D8=",
                        },
                        dtype: "float64",
                        order: "little",
                        shape: [10],
                      },
                      y1: {
                        type: "ndarray",
                        array: {
                          type: "bytes",
                          data: "AAAAAAAAAAAcFjxSt5HkPxccgYyLg+8/q0xY6Hq26z/4C4p0qOPVP/QLinSo49W/qExY6Hq2678YHIGMi4Pvvx8WPFK3keS/B1wUMyamsbw=",
                        },
                        dtype: "float64",
                        order: "little",
                        shape: [10],
                      },
                    },
                  },
                },
                glyph: {
                  type: "object",
                  name: "Line",
                  id: "1004",
                  attributes: {
                    x: {field: "x"},
                    y: {field: "y1"},
                  },
                },
              },
            }, {
              type: "object",
              name: "GlyphRenderer",
              id: "1007",
              attributes: {
                data_source: {id: "1003"},
                glyph: {
                  type: "object",
                  name: "Line",
                  id: "1006",
                  attributes: {
                    x: {field: "x"},
                    y: {field: "y0"},
                  },
                },
              },
            }],
            x_range: {
              type: "object",
              name: "DataRange1d",
              id: "1008",
              attributes: {},
            },
            x_scale: {
              type: "object",
              name: "LinearScale",
              id: "1010",
              attributes: {},
            },
            y_range: {
              type: "object",
              name: "DataRange1d",
              id: "1009",
              attributes: {},
            },
            y_scale: {
              type: "object",
              name: "LinearScale",
              id: "1011",
              attributes: {},
            },
          },
        }],
        title: "Bokeh Application",
        version: "3.0.0",
      }

      const events0: DocumentEvent[] = []
      const doc = Document.from_json(doc_json, events0)
      expect(events0).to.be.empty

      expect(doc.roots().length).to.be.equal(1)

      const events1: DocumentEvent[] = []
      doc.on_change((event) => events1.push(event))
      await build_view(doc.roots()[0], {parent: null})

      expect(events1).to.be.similar([
        new ModelChangedEvent(doc, doc.get_model_by_id("1008")!, "start", -0.15707963267948988),
        new ModelChangedEvent(doc, doc.get_model_by_id("1008")!, "end",    3.2986722862692828),
        new ModelChangedEvent(doc, doc.get_model_by_id("1009")!, "start", -1.0840481406628186),
        new ModelChangedEvent(doc, doc.get_model_by_id("1009")!, "end",    1.0992403876506105),
      ])
    })
  })

  describe("in issue #11877", async () => {
    it("requires two render iterations to paint data URL images", async () => {
      const jpg = "/9j/4AAQSkZJRgABAQEASABIAAD//gATQ3JlYXRlZCB3aXRoIEdJTVD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wgARCAAUABQDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAWAQEBAQAAAAAAAAAAAAAAAAAABwn/2gAMAwEAAhADEAAAAbIZ30QAAAD/xAAUEAEAAAAAAAAAAAAAAAAAAAAw/9oACAEBAAEFAh//xAAUEQEAAAAAAAAAAAAAAAAAAAAw/9oACAEDAQE/AR//xAAUEQEAAAAAAAAAAAAAAAAAAAAw/9oACAECAQE/AR//xAAUEAEAAAAAAAAAAAAAAAAAAAAw/9oACAEBAAY/Ah//xAAUEAEAAAAAAAAAAAAAAAAAAAAw/9oACAEBAAE/IR//2gAMAwEAAgADAAAAEAAAAB//xAAUEQEAAAAAAAAAAAAAAAAAAAAw/9oACAEDAQE/EB//xAAUEQEAAAAAAAAAAAAAAAAAAAAw/9oACAECAQE/EB//xAAUEAEAAAAAAAAAAAAAAAAAAAAw/9oACAEBAAE/EB//2Q=="
      const png = "iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5QwMEBEn745HIwAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAdElEQVQ4y2NkwA/M/uORZGKgAAycZkbCSnB7m8bO/n+SXGf//w91M6M5Bc7Gaj8jMdaiaDAnQjNWnegGvefnh7AEP34kYCeGTQjNECDw4QMx2rAH2AcBASJ1Yg9tZP2MeEMUe1RB9DMSSgW0SZ6Ynh9M+RkAVKIcx4/3GikAAAAASUVORK5CYII="

      const render = sinon.spy(ImageURLView.prototype, "render")

      try {
        const p0 = fig([200, 200])
        p0.image_url([data_url(jpg, "image/jpeg")], 0, 0, null, null)
        await display(p0)
        expect(render.callCount).to.be.equal(1)

        render.resetHistory()

        const p1 = fig([200, 200])
        p1.image_url([data_url(png, "image/png")], 0, 0, null, null)
        await display(p1)
        expect(render.callCount).to.be.equal(1)

        render.resetHistory()

        const url = URL.createObjectURL(new Blob([base64_to_buffer(png)]))
        const p2 = fig([200, 200])
        p2.image_url([url], 0, 0, null, null)
        await display(p2)
        expect(render.callCount).to.be.above(0)
        expect(render.callCount).to.be.below(3)

        render.resetHistory()

        const p3 = fig([200, 200])
        p3.image_url(["/assets/images/pattern.png"], 0, 0, null, null)
        await display(p3)
        expect(render.callCount).to.be.above(0)
        expect(render.callCount).to.be.below(3)
      } finally {
        render.restore()
      }
    })
  })

  describe("in issue #7390", () => {
    it("allows to trigger tap events when clicking outside the frame area", async () => {
      const p = fig([100, 100], {
        x_range: [0, 2], y_range: [0, 2],
        x_axis_type: null, y_axis_type: null,
        tools: "tap",
        min_border: 10,
      })
      const r = p.block({x: [0, 1], y: [0, 1], width: 1, height: 1})

      const {view} = await display(p)
      expect(r.data_source.selected.indices).to.be.equal([])

      async function tap(sx: number, sy: number) {
        const ui = view.canvas_view.ui_event_bus
        const {left, top} = offset(ui.hit_area)
        const ev = new MouseEvent("click", {clientX: left + sx, clientY: top + sy})
        const hev = {
          type: "tap",
          deltaX: 0,
          deltaY: 0,
          scale: 1,
          rotation: 0,
          srcEvent: ev,
        }
        ui._tap(hev) // can't use dispatchEvent(), becuase of doubletap recognizer
        await view.ready
      }

      await tap(30, 70) // click on 0
      expect(r.data_source.selected.indices).to.be.equal([0])

      await tap(30, 30) // click on empty
      expect(r.data_source.selected.indices).to.be.equal([])

      await tap(70, 30) // click on 1
      expect(r.data_source.selected.indices).to.be.equal([1])

      await tap(5, 5)   // click off frame
      expect(r.data_source.selected.indices).to.be.equal([1])
    })
  })
})

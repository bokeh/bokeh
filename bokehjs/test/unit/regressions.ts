import sinon from "sinon"

import {expect, expect_instanceof, expect_not_null} from "assertions"
import {display, fig, restorable} from "./_util"
import {PlotActions, actions, xy, line, tap, mouse_click, scroll_up, scroll_down} from "../interactive"

import {
  AllIndices,
  BooleanFilter,
  BoxAnnotation,
  BoxEditTool,
  BoxSelectTool,
  CDSView,
  CategoricalColorMapper,
  Circle,
  Column,
  ColumnDataSource,
  CopyTool,
  CustomJS,
  DataRange1d,
  EqHistColorMapper,
  GlyphRenderer,
  HoverTool,
  Image,
  IndexFilter,
  Legend,
  LegendItem,
  Line,
  LinearColorMapper,
  Node,
  PanTool,
  Pane,
  Plot,
  Range1d,
  RangeTool,
  Rect,
  Row,
  Scatter,
  TablerIcon,
  TapTool,
  TileRenderer,
  Title,
  Toolbar,
  WMTSTileSource,
  WheelZoomTool,
} from "@bokehjs/models"

import {
  GlobalImportedStyleSheet,
  GlobalInlineStyleSheet,
  ImportedStyleSheet,
  InlineStyleSheet,
} from "@bokehjs/models/dom"

import {
  Button,
  CategoricalSlider,
} from "@bokehjs/models/widgets"

import {version} from "@bokehjs/version"
import {Model} from "@bokehjs/model"
import * as p from "@bokehjs/core/properties"
import {is_equal} from "@bokehjs/core/util/eq"
import {linspace, range} from "@bokehjs/core/util/array"
import {keys} from "@bokehjs/core/util/object"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {BitSet} from "@bokehjs/core/util/bitset"
import {base64_to_buffer} from "@bokehjs/core/util/buffer"
import type {XY} from "@bokehjs/core/util/bbox"
import {div} from "@bokehjs/core/dom"
import type {Color, Arrayable} from "@bokehjs/core/types"
import type {DocJson, DocumentEvent} from "@bokehjs/document"
import {Document, ModelChangedEvent, MessageSentEvent} from "@bokehjs/document"
import {DocumentReady, RangesUpdate} from "@bokehjs/core/bokeh_events"
import {gridplot} from "@bokehjs/api/gridplot"
import {Spectral11, Viridis11, Viridis256} from "@bokehjs/api/palettes"
import {defer, paint, poll} from "@bokehjs/core/util/defer"
import type {Field} from "@bokehjs/core/vectorization"
import type {ToolName} from "@bokehjs/api/figure"

import {UIElement, UIElementView} from "@bokehjs/models/ui/ui_element"
import type {GlyphRendererView} from "@bokehjs/models/renderers/glyph_renderer"
import {ImageURLView} from "@bokehjs/models/glyphs/image_url"
import {ImageView} from "@bokehjs/models/glyphs/image"
import {CopyToolView} from "@bokehjs/models/tools/actions/copy_tool"
import {TableDataProvider, DataTable} from "@bokehjs/models/widgets/tables/data_table"
import {TableColumn} from "@bokehjs/models/widgets/tables/table_column"
import {DTINDEX_NAME} from "@bokehjs/models/widgets/tables/definitions"
import {Spinner} from "@bokehjs/models/widgets"

class QualifiedModelView extends UIElementView {
  declare model: QualifiedModel
}
class QualifiedModel extends UIElement {
  declare __view_type__: QualifiedModelView
  static override __module__ = "some.external.provider"
  static {
    this.prototype.default_view = QualifiedModelView
  }
}

namespace ModelWithUnsetReadonly {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    p0: p.Property<number>
  }
}

interface ModelWithUnsetReadonly extends ModelWithUnsetReadonly.Attrs {}

class ModelWithUnsetReadonly extends Model {
  declare properties: ModelWithUnsetReadonly.Props

  constructor(attrs?: Partial<ModelWithUnsetReadonly.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ModelWithUnsetReadonly.Props>(({Int}) => ({
      p0: [ Int, p.unset, {readonly: true} ],
    }))
  }
}

function data_url(data: string, mime: string, encoding: string = "base64") {
  return `data:${mime};${encoding},${data}`
}

function scalar_image(N: number = 100) {
  const x = linspace(0, 10, N)
  const y = linspace(0, 10, N)
  const d = new Float64Array(N*N)
  const {sin, cos} = Math
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      d[i*N + j] = sin(x[i])*cos(y[j])
    }
  }
  return ndarray(d, {dtype: "float64", shape: [N, N]})
}

describe("Bug", () => {
  describe("in issue #10612", () => {
    it("prevents hovering over dynamically added glyphs", async () => {
      const hover = new HoverTool({renderers: "auto"})
      const plot = fig([200, 200], {tools: [hover]})
      plot.scatter([1, 2, 3], [4, 5, 6])
      const {view} = await display(plot)
      const hover_view = view.owner.get_one(hover)
      expect(hover_view.computed_renderers.length).to.be.equal(1)

      plot.scatter([2, 3, 4], [4, 5, 6])
      plot.scatter([3, 4, 5], [4, 5, 6])
      await view.ready
      expect(hover_view.computed_renderers.length).to.be.equal(3)
    })
  })

  describe("in issue #10784", () => {
    it("doesn't allow to repaint an individual layer of a plot", async () => {
      const plot = fig([200, 200])
      const r0 = plot.scatter([0, 1, 2], [3, 4, 5], {fill_color: "blue", level: "glyph"})
      const r1 = plot.scatter(1, 3, {fill_color: "red", level: "overlay"})
      const r2 = new BoxAnnotation({left: 0, right: 2, bottom: 3, top: 5, level: "overlay"})
      plot.add_layout(r2)
      const {view} = await display(plot)

      const rv0 = view.owner.get_one(r0)
      const rv1 = view.owner.get_one(r1)
      const rv2 = view.owner.get_one(r2)

      const rv0_spy = sinon.spy(rv0, "paint")
      const rv1_spy = sinon.spy(rv1, "paint")
      const rv2_spy = sinon.spy(rv2, "paint")

      r1.glyph.x = 2
      await view.ready
      await view.ready // wait for request_paint()

      expect(rv0_spy.callCount).to.be.equal(0)
      expect(rv1_spy.callCount).to.be.equal(1)
      expect(rv2_spy.callCount).to.be.equal(1)

      r1.glyph.y = 4
      await view.ready
      await view.ready // wait for request_paint()

      expect(rv0_spy.callCount).to.be.equal(0)
      expect(rv1_spy.callCount).to.be.equal(2)
      expect(rv2_spy.callCount).to.be.equal(2)

      r2.left = 1
      await view.ready
      await view.ready // wait for request_paint()

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
      expect(view.owner.get_one(renderer).glyph.data_size).to.be.equal(1)
    })

    // TODO: this should test WebDataSource
  })

  describe("in issue #10935", () => {
    it("prevents to render a plot with a legend and an empty view", async () => {
      const plot = fig([200, 200])
      const filter = new BooleanFilter({booleans: [false, false]})
      const view = new CDSView({filter})
      plot.scatter([1, 2], [3, 4], {marker: "square", fill_color: ["red", "green"], view, legend_label: "square"})
      await display(plot)
    })

    it("prevents to render a plot with a legend and a subset of indices", async () => {
      const plot = fig([200, 200])
      const filter = new BooleanFilter({booleans: [true, true, false, false]})
      const view = new CDSView({filter})
      const data_source = new ColumnDataSource({data: {x: [1, 2, 3, 4], y: [5, 6, 7, 8], fld: ["a", "a", "b", "b"]}})
      const r = plot.scatter("x", "y", {marker: "square", fill_color: ["red", "red", "green", "green"], view, source: data_source})
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
      expect_instanceof(plot.title, Title) // expect() can't narrow types
      plot.title.text = "other title"
      expect(plot.title).to.be.instanceof(Title)
      expect(plot.title.text).to.be.equal("other title")
    })
  })

  describe("in issue #11750", () => {
    it("makes plots render unnecessarily when hover glyph wasn't defined", async () => {
      async function test(hover_glyph: Line | null) {
        const data_source = new ColumnDataSource({data: {x: [0, 1], y: [0.1, 0.1]}})
        const glyph = new Line({line_color: "red"})
        const renderer = new GlyphRenderer({data_source, glyph, hover_glyph})
        const plot = fig([200, 200], {tools: [new HoverTool({mode: "vline", attachment: "above"})]})
        plot.add_renderers(renderer)

        const {view} = await display(plot)

        const lnv = view.owner.get_one(renderer)
        const ln_spy = sinon.spy(lnv, "request_paint")

        await actions(view).hover(xy(0, 0), xy(1, 1), 6)
        await view.ready

        return ln_spy.callCount
      }

      expect(await test(null)).to.be.equal(0)
      expect(await test(new Line({line_color: "blue"}))).to.be.equal(1)
    })
  })

  describe("in issue #11999", () => {
    it("makes plots render unnecessarily when inspection indices don't change", async () => {
      const data_source = new ColumnDataSource({data: {x: [0, 0.6], y: [0.6, 0], width: [0.4, 0.4], height: [0.4, 0.4]}})
      const glyph = new Rect({line_color: "red"})
      const hover_glyph = new Rect({line_color: "blue"})
      const renderer = new GlyphRenderer({data_source, glyph, hover_glyph})
      const plot = fig([200, 200], {tools: [new HoverTool()]})
      plot.add_renderers(renderer)

      const {view} = await display(plot)

      const gv = view.owner.get_one(renderer)
      const gv_spy = sinon.spy(gv, "request_paint")

      await actions(view).hover(xy(0, 0), xy(1, 1), 6)
      await view.ready
      expect(gv_spy.callCount).to.be.equal(0)

      await actions(view).hover(xy(0.6, 1), xy(0.6, 0), 6)
      await view.ready
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
        version: "3.1.0",
      }

      const events0: DocumentEvent[] = []
      const doc = Document.from_json(doc_json, events0)
      expect(events0).to.be.empty

      expect(doc.roots().length).to.be.equal(1)

      const events1: DocumentEvent[] = []
      doc.on_change((event) => events1.push(event))
      await display(doc)

      const m1002 = doc.get_model_by_id("1002")
      const m1008 = doc.get_model_by_id("1008")
      const m1009 = doc.get_model_by_id("1009")

      expect_not_null(m1002)
      expect_not_null(m1008)
      expect_not_null(m1009)

      expect(events1).to.be.similar([
        new ModelChangedEvent(doc, m1008, "start", -0.15707963267948988),
        new ModelChangedEvent(doc, m1008, "end",    3.2986722862692828),
        new ModelChangedEvent(doc, m1009, "start", -1.0840481406628186),
        new ModelChangedEvent(doc, m1009, "end",    1.0992403876506105),
        new ModelChangedEvent(doc, m1002, "inner_width",  565),
        new ModelChangedEvent(doc, m1002, "inner_height", 590),
        new ModelChangedEvent(doc, m1002, "outer_width",  600),
        new ModelChangedEvent(doc, m1002, "outer_height", 600),
        new MessageSentEvent(doc, "bokeh_event", new DocumentReady()),
      ])
    })
  })

  describe("in issue #11877", async () => {
    it("requires two render iterations to paint data URL images", async () => {
      const jpg = "/9j/4AAQSkZJRgABAQEASABIAAD//gATQ3JlYXRlZCB3aXRoIEdJTVD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wgARCAAUABQDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAWAQEBAQAAAAAAAAAAAAAAAAAABwn/2gAMAwEAAhADEAAAAbIZ30QAAAD/xAAUEAEAAAAAAAAAAAAAAAAAAAAw/9oACAEBAAEFAh//xAAUEQEAAAAAAAAAAAAAAAAAAAAw/9oACAEDAQE/AR//xAAUEQEAAAAAAAAAAAAAAAAAAAAw/9oACAECAQE/AR//xAAUEAEAAAAAAAAAAAAAAAAAAAAw/9oACAEBAAY/Ah//xAAUEAEAAAAAAAAAAAAAAAAAAAAw/9oACAEBAAE/IR//2gAMAwEAAgADAAAAEAAAAB//xAAUEQEAAAAAAAAAAAAAAAAAAAAw/9oACAEDAQE/EB//xAAUEQEAAAAAAAAAAAAAAAAAAAAw/9oACAECAQE/EB//xAAUEAEAAAAAAAAAAAAAAAAAAAAw/9oACAEBAAE/EB//2Q=="
      const png = "iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5QwMEBEn745HIwAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAdElEQVQ4y2NkwA/M/uORZGKgAAycZkbCSnB7m8bO/n+SXGf//w91M6M5Bc7Gaj8jMdaiaDAnQjNWnegGvefnh7AEP34kYCeGTQjNECDw4QMx2rAH2AcBASJ1Yg9tZP2MeEMUe1RB9DMSSgW0SZ6Ynh9M+RkAVKIcx4/3GikAAAAASUVORK5CYII="

      using render = restorable(sinon.spy(ImageURLView.prototype, "paint"))

      const p0 = fig([200, 200])
      p0.image_url([data_url(jpg, "image/jpeg")], 0, 0, 10, 10)
      await display(p0)
      expect(render.callCount).to.be.equal(1)
      render.resetHistory()

      const p1 = fig([200, 200])
      p1.image_url([data_url(png, "image/png")], 0, 0, 10, 10)
      await display(p1)
      expect(render.callCount).to.be.equal(1)
      render.resetHistory()

      const url = URL.createObjectURL(new Blob([base64_to_buffer(png)]))
      const p2 = fig([200, 200])
      p2.image_url([url], 0, 0, 10, 10)
      await display(p2)
      expect(render.callCount).to.be.within(1, 2)
      render.resetHistory()

      const p3 = fig([200, 200])
      p3.image_url(["/assets/images/pattern.png"], 0, 0, 10, 10)
      await display(p3)
      expect(render.callCount).to.be.within(1, 2)
      render.resetHistory()
    })
  })

  describe("in issue #7390", () => {
    it("allows to trigger tap events when clicking outside the frame area", async () => {
      const p = fig([100, 100], {
        x_range: [0, 2], y_range: [0, 2],
        x_axis_type: null, y_axis_type: null,
        tools: [new TapTool({mode: "replace"})],
        min_border: 10,
      })
      const r = p.block({x: [0, 1], y: [0, 1], width: 1, height: 1})

      const {view} = await display(p)
      expect(r.data_source.selected.indices).to.be.equal([])

      const actions = new PlotActions(view, {units: "screen"})

      await actions.tap(xy(30, 70)) // click on 0
      expect(r.data_source.selected.indices).to.be.equal([0])

      await actions.tap(xy(30, 30)) // click on empty
      expect(r.data_source.selected.indices).to.be.equal([])

      await actions.tap(xy(70, 30)) // click on 1
      expect(r.data_source.selected.indices).to.be.equal([1])

      await actions.tap(xy(5, 5))   // click off frame
      expect(r.data_source.selected.indices).to.be.equal([1])
    })
  })

  describe("in issue #8531", () => {
    it("initiates multiple downloads when using copy tool in a gridplot", async () => {
      function f(color: Color) {
        const copy = new CopyTool()
        const copy_btn = copy.tool_button()
        const toolbar = new Toolbar({tools: [copy], buttons: [copy_btn]})
        const p = fig([100, 100], {toolbar})
        p.scatter({x: [0, 1, 2], y: [0, 1, 2], color})
        return p
      }

      const plots = [
        [f("red"), f("green"), f("blue")],
        [f("yellow"), f("pink"), f("purple")],
      ]

      const grid = gridplot(plots, {merge_tools: true})
      const {view} = await display(grid)

      const {tool_buttons} = view.toolbar_view
      expect(tool_buttons.length).to.be.equal(1)

      const [copy_btn] = tool_buttons
      const copy_btn_view = view.owner.get_one(copy_btn)

      const stub = sinon.stub(CopyToolView.prototype, "copy")
      stub.callsFake(async () => undefined)
      try {
        await tap(copy_btn_view.el)
        await defer()
        expect(stub.callCount).to.be.equal(1)
      } finally {
        stub.restore()
      }
    })
  })

  describe("in issue #8168", () => {
    it("allows to start selection from toolbar or axes", async () => {
      const p = fig([200, 200], {
        tools: [new BoxSelectTool()],
        toolbar_location: "above",
        x_axis_location: null,
        y_axis_location: null,
        min_border: 0,
      })
      const r = p.scatter([1, 2, 3], [1, 2, 3])

      const {view} = await display(p)
      await paint()
      expect(r.data_source.selected.indices).to.be.equal([])

      const actions = new PlotActions(view, {units: "screen"})

      await actions.pan(xy(0, 0), xy(200, 200))
      await paint()
      expect(r.data_source.selected.indices).to.be.equal([])

      const tbv = view.owner.get_one(p.toolbar)
      await actions.pan(xy(0, tbv.bbox.height + 1), xy(200, 200))
      await paint()
      expect(r.data_source.selected.indices).to.be.equal([0, 1, 2])
    })
  })

  describe("in issue #12678", () => {
    type Range = [number, number]

    async function test(x_range: Range, y_range: Range) {
      const p = fig([200, 200], {x_range, y_range})
      const color_mapper = new LinearColorMapper({palette: Spectral11})
      const glyph = p.image({image: {value: scalar_image()}, x: -5, y: -5, dw: 10, dh: 10, color_mapper})

      const {view} = await display(p)
      const glyph_view = view.owner.get_one(glyph)

      function hit_test(x: number, y: number): boolean {
        const sx = view.frame.x_scale.compute(x)
        const sy = view.frame.y_scale.compute(y)
        const result = glyph_view.hit_test({type: "point", sx, sy})
        return is_equal(result?.indices, [0])
      }

      expect(hit_test(0, 0)).to.be.true

      expect(hit_test(0, 10)).to.be.false
      expect(hit_test(0, -10)).to.be.false
      expect(hit_test(-10, 10)).to.be.false
      expect(hit_test(-10, -10)).to.be.false
      expect(hit_test(10, 10)).to.be.false
      expect(hit_test(10, -10)).to.be.false
      expect(hit_test(-10, 0)).to.be.false
      expect(hit_test(10, 0)).to.be.false
    }

    describe("doesn't allow correctly hit testing Image glyph", () => {
      it("with normal ranges", async () => {
        await test([-15, 15], [-15, 15])
      })

      it("with reversed ranges", async () => {
        await test([15, -15], [15, -15])
      })

      it("with reversed x-range", async () => {
        await test([15, -15], [-15, 15])
      })

      it("with reversed y-range", async () => {
        await test([-15, 15], [15, -15])
      })
    })
  })

  describe("in issue #9752", () => {
    it("prevents from hit testing Rect glyph with angle != 0", async () => {
      const plot = fig([600, 600], {tools: "pan,wheel_zoom,hover", toolbar_location: "right"})

      const index =  [ 0,  1,  2, 3,  4,  5,  6,   7,   8]
      const x =      [-3, -2, -1, 0,  1,  2,  3,  -2,   2]
      const y =      [-3, -2, -1, 0,  1,  2,  3,   2,  -2]
      const width =  [ 3,  2,  1, 1,  1,  2,  3,   2,   3]
      const height = [ 3,  2,  1, 1,  1,  2,  3,   2,   3]
      const angle =  [45, 30, 15, 0, 15, 30, 45, 270, 450]

      const rect = plot.rect({x, y, width, height, angle, angle_units: "deg", fill_alpha: 0.5})
      plot.text({x, y, text: index.map((i) => `${i}`), anchor: "center"})

      const {view} = await display(plot)
      const rect_view = view.owner.get_one(rect)

      function hit_test(x: number, y: number): Arrayable<number> | undefined {
        const sx = view.frame.x_scale.compute(x)
        const sy = view.frame.y_scale.compute(y)
        return rect_view.hit_test({type: "point", sx, sy})?.indices
      }

      expect(hit_test(0, 0)).to.be.equal([3])
      expect(hit_test(-2, 2)).to.be.equal([7])

      expect(hit_test(-3, -3)).to.be.equal([0])
      expect(hit_test(-2, -2)).to.be.equal([0, 1])
      expect(hit_test(-1, -1)).to.be.equal([2])
      expect(hit_test(0, 0)).to.be.equal([3])
      expect(hit_test(1, 1)).to.be.equal([4])
      expect(hit_test(2, 2)).to.be.equal([5, 6])
      expect(hit_test(3, 3)).to.be.equal([6])
      expect(hit_test(-2, 2)).to.be.equal([7])
      expect(hit_test(2, -2)).to.be.equal([8])

      expect(hit_test(2, -4)).to.be.equal([])
      expect(hit_test(2, 3)).to.be.equal([5, 6])
      expect(hit_test(2.75, 1.2)).to.be.equal([])
      expect(hit_test(-1.1, -2.7)).to.be.equal([])
    })
  })

  describe("in issue #12778", () => {
    it("doesn't allow emitting RangesUpdate event for linked plots", async () => {
      const p0 = fig([200, 200], {tools: "pan"})
      const p1 = fig([200, 200], {tools: "pan", x_range: p0.x_range, y_range: p0.y_range})
      const p2 = fig([200, 200], {tools: "pan", x_range: p0.x_range})

      p0.scatter([1, 2, 3], [0, 1, 2])
      p1.scatter([1, 2, 3], [2, 3, 4])
      p2.scatter([1, 2, 3], [5, 6, 7])

      const events: RangesUpdate[] = []
      p0.on_event(RangesUpdate, (event) => events.push(event))
      p1.on_event(RangesUpdate, (event) => events.push(event))
      p2.on_event(RangesUpdate, (event) => events.push(event))

      const row = new Row({children: [p0, p1, p2]})
      const {view} = await display(row)

      const pv0 = view.owner.get_one(p0)
      const actions = new PlotActions(pv0)
      await actions.pan(xy(2, 1), xy(2, 3))
      await paint()

      expect(events.length).to.be.equal(3)

      expect(events[0].origin).to.be.equal(p0)
      expect(events[1].origin).to.be.equal(p1)
      expect(events[2].origin).to.be.equal(p2)
    })
  })

  describe("in issue #12797", () => {
    it("allows UIElement with qualified type to use invalid characters in CSS classes", async () => {
      const obj = new QualifiedModel()
      const {view} = await display(obj, [200, 200])
      const cls = "bk-some-external-provider-QualifiedModel"
      expect(view.el.classList.contains(cls)).to.be.true
    })
  })

  describe("in issue #6683", () => {
    it("doesn't allow TableDataProvider to correctly sort strings with accents", async () => {
      const source = new ColumnDataSource({
        data: {
          words: ["met", "no", "mute", "méteo", "mill", "mole"],
        },
      })
      const indices = BitSet.from_indices(6, [0, 1, 2, 3, 4, 5])
      const view = new CDSView({indices})
      const provider = new TableDataProvider(source, view)
      const column = new TableColumn({field: "words"}).toColumn()

      provider.sort([{sortCol: column, sortAsc: true}])
      const records_asc = provider.getRecords()
      expect(records_asc).to.be.equal([
        {words: "met",   [DTINDEX_NAME]: 0},
        {words: "méteo", [DTINDEX_NAME]: 3},
        {words: "mill",  [DTINDEX_NAME]: 4},
        {words: "mole",  [DTINDEX_NAME]: 5},
        {words: "mute",  [DTINDEX_NAME]: 2},
        {words: "no",    [DTINDEX_NAME]: 1},
      ])

      provider.sort([{sortCol: column, sortAsc: false}])
      const records_dsc = provider.getRecords()
      expect(records_dsc).to.be.equal([
        {words: "no",    [DTINDEX_NAME]: 1},
        {words: "mute",  [DTINDEX_NAME]: 2},
        {words: "mole",  [DTINDEX_NAME]: 5},
        {words: "mill",  [DTINDEX_NAME]: 4},
        {words: "méteo", [DTINDEX_NAME]: 3},
        {words: "met",   [DTINDEX_NAME]: 0},
      ])
    })
  })

  describe("in issue #13139", () => {
    function make_plot(width: number, height: number) {
      const p = fig([width, height], {output_backend: "webgl"})
      p.line([0, 1], [0, 1])
      return p
    }

    it("raises DOMException if webgl canvas width is zero", async () => {
      await display(make_plot(0, 100))
    })
    it("raises DOMException if webgl canvas height is zero", async () => {
      await display(make_plot(100, 0))
    })
    it("raises DOMException if webgl canvas area is zero", async () => {
      await display(make_plot(0, 0))
    })
  })

  describe("in issue #12078", () => {
    it("doesn't allow to correctly hit test Marker and Scatter glyphs", async () => {
      const p = new Plot()
      const source = new ColumnDataSource({
        data: {
          x: [0, 1, 3, 4],
          y: [0, 1, 3, 4],
        },
      })
      const glyph = new Scatter({marker: "circle", size: 20})
      const r = p.add_glyph(glyph, source)
      const {view: pv} = await display(p)
      const rv = pv.owner.get_one(r)

      function at(x: number, y: number) {
        const sx = pv.frame.x_scale.compute(x)
        const sy = pv.frame.y_scale.compute(y)
        return {sx, sy}
      }

      function rect(x0: number, y0: number, x1: number, y1: number) {
        const {sx: sx0, sy: sy0} = at(x0, y0)
        const {sx: sx1, sy: sy1} = at(x1, y1)
        return {sx0, sy0, sx1, sy1}
      }

      function poly(x0: number, y0: number, x1: number, y1: number) {
        const {sx: sx0, sy: sy0} = at(x0, y0)
        const {sx: sx1, sy: sy1} = at(x1, y1)
        return {sx: [sx0, sx1, sx1, sx0], sy: [sy0, sy0, sy1, sy1]}
      }

      const result0 = rv.hit_test({type: "point", ...at(2, 2)})
      expect(result0?.indices).to.be.equal([])

      const result1 = rv.hit_test({type: "point", ...at(3, 3)})
      expect(result1?.indices).to.be.equal([2])

      const result2 = rv.hit_test({type: "span", direction: "h", ...at(2, 2)})
      expect(result2?.indices).to.be.equal([])

      const result3 = rv.hit_test({type: "span", direction: "h", ...at(3, 3)})
      expect(result3?.indices).to.be.equal([2])

      const result4 = rv.hit_test({type: "span", direction: "v", ...at(2, 2)})
      expect(result4?.indices).to.be.equal([])

      const result5 = rv.hit_test({type: "span", direction: "v", ...at(3, 3)})
      expect(result5?.indices).to.be.equal([2])

      const result6 = rv.hit_test({type: "rect", ...rect(1.5, 1.5, 2.5, 2.5)})
      expect(result6?.indices).to.be.equal([])

      const result7 = rv.hit_test({type: "rect", ...rect(2.5, 2.5, 3.5, 3.5)})
      expect(result7?.indices).to.be.equal([2])

      const result8 = rv.hit_test({type: "poly", ...poly(1.5, 1.5, 2.5, 2.5)})
      expect(result8?.indices).to.be.equal([])

      const result9 = rv.hit_test({type: "poly", ...poly(2.5, 2.5, 3.5, 3.5)})
      expect(result9?.indices).to.be.equal([2])
    })
  })

  describe("in issue #13217", () => {
    it("doesn't allow to bind this in non-module CustomJS", async () => {
      const obj = new Plot()
      const cb = new CustomJS({args: {arg0: "abc"}, code: "return [this, arg0, cb_obj, cb_data.data0]"})
      const result = await cb.execute(obj, {data0: 123})
      expect(result).to.be.equal([obj, "abc", obj, 123])
    })
  })

  describe("in issue #13248", () => {
    it("doesn't allow to render an invisible plot with a tile renderer", async () => {
      function box(width: number, height: number): HTMLElement {
        return div({style: {width: `${width}px`, height: `${height}px`, display: "none"}})
      }

      const osm_source = new WMTSTileSource({
        // url: "https://c.tile.openstreetmap.org/{Z}/{X}/{Y}.png",
        url: "/assets/tiles/osm/{Z}_{X}_{Y}.png",
        attribution: "&copy; (0) OSM source attribution",
      })

      const osm = new TileRenderer({tile_source: osm_source})

      const p = fig([200, 200], {
        x_range: [-2000000, 6000000],
        y_range: [-1000000, 7000000],
        x_axis_type: "mercator",
        y_axis_type: "mercator",
        renderers: [osm],
      })

      const spy = sinon.spy(osm_source, "get_tiles_by_extent")
      try {
        await display(p, [250, 250], box(200, 200))
        expect(spy.called).to.be.false
      } finally {
        spy.restore()
      }
    })
  })

  describe("in issue #13377", () => {
    it("doesn't allow serialization of unset readonly properties", async () => {
      const obj = new ModelWithUnsetReadonly()
      const doc = new Document()
      doc.add_root(obj)
      expect(doc.to_json()).to.be.equal({
        version,
        title: "Bokeh Application",
        roots: [{
          type: "object",
          name: "ModelWithUnsetReadonly",
          id: obj.id,
          attributes: {
            tags: [],
            name: null,
            js_property_callbacks: {type: "map"},
            js_event_callbacks: {type: "map"},
            subscribed_events: {type: "set"},
            syncable: true,
          },
        }],
      })
    })
  })

  describe("in issue #13416", () => {
    it("doesn't allow categorical mapping of non-factors to nan_color", async () => {
      const mapper = new CategoricalColorMapper({
        factors: ["a", "b"],
        palette: ["red", "green"],
        nan_color: "black",
      })

      const data = ["a", "c", "a", "b", null, "b", "a", NaN]
      const result = ["red", "black", "red", "green", "black", "green", "red", "black"]

      expect(mapper.v_compute(data)).to.be.equal(result)
    })
  })

  describe("in issue #13414", () => {
    it("doesn't allow re-render Icon when its properties change", async () => {
      const icon = new TablerIcon({icon_name: "eye", size: "1.2em"})
      const button = new Button({icon, label: "Visibility"})

      const {view} = await display(button)

      const icon_view = view.owner.get_one(icon)
      using render = restorable(sinon.spy(icon_view, "render"))

      icon.icon_name = "eye-off"
      await view.ready

      expect(render.calledOnce).to.be.true
    })
  })

  describe("in issue #13456", () => {
    it("doesn't allow reuse nodes when updating RangeTool's overlay", async () => {
      const x_range = new Range1d({start: 0, end: 1})
      const x_range_tool = new RangeTool({x_range})

      x_range_tool.update_overlay_from_ranges()
      expect(x_range_tool.overlay.left).to.be.equal(0)
      expect(x_range_tool.overlay.right).to.be.equal(1)
      expect(x_range_tool.overlay.top).to.be.instanceof(Node)
      expect(x_range_tool.overlay.bottom).to.be.instanceof(Node)

      const prev_top = x_range_tool.overlay.top
      const prev_bottom = x_range_tool.overlay.bottom

      x_range.start = 10
      x_range.end = 20
      x_range_tool.update_overlay_from_ranges()
      expect(x_range_tool.overlay.left).to.be.equal(10)
      expect(x_range_tool.overlay.right).to.be.equal(20)
      expect(x_range_tool.overlay.top).to.be.equal(prev_top)
      expect(x_range_tool.overlay.bottom).to.be.equal(prev_bottom)

      const y_range = new Range1d({start: 0, end: 1})
      const y_range_tool = new RangeTool({y_range})

      y_range_tool.update_overlay_from_ranges()
      expect(y_range_tool.overlay.left).to.be.instanceof(Node)
      expect(y_range_tool.overlay.right).to.be.instanceof(Node)
      expect(y_range_tool.overlay.top).to.be.equal(1)
      expect(y_range_tool.overlay.bottom).to.be.equal(0)

      const prev_left = y_range_tool.overlay.left
      const prev_right = y_range_tool.overlay.right

      y_range.start = 10
      y_range.end = 20
      y_range_tool.update_overlay_from_ranges()
      expect(y_range_tool.overlay.left).to.be.equal(prev_left)
      expect(y_range_tool.overlay.right).to.be.equal(prev_right)
      expect(y_range_tool.overlay.top).to.be.equal(20)
      expect(y_range_tool.overlay.bottom).to.be.equal(10)
    })
  })

  describe("in issue #13064", () => {
    it("doesn't allow spinner to follow the correct format when value's precision is higher than step's precision", async () => {
      const obj = new Spinner({value: 0.3, low: 0, mode: "float", step: 1, format: "0.0"})
      const {view} = await display(obj, [500, 400])
      const button = view.shadow_el.querySelector(".bk-spin-btn-up")!
      const input = view.shadow_el.querySelector(".bk-input") as HTMLInputElement

      expect(input.value).to.be.equal("0.3")

      const ev = new MouseEvent("mousedown")
      const ev2 = new MouseEvent("mouseup")
      button.dispatchEvent(ev)
      button.dispatchEvent(ev2)
      expect(input.value).to.be.equal("1.3")
    })
  })

  describe("in issue #13556", () => {
    it("doesn't allow creation of correct DOM elements for imported stylesheets", async () => {
      const style0 = new GlobalImportedStyleSheet({url: "/assets/css/global.css"})
      const style1 = new ImportedStyleSheet({url: "/assets/css/local.css"})

      const style2 = new GlobalInlineStyleSheet({css: ":root { --global-inline: 1; }"})
      const style3 = new InlineStyleSheet({css: ":host { --local-inline: 1; }"})

      const pane = new Pane({stylesheets: [style0, style1, style2, style3]})
      const {view} = await display(pane, [100, 100])

      expect(document.head.querySelectorAll("link[href='/assets/css/global.css']").length).to.be.equal(1)
      expect(view.shadow_el.querySelectorAll("link[href='/assets/css/local.css']").length).to.be.equal(1)

      expect([...document.head.querySelectorAll("style")].filter((el) => el.textContent?.includes("--global-inline: 1")).length).to.be.equal(1)
      expect([...view.shadow_el.querySelectorAll("style")].filter((el) => el.textContent?.includes("--local-inline: 1")).length).to.be.equal(1)

      await poll(() => [...document.styleSheets].some((style) => style.href?.includes("global.css")))
      await poll(() => [...view.shadow_el.styleSheets].some((style) => style.href?.includes("global.css")))

      expect(getComputedStyle(document.documentElement).getPropertyValue("--global-imported")).to.be.equal("1")
      expect(getComputedStyle(view.el).getPropertyValue("--local-imported")).to.be.equal("1")

      expect(getComputedStyle(document.documentElement).getPropertyValue("--global-inline")).to.be.equal("1")
      expect(getComputedStyle(view.el).getPropertyValue("--local-inline")).to.be.equal("1")
    })
  })

  describe("in issue #13500", () => {
    function fields<T extends object>(data: T): {[K in keyof T]: Field} {
      const result: {[key: string]: Field} = {}
      for (const field of keys(data)) {
        result[field] = {field}
      }
      return result as {[K in keyof T]: Field}
    }

    describe("doesn't allow to correctly compute coordinates in BoxEditTool", () => {
      it("of Rect glyph", async () => {
        const p = fig([400, 400], {
          x_range: [0, 10], y_range: [0, 10],
          x_axis_type: null, y_axis_type: null,
          min_border: 0,
        })

        const data = {
          x:      [3.0],
          y:      [2.0],
          width:  [4.0],
          height: [2.0],
          color:  ["red"],
        }
        const source = new ColumnDataSource({data})
        const {x, y, width, height, color} = fields(data)
        const renderer = p.rect({x, y, width, height, color, source})

        const edit_tool = new BoxEditTool({renderers: [renderer], default_overrides: {color: "green"}})
        p.add_tools(edit_tool)
        p.toolbar.active_drag = edit_tool

        const {view} = await display(p)

        await actions(view).pan_along(line(xy(7, 4), xy(9, 8)), {shift: true})
        await paint()

        expect(data).to.be.equal({
          x:      [3.0, 8.0],
          y:      [2.0, 6.0],
          width:  [4.0, 2.0],
          height: [2.0, 4.0],
          color:  ["red", "green"],
        })
      })

      it("of Block glyph", async () => {
        const p = fig([400, 400], {
          x_range: [0, 10], y_range: [0, 10],
          x_axis_type: null, y_axis_type: null,
          min_border: 0,
        })

        const data = {
          x:      [3.0],
          y:      [2.0],
          width:  [4.0],
          height: [2.0],
          color:  ["red"],
        }
        const source = new ColumnDataSource({data})
        const {x, y, width, height, color} = fields(data)
        const renderer = p.rect({x, y, width, height, color, source})

        const edit_tool = new BoxEditTool({renderers: [renderer], default_overrides: {color: "green"}})
        p.add_tools(edit_tool)
        p.toolbar.active_drag = edit_tool

        const {view} = await display(p)

        await actions(view).pan_along(line(xy(7, 4), xy(9, 8)), {shift: true})
        await paint()

        expect(data).to.be.equal({
          x:      [3.0, 8.0],
          y:      [2.0, 6.0],
          width:  [4.0, 2.0],
          height: [2.0, 4.0],
          color:  ["red", "green"],
        })
      })

      it("of Quad glyph", async () => {
        const p = fig([400, 400], {
          x_range: [0, 10], y_range: [0, 10],
          x_axis_type: null, y_axis_type: null,
          min_border: 0,
        })

        const data = {
          left:   [3.0],
          right:  [2.0],
          top:    [4.0],
          bottom: [2.0],
          color:  ["red"],
        }
        const source = new ColumnDataSource({data})
        const {left, right, top, bottom, color} = fields(data)
        const renderer = p.quad({left, right, top, bottom, color, source})

        const edit_tool = new BoxEditTool({renderers: [renderer], default_overrides: {color: "green"}})
        p.add_tools(edit_tool)
        p.toolbar.active_drag = edit_tool

        const {view} = await display(p)

        await actions(view).pan_along(line(xy(7, 4), xy(9, 8)), {shift: true})
        await paint()

        expect(data).to.be.equal({
          left:   [3.0, 7.0],
          right:  [2.0, 9.0],
          top:    [4.0, 8.0],
          bottom: [2.0, 4.0],
          color:  ["red", "green"],
        })
      })

      it("of HBar glyph", async () => {
        const p = fig([400, 400], {
          x_range: [0, 10], y_range: [0, 10],
          x_axis_type: null, y_axis_type: null,
          min_border: 0,
        })

        const data = {
          y:      [3.0],
          height: [2.0],
          left:   [2.0],
          right:  [4.0],
          color:  ["red"],
        }
        const source = new ColumnDataSource({data})
        const {y, height, left, right, color} = fields(data)
        const renderer = p.hbar({y, height, left, right, color, source})

        const edit_tool = new BoxEditTool({renderers: [renderer], default_overrides: {color: "green"}})
        p.add_tools(edit_tool)
        p.toolbar.active_drag = edit_tool

        const {view} = await display(p)

        await actions(view).pan_along(line(xy(7, 4), xy(9, 8)), {shift: true})
        await paint()

        expect(data).to.be.equal({
          y:      [3.0, 6.0],
          height: [2.0, 4.0],
          left:   [2.0, 7.0],
          right:  [4.0, 9.0],
          color:  ["red", "green"],
        })
      })

      it("of VBar glyph", async () => {
        const p = fig([400, 400], {
          x_range: [0, 10], y_range: [0, 10],
          x_axis_type: null, y_axis_type: null,
          min_border: 0,
        })

        const data = {
          x:      [3.0],
          width:  [2.0],
          top:    [4.0],
          bottom: [2.0],
          color:  ["red"],
        }
        const source = new ColumnDataSource({data})
        const {x, width, top, bottom, color} = fields(data)
        const renderer = p.vbar({x, width, top, bottom, color, source})

        const edit_tool = new BoxEditTool({renderers: [renderer], default_overrides: {color: "green"}})
        p.add_tools(edit_tool)
        p.toolbar.active_drag = edit_tool

        const {view} = await display(p)

        await actions(view).pan_along(line(xy(7, 4), xy(9, 8)), {shift: true})
        await paint()

        expect(data).to.be.equal({
          x:      [3.0, 8.0],
          width:  [2.0, 2.0],
          top:    [4.0, 8.0],
          bottom: [2.0, 4.0],
          color:  ["red", "green"],
        })
      })

      it("of HStrip glyph", async () => {
        const p = fig([400, 400], {
          x_range: [0, 10], y_range: [0, 10],
          x_axis_type: null, y_axis_type: null,
          min_border: 0,
        })

        const data = {
          y0:    [1.0],
          y1:    [3.0],
          color: ["red"],
        }
        const source = new ColumnDataSource({data})
        const {y0, y1, color} = fields(data)
        const renderer = p.hstrip({y0, y1, color, source})

        const edit_tool = new BoxEditTool({renderers: [renderer], default_overrides: {color: "green"}})
        p.add_tools(edit_tool)
        p.toolbar.active_drag = edit_tool

        const {view} = await display(p)

        await actions(view).pan_along(line(xy(7, 4), xy(9, 8)), {shift: true})
        await paint()

        expect(data).to.be.equal({
          y0:    [1.0, 4.0],
          y1:    [3.0, 8.0],
          color: ["red", "green"],
        })
      })

      it("of VStrip glyph", async () => {
        const p = fig([400, 400], {
          x_range: [0, 10], y_range: [0, 10],
          x_axis_type: null, y_axis_type: null,
          min_border: 0,
        })

        const data = {
          x0:    [2.0],
          x1:    [4.0],
          color: ["red"],
        }
        const source = new ColumnDataSource({data})
        const {x0, x1, color} = fields(data)
        const renderer = p.vstrip({x0, x1, color, source})

        const edit_tool = new BoxEditTool({renderers: [renderer], default_overrides: {color: "green"}})
        p.add_tools(edit_tool)
        p.toolbar.active_drag = edit_tool

        const {view} = await display(p)

        await actions(view).pan_along(line(xy(7, 4), xy(9, 8)), {shift: true})
        await paint()

        expect(data).to.be.equal({
          x0:    [2.0, 7.0],
          x1:    [4.0, 9.0],
          color: ["red", "green"],
        })
      })
    })
  })

  describe("in issue #13555", () => {
    it("doesn't allow to compute correct image index for inverted ranges", async () => {
      const n = 5

      async function plot(x_flipped: boolean, y_flipped: boolean) {
        const x = linspace(0, 10, n)
        const y = linspace(0, 10, n)

        const values: number[] = []
        for (const yi of y) {
          for (const xi of x) {
            values.push(xi + yi)
          }
        }
        const image = ndarray(values, {dtype: "float64", shape: [n, n]})

        const x_range = new DataRange1d({flipped: x_flipped})
        const y_range = new DataRange1d({flipped: y_flipped})

        const p = fig([300, 300], {x_range, y_range, toolbar_location: "right"})

        const color_mapper = new LinearColorMapper({palette: Viridis256})
        const img = p.image({image: [image], x: 0, y: 0, dw: 2*n, dh: 2*n, color_mapper})

        const hover = new TapTool({renderers: [img], behavior: "select"})
        p.add_tools(hover)

        const {view} = await display(p)
        return {view, img}
      }

      function image_index(i: number, j: number) {
        return [{index: 0, i, j, flat_index: j*n + i}]
      }

      async function test(options: {x_flipped: boolean, y_flipped: boolean}) {
        const {x_flipped, y_flipped} = options

        const {view, img} = await plot(x_flipped, y_flipped)
        const actions = new PlotActions(view)

        await actions.tap({x: 1, y: 1})
        await view.ready
        expect(img.data_source.selected.image_indices).to.be.equal(image_index(0, 0))
        img.data_source.selected.clear()
        await view.ready

        await actions.tap({x: 2*n-1, y: 1})
        await view.ready
        expect(img.data_source.selected.image_indices).to.be.equal(image_index(n-1, 0))
        img.data_source.selected.clear()
        await view.ready

        await actions.tap({x: 1, y: 2*n-1})
        await view.ready
        expect(img.data_source.selected.image_indices).to.be.equal(image_index(0, n-1))
        img.data_source.selected.clear()
        await view.ready

        await actions.tap({x: 2*n-1, y: 2*n-1})
        await view.ready
        expect(img.data_source.selected.image_indices).to.be.equal(image_index(n-1, n-1))
        img.data_source.selected.clear()
        await view.ready
      }

      await test({x_flipped: false, y_flipped: false})
      await test({x_flipped: true,  y_flipped: false})
      await test({x_flipped: false, y_flipped: true})
      await test({x_flipped: true,  y_flipped: true})
    })
  })

  describe("in issue #13293", () => {
    function indices(gv: GlyphRendererView, {x, y}: XY) {
      const sx = gv.coordinates.x_scale.compute(x)
      const sy = gv.coordinates.y_scale.compute(y)
      const htr = gv.hit_test({type: "point", sx, sy})
      expect_not_null(htr)
      return htr.line_indices
    }

    describe("doesn't allow to correctly hit-test VAreaStep", () => {
      it("with step_mode=before", async () => {
        const p = fig([300, 300], {title: "varea_step: before"})
        const g = p.varea_step({
          x: [1, 2, 3, 4, 5],
          y1: [12, 16, 14, 13, 15],
          y2: [1, 4, 2, 1, 3],
          step_mode: "before",
        })
        p.add_tools(new HoverTool({tooltips: "i=$index, x=@x, y1=@y1, y2=@y2"}))

        const {view} = await display(p)
        const gv = view.owner.get_one(g)

        expect(indices(gv, xy(0.75, 10))).to.be.equal([])
        expect(indices(gv, xy(1.25, 10))).to.be.equal([1])
        expect(indices(gv, xy(1.75, 10))).to.be.equal([1])
        expect(indices(gv, xy(2.25, 10))).to.be.equal([2])
        expect(indices(gv, xy(2.75, 10))).to.be.equal([2])
      })

      it("with step_mode=center", async () => {
        const p = fig([300, 300], {title: "varea_step: center"})
        const g = p.varea_step({
          x: [1, 2, 3, 4, 5],
          y1: [12, 16, 14, 13, 15],
          y2: [1, 4, 2, 1, 3],
          step_mode: "center",
        })
        p.add_tools(new HoverTool({tooltips: "i=$index, x=@x, y1=@y1, y2=@y2"}))

        const {view} = await display(p)
        const gv = view.owner.get_one(g)

        expect(indices(gv, xy(0.75, 10))).to.be.equal([])
        expect(indices(gv, xy(1.25, 10))).to.be.equal([0])
        expect(indices(gv, xy(1.75, 10))).to.be.equal([1])
        expect(indices(gv, xy(2.25, 10))).to.be.equal([1])
        expect(indices(gv, xy(2.75, 10))).to.be.equal([2])
      })

      it("with step_mode=after", async () => {
        const p = fig([300, 300], {title: "varea_step: after"})
        const g = p.varea_step({
          x: [1, 2, 3, 4, 5],
          y1: [12, 16, 14, 13, 15],
          y2: [1, 4, 2, 1, 3],
          step_mode: "after",
        })
        p.add_tools(new HoverTool({tooltips: "i=$index, x=@x, y1=@y1, y2=@y2"}))

        const {view} = await display(p)
        const gv = view.owner.get_one(g)

        expect(indices(gv, xy(0.75, 10))).to.be.equal([])
        expect(indices(gv, xy(1.25, 10))).to.be.equal([0])
        expect(indices(gv, xy(1.75, 10))).to.be.equal([0])
        expect(indices(gv, xy(2.25, 10))).to.be.equal([1])
        expect(indices(gv, xy(2.75, 10))).to.be.equal([1])
      })
    })

    describe("doesn't allow to correctly hit-test HAreaStep", () => {
      it("with step_mode=before", async () => {
        const p = fig([300, 300], {title: "harea_step: before"})
        const g = p.harea_step({
          y: [1, 2, 3, 4, 5],
          x1: [1, 4, 2, 1, 3],
          x2: [12, 16, 14, 13, 15],
          step_mode: "before",
        })
        p.add_tools(new HoverTool({tooltips: "i=$index, x1=@x1, x2=@x2, y=@y"}))

        const {view} = await display(p)
        const gv = view.owner.get_one(g)

        expect(indices(gv, xy(10, 0.75))).to.be.equal([])
        expect(indices(gv, xy(10, 1.25))).to.be.equal([1])
        expect(indices(gv, xy(10, 1.75))).to.be.equal([1])
        expect(indices(gv, xy(10, 2.25))).to.be.equal([2])
        expect(indices(gv, xy(10, 2.75))).to.be.equal([2])
      })

      it("with step_mode=center", async () => {
        const p = fig([300, 300], {title: "harea_step: center"})
        const g = p.harea_step({
          y: [1, 2, 3, 4, 5],
          x1: [1, 4, 2, 1, 3],
          x2: [12, 16, 14, 13, 15],
          step_mode: "center",
        })
        p.add_tools(new HoverTool({tooltips: "i=$index, x1=@x1, x2=@x2, y=@y"}))

        const {view} = await display(p)
        const gv = view.owner.get_one(g)

        expect(indices(gv, xy(10, 0.75))).to.be.equal([])
        expect(indices(gv, xy(10, 1.25))).to.be.equal([0])
        expect(indices(gv, xy(10, 1.75))).to.be.equal([1])
        expect(indices(gv, xy(10, 2.25))).to.be.equal([1])
        expect(indices(gv, xy(10, 2.75))).to.be.equal([2])
      })

      it("with step_mode=after", async () => {
        const p = fig([300, 300], {title: "harea_step: after"})
        const g = p.harea_step({
          y: [1, 2, 3, 4, 5],
          x1: [1, 4, 2, 1, 3],
          x2: [12, 16, 14, 13, 15],
          step_mode: "after",
        })
        p.add_tools(new HoverTool({tooltips: "i=$index, x1=@x1, x2=@x2, y=@y"}))

        const {view} = await display(p)
        const gv = view.owner.get_one(g)

        expect(indices(gv, xy(10, 0.75))).to.be.equal([])
        expect(indices(gv, xy(10, 1.25))).to.be.equal([0])
        expect(indices(gv, xy(10, 1.75))).to.be.equal([0])
        expect(indices(gv, xy(10, 2.25))).to.be.equal([1])
        expect(indices(gv, xy(10, 2.75))).to.be.equal([1])
      })
    })
  })

  describe("in issue #13507", () => {
    it("doesn't allow to emit RangesUpdate on plots linked by RangeTool's ranges", async () => {
      const source = new ColumnDataSource({
        data: {
          x: [1, 2, 3, 4, 5],
          y: [1, 2, 3, 4, 5],
        },
      })

      const target_plot = fig([300, 200], {x_range: [1.5, 3.5], y_range: [1.5, 3.5]})
      target_plot.scatter({size: 20, source})

      const range_plot = fig([300, 200])
      range_plot.scatter({size: 20, source})

      const range_tool = new RangeTool({
        x_range: target_plot.x_range,
        y_range: target_plot.y_range,
      })
      range_plot.add_tools(range_tool)

      const updates = {target: false, range: false}
      target_plot.on_event(RangesUpdate, () => updates.target = true)
      range_plot.on_event(RangesUpdate, () => updates.range = true)

      const layout = new Column({children: [target_plot, range_plot]})
      const {view} = await display(layout)

      const pv = view.owner.get_one(range_plot)
      await actions(pv).pan(xy(2.5, 2.5), xy(3.5, 3.5))
      await view.ready

      expect(updates.target && updates.range).to.be.true
    })
  })

  describe("in issue #13536", () => {
    it("doesn't allow selected rows to sync correctly when rows are filtered", async () => {
      const source = new ColumnDataSource({
        data: {
          index: [0, 1, 2],
          x: [1, 2, 3],
          y: ["a", "b", "c"],
        },
      })

      const columns = [
        new TableColumn({field: "index", title: "#", width: 50}),
        new TableColumn({field: "x", title: "x", width: 50}),
        new TableColumn({field: "y", title: "y", width: 50}),
      ]
      const filter = new AllIndices()
      const cds_view = new CDSView({filter})

      const table = new DataTable({source, columns, selectable: "checkbox", view: cds_view, width: 300, height: 400})
      const {view} = await display(table, [350, 450])

      await view.ready

      const checkbox1 = view.shadow_el.querySelectorAll(".slick-cell.l1.r1.bk-cell-select")[2]
      const checkbox1_el = checkbox1.querySelector('input[type="checkbox"]')
      expect_not_null(checkbox1_el)
      await mouse_click(checkbox1_el)
      expect(view.get_selected_rows()).to.be.equal([2])
      expect(table.source.selected.indices).to.be.equal([2])

      table.view.filter = new IndexFilter({indices: [0, 1]})

      expect(view.get_selected_rows()).to.be.equal([])
      expect(table.source.selected.indices).to.be.equal([])

      const checkbox2 = view.shadow_el.querySelectorAll(".slick-cell.l1.r1.bk-cell-select")[0]
      const checkbox2_el = checkbox2.querySelector('input[type="checkbox"]')
      expect_not_null(checkbox2_el)
      await mouse_click(checkbox2_el)
      expect(view.get_selected_rows()).to.be.equal([0])
      expect(table.source.selected.indices).to.be.equal([0])

      table.view.filter = new IndexFilter({indices: [0, 1, 2]})

      expect(view.get_selected_rows().slice().sort()).to.be.equal([0, 2].sort())
      expect(table.source.selected.indices.slice().sort()).to.be.equal([0, 2].sort())
    })
  })

  describe("in issue #13831", () => {
    it("allows addition of new indices to selection by default", async () => {
      const tap_tool = new TapTool()
      const p = fig([200, 200], {tools: [tap_tool]})
      const cr = p.circle({x: [0, 1, 2, 3], y: [0, 1, 2, 3], radius: [0.5, 0.75, 1.0, 1.25], color: ["red", "green", "blue", "yellow"], alpha: 0.8})
      const ds = cr.data_source

      const {view} = await display(p)
      const pv = actions(view)

      expect(ds.selected.indices).to.be.equal([])

      async function tap_at(x: number, y: number) {
        await pv.tap(xy(x, y))
        await view.ready
      }

      await tap_at(0, 0)     // select red
      expect(ds.selected.indices).to.be.equal([0])

      await tap_at(0, 0)     // deselect red
      expect(ds.selected.indices).to.be.equal([])

      await tap_at(0, 0)     // select red
      expect(ds.selected.indices).to.be.equal([0])

      await tap_at(1, 1)     // select green
      expect(ds.selected.indices).to.be.equal([1])

      await tap_at(2, 2)     // select blue
      expect(ds.selected.indices).to.be.equal([2])

      await tap_at(3, 3)     // select yellow
      expect(ds.selected.indices).to.be.equal([3])

      await tap_at(4, 0)     // deselect
      expect(ds.selected.indices).to.be.equal([])

      await tap_at(2.5, 2.5) // select blue and yellow
      expect(ds.selected.indices).to.be.equal([2, 3])

      await tap_at(2.5, 2.5) // deselect blue and yellow
      expect(ds.selected.indices).to.be.equal([])

      await tap_at(2, 2)     // select blue
      expect(ds.selected.indices).to.be.equal([2])

      await tap_at(2.5, 2.5) // deselect blue and select yellow
      expect(ds.selected.indices).to.be.equal([3])
    })
  })

  describe("in issue #13951", () => {
    it("doesn't allow inheriting image data in Image-like glyphs", async () => {
      const p = fig([400, 400])

      const color_mapper = new EqHistColorMapper({palette: Spectral11})
      const gr = p.image({image: [scalar_image()], x: 0, y: 0, dw: 10, dh: 10, color_mapper})

      const nonselection_color_mapper = new EqHistColorMapper({palette: Viridis11})
      gr.nonselection_glyph = new Image({x: 0, y: 0, dw: 10, dh: 10, color_mapper: nonselection_color_mapper})

      const {view} = await display(p)
      const grv = view.views.get_one(gr)

      expect_instanceof(grv.glyph, ImageView)
      expect_instanceof(grv.selection_glyph, ImageView)
      expect_instanceof(grv.nonselection_glyph, ImageView)
      expect_instanceof(grv.decimated_glyph, ImageView)
      expect_instanceof(grv.hover_glyph, ImageView)
      expect_instanceof(grv.muted_glyph, ImageView)

      expect(grv.glyph.inherited_image_data).to.be.false
      expect(grv.selection_glyph.inherited_image_data).to.be.true
      expect(grv.nonselection_glyph.inherited_image_data).to.be.false
      expect(grv.decimated_glyph.inherited_image_data).to.be.true
      expect(grv.hover_glyph.inherited_image_data).to.be.true
      expect(grv.muted_glyph.inherited_image_data).to.be.true

      expect(grv.glyph.inherited_image_width).to.be.false
      expect(grv.selection_glyph.inherited_image_width).to.be.true
      expect(grv.nonselection_glyph.inherited_image_width).to.be.false
      expect(grv.decimated_glyph.inherited_image_width).to.be.true
      expect(grv.hover_glyph.inherited_image_width).to.be.true
      expect(grv.muted_glyph.inherited_image_width).to.be.true

      expect(grv.glyph.inherited_image_height).to.be.false
      expect(grv.selection_glyph.inherited_image_height).to.be.true
      expect(grv.nonselection_glyph.inherited_image_height).to.be.false
      expect(grv.decimated_glyph.inherited_image_height).to.be.true
      expect(grv.hover_glyph.inherited_image_height).to.be.true
      expect(grv.muted_glyph.inherited_image_height).to.be.true
    })
  })

  describe("in issue #13965", () => {
    it("doesn't allow to correctly index categories in CategoricalSlider", async () => {
      const categories = range(0, 20).map((i) => `${i}`)
      const slider = new CategoricalSlider({categories, value: "0"})
      const {view} = await display(slider, [300, 50])

      const el = view.shadow_el.querySelector(".noUi-handle")
      expect_not_null(el)

      // The expectation is that no errors accumulate during sliding.
      for (const _ of categories) {
        el.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight"}))
        await view.ready
      }
    })
  })

  describe("in issue #14058", () => {
    it("doesn't allow emitting UI events for all but the first tool", async () => {
      async function test(tools: ToolName[], active_drag: ToolName) {
        const p = fig([200, 200], {tools, active_drag})
        const gr = p.scatter([1, 2, 3], [1, 2, 3], {size: 20})
        gr.data_source.selected.indices = [1]
        const {view} = await display(p)
        expect(gr.data_source.selected.indices).to.be.equal([1])
        const ev = new KeyboardEvent("keyup", {key: "Escape"})
        document.dispatchEvent(ev)
        await view.ready
        expect(gr.data_source.selected.indices).to.be.equal([])
      }

      await test(["box_select", "lasso_select"], "box_select")
      await test(["box_select", "lasso_select"], "lasso_select")
      await test(["lasso_select", "box_select"], "box_select")
      await test(["lasso_select", "box_select"], "lasso_select")
    })
  })

  describe("in issue #14072", () => {
    it("doesn't allow Spinner widget to react to wheel events when focused", async () => {
      const spinner = new Spinner({value: 0, step: 1, width: 100})
      const {view} = await display(spinner, [150, 100])
      expect(spinner.value).to.be.equal(0)

      window.focus() // make sure spinner doesn't have focus
      await scroll_up(view.input_el)
      await view.ready
      await scroll_up(view.input_el)
      await view.ready
      expect(spinner.value).to.be.equal(0)
      await scroll_down(view.input_el)
      await view.ready
      expect(spinner.value).to.be.equal(0)

      view.input_el.focus()
      await scroll_up(view.input_el)
      await view.ready
      await scroll_up(view.input_el)
      await view.ready
      expect(spinner.value).to.be.equal(2)
      await scroll_down(view.input_el)
      await view.ready
      expect(spinner.value).to.be.equal(1)
    })
  })

  describe("in issue #14107", () => {
    it("doesn't allow for default browser touch actions when no tools are enabled", async () => {
      const p0 = fig([200, 200], {tools: [], toolbar_location: "right"})
      p0.scatter([1, 2, 3], [1, 2, 3], {size: 20})
      const {view: pv0} = await display(p0)
      expect(getComputedStyle(pv0.canvas.events_el).touchAction).to.be.equal("auto")

      const pan1 = new PanTool()
      const p1 = fig([200, 200], {tools: [pan1], active_drag: pan1, toolbar_location: "right"})
      p1.scatter([1, 2, 3], [1, 2, 3], {size: 20})
      const {view: pv1} = await display(p1)
      expect(getComputedStyle(pv1.canvas.events_el).touchAction).to.be.equal("pinch-zoom")

      const zoom2 = new WheelZoomTool()
      const p2 = fig([200, 200], {tools: [zoom2], active_scroll: zoom2, toolbar_location: "right"})
      p2.scatter([1, 2, 3], [1, 2, 3], {size: 20})
      const {view: pv2} = await display(p2)
      expect(getComputedStyle(pv2.canvas.events_el).touchAction).to.be.equal("pan-x pan-y")

      const pan3 = new PanTool()
      const zoom3 = new WheelZoomTool()
      const p3 = fig([200, 200], {tools: [pan3, zoom3], active_drag: pan3, active_scroll: zoom3, toolbar_location: "right"})
      p3.scatter([1, 2, 3], [1, 2, 3], {size: 20})
      const {view: pv3} = await display(p3)
      expect(getComputedStyle(pv3.canvas.events_el).touchAction).to.be.equal("none")
    })
  })
})

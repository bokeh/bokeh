import {figure} from "@bokehjs/api/figure"
import {logger} from "@bokehjs/core/logging"
import * as Events from "@bokehjs/core/bokeh_events"
import type {TapEvent} from "@bokehjs/core/ui_events"
import {actions, xy} from "#framework/interactive"
import {BoxSelectTool} from "@bokehjs/models/tools/gestures/box_select_tool"
import {TapTool} from "@bokehjs/models/tools/gestures/tap_tool"
import type {TapToolCallback} from "@bokehjs/models/tools/gestures/tap_tool"
import {CoordinateTransform} from "@bokehjs/models/coordinates/coordinate_mapping"
import * as sinon from "sinon"
import {restorable} from "#framework/util"
import {SpatialIndex} from "@bokehjs/core/util/spatial"
import {BoxAnnotation} from "@bokehjs/models/annotations/box_annotation"
import {TileRenderer} from "@bokehjs/models/tiles/tile_renderer"
import {WMTSTileSource} from "@bokehjs/models/tiles/wmts_tile_source"
import {LogScale} from "@bokehjs/models/scales/log_scale"
import {Segment} from "@bokehjs/models/glyphs/segment"
import {ZoomOutTool} from "@bokehjs/models/tools/actions/zoom_out_tool"
import {BoxZoomTool} from "@bokehjs/models/tools/gestures/box_zoom_tool"
import {settings} from "@bokehjs/core/settings"
import {TextBox} from "@bokehjs/core/graphics"
import {expect, expect_instanceof} from "#framework/assertions"
import {display} from "#framework/layouts"
import {build_view} from "@bokehjs/core/build_views"
import {BBox} from "@bokehjs/core/util/bbox"
import type {CartesianFrameView} from "@bokehjs/models/canvas/cartesian_frame"
import {CartesianFrame} from "@bokehjs/models/canvas/cartesian_frame"
import {PolarMapping} from "@bokehjs/models/coordinates/polar_mapping"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Row} from "@bokehjs/models/layouts/row"
import {Plot} from "@bokehjs/models/plots/plot"
import type {ScatterView} from "@bokehjs/models/glyphs/scatter"
import {Scatter} from "@bokehjs/models/glyphs/scatter"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {WheelZoomTool} from "@bokehjs/models/tools/gestures/wheel_zoom_tool"
import {PanTool} from "@bokehjs/models/tools/gestures/pan_tool"
import {HoverTool} from "@bokehjs/models/tools/inspectors/hover_tool"
import {PolarAxis, polar_ticks} from "@bokehjs/models/axes/polar_axis"
import {PolarGrid} from "@bokehjs/models/grids/polar_grid"
import {FixedTicker} from "@bokehjs/models/tickers/fixed_ticker"

async function transform(attrs: Partial<PolarMapping.Attrs> = {}) {
  const mapping = PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10}), padding: 0, ...attrs})
  const frame = await build_view(CartesianFrame.create({x_range: mapping.radial_range, y_range: mapping.angular_range}), {parent: null})
  frame.set_geometry(new BBox({x: 0, y: 0, width: 400, height: 200}))
  return mapping.get_transform(frame)
}

function scatter_models(mapping?: PolarMapping) {
  mapping ??= PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10}), padding: 20})
  const source = ColumnDataSource.create({data: {x: [5, 5, 5, -1, NaN, 5], y: [0, 90, 359, 30, 30, 180]}})
  const renderer = GlyphRenderer.create({glyph: Scatter.create({x: {field: "x"}, y: {field: "y"}, size: 10}), data_source: source})
  const axes = [PolarAxis.create({dimension: "radial"}), PolarAxis.create({dimension: "angular"})]
  const plot = Plot.create({width: 300, height: 300, min_border: 0, toolbar_location: null, coordinate_system: mapping,
                            renderers: [...axes.map((axis) => PolarGrid.create({axis})), ...axes, renderer]})
  const wheel = WheelZoomTool.create()
  const pan = PanTool.create()
  const hover = HoverTool.create({renderers: [renderer]})
  plot.add_tools(wheel, pan, hover)
  return {plot, renderer, source, mapping, wheel, pan, hover}
}

async function scatter_plot(mapping?: PolarMapping) {
  const {plot, renderer, source, mapping: coordinates, wheel, pan, hover} = scatter_models(mapping)
  const {view} = await display(plot)
  return {view, renderer: view.owner.get_one(renderer), source, mapping: coordinates, wheel: view.owner.get_one(wheel), pan: view.owner.get_one(pan), hover: view.owner.get_one(hover)}
}

describe("PolarMapping", () => {
  for (const state of ["selection_glyph", "nonselection_glyph", "hover_glyph", "muted_glyph"] as const) {
    it(`rejects an unsupported ${state} and recovers with Cartesian coordinates`, async () => {
      using warn = restorable(sinon.stub(logger, "warn"))
      const {plot, renderer} = scatter_models()
      const model: GlyphRenderer = renderer
      model[state] = Segment.create()
      const {view} = await display(plot)
      const renderer_view = view.owner.get_one(renderer)
      const message = "Skipping GlyphRenderer: this renderer or its visual-state glyphs are not supported by PolarMapping"
      expect(renderer_view.is_renderable).to.be.false
      expect(warn.withArgs(message).callCount).to.be.equal(1)
      expect(renderer_view.is_renderable).to.be.false
      expect(warn.withArgs(message).callCount).to.be.equal(1)

      plot.coordinate_system = null
      await view.ready
      expect(renderer_view.is_renderable).to.be.true
    })
  }

  for (const kind of ["axis", "grid"] as const) {
    it(`warns once for a misplaced polar ${kind} and recovers when the mapping changes`, async () => {
      using warn = restorable(sinon.stub(logger, "warn"))
      const axis = PolarAxis.create()
      const guide = kind == "axis" ? axis : PolarGrid.create({axis})
      const plot = Plot.create({x_range: Range1d.create({start: 0, end: 10}),
                                y_range: Range1d.create({start: 0, end: 360}),
                                toolbar_location: null, renderers: [guide]})
      const {view} = await display(plot)
      const guide_view = view.owner.get_one(guide)
      const message = `Skipping ${guide.type}: ${guide.type} requires a PolarMapping`
      expect(guide_view.is_renderable).to.be.false
      expect(warn.withArgs(message).callCount).to.be.equal(1)
      view.request_repaint()
      await view.ready
      expect(guide_view.is_renderable).to.be.false
      expect(warn.withArgs(message).callCount).to.be.equal(1)

      plot.coordinate_system = PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10})})
      await view.ready
      expect(guide_view.is_renderable).to.be.true

      plot.coordinate_system = null
      await view.ready
      expect(guide_view.is_renderable).to.be.false
      expect(warn.withArgs(message).callCount).to.be.equal(2)
    })
  }

  it("maps cardinal angles with a circular aspect in a rectangular frame", async () => {
    const t = await transform()
    expect(t.compute(10, 0)).to.be.similar([300, 100])
    expect(t.compute(10, 90)).to.be.similar([200, 0])
    expect(t.compute(10, 180)).to.be.similar([100, 100])
    expect(t.compute(10, 270)).to.be.similar([200, 200])
    expect(t.compute(10, 360)).to.be.similar(t.compute(10, 0))
  })

  it("inverts paired coordinates and leaves the angle at the origin undefined", async () => {
    const t = await transform()
    for (const theta of [0, 45, 90, 200, 359]) {
      expect(t.invert(...t.compute(7, theta))).to.be.similar([7, theta])
    }
    expect(t.invert(...t.center)[0]).to.be.equal(0)
    expect(t.invert(...t.center)[1]).to.be.NaN
    const [rs, angles] = t.map_from_screen(...t.map_to_screen([1, 3], [45, 270]))
    expect(rs).to.be.similar(new Float64Array([1, 3]))
    expect(angles).to.be.similar(new Float64Array([45, 270]))
  })

  it("supports clockwise angles, other zero directions, and radians", async () => {
    const t = await transform({zero_direction: "north", direction: "clock", angle_units: "rad", angular_range: Range1d.create({start: 0, end: 2*Math.PI})})
    expect(t.compute(10, 0)).to.be.similar([200, 0])
    expect(t.compute(10, Math.PI/2)).to.be.similar([300, 100])
    expect(t.invert(...t.compute(3, Math.PI))).to.be.similar([3, Math.PI])
  })

  it("handles sectors crossing the seam with unwrapped bounds", async () => {
    const t = await transform({angular_range: Range1d.create({start: 300, end: 420})})
    expect(t.compute(5, 30)).to.be.similar(t.compute(5, 390))
    expect(t.invert(...t.compute(5, 30))).to.be.similar([5, 390])
    expect(t.compute(5, 180)[0]).to.be.NaN
    expect(t.contains(150, 100)).to.be.false
    expect(t.contains(...t.center)).to.be.true
    expect(t.contains(301, 100)).to.be.false
  })

  it("excludes invalid radii, angles, and data outside explicit radial limits", async () => {
    const t = await transform()
    for (const [r, theta] of [[-1, 0], [NaN, 0], [1, NaN], [Infinity, 0], [11, 0]]) {
      expect(t.compute(r, theta)[0]).to.be.NaN
    }
  })

  it("rejects invalid range configurations", async () => {
    for (const attrs of [
      {radial_range: Range1d.create({start: -1, end: 10})},
      {radial_range: Range1d.create({start: 10, end: 0})},
      {angular_range: Range1d.create({start: 0, end: 400})},
      {angular_range: Range1d.create({start: 0, end: 0})},
    ]) {
      const t = await transform(attrs)
      expect(t.validate()).to.be.false
    }
  })

  it("updates geometry after frame resizing", async () => {
    const t = await transform()
    ;(t.frame as CartesianFrameView).set_geometry(new BBox({x: 20, y: 30, width: 200, height: 400}))
    expect(t.compute(10, 0)).to.be.similar([220, 230])
    expect(t.invert(220, 230)).to.be.similar([10, 0])
  })

  it("uses axis tickers for polar guides without a duplicate seam label", async () => {
    const t = await transform()
    const axis = PolarAxis.create({dimension: "angular", ticker: FixedTicker.create({ticks: [0, 90, 180, 270, 360]})})
    expect(polar_ticks(axis, t)).to.be.equal([0, 90, 180, 270])
    t.mapping.angular_range.end = 180
    expect(polar_ticks(axis, t)).to.be.equal([0, 90, 180])
  })

  it("hits scatter points and selects rectangles, lassos, and spans in screen space", async () => {
    const {renderer} = await scatter_plot()
    const {sx, sy} = renderer.glyph as ScatterView
    const point = renderer.hit_test({type: "point", sx: sx[0], sy: sy[0]})!
    expect(point.indices).to.be.equal([0, 2])
    const rect = renderer.hit_test({type: "rect", sx0: sx[1] - 2, sx1: sx[1] + 2, sy0: sy[1] - 2, sy1: sy[1] + 2})!
    expect(rect.indices).to.be.equal([1])
    const poly = renderer.hit_test({type: "poly", sx: [sx[1] - 2, sx[1] + 2, sx[1]], sy: [sy[1] + 2, sy[1] + 2, sy[1] - 2]})!
    expect(poly.indices).to.be.equal([1])
    const span = renderer.hit_test({type: "span", direction: "h", sx: sx[1], sy: sy[1]})!
    expect(span.indices).to.be.equal([1])
  })

  it("pans the frame in both directions and zooms around the pointer without changing data ranges", async () => {
    const {view, mapping, wheel, pan, renderer} = await scatter_plot()
    const t = view.polar_transform!
    const center = t.center
    const radius = t.radius
    const anchor = t.compute(5, 45)
    wheel.zoom(...anchor, 60)
    await view.ready
    expect(t.compute(5, 45)).to.be.similar(anchor)
    expect(t.radius).to.be.similar(radius/0.9)
    expect([mapping.radial_range.start, mapping.radial_range.end]).to.be.equal([0, 10])
    const before = t.compute(5, 90)
    pan._pan_start({type: "pan_start", sx: center[0], sy: center[1], dx: 0, dy: 0, modifiers: {shift: false, ctrl: false, alt: false}, native: new PointerEvent("pointerdown")})
    pan._update(30, -20)
    pan._pan_end({type: "pan_end", sx: center[0] + 30, sy: center[1] - 20, dx: 30, dy: -20, modifiers: {shift: false, ctrl: false, alt: false}, native: new PointerEvent("pointerup")})
    await view.ready
    expect(t.compute(5, 90)).to.be.similar([before[0] + 30, before[1] - 20])
    expect(renderer.hit_test({type: "point", sx: before[0] + 30, sy: before[1] - 20})!.indices).to.be.equal([1])
    expect([mapping.angular_range.start, mapping.angular_range.end]).to.be.equal([0, 360])
    expect([mapping.radial_range.start, mapping.radial_range.end]).to.be.equal([0, 10])
    view.state.undo()
    expect(t.compute(5, 90)).to.be.similar(before)
    view.state.redo()
    expect(t.compute(5, 90)).to.be.similar([before[0] + 30, before[1] - 20])
    view.reset()
    expect(t.center).to.be.similar(center)
    expect(t.radius).to.be.similar(radius)
    expect(view.polar_viewport).to.be.equal({x: 0, y: 0, scale: 1})
  })

  it("ignores wheel events outside the rectangular viewport", async () => {
    const {view, wheel} = await scatter_plot()
    wheel.zoom(view.frame.bbox.right + 10, view.frame.bbox.bottom + 10, 60)
    expect(view.polar_viewport).to.be.equal({x: 0, y: 0, scale: 1})
  })

  it("rebuilds screen hits after data changes", async () => {
    const {renderer, source, view} = await scatter_plot()
    source.data = {x: [5], y: [180]}
    await view.ready
    const [sx, sy] = renderer.coordinates.compute(5, 180)
    expect(renderer.hit_test({type: "point", sx, sy})!.indices).to.be.equal([0])
  })

  it("reports polar hover values, including an undefined angle at the center", async () => {
    const {renderer, hover, source, view} = await scatter_plot()
    const [sx, sy] = renderer.coordinates.compute(5, 90)
    hover._inspect(sx, sy, "xy")
    const entries = hover.render_entries(renderer.model, {type: "point", sx, sy})
    expect(entries[0].vars.x).to.be.similar(5)
    expect(entries[0].vars.y).to.be.similar(90)
    source.data = {x: [0], y: [30]}
    await view.ready
    const [cx, cy] = view.polar_transform!.center
    hover._inspect(cx, cy, "xy")
    const origin = hover.render_entries(renderer.model, {type: "point", sx: cx, sy: cy})
    expect(origin[0].vars.x).to.be.equal(0)
    expect(origin[0].vars.y).to.be.NaN
  })

  it("keeps linked polar ranges and screen hits synchronized", async () => {
    const a = scatter_models()
    const b = scatter_models(PolarMapping.create({radial_range: a.mapping.radial_range, padding: 20}))
    const {view} = await display(Row.create({children: [a.plot, b.plot]}))
    const av = view.owner.get_one(a.plot)
    const bv = view.owner.get_one(b.plot)
    view.owner.get_one(a.wheel).zoom(...av.polar_transform!.compute(5, 0), 60)
    await bv.ready
    expect(bv.polar_viewport).to.be.equal({x: 0, y: 0, scale: 1})
    a.mapping.radial_range.end = 20
    await bv.ready
    expect(b.mapping.radial_range).to.be.identical(a.mapping.radial_range)
    const ar = view.owner.get_one(a.renderer)
    const br = view.owner.get_one(b.renderer)
    const [sx, sy] = br.coordinates.compute(5, 90)
    expect(br.coordinates.invert(sx, sy)).to.be.similar(ar.coordinates.invert(...ar.coordinates.compute(5, 90)))
    expect(br.hit_test({type: "point", sx, sy})!.indices).to.be.equal([1])
  })

  it("rebinds replaced ranges and updates the screen index on range changes", async () => {
    const {mapping, view, renderer} = await scatter_plot()
    mapping.radial_range = Range1d.create({start: 0, end: 20})
    await view.ready
    expect(view.frame.x_range).to.be.identical(mapping.radial_range)
    mapping.radial_range.end = 15
    await view.ready
    const [sx, sy] = renderer.coordinates.compute(5, 90)
    expect(renderer.hit_test({type: "point", sx, sy})!.indices).to.be.equal([1])
  })

  it("selects only visible points in a seam-crossing sector", async () => {
    const {renderer, view} = await scatter_plot(PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10}),
                                                                     angular_range: Range1d.create({start: 300, end: 420})}))
    const {left: sx0, right: sx1, top: sy0, bottom: sy1} = view.frame.bbox
    expect(renderer.hit_test({type: "rect", sx0, sx1, sy0, sy1})!.indices).to.be.equal([0, 2])
  })

  it("creates polar axes and grids through the JavaScript figure API", async () => {
    const mapping = PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10})})
    const plot = figure({width: 300, height: 300, coordinate_system: mapping})
    plot.scatter([5], [90])
    const {view} = await display(plot)
    expect(plot.renderers.filter((r) => r instanceof PolarAxis).length).to.be.equal(2)
    expect(plot.renderers.filter((r) => r instanceof PolarGrid).length).to.be.equal(2)
    expect(plot.below).to.be.equal([])
    expect(plot.left).to.be.equal([])
    expect(view.polar_transform!.invert(...view.polar_transform!.compute(5, 90))).to.be.similar([5, 90])
  })

  it("positions the box-selection overlay in the dragged screen rectangle", async () => {
    const models = scatter_models()
    const box = BoxSelectTool.create()
    models.plot.add_tools(box)
    const {view} = await display(models.plot)
    const tool = view.owner.get_one(box)
    const modifiers = {shift: false, ctrl: false, alt: false}
    tool._pan_start({type: "pan_start", sx: 110, sy: 120, dx: 0, dy: 0, modifiers, native: new PointerEvent("pointerdown")})
    tool._pan({type: "pan", sx: 190, sy: 200, dx: 80, dy: 80, modifiers, native: new PointerEvent("pointermove")})
    await view.ready
    const overlay = view.owner.get_one(box.overlay)
    expect(overlay.coordinates.is_separable).to.be.true
    expect(overlay.bbox.rect).to.be.similar(new BBox({left: 110, right: 190, top: 120, bottom: 200}).rect)
  })

  it("reports paired polar coordinates in tap callbacks and plot events", async () => {
    const models = scatter_models()
    const callbacks: [number, number][] = []
    const selections: Events.SelectionGeometry[] = []
    const taps: Events.Tap[] = []
    const callback: TapToolCallback = (_, {geometries}) => callbacks.push([geometries.x, geometries.y])
    const tap = TapTool.create({callback})
    models.plot.add_tools(tap)
    models.plot.on_event(Events.Tap, (event) => taps.push(event))
    models.plot.on_event(Events.SelectionGeometry, (event) => selections.push(event))
    const {view} = await display(models.plot)
    const [sx, sy] = view.polar_transform!.compute(5, 90)
    const modifiers = {shift: false, ctrl: false, alt: false}
    view.owner.get_one(tap)._tap({sx, sy, modifiers} as TapEvent)
    await actions(view, {units: "screen"}).tap(xy(sx, sy))
    expect(callbacks[0]).to.be.similar([5, 90])
    expect([taps[0].x, taps[0].y]).to.be.similar([5, 90])
    const point = selections[0].geometry
    expect(point.type).to.be.equal("point")
    if (point.type == "point") {
      expect([point.x, point.y]).to.be.similar([5, 90])
    }
  })

  it("skips invalid ranges and recovers after they become valid", async () => {
    const {view, mapping, renderer} = await scatter_plot()
    const ctx = view.canvas_view.primary.ctx
    const before = ctx.getTransform()
    mapping.radial_range.start = -1
    await view.ready
    expect(view.polar_transform!.is_valid).to.be.false
    expect([...renderer.glyph.mask_data()]).to.be.equal([])
    expect([...ctx.getTransform().toFloat64Array()]).to.be.equal([...before.toFloat64Array()])
    mapping.radial_range.start = 0
    await view.ready
    const [sx, sy] = renderer.coordinates.compute(5, 90)
    expect(renderer.hit_test({type: "point", sx, sy})!.indices).to.be.equal([1])
  })

  it("rejects unsupported glyphs and tools before a JavaScript figure paints", () => {
    const mapping = PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10})})
    const p = figure({coordinate_system: mapping, tools: []})
    expect(() => p.segment([1], [0], [2], [90])).to.throw(Error, "not supported by PolarMapping")
    for (const tool of ["box_zoom", "zoom_in", "zoom_out", "xpan", "ypan", "xwheel_zoom", "ywheel_zoom", "xwheel_pan", "ywheel_pan"] as const) {
      expect(() => figure({coordinate_system: mapping, tools: [tool]})).to.throw(Error)
    }
  })

  it("rejects deferred path glyphs through figure and raw renderer entry points", async () => {
    const {Line} = await import("@bokehjs/models/glyphs/line")
    const {Patch} = await import("@bokehjs/models/glyphs/patch")
    const {MultiLine} = await import("@bokehjs/models/glyphs/multi_line")
    const p = figure({coordinate_system: PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10})}), tools: []})
    expect(() => p.line([2, 4], [0, 90])).to.throw(Error, "not supported by PolarMapping")
    expect(() => p.patch([2, 4, 2], [0, 90, 180])).to.throw(Error, "not supported by PolarMapping")
    expect(() => p.multi_line([[2, 4]], [[0, 90]])).to.throw(Error, "not supported by PolarMapping")
    const renderers = [Line.create(), Patch.create(), MultiLine.create()].map((glyph) => {
      expect(() => p.add_glyph(glyph)).to.throw(Error, "not supported by PolarMapping")
      return GlyphRenderer.create({glyph, data_source: ColumnDataSource.create()})
    })
    p.add_renderers(...renderers)
    const {view} = await display(p)
    expect(renderers.every((r) => !view.owner.get_one(r).is_renderable)).to.be.true
  })

  it("preserves custom renderer coordinates when the mapping changes", async () => {
    const {view, mapping, renderer} = await scatter_plot()
    const coordinates = new CoordinateTransform(view.frame.x_scale, view.frame.y_scale)
    renderer.coordinates = coordinates
    mapping.zero_direction = "north"
    await view.ready
    expect(renderer.coordinates).to.be.identical(coordinates)
  })

  it("updates a replaced mapping even when it shares the same ranges", async () => {
    const {view, mapping, renderer} = await scatter_plot()
    view.model.coordinate_system = PolarMapping.create({radial_range: mapping.radial_range, angular_range: mapping.angular_range,
                                                        zero_direction: "north", padding: 20})
    await view.ready
    const [cx, cy] = view.polar_transform!.center
    expect(renderer.coordinates.compute(5, 0)).to.be.similar([cx, cy - 65])
    expect(renderer.hit_test({type: "point", sx: cx, sy: cy - 65})!.indices).to.be.equal([0, 2])
  })

  it("restores the authoritative mapping range if the JavaScript x_range is replaced", async () => {
    const {view, mapping} = await scatter_plot()
    view.model.x_range = Range1d.create({start: 0, end: 20})
    expect(view.model.x_range).to.be.identical(mapping.radial_range)
    view.reset_range()
    expect([mapping.radial_range.start, mapping.radial_range.end]).to.be.equal([0, 10])
  })

  it("uses radius and angle labels in JavaScript default hover tooltips", () => {
    const p = figure({coordinate_system: PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10})})})
    const hover = p.toolbar.tools.find((tool) => tool instanceof HoverTool) as HoverTool
    expect(hover.tooltips).to.be.equal([["radius", "$x"], ["angle", "$y"]])
  })

  for (const level of ["glyph", "image", "underlay", "annotation"] as const) {
    it(`clips scatter markers at the circular boundary at level ${level}`, async () => {
      const mapping = PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10}), padding: 20})
      const renderer = GlyphRenderer.create({level, glyph: Scatter.create({x: {value: 10}, y: {value: 0}, size: 40,
                                                                           fill_color: "red", line_color: null}), data_source: ColumnDataSource.create({data: {index: [0]}})})
      const p = Plot.create({coordinate_system: mapping, width: 200, height: 200, min_border: 0,
                             toolbar_location: null, outline_line_color: null, renderers: [renderer]})
      const {view} = await display(p)
      const {ctx, pixel_ratio} = view.canvas_view.primary
      const pixel = (x: number, y: number) => [...ctx.getImageData(x*pixel_ratio, y*pixel_ratio, 1, 1).data]
      expect(pixel(175, 100)).to.be.equal([255, 0, 0, 255])
      expect(pixel(185, 100)).to.be.equal([0, 0, 0, 0])
    })
  }

  it("does not build a screen-space tree until a hit-test needs it", async () => {
    const {view, renderer} = await scatter_plot()
    using finish = restorable(sinon.spy(SpatialIndex.prototype, "finish"))
    view.request_repaint()
    await view.ready
    expect(finish.callCount).to.be.equal(0)
    const [sx, sy] = renderer.coordinates.compute(5, 90)
    expect(renderer.hit_test({type: "point", sx, sy})!.indices).to.be.equal([1])
    expect(finish.callCount).to.be.equal(1)
  })

  it("clips the sector background and markers crossing a sector edge", async () => {
    const mapping = PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10}),
                                         angular_range: Range1d.create({start: 0, end: 90}), padding: 20})
    const renderer = GlyphRenderer.create({glyph: Scatter.create({x: {value: 5}, y: {value: 0}, size: 40,
                                                                  fill_color: "red", line_color: null}), data_source: ColumnDataSource.create({data: {index: [0]}})})
    const p = Plot.create({coordinate_system: mapping, width: 200, height: 200, min_border: 0,
                           toolbar_location: null, background_fill_color: "blue", outline_line_color: null, renderers: [renderer]})
    const {view} = await display(p)
    const {ctx, pixel_ratio} = view.canvas_view.primary
    const pixel = (x: number, y: number) => [...ctx.getImageData(x*pixel_ratio, y*pixel_ratio, 1, 1).data]
    expect(pixel(135, 95)).to.be.equal([255, 0, 0, 255])
    expect(pixel(135, 105)).to.be.equal([0, 0, 0, 0])
    expect(pixel(110, 80)).to.be.equal([0, 0, 255, 255])
    expect(pixel(110, 120)).to.be.equal([0, 0, 0, 0])
  })

  it("continues painting supported scatter and polar guides after an unsupported renderer", async () => {
    const models = scatter_models()
    const bad = GlyphRenderer.create({glyph: Segment.create({x0: {field: "x"}, y0: {field: "y"}, x1: {field: "x"}, y1: {field: "y"}}), data_source: models.source})
    models.plot.renderers = [bad, ...models.plot.renderers]
    models.hover.renderers = [bad, models.renderer]
    const tap = TapTool.create({renderers: [bad, models.renderer]})
    models.plot.add_tools(tap)
    const {view} = await display(models.plot)
    expect(view.owner.get_one(bad).is_renderable).to.be.false
    const renderer = view.owner.get_one(models.renderer)
    expect(renderer.is_renderable).to.be.true
    const [sx, sy] = renderer.coordinates.compute(5, 90)
    expect(view.owner.get_one(bad).hit_test({type: "point", sx, sy})).to.be.null
    expect(renderer.hit_test({type: "point", sx, sy})!.indices).to.be.equal([1])
    const hover = view.owner.get_one(models.hover)
    hover._inspect(sx, sy, "xy")
    expect(hover.render_entries(models.renderer, {type: "point", sx, sy})[0].vars.y).to.be.similar(90)
    view.owner.get_one(tap)._tap({sx, sy, modifiers: {shift: false, ctrl: false, alt: false}} as TapEvent)
    expect(models.source.selected.indices).to.be.equal([1])
    const {ctx, pixel_ratio} = view.canvas_view.primary
    expect(ctx.getImageData(Math.round(sx*pixel_ratio), Math.round(sy*pixel_ratio), 1, 1).data[3]).to.be.equal(255)
    expect(view.owner.get_one(models.plot.renderers.find((r) => r instanceof PolarAxis)!).has_finished()).to.be.true
  })

  it("rejects unsupported glyphs added directly through Plot.add_glyph", () => {
    const p = Plot.create({coordinate_system: PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10})})})
    expect(() => p.add_glyph(Segment.create())).to.throw(Error, "not supported by PolarMapping")
  })

  it("does not let tools inserted through the toolbar change polar ranges", async () => {
    const models = scatter_models()
    const zoom = ZoomOutTool.create()
    const box = BoxZoomTool.create()
    models.plot.toolbar.tools = [...models.plot.toolbar.tools, zoom, box]
    models.plot.toolbar.active_drag = box
    const {view} = await display(models.plot)
    await actions(view, {units: "screen"}).pan(xy(60, 70), xy(210, 230), 5)
    expect(view.owner.get_one(zoom).is_supported).to.be.false
    zoom.do.emit(undefined)
    view.owner.get_one(zoom).doit()
    view.owner.get_one(box)._update([20, 280], [20, 280])
    expect([models.mapping.radial_range.start, models.mapping.radial_range.end]).to.be.equal([0, 10])
    expect([models.mapping.angular_range.start, models.mapping.angular_range.end]).to.be.equal([0, 360])
  })

  it("wraps sector tick labels while retaining their unwrapped tick positions", async () => {
    const mapping = PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10}),
                                         angular_range: Range1d.create({start: 300, end: 420})})
    const models = scatter_models(mapping)
    const axis = models.plot.renderers.find((r): r is PolarAxis => r instanceof PolarAxis && r.dimension == "angular")!
    axis.ticker = FixedTicker.create({ticks: [300, 330, 360, 390, 420]})
    const {view} = await display(models.plot)
    const axis_view = view.owner.get_one(axis)
    const ticks = polar_ticks(axis, view.polar_transform!)
    const labels = () => axis_view.compute_labels(ticks).map((label) => {
      expect_instanceof(label, TextBox)
      return label.text
    })
    expect(ticks).to.be.equal([300, 330, 360, 390, 420])
    expect(labels()).to.be.equal(["300", "330", "0", "30", "60"])
    axis.wrap_labels = false
    expect(labels()).to.be.equal(["300", "330", "360", "390", "420"])
  })

  it("uses 45-degree ticks on a default full-circle figure", async () => {
    const p = figure({coordinate_system: PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10})}),
                      width: 300, height: 300})
    const {view} = await display(p)
    const axis = p.renderers.find((r): r is PolarAxis => r instanceof PolarAxis && r.dimension == "angular")!
    expect(polar_ticks(axis, view.polar_transform!)).to.be.equal([0, 45, 90, 135, 180, 225, 270, 315])
  })

  it("renders and clips polar scatter on canvas when the plot requests WebGL", async () => {
    // The test harness forces WebGL, so restore the production fallback policy for this case.
    using fallback = restorable(sinon.stub(settings, "force_webgl"))
    fallback.get(() => false)
    const models = scatter_models()
    models.plot.output_backend = "webgl"
    const {view} = await display(models.plot)
    const renderer = view.owner.get_one(models.renderer)
    expect(renderer.glyph.has_webgl()).to.be.false
    const [sx, sy] = renderer.coordinates.compute(5, 90)
    const {ctx, pixel_ratio} = view.canvas_view.primary
    expect(ctx.getImageData(Math.round(sx*pixel_ratio), Math.round(sy*pixel_ratio), 1, 1).data[3]).to.be.equal(255)
    expect(renderer.hit_test({type: "point", sx, sy})!.indices).to.be.equal([1])
  })

  it("does not let a tile renderer rewrite polar ranges or reset values", async () => {
    const models = scatter_models()
    const tile = TileRenderer.create({tile_source: WMTSTileSource.create({url: "https://example.invalid/{Z}/{X}/{Y}.png"})})
    models.plot.renderers = [tile, ...models.plot.renderers]
    const {view} = await display(models.plot)
    expect(view.owner.get_one(tile).is_renderable).to.be.false
    expect([models.mapping.radial_range.start, models.mapping.radial_range.end]).to.be.equal([0, 10])
    expect([models.mapping.angular_range.start, models.mapping.angular_range.end]).to.be.equal([0, 360])
    expect(models.mapping.radial_range.reset_start).to.be.null
    expect(models.mapping.radial_range.reset_end).to.be.null
    view.reset_range()
    expect([models.mapping.radial_range.start, models.mapping.radial_range.end]).to.be.equal([0, 10])
  })

  it("clips scatter nested in an annotation to the polar boundary", async () => {
    const mapping = PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10}), padding: 20})
    const renderer = GlyphRenderer.create({glyph: Scatter.create({x: {value: 10}, y: {value: 0}, size: 40,
                                                                  fill_color: "red", line_color: null}), data_source: ColumnDataSource.create({data: {index: [0]}})})
    const annotation = BoxAnnotation.create({fill_color: null, line_color: null, renderers: [renderer]})
    const p = Plot.create({coordinate_system: mapping, width: 200, height: 200, min_border: 0,
                           toolbar_location: null, outline_line_color: null, renderers: [annotation]})
    const {view} = await display(p)
    const {ctx, pixel_ratio} = view.canvas_view.primary
    const pixel = (x: number, y: number) => [...ctx.getImageData(x*pixel_ratio, y*pixel_ratio, 1, 1).data]
    expect(pixel(175, 100)).to.be.equal([255, 0, 0, 255])
    expect(pixel(185, 100)).to.be.equal([0, 0, 0, 0])
  })

  it("rejects incompatible axis types and nonlinear frame scales in JavaScript", () => {
    const mapping = PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10})})
    for (const x_axis_type of ["log", "datetime", "mercator"] as const) {
      expect(() => figure({coordinate_system: mapping, x_axis_type})).to.throw(Error, "PolarMapping currently supports linear radial scaling only")
    }
    expect(() => figure({coordinate_system: mapping, x_scale: LogScale.create()})).to.throw(Error)
    expect(() => figure({coordinate_system: mapping, y_scale: LogScale.create()})).to.throw(Error)
  })

  it("refreshes WebGL eligibility when switching between Cartesian and polar mappings", async () => {
    using fallback = restorable(sinon.stub(settings, "force_webgl"))
    fallback.get(() => false)
    const mapping = PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10}), padding: 20})
    const renderer = GlyphRenderer.create({glyph: Scatter.create({x: {value: 10}, y: {value: 0}, size: 40,
                                                                  fill_color: "red", line_color: null}), data_source: ColumnDataSource.create({data: {index: [0]}})})
    const p = Plot.create({output_backend: "webgl", x_range: mapping.radial_range, y_range: mapping.angular_range,
                           width: 200, height: 200, min_border: 0, toolbar_location: null, outline_line_color: null, renderers: [renderer]})
    const {view} = await display(p)
    const rv = view.owner.get_one(renderer)
    expect(rv.glyph.has_webgl()).to.be.true
    p.coordinate_system = mapping
    await view.ready
    expect(rv.glyph.has_webgl()).to.be.false
    const {ctx, pixel_ratio} = view.canvas_view.primary
    expect([...ctx.getImageData(185*pixel_ratio, 100*pixel_ratio, 1, 1).data]).to.be.equal([0, 0, 0, 0])
    p.coordinate_system = null
    await view.ready
    expect(rv.glyph.has_webgl()).to.be.true
  })

  it("invalidates coordinate caches throughout nested renderer trees", async () => {
    const mapping = PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10}), padding: 20})
    const renderer = GlyphRenderer.create({glyph: Scatter.create({x: {value: 5}, y: {value: 0}}),
                                           data_source: ColumnDataSource.create({data: {index: [0]}})})
    const inner = BoxAnnotation.create({fill_color: null, line_color: null, renderers: [renderer]})
    const outer = BoxAnnotation.create({fill_color: null, line_color: null, renderers: [inner]})
    const p = Plot.create({coordinate_system: mapping, width: 200, height: 200, min_border: 0,
                           toolbar_location: null, renderers: [outer]})
    const {view} = await display(p)
    const rv = view.owner.get_one(renderer)
    const original = rv.coordinates
    p.coordinate_system = PolarMapping.create({radial_range: mapping.radial_range, angular_range: mapping.angular_range,
                                               zero_direction: "north", padding: 20})
    await view.ready
    expect(rv.coordinates).to.not.be.identical(original)
    const [sx, sy] = view.polar_transform!.compute(5, 0)
    expect(rv.coordinates.compute(5, 0)).to.be.similar([sx, sy])
    expect(rv.hit_test({type: "point", sx, sy})!.indices).to.be.equal([0])
  })

  it("keeps externally changed data limits when undoing camera navigation", async () => {
    const {view, mapping, wheel} = await scatter_plot()
    wheel.zoom(...view.polar_transform!.compute(5, 45), 60)
    mapping.radial_range.end = 20
    mapping.angular_range.end = 270
    await view.ready
    view.state.undo()
    expect(mapping.radial_range.end).to.be.equal(20)
    expect(mapping.angular_range.end).to.be.equal(270)
    expect(view.polar_viewport).to.be.equal({x: 0, y: 0, scale: 1})
    view.state.redo()
    expect(mapping.radial_range.end).to.be.equal(20)
    expect(mapping.angular_range.end).to.be.equal(270)
    expect(view.polar_viewport.scale).to.be.similar(1/0.9)
  })

  it("does not add camera history for unchanged gestures", async () => {
    const {view, pan, wheel, mapping} = await scatter_plot()
    const [sx, sy] = view.polar_transform!.center
    const event = {
      type: "pan_start" as const, sx, sy, dx: 0, dy: 0,
      modifiers: {shift: false, ctrl: false, alt: false}, native: new PointerEvent("pointerdown"),
    }
    pan._pan_start(event)
    pan._pan_end({...event, type: "pan_end"})
    expect(view.state.can_undo).to.be.false
    pan._pan_start(event)
    pan._update(10, 10)
    pan._update(0, 0)
    pan._pan_end({...event, type: "pan_end"})
    expect(view.state.can_undo).to.be.false
    mapping.radial_range.start = -1
    pan._pan_start(event)
    pan._update(10, 10)
    pan._pan_end({...event, type: "pan_end"})
    expect(view.state.can_undo).to.be.false
    mapping.radial_range.start = 0
    view.set_polar_viewport({x: 0, y: 0, scale: 1e3})
    wheel.zoom(sx, sy, 60)
    expect(view.state.can_undo).to.be.false
  })

  it("clips translated and magnified polar backgrounds and guides to the viewport", async () => {
    const p = figure({coordinate_system: PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10}), padding: 20}),
                      width: 300, height: 300, min_border: 50, toolbar_location: null, tools: [],
                      background_fill_color: "red", border_fill_color: "white"})
    const {view} = await display(p)
    view.set_polar_viewport({x: 0, y: -view.frame.bbox.height/2, scale: 2})
    await view.ready
    const {ctx, pixel_ratio} = view.canvas_view.primary
    const box = view.frame.bbox
    const pixel = (x: number, y: number) => [...ctx.getImageData(Math.round(x*pixel_ratio), Math.round(y*pixel_ratio), 1, 1).data]
    expect(pixel(box.hcenter, box.top - 10)).to.be.equal([255, 255, 255, 255])
    expect(pixel(box.left - 10, box.top + 10)).to.be.equal([255, 255, 255, 255])
    expect(pixel(box.hcenter + 13, box.top + 9)).to.be.equal([255, 0, 0, 255])
    for (const model of p.select(PolarAxis)) {
      expect(view.owner.get_one(model).needs_clip).to.be.true
    }
  })

})

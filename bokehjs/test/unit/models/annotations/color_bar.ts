import {expect} from "assertions"
import * as sinon from "sinon"

import {ColorBar, ColorBarView} from '@bokehjs/models/annotations/color_bar'
import {LinearColorMapper} from "@bokehjs/models/mappers/linear_color_mapper"
import {LinearScale} from "@bokehjs/models/scales/linear_scale"
import {LogColorMapper} from "@bokehjs/models/mappers/log_color_mapper"
import {LogScale} from "@bokehjs/models/scales/log_scale"
import {LogTicker} from "@bokehjs/models/tickers/log_ticker"
import {Viridis} from "@bokehjs/api/palettes"
import {Plot} from "@bokehjs/models/plots/plot"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Place} from "@bokehjs/core/enums"
import * as text from "@bokehjs/core/util/text"
import {build_view} from "@bokehjs/core/build_views"
import {NumberArray} from '@bokehjs/core/types'

async function color_bar_view(attrs: Partial<ColorBar.Attrs> = {}, place: Place = "center"): Promise<ColorBarView> {
  const plot = new Plot({
    x_range: new Range1d({start: 0, end: 1}),
    y_range: new Range1d({start: 0, end: 1}),
    frame_width: 500,
    frame_height: 500,
    width_policy: "min",
    height_policy: "min",
  })

  const color_bar = new ColorBar(attrs)
  plot.add_layout(color_bar, place)

  const plot_view = (await build_view(plot)).build()
  return plot_view.renderer_views.get(color_bar)! as ColorBarView
}

describe("ColorBar module", () => {

  let _measure_font_stub: sinon.SinonStub
  let _set_canvas_image_spy: sinon.SinonSpy

  before_each(() => {
    _measure_font_stub = sinon.stub(text, "measure_font").callsFake(() => {
      return {height: 15, ascent: 10, descent: 5}
    })
    _set_canvas_image_spy = sinon.spy(ColorBarView.prototype as any, '_set_canvas_image') // XXX: protected
  })

  after_each(() => {
    _measure_font_stub.restore()
    _set_canvas_image_spy.restore()
  })

  describe("ColorBar", () => {

    describe("ColorBar._title_extent method", () => {

      it("_title_height should return 0 if there is no title", async () => {
        const view = await color_bar_view()
        expect(view._title_extent()).to.be.equal(0)
      })

      it("_title_height should calculate title height plus title_standoff if there is a title", async () => {
        const view = await color_bar_view({
          title: "I'm a title",
          title_standoff: 5,
        })
        expect(view._title_extent()).to.be.equal(20)
      })
    })

    describe("ColorBar._tick_extent method", () => {
      it("Should return zero if either low or high are unset", async () => {
        const view = await color_bar_view({
          color_mapper: new LinearColorMapper({palette: Viridis.Viridis10}),
        })
        expect(view._tick_extent()).to.be.equal(0)
      })

      it("Should return major_tick_out if both low and high are set", async () => {
        const view = await color_bar_view({
          color_mapper: new LinearColorMapper({low: 0, high: 10, palette: Viridis.Viridis10}),
          major_tick_out: 6,
        })
        expect(view._tick_extent()).to.be.equal(6)
      })
    })

    describe("ColorBar._tick_coordinate_scale method", () => {

      it("LinearColorMapper should yield LinearScale instance with correct state", async () => {
        const view = await color_bar_view({
          color_mapper: new LinearColorMapper({low: 0, high: 10, palette: Viridis.Viridis10}),
        })
        const scale = view._tick_coordinate_scale(100) // length of scale dimension
        expect(scale).to.be.instanceof(LinearScale)
        expect((scale as any)._linear_compute_state()).to.be.equal([10, 0]) // XXX
      })

      it("LogColorMapper should yield LogScale instance with correct state", async () => {
        const view = await color_bar_view({
          color_mapper: new LogColorMapper({low: 0, high: 10, palette: Viridis.Viridis10}),
        })
        const scale = view._tick_coordinate_scale(100) // length of scale dimension
        expect(scale).to.be.instanceof(LogScale)
        expect((scale as any)._compute_state()).to.be.equal([100, 0, 2.302585092994046, 0]) // XXX
      })
    })

    describe("ColorBar._computed_image_dimensions method", () => {

      describe("ColorBar.orientation = 'vertical' in plot frame", () => {

        it("Should use set `width` and `height` if set", async () => {
          const view = await color_bar_view({
            color_mapper: new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis3}),
            width: 100,
            height: 200,
          })

          const image_dimensions = view._computed_image_dimensions()
          expect(image_dimensions.width).to.be.equal(100)
          expect(image_dimensions.height).to.be.equal(200)
        })

        it("Should return height = 0.30 * frame_height for 'short' palette", async () => {
          const view = await color_bar_view({
            color_mapper: new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis3}),
          })

          const image_dimensions = view._computed_image_dimensions()
          expect(image_dimensions.width).to.be.equal(25)
          expect(image_dimensions.height).to.be.equal(150)
        })

        it("Should return height = palette.length * 25 for 'medium' palette", async () => {
          const view = await color_bar_view({
            color_mapper: new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis10}),
          })

          const image_dimensions = view._computed_image_dimensions()
          expect(image_dimensions.width).to.be.equal(25)
          expect(image_dimensions.height).to.be.equal(250)
        })

        it("Should return height = 0.80 * plot.height for 'long' palette", async () => {
          const view = await color_bar_view({
            color_mapper: new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis256}),
          })

          const image_dimensions = view._computed_image_dimensions()
          expect(image_dimensions.width).to.be.equal(25)
          expect(image_dimensions.height).to.be.equal(380)
        })
      })

      describe("ColorBar.orientation = 'vertical' in side frame", () => {

        it("Should return height = plot.height - 2 * padding for any palette in side panel", async () => {
          const view = await color_bar_view({
            color_mapper: new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis3}),
            title: "I'm a title",
          }, "right")

          const image_dimensions = view._computed_image_dimensions()
          expect(image_dimensions.width).to.be.equal(25)
          // height = 500 (plot.height) - 2 * 10 (color_bar.padding) - 17 (title_height)
          expect(image_dimensions.height).to.be.equal(463)
        })
      })

      describe("ColorBar.orientation = 'horizontal'", () => {

        it("Should use set `width` and `height` if set", async () => {
          const view = await color_bar_view({
            color_mapper: new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis3}),
            orientation: 'horizontal',
            width: 100,
            height: 200,
          })

          const image_dimensions = view._computed_image_dimensions()
          expect(image_dimensions.width).to.be.equal(100)
          expect(image_dimensions.height).to.be.equal(200)
        })

        it("Should return width = 0.30 * plot.width for 'short' palette", async () => {
          const view = await color_bar_view({
            color_mapper: new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis3}),
            orientation: 'horizontal',
          })

          const image_dimensions = view._computed_image_dimensions()
          expect(image_dimensions.width).to.be.equal(150)
          expect(image_dimensions.height).to.be.equal(25)
        })

        it("Should return width = palette.length * 25 for 'medium' palette", async () => {
          const view = await color_bar_view({
            color_mapper: new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis10}),
            orientation: 'horizontal',
          })

          const image_dimensions = view._computed_image_dimensions()
          expect(image_dimensions.width).to.be.equal(250)
          expect(image_dimensions.height).to.be.equal(25)
        })

        it("Should return width = 0.80 * plot.width for 'long' palette", async () => {
          const view = await color_bar_view({
            color_mapper: new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis256}),
            orientation: 'horizontal',
          })

          const image_dimensions = view._computed_image_dimensions()
          // width = 500 (plot.width) * 0.8 - 2 * 10 (color_bar.padding)
          expect(image_dimensions.width).to.be.equal(380)
          expect(image_dimensions.height).to.be.equal(25)
        })
      })

      describe("ColorBar.orientation = 'horizontal' in side frame", () => {

        it("Should return width = plot.width - 2 * padding for any palette in side panel", async () => {
          const view = await color_bar_view({
            color_mapper: new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis10}),
            orientation: 'horizontal',
            title: "I'm a title",
          }, "below")

          const image_dimensions = view._computed_image_dimensions()
          // width = 500 (plot.width) - 2 * 10 (color_bar.padding)
          expect(image_dimensions.width).to.be.equal(480)
          expect(image_dimensions.height).to.be.equal(25)
        })
      })
    })

    describe("ColorBar.tick_info method", () => {

      it("Should correctly tick coords and labels for LinearColorMapper if orientation='vertical'", async () => {
        const view = await color_bar_view({
          color_mapper: new LinearColorMapper({low: 10, high: 20, palette: Viridis.Viridis10}),
          orientation: 'vertical',
          height: 100,
        })

        const tick_coords = view.tick_info()

        expect(tick_coords.coords.major[0]).to.be.equal([0, 0, 0, 0, 0, 0])
        expect(tick_coords.coords.major[1]).to.be.equal(new NumberArray([100, 80, 60, 40, 20, 0]))
        expect(tick_coords.labels.major).to.be.equal(['10', '12', '14', '16', '18', '20'])
      })

      it("Should correctly determine tick coords and labels for LinearColorMapperif orientation='horizontal'", async () => {
        const view = await color_bar_view({
          color_mapper: new LinearColorMapper({low: 10, high: 20, palette: Viridis.Viridis10}),
          orientation: 'horizontal',
          width: 100,
        })

        const tick_coords = view.tick_info()

        expect(tick_coords.coords.major[1]).to.be.equal([0, 0, 0, 0, 0, 0])
        expect(tick_coords.coords.major[0]).to.be.equal(new NumberArray([0, 20, 40, 60, 80, 100]))
        expect(tick_coords.labels.major).to.be.equal(['10', '12', '14', '16', '18', '20'])
      })

      it("Should correctly determine tick coords and labels for LogColorMapper if orientation='vertical'", async () => {
        const view = await color_bar_view({
          color_mapper: new LogColorMapper({low: 1, high: 1000, palette: Viridis.Viridis10}),
          orientation: 'vertical',
          height: 100,
        })

        const tick_coords = view.tick_info()

        expect(tick_coords.coords.major[0]).to.be.equal([0, 0, 0, 0, 0])
        expect(tick_coords.coords.major[1]).to.be.equal(new NumberArray([23.29900360107422, 13.264663696289062, 7.39495849609375, 3.2303314208984375, 0]))
        expect(tick_coords.labels.major).to.be.equal(['200', '400', '600', '800', '1000'])
      })

      it("Should correctly determine tick coords and labels for LogColorMapper if orientation='horizontal'", async () => {
        const view = await color_bar_view({
          color_mapper: new LogColorMapper({low: 1, high: 1000, palette: Viridis.Viridis10}),
          orientation: 'horizontal',
          width: 100,
        })

        const tick_coords = view.tick_info()

        expect(tick_coords.coords.major[1]).to.be.equal([0, 0, 0, 0, 0])
        expect(tick_coords.coords.major[0]).to.be.equal(new NumberArray([76.70099985546604, 86.73533304426542, 92.60504167945479, 96.76966623306478, 100]))
        expect(tick_coords.labels.major).to.be.equal(['200', '400', '600', '800', '1000'])
      })

      it("Should correctly return empty tick coords and labels for LogColorMapper if log(high)/log(low) are non-numeric", async () => {
        const view = await color_bar_view({
          color_mapper: new LogColorMapper({low: -1, high: 0, palette: Viridis.Viridis10}),
          ticker: new LogTicker(),
        })

        const tick_coords = view.tick_info()

        expect(tick_coords.coords.major[0]).to.be.equal([])
        expect(tick_coords.coords.major[1]).to.be.equal(new NumberArray([]))
        expect(tick_coords.labels.major).to.be.equal([])
      })
    })
  })

  describe("ColorBarView", () => {

    it("Should reset scale image if color_mapper changes", async () => {
      // Reset spy count to zero (method was called during view initialization)
      _set_canvas_image_spy.resetHistory()

      await color_bar_view({
        color_mapper: new LinearColorMapper({low: 0, high: 10, palette: Viridis.Viridis3}),
      }, "right")

      expect(_set_canvas_image_spy.called).to.be.true
    })

    it("ColorBarView._get_image_offset method", async () => {
      const view = await color_bar_view({
        color_mapper: new LinearColorMapper({low: 0, high: 10, palette: Viridis.Viridis10}),
        title: "I'm a title",
      }, "right")

      expect(view._get_image_offset()).to.be.equal({ x: 10, y: 27 })
    })

    it("ColorBarView._get_label_extent method (orientation='vertical')", async () => {
      const view = await color_bar_view({
        color_mapper: new LinearColorMapper({low: 0, high: 10, palette: Viridis.Viridis10}),
      }, "right")

      expect(view._get_label_extent()).to.be.similar(17.3535515625)
    })

    it("ColorBarView._get_label_extent method (orientation='vertical') and no major_labels", async () => {
      // Handle case where scale start/end causes no ticks to exist (usually for a logticker)
      const view = await color_bar_view({
        color_mapper: new LinearColorMapper({low: 0, high: 10, palette: Viridis.Viridis10}),
      }, "right")

      const stub = sinon.stub(view, "tick_info").returns({
        labels: {major: []},
        coords: {major: [[], []], minor: [[], []]},
      })
      expect(view._get_label_extent()).to.be.equal(0)
      stub.restore()
    })

    it("ColorBarView._get_label_extent method (orientation='horizontal')", async () => {
      const view = await color_bar_view({
        color_mapper: new LinearColorMapper({low: 0, high: 10, palette: Viridis.Viridis10}),
        orientation: "horizontal",
      }, "right")

      expect(view._get_label_extent()).to.be.equal(20)
    })

    it("ColorBarView.compute_legend_dimensions method (orientation='vertical')", async () => {
      const view = await color_bar_view({
        color_mapper: new LinearColorMapper({low: 0, high: 10, palette: Viridis.Viridis10}),
        height: 100,
        width: 25,
      }, "right")

      const {width, height} = view.compute_legend_dimensions()
      expect(width).to.be.similar(62.3535515625)
      expect(height).to.be.equal(120)
    })

    it("ColorBarView.compute_legend_dimensions method (orientation='horizontal')", async () => {
      const view = await color_bar_view({
        color_mapper: new LinearColorMapper({low: 0, high: 10, palette: Viridis.Viridis10}),
        orientation: "horizontal",
        height: 25,
        width: 100,
      }, "right")

      const {width, height} = view.compute_legend_dimensions()
      expect(width).to.be.equal(120)
      expect(height).to.be.equal(65)
    })

    it("ColorBarView._get_size method", async () => {
      const view = await color_bar_view({
        color_mapper: new LinearColorMapper({low: 0, high: 10, palette: Viridis.Viridis10}),
      }, "right")

      expect(view.get_size()).to.be.equal({width: 62, height: 500})
    })
  })
})

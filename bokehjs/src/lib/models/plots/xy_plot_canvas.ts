import {PlotView} from "./plot_canvas"
import type {XYPlot} from "./xy_plot"
import {CartesianFrame} from "../canvas/cartesian_frame"
import type {CartesianFrameView} from "../canvas/cartesian_frame"
import type {CoordinateTransform} from "../coordinates/coordinate_transform"
import type {RendererView} from "../renderers/renderer"
import type {Range} from "../ranges/range"
import {RangeManager} from "./range_manager"
import type {RangeInfo, RangeOptions} from "./range_manager"
import {RangesUpdate} from "core/bokeh_events"

export class XYPlotView extends PlotView {
  declare model: XYPlot

  override get_coordinates(renderer?: RendererView): CoordinateTransform {
    const {coordinates = null, x_range_name = "default", y_range_name = "default"} = renderer?.model ?? {}
    return coordinates != null ? coordinates.get_transform(this.frame)
      : this.model.coordinate_system.get_transform(this.frame, x_range_name, y_range_name)
  }

  override get coordinate_source_properties() {
    const {x_range, y_range, extra_x_ranges, extra_y_ranges} = this._frame.properties
    return [x_range, y_range, extra_x_ranges, extra_y_ranges]
  }

  declare protected _frame: CartesianFrame

  declare frame_view: CartesianFrameView

  override get frame(): CartesianFrameView {
    return this.frame_view
  }

  protected _range_manager: RangeManager

  override set invalidate_dataranges(value: boolean) {
    this._range_manager.invalidate_dataranges = value
  }

  override update_range(range_info: RangeInfo, options?: Partial<RangeOptions>): void {
    this.pause()
    this._range_manager.update(range_info, options)
    this.unpause()
  }

  override reset_range(): void {
    this.pause()
    this._range_manager.reset()
    this.unpause()
    this.trigger_ranges_update_event()
  }

  override ranges_update_event(): RangesUpdate {
    const {x_range, y_range} = this.model
    return new RangesUpdate(x_range.start, x_range.end, y_range.start, y_range.end)
  }

  override trigger_ranges_update_event(extra_ranges: Range[] = []): void {
    /**
     * Emits `RangesUpdate` event on all plots linked by all
     * ranges managed by this plot's range manager and linked
     * by additional context dependent ranges (`extra_ranges`).
     */
    const {x_ranges, y_ranges} = this._range_manager.ranges()
    const ranges = [...x_ranges, ...y_ranges, ...extra_ranges]

    const linked_plots = new Set(ranges.flatMap((r) => [...r.linked_plots]))

    for (const plot_view of linked_plots) {
      const event = plot_view.ranges_update_event()
      plot_view.model.trigger_event(event)
    }
  }

  protected _constrain_range_interval(range: Range): void {
    const range_info = this._range_manager.constrain_interval(range)
    if (range_info != null) {
      this.update_range(range_info)
    }
  }

  protected override _create_frame(): CartesianFrame {
    return CartesianFrame.create({
      place: "center",
      x_scale: this.model.x_scale,
      y_scale: this.model.y_scale,
      x_range: this.model.x_range,
      y_range: this.model.y_range,
      extra_x_ranges: this.model.extra_x_ranges,
      extra_y_ranges: this.model.extra_y_ranges,
      extra_x_scales: this.model.extra_x_scales,
      extra_y_scales: this.model.extra_y_scales,
      aspect_scale: this.model.aspect_scale,
      match_aspect: this.model.match_aspect,
    })
  }

  protected override _initialize_coordinates(): void {
    this._range_manager = new RangeManager(this)
  }

  override connect_signals(): void {
    super.connect_signals()
    const {
      x_range, y_range,
      x_scale, y_scale,
      extra_x_ranges, extra_y_ranges,
      extra_x_scales, extra_y_scales,
      aspect_scale, match_aspect,
    } = this.model.properties

    this.on_change([
      x_range, y_range,
      x_scale, y_scale,
      extra_x_ranges, extra_y_ranges,
      extra_x_scales, extra_y_scales,
      aspect_scale, match_aspect,
    ], () => {
      const {
        x_range, y_range,
        x_scale, y_scale,
        extra_x_ranges, extra_y_ranges,
        extra_x_scales, extra_y_scales,
        aspect_scale, match_aspect,
      } = this.model

      this._frame.setv({
        x_range, y_range,
        x_scale, y_scale,
        extra_x_ranges, extra_y_ranges,
        extra_x_scales, extra_y_scales,
        aspect_scale, match_aspect,
      })
    })

    const range_connections = new Map<Range, () => void>()
    const repaint = () => this.request_repaint()
    const update_range_connections = () => {
      const {ranges} = this.frame
      const changed = ranges.size != range_connections.size || [...ranges].some((range) => !range_connections.has(range))
      if (changed && range_connections.size != 0) {
        this._initial_state.range = undefined
        this.state.clear()
      }
      for (const [range, constrain] of range_connections) {
        if (!ranges.has(range)) {
          this.disconnect(range.change, repaint)
          this.disconnect(range.properties.min_interval.change, constrain)
          this.disconnect(range.properties.max_interval.change, constrain)
          range_connections.delete(range)
        }
      }
      for (const range of ranges) {
        if (!range_connections.has(range)) {
          const constrain = () => this._constrain_range_interval(range)
          this.connect(range.change, repaint)
          this.connect(range.properties.min_interval.change, constrain)
          this.connect(range.properties.max_interval.change, constrain)
          range_connections.set(range, constrain)
        }
      }
    }
    update_range_connections()
    this.connect(this._frame.change, () => {
      update_range_connections()
      this.invalidate_dataranges = true
    })
  }

  protected override _after_coordinate_layout(): void {
    if (this.model.match_aspect) {
      this.pause()
      this._range_manager.update_dataranges()
      this.unpause(true)
    }
  }

  protected override _update_coordinate_ranges(): boolean {
    if (this._range_manager.invalidate_dataranges || this.model.window_axis != "none") {
      this._range_manager.update_dataranges()
      return true
    }
    return false
  }

  protected override _capture_initial_ranges(): void {
    if (this._initial_state.range == null) {
      this._initial_state.range = this._range_manager.compute_initial() ?? undefined
    }
  }
}

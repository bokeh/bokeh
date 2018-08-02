import {Signal0} from "core/signaling"
import {wgs84_mercator} from "core/util/projections"
import {Context2d} from "core/util/canvas"
import {GMapPlot} from "./gmap_plot"
import {PlotCanvas, PlotCanvasView, RangeInfo, FrameBox} from "./plot_canvas"

declare let _bokeh_gmaps_callback: () => void

const gmaps_ready = new Signal0({}, "gmaps_ready")

const load_google_api = function(api_key: string): void {
  _bokeh_gmaps_callback = () => gmaps_ready.emit()

  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.src = `https://maps.googleapis.com/maps/api/js?key=${api_key}&callback=_bokeh_gmaps_callback`
  document.body.appendChild(script)
}

export class GMapPlotCanvasView extends PlotCanvasView {
  model: GMapPlotCanvas

  protected _tiles_loaded: boolean

  protected zoom_count: number

  protected initial_zoom: number
  protected initial_lat: number
  protected initial_lng: number

  protected map: google.maps.Map
  protected map_types: any

  initialize(options: any): void {
    this.pause()

    super.initialize(options)

    this._tiles_loaded = false
    this.zoom_count = 0

    const {zoom, lat, lng} = this.model.plot.map_options
    this.initial_zoom = zoom
    this.initial_lat = lat
    this.initial_lng = lng

    this.canvas_view.map_el!.style.position = "absolute"

    if (typeof google === "undefined" || google.maps == null) {
      if (typeof _bokeh_gmaps_callback === "undefined") {
        load_google_api(this.model.plot.api_key)
      }
      gmaps_ready.connect(() => this.request_render())
    }

    this.unpause()
  }

  update_range(range_info: RangeInfo & {sdx?: number, sdy?: number, factor?: number} | null): void {
    // RESET -------------------------
    if (range_info == null) {
      this.map.setCenter({lat: this.initial_lat, lng: this.initial_lng})
      this.map.setOptions({zoom: this.initial_zoom})
      super.update_range(null)

    // PAN ----------------------------
    } else if (range_info.sdx != null || range_info.sdy != null) {
      this.map.panBy(range_info.sdx || 0, range_info.sdy || 0)
      super.update_range(range_info)

    // ZOOM ---------------------------
    } else if (range_info.factor != null) {

      // The zoom count decreases the sensitivity of the zoom. (We could make this user configurable)
      let zoom_change
      if (this.zoom_count !== 10) {
        this.zoom_count += 1
        return
      }
      this.zoom_count = 0

      this.pause()

      super.update_range(range_info)

      if (range_info.factor < 0)
        zoom_change = -1
      else
        zoom_change = 1

      const old_map_zoom = this.map.getZoom()
      const new_map_zoom = old_map_zoom + zoom_change

      // Zooming out too far causes problems
      if (new_map_zoom >= 2) {
        this.map.setZoom(new_map_zoom)

        // Check we haven't gone out of bounds, and if we have undo the zoom
        const [proj_xstart, proj_xend,,] = this._get_projected_bounds()
        if (proj_xend - proj_xstart < 0) {
          this.map.setZoom(old_map_zoom)
        }
      }

      this.unpause()
    }

    // Finally re-center
    this._set_bokeh_ranges()
  }

  protected _build_map(): void {
    const {maps} = google

    this.map_types = {
      satellite : maps.MapTypeId.SATELLITE,
      terrain   : maps.MapTypeId.TERRAIN,
      roadmap   : maps.MapTypeId.ROADMAP,
      hybrid    : maps.MapTypeId.HYBRID,
    }

    const mo = this.model.plot.map_options
    const map_options: google.maps.MapOptions = {
      center: new maps.LatLng(mo.lat, mo.lng),
      zoom: mo.zoom,
      disableDefaultUI: true,
      mapTypeId: this.map_types[mo.map_type],
      scaleControl: mo.scale_control,
      tilt: mo.tilt,
    }

    if (mo.styles != null)
      map_options.styles = JSON.parse(mo.styles)

    // create the map with above options in div
    this.map = new maps.Map(this.canvas_view.map_el, map_options)

    // update bokeh ranges whenever the map idles, which should be after most UI action
    maps.event.addListener(this.map, 'idle', () => this._set_bokeh_ranges())

    // also need an event when bounds change so that map resizes trigger renders too
    maps.event.addListener(this.map, 'bounds_changed', () => this._set_bokeh_ranges())

    maps.event.addListenerOnce(this.map, 'tilesloaded', () => this._render_finished())

    // wire up listeners so that changes to properties are reflected
    this.connect(this.model.plot.properties.map_options.change, () => this._update_options())
    this.connect(this.model.plot.map_options.properties.styles.change, () => this._update_styles())
    this.connect(this.model.plot.map_options.properties.lat.change, () => this._update_center('lat'))
    this.connect(this.model.plot.map_options.properties.lng.change, () => this._update_center('lng'))
    this.connect(this.model.plot.map_options.properties.zoom.change, () => this._update_zoom())
    this.connect(this.model.plot.map_options.properties.map_type.change, () => this._update_map_type())
    this.connect(this.model.plot.map_options.properties.scale_control.change, () => this._update_scale_control())
    this.connect(this.model.plot.map_options.properties.tilt.change, () => this._update_tilt())
  }

  protected _render_finished(): void {
    this._tiles_loaded = true
    this.notify_finished()
  }

  has_finished(): boolean {
    return super.has_finished() && this._tiles_loaded === true
  }

  protected _get_latlon_bounds(): [number, number, number, number] {
    const bounds = this.map.getBounds()!
    const top_right = bounds.getNorthEast()
    const bottom_left = bounds.getSouthWest()

    const xstart = bottom_left.lng()
    const xend = top_right.lng()
    const ystart = bottom_left.lat()
    const yend = top_right.lat()
    return [xstart, xend, ystart, yend]
  }

  protected _get_projected_bounds(): [number, number, number, number] {
    const [xstart, xend, ystart, yend] = this._get_latlon_bounds()
    const [proj_xstart, proj_ystart] = wgs84_mercator.forward([xstart, ystart])
    const [proj_xend, proj_yend] = wgs84_mercator.forward([xend, yend])
    return [proj_xstart, proj_xend, proj_ystart, proj_yend]
  }

  protected _set_bokeh_ranges(): void {
    const [proj_xstart, proj_xend, proj_ystart, proj_yend] = this._get_projected_bounds()
    this.frame.x_range.setv({start: proj_xstart, end: proj_xend})
    this.frame.y_range.setv({start: proj_ystart, end: proj_yend})
  }

  protected _update_center(fld: "lat" | "lng"): void {
    const c = this.map.getCenter().toJSON()
    c[fld] = this.model.plot.map_options[fld]
    this.map.setCenter(c)
    this._set_bokeh_ranges()
  }

  protected _update_map_type(): void {
    this.map.setOptions({mapTypeId: this.map_types[this.model.plot.map_options.map_type] })
  }

  protected _update_scale_control(): void {
    this.map.setOptions({scaleControl: this.model.plot.map_options.scale_control })
  }

  protected _update_tilt(): void {
    this.map.setOptions({tilt: this.model.plot.map_options.tilt })
  }

  protected _update_options(): void {
    this._update_styles()
    this._update_center('lat')
    this._update_center('lng')
    this._update_zoom()
    this._update_map_type()
  }

  protected _update_styles(): void {
    this.map.setOptions({styles: JSON.parse(this.model.plot.map_options.styles) })
  }

  protected _update_zoom(): void {
    this.map.setOptions({zoom: this.model.plot.map_options.zoom})
    this._set_bokeh_ranges()
  }

  // this method is expected and called by PlotCanvasView.render
  protected _map_hook(_ctx: Context2d, frame_box: FrameBox): void {
    const [left, top, width, height] = frame_box
    this.canvas_view.map_el!.style.top    = `${top}px`
    this.canvas_view.map_el!.style.left   = `${left}px`
    this.canvas_view.map_el!.style.width  = `${width}px`
    this.canvas_view.map_el!.style.height = `${height}px`

    if (this.map == null && typeof google !== "undefined" && google.maps != null)
      this._build_map()
  }

  // this overrides the standard _paint_empty to make the inner canvas transparent
  protected _paint_empty(ctx: Context2d, frame_box: FrameBox): void {
    const ow = this.canvas._width.value
    const oh = this.canvas._height.value
    const [left, top, iw, ih] = frame_box

    ctx.clearRect(0, 0, ow, oh)

    ctx.beginPath()
    ctx.moveTo(0,  0)
    ctx.lineTo(0,  oh)
    ctx.lineTo(ow, oh)
    ctx.lineTo(ow, 0)
    ctx.lineTo(0,  0)

    ctx.moveTo(left,    top)
    ctx.lineTo(left+iw, top)
    ctx.lineTo(left+iw, top+ih)
    ctx.lineTo(left,    top+ih)
    ctx.lineTo(left,    top)
    ctx.closePath()

    ctx.fillStyle = this.model.plot.border_fill_color
    ctx.fill()
  }
}

export namespace GMapPlotCanvas {
  export interface Attrs extends PlotCanvas.Attrs {}

  export interface Props extends PlotCanvas.Props {}
}

export interface GMapPlotCanvas extends GMapPlotCanvas.Attrs {}

export class GMapPlotCanvas extends PlotCanvas {

  properties: GMapPlotCanvas.Props

  plot: GMapPlot

  constructor(attrs?: Partial<GMapPlotCanvas.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'GMapPlotCanvas'
    this.prototype.default_view = GMapPlotCanvasView
  }

  initialize(): void {
    this.use_map = true
    super.initialize()
  }
}
GMapPlotCanvas.initClass()

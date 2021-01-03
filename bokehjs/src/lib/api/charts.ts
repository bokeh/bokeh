import {Palette} from "./palettes"
import * as palettes from "./palettes"
import {Color} from "core/types"
import {is_dark, color2rgba} from "core/util/color"
import {zip, unzip, sum, cumsum, copy, transpose} from "core/util/array"
import {isArray} from "core/util/types"
import {sprintf} from "core/util/templating"
import {Anchor, TooltipAttachment} from "core/enums"

import {
  Plot,
  ColumnDataSource,
  GlyphRenderer,
  HoverTool,
  AnnularWedge, Quad, Text,
  Range, DataRange1d, FactorRange,
  Axis, LinearAxis, CategoricalAxis,
  Scale, LinearScale, CategoricalScale,
  TickFormatter, BasicTickFormatter, NumeralTickFormatter,
} from "./models"

function resolve_palette(palette: Palette | Color[] = "Spectral11"): Color[] {
  return isArray(palette) ? palette : palettes[palette]
}

export interface ChartOpts {
  width?: number
  height?: number
}

export interface PieChartData {
  labels: string[]
  values: number[]
}

export interface PieChartOpts extends ChartOpts {
  start_angle?: number
  end_angle?: number
  center?: [number, number] | {x: number, y: number}
  inner_radius?: number
  outer_radius?: number
  palette?: Palette | Color[]
  slice_labels?: "labels" | "values" | "percentages"
}

export function pie(data: PieChartData, opts: PieChartOpts = {}): Plot {
  const labels: string[] = []
  const values: number[] = []

  for (let i = 0; i < Math.min(data.labels.length, data.values.length); i++) {
    if (data.values[i] > 0) {
      labels.push(data.labels[i])
      values.push(data.values[i])
    }
  }

  const start_angle = opts.start_angle != null ? opts.start_angle : 0
  const end_angle = opts.end_angle != null ? opts.end_angle : (start_angle + 2*Math.PI)

  const angle_span = Math.abs(end_angle - start_angle)
  const to_radians = (x: number) => angle_span*x

  const total_value = sum(values)
  const normalized_values = values.map((v) => v/total_value)
  const cumulative_values = cumsum(normalized_values)

  const end_angles = cumulative_values.map((v) => start_angle + to_radians(v))
  const start_angles = [start_angle].concat(end_angles.slice(0, -1))
  const half_angles = zip(start_angles, end_angles).map(([start, end]) => (start + end)/2)

  let cx: number
  let cy: number
  if (opts.center == null) {
    cx = 0
    cy = 0
  } else if (isArray(opts.center)) {
    cx = opts.center[0]
    cy = opts.center[1]
  } else {
    cx = opts.center.x
    cy = opts.center.y
  }

  const inner_radius = opts.inner_radius != null ? opts.inner_radius : 0
  const outer_radius = opts.outer_radius != null ? opts.outer_radius : 1

  const palette = resolve_palette(opts.palette)

  const colors: Color[] = []
  for (let i = 0; i < normalized_values.length; i++)
    colors.push(palette[i % palette.length])
  const text_colors = colors.map((c) => is_dark(color2rgba(c)) ? "white" : "black")

  function to_cartesian(r: number, alpha: number): [number, number] {
    return [r*Math.cos(alpha), r*Math.sin(alpha)]
  }

  const half_radius = (inner_radius+outer_radius)/2
  let [text_cx, text_cy] = unzip(half_angles.map((half_angle) => to_cartesian(half_radius, half_angle)))
  text_cx = text_cx.map((x) => x + cx)
  text_cy = text_cy.map((y) => y + cy)

  const text_angles = half_angles.map((a: number): number => {
    if (a >= Math.PI/2 && a <= 3*Math.PI/2)
      return a + Math.PI
    else
      return a
  })

  const source = new ColumnDataSource({
    data: {
      labels,
      values,
      percentages: normalized_values.map((v) => sprintf("%.2f%%", v*100)),
      start_angles,
      end_angles,
      text_angles,
      colors,
      text_colors,
      text_cx,
      text_cy,
    },
  })

  const g1 = new AnnularWedge({
    x: cx, y: cy,
    inner_radius, outer_radius,
    start_angle: {field: "start_angles"}, end_angle: {field: "end_angles"},
    line_color: null, line_width: 1, fill_color: {field: "colors"},
  })
  const h1 = new AnnularWedge({
    x: cx, y: cy,
    inner_radius, outer_radius,
    start_angle: {field: "start_angles"}, end_angle: {field: "end_angles"},
    line_color: null, line_width: 1, fill_color: {field: "colors"}, fill_alpha: 0.8,
  })
  const r1 = new GlyphRenderer({
    data_source: source,
    glyph: g1,
    hover_glyph: h1,
  })

  const g2 = new Text({
    x: {field: "text_cx"}, y: {field: "text_cy"},
    text: {field: opts.slice_labels ?? "labels"},
    angle: {field: "text_angles"},
    text_align: "center", text_baseline: "middle",
    text_color: {field: "text_colors"}, text_font_size: "12px",
  })
  const r2 = new GlyphRenderer({
    data_source: source,
    glyph: g2,
  })

  const xdr = new DataRange1d({renderers: [r1], range_padding: 0.2})
  const ydr = new DataRange1d({renderers: [r1], range_padding: 0.2})
  const plot = new Plot({x_range: xdr, y_range: ydr})

  plot.add_renderers(r1, r2)

  const tooltip = "<div>@labels</div><div><b>@values</b> (@percentages)</div>"
  const hover = new HoverTool({renderers: [r1], tooltips: tooltip})
  plot.add_tools(hover)

  return plot
}

export type BarChartData = (string | number)[][]

export interface BarChartOpts extends ChartOpts {
  stacked?: boolean
  orientation?: "horizontal" | "vertical"
  bar_width?: number
  palette?: Palette | Color[]
  axis_number_format?: string
}

export function bar(data: BarChartData, opts: BarChartOpts = {}): Plot {
  const column_names = data[0]

  const row_data = data.slice(1)
  const col_data = transpose(row_data)

  const labels = col_data[0].map((v) => v.toString())
  const columns = col_data.slice(1) as number[][]

  let yaxis: Axis = new CategoricalAxis()
  let ydr: Range = new FactorRange({factors: labels})
  let yscale: Scale = new CategoricalScale()

  let xformatter: TickFormatter
  if (opts.axis_number_format != null)
    xformatter = new NumeralTickFormatter({format: opts.axis_number_format})
  else
    xformatter = new BasicTickFormatter()
  let xaxis: Axis = new LinearAxis({formatter: xformatter})
  let xdr: Range = new DataRange1d({start: 0})
  let xscale: Scale = new LinearScale()

  const palette = resolve_palette(opts.palette)

  const stacked = opts.stacked != null ? opts.stacked : false
  const orientation = opts.orientation != null ? opts.orientation : "horizontal"

  const renderers: GlyphRenderer[] = []

  if (stacked) {
    const left: number[] = []
    const right: number[] = []

    for (let i = 0; i < columns.length; i++) {
      const bottom: [string, number][] = []
      const top: [string, number][] = []

      for (let j = 0; j < labels.length; j++) {
        const label = labels[j]
        if (i == 0) {
          left.push(0)
          right.push(columns[i][j])
        } else {
          left[j] += columns[i-1][j]
          right[j] += columns[i][j]
        }
        bottom.push([label, -0.5])
        top.push([label, 0.5])
      }

      const source = new ColumnDataSource({
        data: {
          left: copy(left),
          right: copy(right),
          top,
          bottom,
          labels,
          values: columns[i],
          columns: columns[i].map((_) => column_names[i+1]),
        },
      })

      const g1 = new Quad({
        left: {field: "left"}, bottom: {field: "bottom"},
        right: {field: "right"}, top: {field: "top"},
        line_color: null, fill_color: palette[i % palette.length],
      })
      const r1 = new GlyphRenderer({data_source: source, glyph: g1})
      renderers.push(r1)
    }
  } else {
    const dy = 1/columns.length

    for (let i = 0; i < columns.length; i++) {
      const left: number[] = []
      const right: number[] = []
      const bottom: [string, number][] = []
      const top: [string, number][] = []

      for (let j = 0; j < labels.length; j++) {
        const label = labels[j]
        left.push(0)
        right.push(columns[i][j])
        bottom.push([label, i*dy-0.5])
        top.push([label, (i+1)*dy-0.5])
      }

      const source = new ColumnDataSource({
        data: {
          left,
          right,
          top,
          bottom,
          labels,
          values: columns[i],
          columns: columns[i].map((_) => column_names[i+1]),
        },
      })

      const g1 = new Quad({
        left: {field: "left"}, bottom: {field: "bottom"},
        right: {field: "right"}, top: {field: "top"},
        line_color: null, fill_color: palette[i % palette.length],
      })
      const r1 = new GlyphRenderer({data_source: source, glyph: g1})
      renderers.push(r1)
    }
  }

  if (orientation == "vertical") {
    [xdr, ydr] = [ydr, xdr]
    ;[xaxis, yaxis] = [yaxis, xaxis]
    ;[xscale, yscale] = [yscale, xscale]

    for (const r of renderers) {
      const data = (r.data_source as ColumnDataSource).data
      ;[data.left, data.bottom] = [data.bottom, data.left]
      ;[data.right, data.top] = [data.top, data.right]
    }
  }

  const plot = new Plot({x_range: xdr, y_range: ydr, x_scale: xscale, y_scale: yscale})

  plot.add_renderers(...renderers)
  plot.add_layout(yaxis, "left")
  plot.add_layout(xaxis, "below")

  const tooltip = "<div>@labels</div><div>@columns:&nbsp<b>@values</b></div>"

  let anchor: Anchor
  let attachment: TooltipAttachment
  if (orientation == "horizontal") {
    anchor = "center_right"
    attachment = "horizontal"
  } else {
    anchor = "top_center"
    attachment = "vertical"
  }

  const hover = new HoverTool({
    renderers,
    tooltips: tooltip,
    point_policy: "snap_to_data",
    anchor,
    attachment,
  })
  plot.add_tools(hover)

  return plot
}

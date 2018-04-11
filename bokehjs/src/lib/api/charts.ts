import {sprintf} from "sprintf-js"
import {Palette} from "./palettes"
import * as palettes from "./palettes"
import {zip, unzip, sum, cumsum, copy} from "../core/util/array"
import {isArray} from "../core/util/types"
import {Anchor, TooltipAttachment} from "../core/enums"

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

type RGB = [number, number, number]

function num2hexcolor(num: number): string {
  return sprintf("#%06x", num)
}

function hexcolor2rgb(color: string): RGB {
  const r = parseInt(color.substr(1, 2), 16)
  const g = parseInt(color.substr(3, 2), 16)
  const b = parseInt(color.substr(5, 2), 16)
  return [r, g, b]
}

function is_dark([r, g, b]: RGB): boolean {
  const l = 1 - (0.299*r + 0.587*g + 0.114*b)/255
  return l >= 0.6
}

export type Color = string

function norm_palette(palette: Palette | Color[] = "Spectral11"): Color[] {
  if (isArray(palette))
    return palette
  else {
    type Pals = {[key in Palette]: number[]}
    return (palettes as Pals)[palette].map(num2hexcolor)
  }
}

export interface ChartOpts {
  width?: number
  height?: number
}

export interface PieChartData {
  labels: number[]
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
  const labels: number[] = []
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

  const palette = norm_palette(opts.palette)

  const colors: Color[] = []
  for (let i = 0; i < normalized_values.length; i++)
    colors.push(palette[i % palette.length])
  const text_colors = colors.map((c) => is_dark(hexcolor2rgb(c)) ? "white" : "black")

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
      labels: labels,
      values: values,
      percentages: normalized_values.map((v) => sprintf("%.2f%%", v*100)),
      start_angles: start_angles,
      end_angles: end_angles,
      text_angles: text_angles,
      colors: colors,
      text_colors: text_colors,
      text_cx: text_cx,
      text_cy: text_cy,
    },
  })

  const g1 = new AnnularWedge({
    x: cx, y: cy,
    inner_radius: inner_radius, outer_radius: outer_radius,
    start_angle: {field: "start_angles"}, end_angle: {field: "end_angles"},
    line_color: null, line_width: 1, fill_color: {field: "colors"},
  })
  const h1 = new AnnularWedge({
    x: cx, y: cy,
    inner_radius: inner_radius, outer_radius: outer_radius,
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
    text: {field: opts.slice_labels || "labels"},
    angle: {field: "text_angles"},
    text_align: "center", text_baseline: "middle",
    text_color: {field: "text_colors"}, text_font_size: "9pt",
  })
  const r2 = new GlyphRenderer({
    data_source: source,
    glyph: g2,
  })

  const xdr = new DataRange1d({renderers: [r1], range_padding: 0.2})
  const ydr = new DataRange1d({renderers: [r1], range_padding: 0.2})
  const plot = new Plot({x_range: xdr, y_range: ydr})

  if (opts.width != null) plot.plot_width = opts.width
  if (opts.height != null) plot.plot_height = opts.height

  plot.add_renderers(r1, r2)

  const tooltip = "<div>@labels</div><div><b>@values</b> (@percentages)</div>"
  const hover = new HoverTool({renderers: [r1], tooltips: tooltip})
  plot.add_tools(hover)

  return plot
}

export type BarChartData = number[][]

export interface BarChartOpts extends ChartOpts {
  stacked?: boolean
  orientation?: "horizontal" | "vertical"
  bar_width?: number
  palette?: Palette | Color[]
  axis_number_format?: string
}

export function bar(data: BarChartData, opts: BarChartOpts = {}): Plot {
  const column_names = data[0]
  const rows = data.slice(1)

  let columns: number[][] = column_names.map((_) => [])
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      columns[i].push(row[i])
    }
  }

  const labels = columns[0].map((v) => v.toString())
  columns = columns.slice(1)

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

  const palette = norm_palette(opts.palette)

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
          top: top,
          bottom: bottom,
          labels: labels,
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
          left: left,
          right: right,
          top: top,
          bottom: bottom,
          labels: labels,
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
    [xdr, ydr] = [ydr, xdr];
    [xaxis, yaxis] = [yaxis, xaxis];
    [xscale, yscale] = [yscale, xscale];

    for (const r of renderers) {
      const data = (r.data_source as ColumnDataSource).data;
      [data.left, data.bottom] = [data.bottom, data.left];
      [data.right, data.top] = [data.top, data.right];
    }
  }

  const plot = new Plot({x_range: xdr, y_range: ydr, x_scale: xscale, y_scale: yscale})

  if (opts.width != null) plot.plot_width = opts.width
  if (opts.height != null) plot.plot_height = opts.height

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
    renderers: renderers,
    tooltips: tooltip,
    point_policy: "snap_to_data",
    anchor: anchor,
    attachment: attachment,
  })
  plot.add_tools(hover)

  return plot
}

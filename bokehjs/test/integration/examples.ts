import {display, column} from "./_util"

const {cos, sin} = Math

import {figure} from "@bokehjs/api/plotting"
import {Spectral} from "@bokehjs/api/palettes"
import {dark_minimal} from "@bokehjs/api/themes"
import {f} from "@bokehjs/api/expr"
import {np} from "@bokehjs/api/linalg"

import {assert} from "@bokehjs/core/util/assert"
import {zip, min, max} from "@bokehjs/core/util/array"
import {NDArray} from "@bokehjs/core/util/ndarray"
import {enumerate} from "@bokehjs/core/util/iterator"
import {radians} from "@bokehjs/core/util/math"

import {use_theme} from "@bokehjs/core/properties"

import {
  Title, Label, Arrow, NormalHead, TeeHead, VeeHead,
  FixedTicker, SingleIntervalTicker,
  TapTool, HoverTool,
  ColumnDataSource,
  DataRange1d,
  TeX,
} from "@bokehjs/models"

import {Div} from "@bokehjs/models/widgets"

const r = String.raw

function tex(strings: TemplateStringsArray, ...subs: unknown[]): TeX {
  return new TeX({text: r(strings, ...subs)})
}

describe("Examples", () => {
  it("should support Trefoil", async () => {
    const cdot = "\u22c5"
    const degree = "\u00b0"

    // https://www.orau.org/ptp/articlesstories/radwarnsymbstory.htm
    function trefoil(R: number = 1) {
      const p = figure({
        x_range: [-6*R, 6*R], y_range: [-6*R, 6*R],
        frame_width: 500, frame_height: 500,
        background_fill_color: "yellow",
        title: new Title({text: "Radiation Warning Symbol (Trefoil)", align: "center", text_font_size: "20px"}),
        x_axis_type: null, y_axis_type: null,
        toolbar_location: null,
      })

      p.annular_wedge({
        x: 0, y: 0,
        inner_radius: 1.5*R, outer_radius: 5*R,
        start_angle: [0, 120, 240], start_angle_units: "deg",
        end_angle: [60, 180, 300], end_angle_units: "deg",
        line_color: "black", fill_color: "magenta",
      })
      p.circle({
        x: 0, y: 0,
        radius: R,
        line_color: "black", fill_color: "magenta",
      })

      const arc = p.arc({
        x: 0, y: 0,
        radius: 5.3*R,
        start_angle: [60, 120], start_angle_units: "deg",
        end_angle: [120, 180], end_angle_units: "deg",
        line_color: "black",
      })
      arc.add_decoration(new TeeHead({size: 10}), "start")
      arc.add_decoration(new VeeHead({size: 8}), "start")
      arc.add_decoration(new TeeHead({size: 10}), "end")
      arc.add_decoration(new VeeHead({size: 8}), "end")

      const [x1, y1] = [5.5*R*cos(radians(150)), 5.5*R*sin(radians(150))]
      p.text({x: [0, x1], y: [5.3*R, y1], text: {value: `60${degree}`}, text_baseline: "bottom", text_align: "center"})

      p.segment({
        x0: [   0,    R, 1.5*R,  5*R],
        y0: 0,
        x1: [   0,    R, 1.5*R,  5*R],
        y1: [-4*R, -2*R,  -3*R, -4*R],
        line_color: "black", line_dash: {value: [3, 3]},
      })

      const s = p.segment({
        x0: 0,
        y0: [-2*R,  -3*R, -4*R],
        x1: [   R, 1.5*R,  5*R],
        y1: [-2*R,  -3*R, -4*R],
        line_color: "black",
      })
      s.add_decoration(new TeeHead({size: 10}), "start")
      s.add_decoration(new VeeHead({size: 8}), "start")
      s.add_decoration(new TeeHead({size: 10}), "end")
      s.add_decoration(new VeeHead({size: 8}), "end")

      p.text({x: 1.0*R/2, y: -2*R, text: {value: "R"}, text_baseline: "bottom", text_align: "center"})
      p.text({x: 1.5*R/2, y: -3*R, text: {value: `1.5${cdot}R`}, text_baseline: "bottom", text_align: "center"})
      p.text({x: 5.0*R/2, y: -4*R, text: {value: `5${cdot}R`}, text_baseline: "bottom", text_align: "center"})

      return p
    }

    await display(trefoil())
  })

  it("should support Sprint", async () => {
    /**
     * A scatter plot comparing historical Olympic sprint times, based on a New York Times' article.
     * Tapping any of the scatter points will open a new browser tab for the Wikipedia entry of the sprinter.
     *
     * http://www.nytimes.com/interactive/2012/08/05/sports/olympics/the-100-meter-dash-one-race-every-medalist-ever.html
     */

    const sprint = {
      Name: [] as string[],
      Country: [] as string[],
      Medal: [] as string[],
      Time: [] as number[],
      Year: [] as number[],
      Abbrev: [] as string[],
      Speed: [] as number[],
      MetersBack: [] as number[],
      MedalFill: [] as string[],
      MedalLine: [] as string[],
      SelectedName: [] as string[],
    }

    const response = await fetch("/assets/data/sprint.csv")
    const data = await response.text()

    const trim = (s: string) => s.trim().replace(/^"|"$/g, "")
    const lines = data.trim().split("\n").splice(1)

    for (const line of lines) {
      const [name, country, medal, time, year] = line.split(",")
      sprint.Name.push(trim(name))
      sprint.Country.push(trim(country))
      sprint.Medal.push(trim(medal))
      sprint.Time.push(parseFloat(time))
      sprint.Year.push(parseInt(year))
    }

    const fill_color = {gold: "#efcf6d", silver: "#cccccc", bronze: "#c59e8a"}
    const line_color = {gold: "#c8a850", silver: "#b0b0b1", bronze: "#98715d"}

    const t0 = sprint.Time[0]

    sprint.Abbrev       = sprint.Country
    sprint.Medal        = sprint.Medal.map((medal) => medal.toLowerCase())
    sprint.Speed        = sprint.Time.map((t) => 100.0/t)
    sprint.MetersBack   = sprint.Time.map((t) => 100.0*(1.0 - t0/t))
    sprint.MedalFill    = sprint.Medal.map((medal) => fill_color[medal as keyof typeof fill_color])
    sprint.MedalLine    = sprint.Medal.map((medal) => line_color[medal as keyof typeof line_color])
    sprint.SelectedName = zip(sprint.Name, sprint.Medal, sprint.Year).map(([name, medal, year]) => {
      return medal == "gold" && [1988, 1968, 1936, 1896].includes(year) ? name : ""
    })

    const source = new ColumnDataSource({data: sprint})

    const plot = figure({
      width: 1000, height: 600,
      x_range: [max(sprint.MetersBack) + 2, 0],
      toolbar_location: null,
      outline_line_color: null,
      y_axis_location: "right",
    })

    assert(plot.y_range instanceof DataRange1d)
    plot.y_range.range_padding = 4
    plot.y_range.range_padding_units = "absolute"

    assert(plot.title instanceof Title)
    plot.title.text = "Usain Bolt vs. 116 years of Olympic sprinters"
    plot.title.text_font_size = "19px"

    plot.xaxis.ticker = new SingleIntervalTicker({interval: 5, num_minor_ticks: 0})
    plot.xaxis.axis_line_color = null
    plot.xaxis.major_tick_line_color = null
    plot.xgrid.grid_line_dash = "dashed"

    plot.yaxis.ticker = new FixedTicker({ticks: [1900, 1912, 1924, 1936, 1952, 1964, 1976, 1988, 2000, 2012]})
    plot.yaxis.major_tick_in = -5
    plot.yaxis.major_tick_out = 10
    plot.ygrid.grid_line_color = null

    const medal = plot.circle({
      x: {field: "MetersBack"}, y: {field: "Year"},
      size: 10,
      source,
      level: "overlay",
      fill_color: {field: "MedalFill"}, line_color: {field: "MedalLine"}, fill_alpha: 0.5,
    })

    const tooltips = `
    <div>
      <span style="font-size: 15px;">@Name</span>&nbsp;
      <span style="font-size: 10px; color: #666;">(@Abbrev)</span>
    </div>
    <div>
      <span style="font-size: 17px; font-weight: bold;">@Time{0.00}</span>&nbsp;
      <span style="font-size: 10px; color: #666;">@Year</span>
    </div>
    <div style="font-size: 11px; color: #666;">@{MetersBack}{0.00} meters behind</div>
    `

    const open_url = {
      execute() {
        for (const index of source.inspected.indices) {
          const name = source.data.Name[index]
          const url = `http://en.wikipedia.org/wiki/${encodeURIComponent(name)}`
          window.open(url)
        }
      },
    }

    const hover = new HoverTool({tooltips, renderers: [medal]})
    const tap = new TapTool({callback: open_url, renderers: [medal], behavior: "inspect"})

    plot.add_tools(hover, tap)

    plot.text({
      x: {field: "MetersBack"}, y: {field: "Year"},
      x_offset: 10, y_offset: -5,
      text: {field: "SelectedName"},
      text_align: "left", text_baseline: "middle", text_font_size: "12px",
      source,
    })

    const no_olympics_label = new Label({
      x: 7.5, y: 1942,
      text: "No Olympics in 1940 or 1944",
      text_align: "center", text_baseline: "middle",
      text_font_size: "12px", text_font_style: "italic",
      text_color: "silver",
    })
    plot.add_layout(no_olympics_label)

    const x = min(sprint.MetersBack.filter((_, i) => sprint.Year[i] == 1900)) - 0.5
    const arrow = new Arrow({
      x_start: x, x_end: 5,
      y_start: 1900, y_end: 1900,
      line_width: 1.5,
      start: new NormalHead({fill_color: "black", size: 6}), end: null,
    })
    plot.add_layout(arrow)

    const meters_back = new Label({
      x: 5, y: 1900,
      x_offset: 10,
      text: "Meters behind\n2012 Usain Bolt",
      text_align: "left", text_baseline: "middle",
      text_font_size: "13px", text_font_style: "bold",
    })
    plot.add_layout(meters_back)

    const disclaimer = new Label({
      x: 0, y: 0,
      x_units: "screen", y_units: "screen",
      text_font_size: "11px", text_color: "silver",
      text: '\
This chart includes medals for the United States and Australia in the\
"Intermediary" Games of 1906, which the I.O.C. does not formally recognize.',
    })
    plot.add_layout(disclaimer, "below")

    await display(plot)
  })

  it("should support BlackbodyRadiation", async () => {
    use_theme(dark_minimal)

    const p = figure({
      width: 700, height: 500,
      toolbar_location: null,
      title: "Black body spectral radiance as a function of frequency",
    })

    function spectral_radiance(nu: NDArray, T: NDArray | number): NDArray {
      const h = 6.626e-34   // Planck constant (Js)
      const k = 1.3806e-23  // Boltzman constant (J/K)
      const c = 2.9979e8    // Speed of light in vacuum (m/s)
      return f`(${2*h}*${nu}**3/${c**2}) / (np.exp(${h}*${nu}/(${k}*${T})) - 1.0)`
    }

    const Ts = np.arange(2000, 6001, 500)  // Temperature (K)
    const palette = Spectral.Spectral9
    const nu = np.linspace(0.1, 1e15, 500) // Frequency (1/s)

    for (const [T, i] of enumerate(Ts)) {
      const B_nu = spectral_radiance(nu, T)
      p.line(f`${nu}/1e15`, f`${B_nu}/1e-9`, {
        line_width: 2,
        legend_label: `T = ${T} K`,
        line_color: palette[i],
      })
    }
    p.legend.items.reverse()

    // Peak radiance line
    const Tpr = np.linspace(1900, 6101, 50)
    const peak_freqs = f`${Tpr}*5.879e10`
    const peak_radiance = spectral_radiance(peak_freqs, Tpr)
    p.line(f`${peak_freqs}/1e15`, f`${peak_radiance}/1e-9`, {
      line_color: "silver", line_dash: "dashed", line_width: 2,
      legend_label: "Peak radiance",
    })

    p.y_range.start = 0
    p.xaxis.axis_label = tex`\color{white} \nu \:(10^{15} s^{-1})`
    p.yaxis.axis_label = tex`\color{white} B_\nu(\nu, T) \quad(10^{-9} J s m^{-3})`

    const div = new Div({
      width: 700,
      height: 100,
      text: r`
        A plot of the spectral radiance, defined as a function of the frequency $$\nu$$, is given by the formula
        <p \>
        $$
        \qquad B_\nu(\nu, T) = \frac{2h\nu^3}{c^2} \frac{1}{\exp(h\nu/kT)-1}\ .
        $$
      `,
    })

    await display(column([p, div]))

    use_theme()
  })

  it("should support NormalDistribution", async () => {
    const p = figure({
      width: 670, height: 400,
      toolbar_location: null,
      title: "Normal (Gaussian) Distribution",
    })

    const n = 1000
    const rng = np.random.default_rng(825914)
    const x = rng.normal(4.7, 12.3, n)

    // Scale random data so that it has mean of 0 and standard deviation of 1
    const xbar = np.mean(x)
    const sigma = np.std(x)
    const scaled = f`(${x} - ${xbar}) / ${sigma}`

    // Histogram
    const bins = np.linspace(-3, 3, 40)
    const [hist, edges] = np.histogram(scaled, {density: true, bins})
    p.quad({
      top: hist, bottom: 0,
      left: edges.slice(0, -1), right: edges.slice(1),
      // TODO: left: f`${edges}[:-1]`, right: f`${edges}[1:]`,
      fill_color: "skyblue", line_color: "white",
      legend_label: `${n} random samples`,
    })

    // Probability density function
    const x_pdf = np.linspace(-3.0, 3.0, 100)
    const pdf = f`np.exp(-0.5*${x_pdf}**2) / np.sqrt(2.0*${np.pi})`
    p.line(x_pdf, pdf, {
      line_width: 2, line_color: "navy",
      legend_label: "Probability Density Function",
    })

    p.y_range.start = 0
    p.xaxis.axis_label = "x"
    p.yaxis.axis_label = "PDF(x)"

    p.xaxis.ticker = new FixedTicker({ticks: [-3, -2, -1, 0, 1, 2, 3]})
    p.xaxis.major_label_overrides = {
      "-3": tex`\overline{x} - 3\sigma`,
      "-2": tex`\overline{x} - 2\sigma`,
      "-1": tex`\overline{x} - \sigma`,
      0: tex`\overline{x}`,
      1: tex`\overline{x} + \sigma`,
      2: tex`\overline{x} + 2\sigma`,
      3: tex`\overline{x} + 3\sigma`,
    }

    p.yaxis.ticker = new FixedTicker({ticks: [0, 0.1, 0.2, 0.3, 0.4]})
    p.yaxis.major_label_overrides = {
      0: tex`0`,
      0.1: tex`0.1/\sigma`,
      0.2: tex`0.2/\sigma`,
      0.3: tex`0.3/\sigma`,
      0.4: tex`0.4/\sigma`,
    }

    const div = new Div({
      width: 700,
      height: 100,
      text: r`
        A histogram of a samples from a Normal (Gaussian) distribution, together with
        the ideal probability density function, given by the equation:
        <p />
        $$
        \qquad PDF(x) = \frac{1}{\sigma\sqrt{2\pi}} \exp\left[-\frac{1}{2}
        \left(\frac{x-\overline{x}}{\sigma}\right)^2 \right]
        $$
      `,
    })

    await display(column([p, div]))
  })
})

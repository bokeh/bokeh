import {display, column} from "../_util"

import {figure} from "@bokehjs/api/plotting"
import {f} from "@bokehjs/api/expr"
import {np} from "@bokehjs/api/linalg"

import {FixedTicker, TeX} from "@bokehjs/models"
import {Div} from "@bokehjs/models/widgets"

const r = String.raw

function tex(strings: TemplateStringsArray, ...subs: unknown[]): TeX {
  return new TeX({text: r(strings, ...subs)})
}

describe("Examples", () => {
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
    p.xaxis.major_label_overrides = new Map([
      [-3, tex`\overline{x} - 3\sigma`],
      [-2, tex`\overline{x} - 2\sigma`],
      [-1, tex`\overline{x} - \sigma`],
      [ 0, tex`\overline{x}`],
      [ 1, tex`\overline{x} + \sigma`],
      [ 2, tex`\overline{x} + 2\sigma`],
      [ 3, tex`\overline{x} + 3\sigma`],
    ])

    p.yaxis.ticker = new FixedTicker({ticks: [0, 0.1, 0.2, 0.3, 0.4]})
    p.yaxis.major_label_overrides = new Map([
      [0.0, tex`0`],
      [0.1, tex`0.1/\sigma`],
      [0.2, tex`0.2/\sigma`],
      [0.3, tex`0.3/\sigma`],
      [0.4, tex`0.4/\sigma`],
    ])

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

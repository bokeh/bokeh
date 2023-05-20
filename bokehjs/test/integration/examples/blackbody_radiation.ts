import {display, column} from "../_util"

import {figure} from "@bokehjs/api/plotting"
import {Spectral} from "@bokehjs/api/palettes"
import {dark_minimal} from "@bokehjs/api/themes"
import {f} from "@bokehjs/api/expr"
import {np} from "@bokehjs/api/linalg"

import type {Arrayable} from "@bokehjs/core/types"
import {enumerate} from "@bokehjs/core/util/iterator"

import type {Theme} from "@bokehjs/core/properties"
import {use_theme} from "@bokehjs/core/properties"

import {TeX} from "@bokehjs/models"
import {Div} from "@bokehjs/models/widgets"

const r = String.raw

function tex(strings: TemplateStringsArray, ...subs: unknown[]): TeX {
  return new TeX({text: r(strings, ...subs)})
}

function with_theme(theme: Theme, fn: () => Promise<void>) {
  return () => {
    use_theme(theme)
    try {
      return fn()
    } finally {
      use_theme()
    }
  }
}

describe("Examples", () => {
  it("should support BlackbodyRadiation", with_theme(dark_minimal, async () => {
    const p = figure({
      width: 700, height: 500,
      toolbar_location: null,
      title: "Black body spectral radiance as a function of frequency",
    })

    function spectral_radiance(nu: Arrayable<number>, T: Arrayable<number> | number): Arrayable<number> {
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
    p.xaxis.axis_label = tex`\color{white} \nu \:(10^{15}\ \text{Hz})`
    p.yaxis.axis_label = tex`\color{white} B_\nu(\nu, T) \quad\left(10^{-9}\ \text{W} / (\text{m}^2 \cdot \text{sr} \cdot \text{Hz})\right)`

    const div = new Div({
      text: r`
        A plot of the spectral radiance, defined as a function of the frequency $$\nu$$, is given by the formula
        <p \>
        $$
        \qquad B_\nu(\nu, T) = \frac{2h\nu^3}{c^2} \frac{1}{\exp(h\nu/kT)-1}\ .
        $$
      `,
    })

    await display(column([p, div]))
  }))
})

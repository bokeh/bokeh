import {display} from "../_util"

import {figure} from "@bokehjs/api/plotting"
import {f} from "@bokehjs/api/expr"
import {np} from "@bokehjs/api/linalg"
import {range, reversed} from "@bokehjs/core/util/array"

import {TeX, Title, Label} from "@bokehjs/models"

const r = String.raw

function tex(strings: TemplateStringsArray, ...subs: unknown[]): TeX {
  return new TeX({text: r(strings, ...subs)})
}

describe("Examples", () => {
  it("should support Schrodinger", async () => {
    const p = figure({
      width: 800, height: 600,
      x_range: [-6, 6], y_range: [0, 8],
      toolbar_location: null,
      title: null,
    })
    p.xaxis.axis_label = tex`q`
    p.yaxis.visible = false
    p.xgrid.visible = false
    p.ygrid.visible = false

    const title = [
      tex`\text{Wavefunction } \psi_v(q) \text{ of first 8 mode solutions of Schrodinger's equation }
        -\frac{1}{2}\frac{d^2\psi}{dq^2} + \frac{1}{2}q^2\psi = \frac{E}{\hbar\omega}\psi`,
      tex`\text{in a potential } V(q) = \frac{q^2}{2} \text{ shown by the dashed line.}`,
      tex`\text{Each wavefunction is labelled with its quantum number } v \text{ and energy } E_v`,
    ]
    for (const text of reversed(title)) {
      p.add_layout(new Title({text, text_font_style: "normal"}), "above")
    }

    const q = np.linspace(-6, 6, 100)
    const yscale = 0.75
    const number_of_modes = 8

    for (const v of range(number_of_modes)) {
      const H_v = np.hermite(v)
      const N_v = (np.pi**0.5 * 2**v * np.factorial(v))**(-0.5)
      const psi = f`${N_v}*${H_v(q)}*np.exp(-(${q}**2)/2)` // XXX: -(q**2)/2 instead of -q**2/2 due to a parser bug
      const E_v = v + 0.5 // use energy level as y-offset

      const y = f`${yscale}*${psi} + ${E_v}`
      const yupper = np.where(f`${y} >= ${E_v}`, y, E_v)
      const ylower = np.where(f`${y} <= ${E_v}`, y, E_v)

      p.varea(q, yupper, E_v, {fill_color: "coral"})
      p.varea(q, ylower, E_v, {fill_color: "orange"})
      p.line(q, y, {color: "red", line_width: 2})

      p.add_layout(new Label({x: -5.8, y: E_v, y_offset: -21, text: tex`v = ${v}`}))
      p.add_layout(new Label({x: 3.9, y: E_v, y_offset: -25, text: tex`E_${v} = (${2*v + 1}/2) \hbar\omega`}))
    }

    const V = f`${q}**2 / 2`
    p.line(q, V, {line_color: "black", line_width: 2, line_dash: "dashed"})

    await display(p)
  })
})

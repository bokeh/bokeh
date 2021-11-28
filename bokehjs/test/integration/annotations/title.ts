import {display, fig, row} from "../_util"
import {tex} from "./_text_utils"

import {OutputBackend} from "@bokehjs/core/enums"
import {Title, HTMLTitle} from "@bokehjs/models/annotations"
import { Constructor } from "@bokehjs/core/class"

const r = String.raw

describe("Title annotation", () => {
  describe("should support positioning", () => {
    function plot<T extends Title | HTMLTitle>(attrs: T extends Title ?  Partial<Title.Attrs> :  Partial<HTMLTitle.Attrs>, TitleCls: Constructor<T>) {
      function make_plot(output_backend: OutputBackend) {
        const p = fig([400, 400], {
          output_backend, title: output_backend,
          x_axis_type: null, y_axis_type: null, x_range: [0, 1], y_range: [0, 1],
        })

        p.add_layout(new TitleCls({text: "1st Left (Ag/9)", ...attrs}), "left")
        p.add_layout(new TitleCls({text: "Second Left (Ag/9)\nspanning two lines", ...attrs}), "left")
        p.add_layout(new TitleCls({text: r`$$\text{Left: } ${tex}$$`, ...attrs}), "left")

        p.add_layout(new TitleCls({text: "1st Right (Ag/9)", ...attrs}), "right")
        p.add_layout(new TitleCls({text: "Second Right (Ag/9)\nspanning two lines", ...attrs}), "right")
        p.add_layout(new TitleCls({text: r`$$\text{Right: } ${tex}$$`, ...attrs}), "right")

        p.add_layout(new TitleCls({text: "1st Above (Ag/9)", ...attrs}), "above")
        p.add_layout(new TitleCls({text: "Second Above (Ag/9)\nspanning two lines", ...attrs}), "above")
        p.add_layout(new TitleCls({text: r`$$\text{Above: } ${tex}$$`, ...attrs}), "above")

        p.add_layout(new TitleCls({text: "1st Below (Ag/9)", ...attrs}), "below")
        p.add_layout(new TitleCls({text: "Second Below (Ag/9)\nspanning two lines", ...attrs}), "below")
        p.add_layout(new TitleCls({text: r`$$\text{Below: } ${tex}$$`, ...attrs}), "below")

        return p
      }

      const p0 = make_plot("canvas")
      const p1 = make_plot("svg")

      return row([p0, p1])
    }

    it("with align=left", async () => {
      const p = plot({align: "left"}, Title)
      await display(p)
    })

    it("with align=center", async () => {
      const p = plot({align: "center"}, Title)
      await display(p)
    })

    it("with align=right", async () => {
      const p = plot({align: "right"}, Title)
      await display(p)
    })

    it("with align=left and border_line and background_fill", async () => {
      const p = plot({align: "left", border_line_color: "black", background_fill_color: "lightgray"}, Title)
      await display(p)
    })

    it("with align=center and border_line and background_fill", async () => {
      const p = plot({align: "center", border_line_color: "black", background_fill_color: "lightgray"}, Title)
      await display(p)
    })

    it("with align=right and border_line and background_fill", async () => {
      const p = plot({align: "right", border_line_color: "black", background_fill_color: "lightgray"}, Title)
      await display(p)
    })

    it("with align=left and offset=20 and border_line and background_fill", async () => {
      const p = plot({align: "left", offset: 20, border_line_color: "black", background_fill_color: "lightgray"}, Title)
      await display(p)
    })

    it("with align=center and offset=20 and border_line and background_fill", async () => {
      const p = plot({align: "center", offset: 20, border_line_color: "black", background_fill_color: "lightgray"}, Title)
      await display(p)
    })

    it("with align=right and offset=20 and border_line and background_fill", async () => {
      const p = plot({align: "right", offset: 20, border_line_color: "black", background_fill_color: "lightgray"}, Title)
      await display(p)
    })

    it("with align=left and standoff=20 and border_line and background_fill", async () => {
      const p = plot({align: "left", standoff: 20, border_line_color: "black", background_fill_color: "lightgray"}, Title)
      await display(p)
    })

    it("with align=center and standoff=20 and border_line and background_fill", async () => {
      const p = plot({align: "center", standoff: 20, border_line_color: "black", background_fill_color: "lightgray"}, Title)
      await display(p)
    })

    it("with align=right and standoff=20 and border_line and background_fill", async () => {
      const p = plot({align: "right", standoff: 20, border_line_color: "black", background_fill_color: "lightgray"}, Title)
      await display(p)
    })

    it("with css rendering", async () => {
      await display(plot({}, HTMLTitle))
    })
  })
})

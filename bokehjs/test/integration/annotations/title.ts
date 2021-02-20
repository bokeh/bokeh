import {display, fig} from "../_util"

import {Title} from "@bokehjs/models"

describe("Title annotation", () => {
  describe("should support positioning", () => {
    function plot(attrs: Partial<Title.Attrs>) {
      const p = fig([300, 300], {
        x_axis_type: null, y_axis_type: null,
        x_range: [0, 1], y_range: [0, 1],
      })

      p.add_layout(new Title({text: "1st Left (Ag/9)", ...attrs}), "left")
      p.add_layout(new Title({text: "Second Left (Ag/9)", ...attrs}), "left")
      p.add_layout(new Title({text: "Third Left (Ag/9)", ...attrs}), "left")

      p.add_layout(new Title({text: "1st Right (Ag/9)", ...attrs}), "right")
      p.add_layout(new Title({text: "Second Right (Ag/9)", ...attrs}), "right")
      p.add_layout(new Title({text: "Third Right (Ag/9)", ...attrs}), "right")

      p.add_layout(new Title({text: "1st Above (Ag/9)", ...attrs}), "above")
      p.add_layout(new Title({text: "Second Above (Ag/9)", ...attrs}), "above")
      p.add_layout(new Title({text: "Third Above (Ag/9)", ...attrs}), "above")

      p.add_layout(new Title({text: "1st Below (Ag/9)", ...attrs}), "below")
      p.add_layout(new Title({text: "Second Below (Ag/9)", ...attrs}), "below")
      p.add_layout(new Title({text: "Third Below (Ag/9)", ...attrs}), "below")

      return p
    }

    it(`with align=left`, async () => {
      const p = plot({align: "left"})
      await display(p)
    })

    it(`with align=center`, async () => {
      const p = plot({align: "center"})
      await display(p)
    })

    it(`with align=right`, async () => {
      const p = plot({align: "right"})
      await display(p)
    })

    it(`with align=left and border_line and background_fill`, async () => {
      const p = plot({align: "left", border_line_color: "black", background_fill_color: "lightgray"})
      await display(p)
    })

    it(`with align=center and border_line and background_fill`, async () => {
      const p = plot({align: "center", border_line_color: "black", background_fill_color: "lightgray"})
      await display(p)
    })

    it(`with align=right and border_line and background_fill`, async () => {
      const p = plot({align: "right", border_line_color: "black", background_fill_color: "lightgray"})
      await display(p)
    })

    it(`with align=left and offset=20 and border_line and background_fill`, async () => {
      const p = plot({align: "left", offset: 20, border_line_color: "black", background_fill_color: "lightgray"})
      await display(p)
    })

    it(`with align=center and offset=20 and border_line and background_fill`, async () => {
      const p = plot({align: "center", offset: 20, border_line_color: "black", background_fill_color: "lightgray"})
      await display(p)
    })

    it(`with align=right and offset=20 and border_line and background_fill`, async () => {
      const p = plot({align: "right", offset: 20, border_line_color: "black", background_fill_color: "lightgray"})
      await display(p)
    })

    it(`with align=left and standoff=20 and border_line and background_fill`, async () => {
      const p = plot({align: "left", standoff: 20, border_line_color: "black", background_fill_color: "lightgray"})
      await display(p)
    })

    it(`with align=center and standoff=20 and border_line and background_fill`, async () => {
      const p = plot({align: "center", standoff: 20, border_line_color: "black", background_fill_color: "lightgray"})
      await display(p)
    })

    it(`with align=right and standoff=20 and border_line and background_fill`, async () => {
      const p = plot({align: "right", standoff: 20, border_line_color: "black", background_fill_color: "lightgray"})
      await display(p)
    })
  })
})

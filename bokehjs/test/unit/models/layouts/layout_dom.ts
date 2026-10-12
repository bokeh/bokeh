import {expect} from "#framework/assertions"
import {display, fig, row, column} from "#framework/layouts"

import {Tabs} from "@bokehjs/models/layouts/tabs"
import {TabPanel} from "@bokehjs/models/layouts/tab_panel"
import {Toggle} from "@bokehjs/models/widgets/toggle"
import type {Column} from "@bokehjs/models/layouts/column"
import type {UIElement} from "@bokehjs/models/ui/ui_element"
import type {Figure} from "@bokehjs/api/figure"
import {gridplot} from "@bokehjs/api/gridplot"

describe("LayoutDOMView", () => {
  describe("in issue #13384", () => {
    function make_layout() {
      const plots = [fig([300, 300]), fig([250, 250]), fig([250, 250])]
      for (const plot of plots) {
        plot.scatter([0, 1, 2], [0, 1, 2])
      }
      const [s1, s2, s3] = plots
      const grid = gridplot([[s2, s3]], {width: 250, height: 250})
      return {col: column([s1, grid]), plots}
    }

    async function expect_frames_laid_out(wrap: (col: Column) => UIElement): Promise<void> {
      const {col, plots} = make_layout()
      const {view} = await display(wrap(col), null)

      for (const plot of plots) {
        const {width, height} = view.owner.get_one(plot).frame.bbox
        expect(width).to.be.within(150, 300)
        expect(height).to.be.within(150, 300)
      }
    }

    it("should lay out plots in a gridplot in a column", async () => {
      await expect_frames_laid_out((col) => col)
    })

    it("should lay out plots in a gridplot in Tabs in a row with linked layouts", async () => {
      await expect_frames_laid_out((col) => {
        const tabs = Tabs.create({
          tabs: [TabPanel.create({child: col, title: "Tab with grid"})],
          link_layouts: true,
        })
        return row([tabs])
      })
    })

    it("should lay out plots in a gridplot in a column in a row", async () => {
      await expect_frames_laid_out((col) => row([column([col])]))
    })
  })

  describe("in issue #14359", () => {
    function make_tabs(children: UIElement[], link_layouts: boolean): Tabs {
      const tabs = children.map((child, i) => TabPanel.create({child, title: `tab${i}`}))
      return Tabs.create({tabs, link_layouts})
    }

    function make_inner_tabs(link_layouts: boolean): {tabs: Tabs, grid_plots: Figure[]} {
      const plots = [fig([350, 300]), fig([300, 300]), fig([300, 300]), fig([300, 300]), fig([300, 300]), fig([300, 300])]
      for (const plot of plots) {
        plot.line([0, 1, 2], [0, 1, 2])
      }
      const [p0, p1, p2, p3, p4, p5] = plots
      const grid = gridplot([[p0, null], [p1, p2]])
      const lay = column([row([p3]), row([p4, p5])])
      return {tabs: make_tabs([grid, lay], link_layouts), grid_plots: [p0, p1, p2]}
    }

    async function expect_nested_tabs_laid_out(link_layouts: boolean): Promise<void> {
      const inner0 = make_inner_tabs(link_layouts)
      const inner1 = make_inner_tabs(link_layouts)
      const outer = make_tabs([inner0.tabs, inner1.tabs], link_layouts)
      const toggle = Toggle.create({label: "button1"})
      const {view} = await display(column([toggle, outer]), null)

      for (const plot of inner0.grid_plots) {
        const {width, height} = view.owner.get_one(plot).frame.bbox
        expect(width).to.be.within(150, 350)
        expect(height).to.be.within(150, 350)
      }
    }

    it("should lay out plots in a gridplot in nested Tabs with linked layouts", async () => {
      await expect_nested_tabs_laid_out(true)
    })

    it("should lay out plots in a gridplot in nested Tabs", async () => {
      await expect_nested_tabs_laid_out(false)
    })
  })
})

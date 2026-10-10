import {expect} from "#framework/assertions"
import {display, fig, row, column} from "#framework/layouts"

import {Tabs} from "@bokehjs/models/layouts/tabs"
import {TabPanel} from "@bokehjs/models/layouts/tab_panel"
import type {Column} from "@bokehjs/models/layouts/column"
import type {UIElement} from "@bokehjs/models/ui/ui_element"
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
})

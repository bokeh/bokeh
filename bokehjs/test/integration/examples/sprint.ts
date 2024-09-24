import {display} from "../_util"

import {figure} from "@bokehjs/api/plotting"

import {assert} from "@bokehjs/core/util/assert"
import {zip, min, max} from "@bokehjs/core/util/array"

import {
  Title, Label, NormalHead,
  FixedTicker, SingleIntervalTicker,
  TapTool, HoverTool,
  ColumnDataSource,
  DataRange1d,
} from "@bokehjs/models"

describe("Examples", () => {
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

    const medal = plot.scatter({
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
          const name = source.get("Name")[index] as string
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
    plot.arrow({
      x0: x, x1: 5,
      y0: 1900, y1: 1900,
      line_color: "black", line_width: 1.5,
      start: new NormalHead({fill_color: "black", size: 6}), end: null,
    })

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
})

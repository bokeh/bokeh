import {display} from "#framework/layouts"

import {figure} from "@bokehjs/api/plotting"
import {GroupFilter, HoverTool, IndexedSubset, RecordDataSource} from "@bokehjs/models"

describe("Examples", () => {
  it("should plot a kelp survey from JSON Lines records", async () => {
    const response = await fetch("/assets/data/record_dive_observations.jsonl")
    const source = RecordDataSource.from_jsonl(await response.text())

    const reviewed = IndexedSubset.create({filter: GroupFilter.create({field_name: "status", group: "reviewed"})})
    const pending = IndexedSubset.create({filter: GroupFilter.create({field_name: "status", group: "pending"})})

    const plot = figure({
      title: "Kelp forest survey by depth", width: 640, height: 410,
      x_axis_label: "Depth (m)", y_axis_label: "Kelp canopy cover (%)",
      x_range: [0, 37], y_range: [0, 103], tools: "pan,wheel_zoom,reset,save",
    })
    plot.add_tools(HoverTool.create({
      tooltips: [["Dive site", "@site"], ["Depth", "@depth m"], ["Cover", "@cover%"], ["Status", "@status"]],
    }))

    const depth = {field: "depth"}
    const cover = {field: "cover"}
    plot.scatter(depth, cover, {
      source, view: pending, marker: "x", color: "#64748b",
      size: 13, line_width: 2, legend_label: "Pending review",
    })
    plot.scatter(depth, cover, {
      source, view: reviewed, color: "#0f766e", size: 10, legend_label: "Reviewed",
    })

    plot.legend.location = "top_right"
    plot.legend.click_policy = "hide"

    await display(plot)
  })
})

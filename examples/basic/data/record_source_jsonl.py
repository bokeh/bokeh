from os.path import dirname, join

from bokeh.models import GroupFilter, IndexedSubset, RecordDataSource
from bokeh.plotting import figure, show

source = RecordDataSource.from_jsonl(join(dirname(__file__), "record_dive_observations.jsonl"))

reviewed = IndexedSubset(filter=GroupFilter(field_name="status", group="reviewed"))
pending = IndexedSubset(filter=GroupFilter(field_name="status", group="pending"))

plot = figure(title="Kelp forest survey by depth", width=640, height=410,
              x_axis_label="Depth (m)", y_axis_label="Kelp canopy cover (%)",
              x_range=(0, 37), y_range=(0, 103), tools="pan,wheel_zoom,reset,save",
              tooltips=[("Dive site", "@site"), ("Depth", "@depth m"), ("Cover", "@cover%"),
                        ("Status", "@status")])

plot.scatter("depth", "cover", source=source, view=pending, marker="x", color="#64748b",
             size=13, line_width=2, legend_label="Pending review")
plot.scatter("depth", "cover", source=source, view=reviewed, color="#0f766e",
             size=10, legend_label="Reviewed")

plot.legend.location = "top_right"
plot.legend.click_policy = "hide"

show(plot)

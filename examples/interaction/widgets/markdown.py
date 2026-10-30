from pathlib import Path

from bokeh.io import show
from bokeh.layouts import column
from bokeh.models import Markdown
from bokeh.plotting import figure

trend = figure(title="An embedded Bokeh plot", height=260, sizing_mode="stretch_width")
trend.line([1, 2, 3, 4, 5], [2, 5, 4, 8, 10], line_width=3)
trend.scatter([1, 2, 3, 4, 5], [2, 5, 4, 8, 10], size=9)

text = Path(__file__).with_suffix(".md").read_text(encoding="utf-8")

md = Markdown(
    text=text,
    embeds={"trend": trend},
    sizing_mode="stretch_width", max_width=700, min_width=0,
    stylesheets=[
        """
        :host { font-size: 15px; line-height: 1.5; }
        img { max-width: min(200px, 100%); height: auto; }
        """,
    ],
)
option_text = """
    ### Sample heading

    First line
    Second line

    #### Stable heading {#option-heading}
"""

defaults = Markdown(text=option_text, sizing_mode="stretch_width", max_width=700, min_width=0)
hard_breaks = Markdown(text=option_text, hard_line_break=True, disable_anchors=True, sizing_mode="stretch_width", max_width=700, min_width=0)
literal_indent = Markdown(text=option_text, dedent=False, sizing_mode="stretch_width", max_width=700, min_width=0)

class Results:
    def __init__(self, count, average):
        self.count = count
        self.average = average

    def _repr_markdown_(self):
        return f"### Results from an object\n\n- **Count:** {self.count}\n- **Average:** {self.average:.2f}"

class ResultsWithMetadata:
    def _repr_markdown_(self):
        return "### Metadata tuple\n\nThe **text** is rendered. Display metadata is ignored.", {"example": True}

class NoMarkdown:
    def _repr_markdown_(self):
        return None

object_example = Markdown(text=Results(count=120, average=4.56), sizing_mode="stretch_width", max_width=700, min_width=0)
metadata_example = Markdown(text=ResultsWithMetadata(), sizing_mode="stretch_width", max_width=700, min_width=0)
empty_example = Markdown(text=NoMarkdown(), sizing_mode="stretch_width", max_width=700, min_width=0)

content_styles = """
:host { min-width: 0; overflow-wrap: anywhere; }
pre { max-width: 100%; box-sizing: border-box; overflow-x: auto; }
table { display: block; max-width: 100%; width: fit-content; overflow-x: auto; }
"""
for widget in (md, defaults, hard_breaks, literal_indent, object_example, metadata_example, empty_example):
    widget.stylesheets = [*widget.stylesheets, content_styles]

def section(text):
    return Markdown(text=text, sizing_mode="stretch_width", stylesheets=["""
        :host { min-width: 0; overflow-wrap: anywhere; }
        h2 {
            background: color-mix(in srgb, var(--primary-text-color) 8%, var(--background-color));
            color: var(--primary-text-color);
            padding: 5px 16px;
            margin: 8px 0;
            font-size: 19px;
            font-weight: 400;
        }
        h2 .heading-anchor { color: inherit; }
        p { max-width: 700px; }
    """])

example = column(
    section("## Basic Markdown"),
    md,
    section("## Default options {#rendering-options-demo}\n\n`dedent=True`, `hard_line_break=False`, `disable_anchors=False`"),
    defaults,
    section("## Hard line breaks, heading anchors disabled\n\n`hard_line_break=True`, `disable_anchors=True`"),
    hard_breaks,
    section("## Preserved indentation\n\n`dedent=False`. This separate widget receives the same indented source, "
        "which is displayed as a code block:"),
    literal_indent,
    section("## Python object representations {#object-representations}\n\nThe examples below also use separate `Markdown` widgets. "
        "Pass an object directly to `Markdown(text=obj)`. "
        "Its `_repr_markdown_()` method is called once on assignment. Reassign it to refresh the displayed snapshot."),
    object_example,
    section("## Object returning a metadata tuple"),
    metadata_example,
    section("## Object returning no content\n\nAn object returning `None`, like `Markdown(text=None)`, produces empty content below:"),
    empty_example,
    spacing=24,
    sizing_mode="stretch_width",
    stylesheets=["""
        :host { background-color: var(--background-color); }
    """],
)
show(example)

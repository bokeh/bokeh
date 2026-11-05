from bokeh.io import show
from bokeh.layouts import column
from bokeh.models import Div

sections = [
    ("setup", "Setup"),
    ("data", "Loading the data"),
    ("analysis", "Analysis"),
    ("results", "Results"),
]

entries = "".join(f'<li><a href="#{name}">{title}</a></li>' for name, title in sections)
contents = Div(text=f'<h2 id="contents">Contents</h2><ul>{entries}</ul>')

filler = " ".join([
    "Each section is long enough that the page has to scroll to reach it.",
    "Links that start with # jump to the element with that id, or to an",
    "&lt;a&gt; element with that name, in the same Div or in another one.",
] * 8)

body = ""
for name, title in sections:
    body += f'<h2 id="{name}">{title}</h2>'
    body += f"<p>{filler}</p>" * 3
    if name == "setup":
        body += '<p>The figures are discussed under <a href="#results">Results</a>.</p>'
    body += '<p><a href="#contents">Back to contents</a></p>'

text = Div(text=body, width=600)

show(column(contents, text))

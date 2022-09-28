'''This example creates a periodic table of elements with a custom tooltip. The tooltip
includes multiple chemical data as well as a bohr diagram for each element.

.. bokeh-example-metadata::
    :sampledata: periodic_table
    :apis: bokeh.plotting.figure.circle, bokeh.transform.dodge, bokeh.transform.factor_cmap
    :refs: :ref:`ug_basic_scatters_markers`
    :keywords: circle, RendererGroup, Template, ToggleGroup

'''

import re

import numpy as np

from bokeh.io import show
from bokeh.models import RendererGroup
from bokeh.models.dom import (ColorRef, Div, Index, Span, Styles,
                              Template, ToggleGroup, ValueRef)
from bokeh.plotting import figure
from bokeh.sampledata.periodic_table import elements
from bokeh.transform import dodge, factor_cmap

periods = ["I", "II", "III", "IV", "V", "VI", "VII"]
groups = [str(x) for x in range(1, 19)]

df = elements.copy()
df["atomic mass"] = df["atomic mass"].astype(str)
df["group"] = df["group"].astype(str)
df["period"] = [periods[x-1] for x in df.period]
df = df[df.group != "-"]
df = df[df.symbol != "Lr"]
df = df[df.symbol != "Lu"]

# 1s2
# [He] 2s2 2p6
# [Ne] 3s2 3p6
# [Ar] 3d10 4s2 4p4
# ->
# 1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p4
econf = "electronic configuration"
ecs = []
for ec in df[econf]:
    n = 1
    while n != 0:
        replace = lambda m: df[df.symbol == m.group("name")][econf].values[0]
        (ec, n) = re.subn(r"\[(?P<name>\w+)\]", replace, ec)

    sc = {}
    for m in re.finditer(r"(?P<shell>\d+)\w(?P<count>\d+)", ec):
        s = int(m.group("shell"))
        c = int(m.group("count"))
        sc.setdefault(s, 0)
        sc[s] += c

    ecs.append(list(sc.values()))
df["electron shells"] = ecs

cmap = {
    "alkali metal"         : "#a6cee3",
    "alkaline earth metal" : "#1f78b4",
    "metal"                : "#d93b43",
    "halogen"              : "#999d9a",
    "metalloid"            : "#e08d49",
    "noble gas"            : "#eaeaea",
    "nonmetal"             : "#f1d4Af",
    "transition metal"     : "#599d7A",
}

TOOLTIPS = [
    ("Name", "@name"),
    ("Atomic number", "@{atomic number}"),
    ("Atomic mass", "@{atomic mass}"),
    ("Type", "@metal"),
    ("CPK color", "$color[hex, swatch]:CPK"),
    ("Electronic configuration", "@{electronic configuration}"),
]

def bohr_diagram():
    plot = figure(
        width=150, height=150,
        x_axis_type=None, y_axis_type=None,
        x_range = (-8,8), y_range = (-8,8),
        toolbar_location=None, outline_line_color=None,
        match_aspect=True,
    )
    groups = []
    for sc in df["electron shells"]:
        n = len(sc)
        group = RendererGroup(visible=False)
        groups.append(group)
        c0 = plot.circle(x=0, y=0, radius=list(range(1, n+1)), fill_color=None, line_color="black", visible=False)
        c0.group = group
        xs = np.array([])
        ys = np.array([])
        for i, c in enumerate(sc):
            da = 360/c
            r = i + 1
            A = np.radians(np.arange(0, 360, da))
            x = r*np.cos(A)
            y = r*np.sin(A)
            xs = np.append(xs, x)
            ys = np.append(ys, y)
            #plot.circle(x=x, y=y)
            #plot.polar.circle(r=i+1, phi=list(range(0, 360, da)), phi_units="deg")
        c1 = plot.circle(x=xs, y=ys, visible=False)
        c1.group = group
    return plot, groups

def tooltips():
    plot, groups = bohr_diagram()

    style = Styles(
        display="grid",
        grid_template_columns="auto auto",
        column_gap="10px",
    )
    grid = Div(style=style)
    grid.children = [
        Span(),                     Span(children=["#", Index()]),
        "Name",                     Span(style=dict(font_weight="bold"), children=[ValueRef(field="name")]),
        "Atomic number",            ValueRef(field="atomic number"),
        "Atomic mass",              ValueRef(field="atomic mass"),
        "Type",                     ValueRef(field="metal"),
        "CPK color",                ColorRef(field="CPK", hex=True, swatch=True),
        "Electronic configuration", ValueRef(field="electronic configuration"),
        Span(),                     plot,
    ]
    return Template(children=[grid], actions=[ToggleGroup(groups=groups)])

p = figure(title="Periodic Table (omitting LA and AC Series)", width=1000, height=450,
           x_range=groups, y_range=list(reversed(periods)),
           tools="hover", toolbar_location=None, tooltips=tooltips())

r = p.rect("group", "period", 0.95, 0.95, source=df, fill_alpha=0.6, legend_field="metal",
           color=factor_cmap('metal', palette=list(cmap.values()), factors=list(cmap.keys())))

text_props = dict(source=df, text_align="left", text_baseline="middle")

x = dodge("group", -0.4, range=p.x_range)

p.text(x=x, y="period", text="symbol", text_font_style="bold", **text_props)

p.text(x=x, y=dodge("period", 0.3, range=p.y_range), text="atomic number",
       text_font_size="11px", **text_props)

p.text(x=x, y=dodge("period", -0.35, range=p.y_range), text="name",
       text_font_size="7px", **text_props)

p.text(x=x, y=dodge("period", -0.2, range=p.y_range), text="atomic mass",
       text_font_size="7px", **text_props)

p.text(x=["3", "3"], y=["VI", "VII"], text=["LA", "AC"], text_align="center", text_baseline="middle")

p.outline_line_color = None
p.grid.grid_line_color = None
p.axis.axis_line_color = None
p.axis.major_tick_line_color = None
p.axis.major_label_standoff = 0
p.legend.orientation = "horizontal"
p.legend.location ="top_center"
p.hover.renderers = [r] # only hover element boxes

show(p)

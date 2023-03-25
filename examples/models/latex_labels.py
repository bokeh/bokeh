''' A plot showing LaTeX ``Label`` objects in many different locations,
inside and outside the figure.

.. bokeh-example-metadata::
    :apis: bokeh.models.annotation.Label
    :refs: :ref:`ug_styling_mathtext`
    :keywords: mathtext, latex

'''
from bokeh.models import Label
from bokeh.plotting import figure, show

p = figure(width=600, height=600, x_range=(0, 10), y_range=(0, 10))

def get_text(prefix=''):
    if prefix:
        prefix = r"\text{" + prefix + r"}: "
    return r"$$" + prefix + r"\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$"

# Default text.
text = get_text()

# Different x and y offsets.
for x_offset, y_offset in zip([0, 25], [0, -50]):
    p.add_layout(Label(
        x=1, y=8, x_offset=x_offset, y_offset=y_offset, angle=15, angle_units="deg",
        text=text, text_font_size="12px", text_color="red", text_alpha=0.9, text_baseline="bottom", text_align="left",
        background_fill_color="green", background_fill_alpha=0.2, border_line_color="blue", border_line_width=2, border_line_dash=[8, 4],
    ))

# Different alignment and rotation in turn units.
for x, y, text_align, angle in zip([4, 4, 8, 9], [2, 1, 4, 4], ["right", "left"]*2, [0, 0, 0.25, 0.25]):
    p.add_layout(Label(
        x=x, y=y, angle=angle, angle_units="turn",
        text=text, text_font_size="12px", text_color="white", text_baseline="top", text_align=text_align,
        background_fill_color="black", border_line_color="red", border_line_width=2,
    ))

# Different angle and background alpha.
for angle, alpha in zip([-20, 70, 160, 250], [0.8, 0.6, 0.4, 0.2]):
    p.add_layout(Label(
        x=5, y=5, angle=angle, angle_units="deg",
        text=text, text_font_size="12px", text_baseline="top", text_align="left",
        background_fill_color="orange", background_fill_alpha=alpha, border_line_color="blue", border_line_width=1, border_line_dash=[10, 2, 8, 2, 4, 2],
    ))

# Outside figure.
for place, angle, text_baseline in zip(["above", "left", "below", "right"], [0, 90]*2, ["bottom", "top"]*2):
    for i, background_fill_color in enumerate(["aquamarine", "lightgreen"]):
        text = get_text(f"{place.capitalize()} {i}")
        p.add_layout(Label(
            x=0, y=0, x_units="screen", y_units="screen", angle=angle, angle_units="deg",
            text=text, text_baseline=text_baseline, text_font_size="14px", text_color="firebrick", text_alpha=0.9,
            background_fill_color=background_fill_color, border_line_color="green", border_line_width=1, border_line_dash=[8, 4],
        ), place)

show(p)

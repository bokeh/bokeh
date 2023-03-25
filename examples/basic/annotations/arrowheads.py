''' A display of available arrow head styles.

.. bokeh-example-metadata::
    :apis: bokeh.models.Plot, bokeh.models.Arrow, bokeh.models.Label
    :refs: :ref:`ug_basic_annotations_arrows`
    :keywords: arrows

'''
from bokeh.models import (Arrow, Label, NormalHead, OpenHead,
                          Plot, Range1d, TeeHead, VeeHead)
from bokeh.plotting import show

ARROW_HEADS = [TeeHead, OpenHead, NormalHead, VeeHead]
HEIGHT = 35 * len(ARROW_HEADS)

p = Plot(width=150, height=HEIGHT,
         x_range=Range1d(0,1), y_range=Range1d(-0.5, len(ARROW_HEADS) - 0.5),
         toolbar_location=None, outline_line_color=None, min_border_left=0,
         min_border_right=0, min_border_top=0, min_border_bottom=0)

for i, style in enumerate(ARROW_HEADS):
    arrow = Arrow(x_start=0.2, y_start=i, x_end=0.2, y_end=i, end=style())
    p.add_layout(arrow)

    label = Label(x=0.2, x_offset=20, y=i, text=style.__name__,
                  text_baseline="middle")
    p.add_layout(label)

show(p)

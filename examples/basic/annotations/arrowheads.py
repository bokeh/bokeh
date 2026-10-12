''' A display of available arrow head styles.

.. bokeh-example-metadata::
    :apis: bokeh.models.Label, bokeh.plotting.figure.arrow
    :refs: :ref:`ug_basic_annotations_arrows`
    :keywords: arrows

'''
from bokeh.models import Label, NormalHead, OpenHead, TeeHead, VeeHead
from bokeh.plotting import figure, show

ARROW_HEADS = [TeeHead, OpenHead, NormalHead, VeeHead]
HEIGHT = 35 * len(ARROW_HEADS)

p = figure(width=150, height=HEIGHT,
           x_range=(0, 1), y_range=(-0.5, len(ARROW_HEADS) - 0.5),
           toolbar_location=None, outline_line_color=None, min_border_left=0,
           min_border_right=0, min_border_top=0, min_border_bottom=0)

for i, style in enumerate(ARROW_HEADS):
    p.arrow(x_start=0.2, y_start=i, x_end=0.2, y_end=i, end=style())

    label = Label(x=0.2, x_offset=20, y=i, text=style.__name__,
                  text_baseline="middle")
    p.add_layout(label)

show(p)

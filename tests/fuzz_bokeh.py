#!/usr/bin/python3

import atheris
import sys

with atheris.instrument_imports():
    from bokeh.plotting import figure
    from bokeh.models import ColumnDataSource, BoxAnnotation


def ConsumeRandomLengthString(fdp, max_length):
    return fdp.ConsumeUnicode(fdp.ConsumeIntInRange(0, max_length))


def ConsumeRandomColor(fdp):
    return (fdp.ConsumeIntInRange(0, 255),
            fdp.ConsumeIntInRange(0, 255),
            fdp.ConsumeIntInRange(0, 255))


def ConsumeDataSource(fdp):
    data = {'x': fdp.ConsumeIntList(10, 10),
            'y': fdp.ConsumeIntList(10, 10)}
    return data


def TestOneInput(data):
    fdp = atheris.FuzzedDataProvider(data)
    max_length = 1000
    max_list_bytes = 1000
    p = figure(
        title=ConsumeRandomLengthString(fdp, max_length),
        x_axis_label=ConsumeRandomLengthString(fdp, max_length),
        y_axis_label=ConsumeRandomLengthString(fdp, max_length))

    data_source = ColumnDataSource(ConsumeDataSource(fdp))

    x = fdp.ConsumeIntList(max_length, max_list_bytes)
    y = fdp.ConsumeIntList(max_length, max_list_bytes)

    p.line(x, y,
           legend_label=ConsumeRandomLengthString(fdp, max_length),
           color=ConsumeRandomColor(fdp),
           line_width=fdp.ConsumeInt(max_length))
    p.circle(x, y,
             legend_label=ConsumeRandomLengthString(fdp, max_length),
             color=ConsumeRandomColor(fdp),
             line_width=fdp.ConsumeInt(max_length))
    p.vbar(
        x=x,
        top=y,
        legend_label=ConsumeRandomLengthString(fdp, max_length),
        width=fdp.ConsumeRegularFloat(),
        bottom=fdp.ConsumeRegularFloat(),
        color=ConsumeRandomColor(fdp))
    p.scatter(
        x='x',
        y='y',
        marker=ConsumeRandomLengthString(fdp, max_length),
        source=data_source)

    low_box = BoxAnnotation(top=fdp.ConsumeRegularFloat(),
                            fill_alpha=fdp.ConsumeFloatInRange(0, 1),
                            fill_color=ConsumeRandomColor(fdp))
    mid_box = BoxAnnotation(bottom=fdp.ConsumeRegularFloat(),
                            top=fdp.ConsumeRegularFloat(),
                            fill_alpha=fdp.ConsumeFloatInRange(0, 1),
                            fill_color=ConsumeRandomColor(fdp))
    high_box = BoxAnnotation(bottom=fdp.ConsumeRegularFloat(),
                             fill_alpha=fdp.ConsumeFloatInRange(0, 1),
                             fill_color=ConsumeRandomColor(fdp))
    p.add_layout(low_box)
    p.add_layout(mid_box)
    p.add_layout(high_box)


atheris.Setup(sys.argv, TestOneInput)
atheris.Fuzz()

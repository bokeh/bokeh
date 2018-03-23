from bokeh.io import save
from bokeh.layouts import row, column
from bokeh.plotting import figure

pq = [       0,  1,  2,  3,
          -1,  0,  1,  2,  3,
        -2, -1,  0,  1,  2,  3,
      -3, -2, -1,  0,  1,  2,  3,
        -3, -2, -1,  0,  1,  2,
          -3, -2, -1,  0,  1,
            -3, -2, -1,  0,
]
pr = [      -3, -3, -3, -3,        # red row
          -2, -2, -2, -2, -2,      # blue row
        -1, -1, -1, -1, -1, -1,    # green row
       0,  0,  0,  0,  0,  0,  0,  # grey row
         1,  1,  1,  1,  1,  1,    # orange row
           2,  2,  2,  2,  2,      # purple row
             3,  3,  3,  3,        # gold row
]

fq = [      -3, -3, -3, -3,        # red col
          -2, -2, -2, -2, -2,      # blue col
        -1, -1, -1, -1, -1, -1,    # green col
       0,  0,  0,  0,  0,  0,  0,  # grey col
         1,  1,  1,  1,  1,  1,    # orange col
           2,  2,  2,  2,  2,      # purple col
             3,  3,  3,  3,        # gold col
]
fr = [       0,  1,  2,  3,
          -1,  0,  1,  2,  3,
        -2, -1,  0,  1,  2,  3,
      -3, -2, -1,  0,  1,  2,  3,
        -3, -2, -1,  0,  1,  2,
          -3, -2, -1,  0,  1,
            -3, -2, -1,  0,
]

colors = ["red"]*4 + ["blue"]*5 + ["green"]*6 + ["grey"]*7 + ["orange"]*6 + ["purple"]*5 + ["gold"]*4

p0 = figure(plot_width=300, plot_height=300, match_aspect=True, toolbar_location=None, title="pointytop")
p0.hex_tile(pr, pq, line_color="white", fill_color=colors)

p1 = figure(plot_width=300, plot_height=300, match_aspect=True, toolbar_location=None, title="pointytop, size=10")
p1.hex_tile(pr, pq, line_color="white", fill_color=colors, size=10)

p2 = figure(plot_width=300, plot_height=300, match_aspect=True, toolbar_location=None, title="pointytop, aspect_scale=2")
p2.hex_tile(pr, pq, line_color="white", fill_color=colors, aspect_scale=2)

p3 = figure(plot_width=300, plot_height=300, match_aspect=True, toolbar_location=None, title="pointytop, aspect_scale=0.5")
p3.hex_tile(pr, pq, line_color="white", fill_color=colors, aspect_scale=0.5)

f0 = figure(plot_width=300, plot_height=300, match_aspect=True, toolbar_location=None, title="flattop")
f0.hex_tile(fr, fq, line_color="white", fill_color=colors, orientation="flattop")

f1 = figure(plot_width=300, plot_height=300, match_aspect=True, toolbar_location=None, title="flattop, size=10")
f1.hex_tile(fr, fq, line_color="white", fill_color=colors, orientation="flattop", size=10)

f2 = figure(plot_width=300, plot_height=300, match_aspect=True, toolbar_location=None, title="flattop, aspect_scale=2")
f2.hex_tile(fr, fq, line_color="white", fill_color=colors, orientation="flattop", aspect_scale=2)

f3 = figure(plot_width=300, plot_height=300, match_aspect=True, toolbar_location=None, title="flattop, aspect_scale=0.5")
f3.hex_tile(fr, fq, line_color="white", fill_color=colors, orientation="flattop", aspect_scale=0.5)

save(column(
    row(p0, p1, p2, p3),
    row(f0, f1, f2, f3),
))

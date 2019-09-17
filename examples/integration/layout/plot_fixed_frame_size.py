from __future__ import absolute_import

import numpy as np

from bokeh.plotting import figure, save

template = """
{% block preamble %}
<style>
    .grid {
        display: inline-grid;
        grid-template-columns: auto auto;
        grid-gap: 10px;
        padding: 10px;
        background-color: gray;
    }
    .item {
        background-color: black;
    }
</style>
{% endblock %}
{% block contents %}
<div class="grid">
    {{ super() }}
</div>
{% endblock %}
{% block root %}
<div class="item">{{ super() }}</div>
{% endblock %}
"""

V = np.arange(10)

fig1 = figure(plot_width=300, plot_height=300)
fig1.scatter(V, V*2)

fig2 = figure(frame_width=150, frame_height=150)
fig2.scatter(V, V*2)

# TODO
# fig3 = figure(plot_width=300, plot_height=300,
#               frame_width=150, frame_height=150,
#               width_policy="fixed", height_policy="fixed")
# fig3.scatter(V, V*2)

save([fig1, fig2], template=template)

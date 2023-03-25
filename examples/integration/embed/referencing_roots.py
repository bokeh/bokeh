from bokeh.io import save
from bokeh.plotting import figure

template = """
{% block preamble %}
<style>
  .col {
    display: inline-grid;
    grid-template-columns: auto;
  }
  .row {
    display: inline-grid;
    grid-template-columns: auto auto auto;
  }
</style>
{% endblock %}
{% block contents %}
  <div class="col">
    <!-- individual roots by index or by name -->
    <div class="row">
      {{ embed(roots[0]) }}
      {{ embed(roots.circle_green) }}
      {{ embed(roots["circle_blue"]) }}
    </div>

    <!-- filtering roots by name -->
    <div class="row">
      {% for root in roots %}
        {% if root.name.startswith("annulus") %}
           {{ embed(root) }}
        {% endif %}
      {% endfor %}
    </div>

    <!-- filtering roots by tags -->
    <div class="row">
      {% for root in roots %}
        {% if "quad" in root.tags %}
           {{ embed(root) }}
        {% endif %}
      {% endfor %}
    </div>
  </div>
{% endblock %}
"""

opts = dict(width=300, height=300, toolbar_location=None)

circle_red = figure(name="circle_red", **opts)
circle_red.circle(0, 0, radius=1, fill_color="red")

circle_green = figure(name="circle_green", **opts)
circle_green.circle(0, 0, radius=1, fill_color="green")

circle_blue = figure(name="circle_blue", **opts)
circle_blue.circle(0, 0, radius=1, fill_color="blue")

annulus_red = figure(name="annulus_red", **opts)
annulus_red.annulus(0, 0, inner_radius=0.25, outer_radius=1, fill_color="red")

annulus_green = figure(name="annulus_green", **opts)
annulus_green.annulus(0, 0, inner_radius=0.25, outer_radius=1, fill_color="green")

annulus_blue = figure(name="annulus_blue", **opts)
annulus_blue.annulus(0, 0, inner_radius=0.25, outer_radius=1, fill_color="blue")

quad_red = figure(tags=["quad"], **opts)
quad_red.quad(-1, 1, -1, 1, fill_color="red")

quad_green = figure(tags=["quad"], **opts)
quad_green.quad(-1, 1, -1, 1, fill_color="green")

quad_blue = figure(tags=["quad"], **opts)
quad_blue.quad(-1, 1, -1, 1, fill_color="blue")

figures = [
    circle_red, circle_green, circle_blue,
    annulus_red, annulus_green, annulus_blue,
    quad_red, quad_green, quad_blue,
]

save(figures, template=template, title="Different methods for referencing roots")

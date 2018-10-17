from bokeh.plotting import figure
from bokeh.io import save
from bokeh.util.browser import view

template = """
{% block preamble %}
<style>
* { box-sizing: border-box; }
.plots { display: flex; flex-direction: row; width: 100%; }
.p { width: 33.3%; padding: 50px; }
.p:nth-child(1) { background-color: red; }
.p:nth-child(2) { background-color: green; }
.p:nth-child(3) { background-color: blue; }
</style>
{% endblock %}
{% block body %}
<body style="background-color: lightgray;">
    {{ self.inner_body() }}
</body>
{% endblock %}
{% block contents %}
<div>
<p>This example shows how different Bokeh Document roots may be embedded in custom
templates. The individal plots were embedded in divs using the embed macro:

<pre>
    &lt;div class="p"&gt;&#123;&#123; embed(roots.p0) &#125;&#125;&lt;/div&gt;
    &lt;div class="p"&gt;&#123;&#123; embed(roots.p1) &#125;&#125;&lt;/div&gt;
    &lt;div class="p"&gt;&#123;&#123; embed(roots.p2) &#125;&#125;&lt;/div&gt;
</pre>

And the divs are styled using standard CSS in the template:

<pre>
    .p { width: 33.3%; padding: 50px; }
    .p:nth-child(1) { background-color: red; }
    .p:nth-child(2) { background-color: green; }
    .p:nth-child(3) { background-color: blue; }
</pre>
</p>
</div>
<div class="plots">
    <div class="p">{{ embed(roots.p0) }}</div>
    <div class="p">{{ embed(roots.p1) }}</div>
    <div class="p">{{ embed(roots.p2) }}</div>
</div>
</div>
{% endblock %}
"""

x = [1, 2, 3]
y = [1, 2, 3]

p0 = figure(name="p0", sizing_mode="scale_width")
p0.scatter(x, y, size=20, fill_color="red")
p1 = figure(name="p1", sizing_mode="scale_width")
p1.scatter(x, y, size=20, fill_color="green")
p2 = figure(name="p2", sizing_mode="scale_width")
p2.scatter(x, y, size=20, fill_color="blue")

save([p0, p1, p2], template=template)
view("custom_layout.html")

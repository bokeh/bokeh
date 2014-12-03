class Population(object):

    year = 2010
    location = "World"

    def __init__(self):
        from bokeh.document import Document
        from bokeh.session import Session
        from bokeh.models import ColumnDataSource
        from bokeh.sampledata.population import load_population

        self.document = Document()
        self.session = Session()
        self.session.use_doc('population')
        self.session.load_document(self.document)

        self.df = load_population()
        self.source_pyramid = ColumnDataSource(data=dict())

    def render(self):
        self.pyramid_plot()
        self.create_layout()
        self.document.add(self.layout)
        self.update_pyramid()

    def pyramid_plot(self):
        from bokeh.models import (
            Plot, DataRange1d, LinearAxis, Grid, Legend,
            SingleIntervalTicker
        )
        from bokeh.models.glyphs import Quad

        xdr = DataRange1d(sources=[self.source_pyramid.columns("male"),
                          self.source_pyramid.columns("female")])
        ydr = DataRange1d(sources=[self.source_pyramid.columns("groups")])

        self.plot = Plot(title=None, x_range=xdr, y_range=ydr,
                         plot_width=600, plot_height=600)

        xaxis = LinearAxis()
        self.plot.add_layout(xaxis, 'below')
        yaxis = LinearAxis(ticker=SingleIntervalTicker(interval=5))
        self.plot.add_layout(yaxis, 'left')

        self.plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
        self.plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

        male_quad = Quad(left="male", right=0, bottom="groups", top="shifted",
                         fill_color="#3B8686")
        male_quad_glyph = self.plot.add_glyph(self.source_pyramid, male_quad)

        female_quad = Quad(left=0, right="female", bottom="groups", top="shifted",
                           fill_color="#CFF09E")
        female_quad_glyph = self.plot.add_glyph(self.source_pyramid, female_quad)

        self.plot.add_layout(Legend(legends=dict(Male=[male_quad_glyph],
                                                 Female=[female_quad_glyph])))

    def on_year_change(self, obj, attr, old, new):
        self.year = int(new)
        self.update_pyramid()

    def on_location_change(self, obj, attr, old, new):
        self.location = new
        self.update_pyramid()

    def create_layout(self):
        from bokeh.models.widgets import Select, HBox, VBox

        years = list(map(str, sorted(self.df.Year.unique())))
        locations = sorted(self.df.Location.unique())

        year_select = Select(title="Year:", value="2010", options=years)
        location_select = Select(title="Location:", value="World", options=locations)

        year_select.on_change('value', self.on_year_change)
        location_select.on_change('value', self.on_location_change)

        controls = HBox(year_select, location_select)
        self.layout = VBox(controls, self.plot)

    def update_pyramid(self):
        pyramid = self.df[(self.df.Location == self.location) & (self.df.Year == self.year)]

        male = pyramid[pyramid.Sex == "Male"]
        female = pyramid[pyramid.Sex == "Female"]

        total = male.Value.sum() + female.Value.sum()

        male_percent = -male.Value / total
        female_percent = female.Value / total

        groups = male.AgeGrpStart.tolist()
        shifted = groups[1:] + [groups[-1] + 5]

        self.source_pyramid.data = dict(
            groups=groups,
            shifted=shifted,
            male=male_percent,
            female=female_percent,
        )
        self.session.store_document(self.document)

import bokeh.embed as embed

pop = Population()
pop.render()

tag = embed.autoload_server(pop.layout, pop.session)

html = """
<html>
<head></head>
<body>
%s
</body>
</html>
"""
html = html % (tag)
with open("population_embed.html", "w+") as f:
    f.write(html)

print("""
To view this example, run

    python -m SimpleHTTPServer (or http.server on python 3)

in this directory, then navigate to

    http://localhost:8000/population_embed.html
""")

import time

link = pop.session.object_link(pop.document.context)
print("""You can also go to

    %s

to see the plots on the Bokeh server directly""" % link)

try:
    while True:
        pop.session.load_document(pop.document)
        time.sleep(0.1)
except KeyboardInterrupt:
    print()

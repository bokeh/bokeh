from bokeh.plotting import square, output_server, show
from bokeh.objects import ServerDataSource
from bokeh.properties import Color
import bokeh.transforms.ar_downsample as ar

output_server("Tweets2")
# 2010 US Census tracts
source = ServerDataSource(data_url="/defaultuser/tweets.hdf5", owner_username="defaultuser")
plot = square(
        'longitude', 'latitude', 
        color='lang',
        source=source,
        plot_width=800,
        plot_height=600,
        title="Tweets")

#ar.replot(plot,
#        shader=ar.Cuberoot() + ar.InterpolateColor(low=(255, 200, 200)),
#        points=True)


red = Color((255,0,0))
green = Color((0,255,0))
blue = Color((0,0,255))
purple = Color((125,0,255))
white = Color((255,255,255))
black = Color((0,0,0))

ar.replot(plot,
          info=ar.Encode(cats=["Arabic","English","Turkish","Russian"]),
          agg=ar.CountCategories(),
          shader=ar.Spread(factor=1) + ar.HDAlpha(colors=["red", "blue", "green", "purple", "black"], log=True),
          points=True,
          balancedZoom=True,
          tools="pan,wheel_zoom,resize,reset,previewsave")
show()

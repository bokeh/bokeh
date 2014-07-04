from bokeh.volumeslicer.objects import VolumeSlicer
from bokeh.server.app import bokeh_app
from bokeh.server.utils.plugins import object_page

@bokeh_app.route("/bokeh/ocean/")
@object_page("ocean")
def make_object():
    slicer = VolumeSlicer.create("/defaultuser/big4.table/big",
                                 [4096, 8192, 94],
                                 x_bounds=[-180,180],
                                 y_bounds=[-90,90],
                                 z_bounds=[2012, 2014])
    return slicer

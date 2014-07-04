import math

from ..plot_object import PlotObject
from ..objects import ServerDataSource, Plot, Range1d
from ..properties import Instance, Int, List
from ..plotting import image

class VolumeSlicer(PlotObject):
    server_data_source = Instance(ServerDataSource)
    vert_source = Instance(ServerDataSource)
    horiz_source = Instance(ServerDataSource)
    main_plot = Instance(Plot)
    vert_plot = Instance(Plot)
    horiz_plot = Instance(Plot)
    shape = List(Int)
    @classmethod
    def create(cls, data_url, shape, x_bounds=[0,1], y_bounds=[0,1],
               z_bounds=[0,1], owner_username="defaultuser"):
        volume_slicer = cls()
        x_range = Range1d(start=x_bounds[0], end=x_bounds[1])
        y_range = Range1d(start=y_bounds[0], end=y_bounds[1])
        z_range = Range1d(start=z_bounds[0], end=z_bounds[1])

        source = ServerDataSource(
            data_url=data_url,
            owner_username=owner_username,
            transform={'resample' : 'heatmap',
                    },
            index_slice=[None, None, 0],
            data={'x' : [0],
                  'y' : [0],
                  'global_offset_x' : [0],
                  'global_offset_y' : [0],
                  'global_x_range' : x_bounds,
                  'global_y_range' : y_bounds,
                  'dw' : x_bounds[-1] - x_bounds[0],
                  'dh' : y_bounds[-1] - y_bounds[0],
                  'palette': ["Spectral-256"]})
        vert_source = ServerDataSource(
            data_url=data_url,
            owner_username=owner_username,
            index_slice=[None, round(shape[1] / 2.0), None],
            transform={'resample' : 'heatmap',
                    },
            data={'x' : [0],
                  'y' : [0],
                  'global_offset_x' : [0],
                  'global_offset_y' : [0],
                  'global_x_range' : z_bounds,
                  'global_y_range' : y_bounds,
                  'dw' : z_bounds[-1] - z_bounds[0],
                  'dh' : y_bounds[-1] - y_bounds[0],
                  'palette': ["Spectral-256"]})
        horiz_source = ServerDataSource(
            data_url=data_url,
            owner_username=owner_username,
            index_slice=[round(shape[0] / 2.0), None, None],
            transform={'resample' : 'heatmap',
                       'transpose' : True
                    },
            data={'x' : [0],
                  'y' : [0],
                  'global_offset_x' : [0],
                  'global_offset_y' : [0],
                  'global_x_range' : x_bounds,
                  'global_y_range' : z_bounds,
                  'dw' : z_bounds[-1] - z_bounds[0],
                  'dh' : y_bounds[-1] - y_bounds[0],
                  'palette': ["Spectral-256"]})
        main_plot = image(
            source=source,
            image="image",
            x="x",
            y="y",
            dw="dw",
            dh="dh",
            plot_width=600,
            plot_height=400,
            x_range=x_range,
            y_range=y_range,
            palette="palette",
            tools="pan,wheel_zoom,box_zoom,reset,previewsave",
            title="xy slice"
        )
        vert_plot = image(
            source=vert_source,
            image="image",
            x="x",
            y="y",
            dw="dw",
            dh="dh",
            plot_width=300,
            plot_height=400,
            palette="palette",
            x_range=z_range,
            y_range=y_range,
            tools="pan",
            title="zy slice"
        )
        horiz_plot = image(
            source=horiz_source,
            image="image",
            x="x",
            y="y",
            dw="dw",
            dh="dh",
            plot_width=600,
            plot_height=300,
            palette="palette",
            x_range=x_range,
            y_range=z_range,
            tools="pan",
            title="xz slice"
        )
        volume_slicer.server_data_source = source
        volume_slicer.vert_source = vert_source
        volume_slicer.horiz_source = horiz_source
        volume_slicer.main_plot = main_plot
        volume_slicer.vert_plot = vert_plot
        volume_slicer.horiz_plot = horiz_plot
        volume_slicer.shape = shape
        return volume_slicer

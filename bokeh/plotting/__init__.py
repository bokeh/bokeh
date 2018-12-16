# this is just for testing, otherwise the figure module is shadowed
# by the figure function and inacessible
from . import figure as _figure

# extra imports -- just things to add to 'from bokeh.plotting import'
from ..document import Document; Document

from ..models import ColumnDataSource; ColumnDataSource
from ..models.layouts import Row, Column; Row, Column

from ..io import curdoc; curdoc
from ..io import output_file; output_file
from ..io import output_notebook; output_notebook
from ..io import reset_output; reset_output
from ..io import save; save
from ..io import show; show
from ..layouts import gridplot, GridSpec; gridplot, GridSpec

from .figure import Figure; Figure
from .figure import figure; figure
from .figure import markers; markers
from .figure import DEFAULT_TOOLS; DEFAULT_TOOLS

from .gmap import GMap; GMap
from .gmap import gmap; gmap

""" Collection of core plotting objects, which can be represented in the
Javascript layer.  The object graph formed by composing the objects in
this module can be stored as a backbone.js model graph, and stored in a
plot server or serialized into JS for embedding in HTML or an IPython
notebook.
"""
import os
from uuid import uuid4
from functools import wraps
import urlparse
import warnings
import logging
logger = logging.getLogger(__file__)

from bokeh.properties import (HasProps, MetaHasProps, Any, Dict, Enum,
        Either, Float, Instance, Int, List, String, Color, Pattern, Percent,
        Size, LineProps, FillProps, TextProps, Include)

class Viewable(MetaHasProps):
    """ Any plot object (Data Model) which has its own View Model in the
    persistence layer.

    Adds handling of a __view_model__ attribute to the class (which is
    provided by default) which tells the View layer what View class to
    create.

    One thing to keep in mind is that a Viewable should have a single
    unique representation in the persistence layer, but it might have
    multiple concurrent client-side Views looking at it.  Those may
    be from different machines altogether.
    """

    # Stores a mapping from subclass __view_model__ names to classes
    model_class_reverse_map = {}

    # Mmmm.. metaclass inheritance.  On the one hand, it seems a little
    # overkill. On the other hand, this is exactly the sort of thing
    # it's meant for.
    def __new__(cls, class_name, bases, class_dict):
        if "__view_model__" not in class_dict:
            class_dict["__view_model__"] = class_name
        class_dict["get_class"] = Viewable.get_class

        # Create the new class
        newcls = super(Viewable,cls).__new__(cls, class_name, bases, class_dict)
        entry = class_dict["__view_model__"]
        # Add it to the reverse map, but check for duplicates first
        if entry in Viewable.model_class_reverse_map:
            raise Warning("Duplicate __view_model__ declaration of '%s' for " \
                          "class %s.  Previous definition: %s" % \
                          (entry, class_name,
                           Viewable.model_class_reverse_map[entry]))
        Viewable.model_class_reverse_map[entry] = newcls
        return newcls

    @classmethod
    def get_class(cls, view_model_name):
        """ Given a __view_model__ name, returns the corresponding class
        object
        """
        d = Viewable.model_class_reverse_map
        if view_model_name in d:
            return d[view_model_name]
        else:
            raise KeyError("View model name '%s' not found" % view_model_name)

def usesession(meth):
    """ Checks for 'session' in kwargs and in **self**, and guarantees
    that **kw always has a valid 'session' parameter.  Wrapped methods
    should define 'session' as an optional argument, and in the body of
    the method, should expect an
    """
    @wraps(meth)
    def wrapper(self, *args, **kw):
        session = kw.get("session", None)
        if session is None:
            session = getattr(self, "session")
        if session is None:
            raise RuntimeError("Call to %s needs a session" % meth.__name__)
        kw["session"] = session
        return meth(self, *args, **kw)
    return wrapper

def is_ref(frag):
    return isinstance(frag, dict) and \
           frag.get('type') and \
           frag.get('id')

def json_apply(fragment, check_func, func):
    """recursively searches through a nested dict/lists
    if check_func(fragment) is True, then we return
    func(fragment)
    """
    if check_func(fragment):
        return func(fragment)
    elif isinstance(fragment, list):
        output = []
        for val in fragment:
            output.append(json_apply(val, check_func, func))
        return output
    elif isinstance(fragment, dict):
        output = {}
        for k, val in fragment.iteritems():
            output[k] = json_apply(val, check_func, func)
        return output
    else:
        return fragment

def resolve_json(fragment, models):
    check_func = is_ref
    def func(fragment):
        if fragment['id'] in models:
            return models[fragment['id']]
        else:
            logging.error("model not found for %s", fragment)
            return None
    return json_apply(fragment, check_func, func)

def traverse_plot_object(plot_object):
    """iterate through an objects properties
    if it has_ref, json_apply through it and accumulate
    all PlotObjects into children.  return all objects found
    """
    children = set()
    def check_func(fragment):
        return isinstance(fragment, PlotObject)
    def func(obj):
        children.add(obj)
        return obj
    for prop in plot_object.properties_with_refs():
        val = getattr(plot_object, prop)
        json_apply(val, check_func, func)
    return children

def recursively_traverse_plot_object(plot_object,
                                     traversed_ids=None,
                                     children=None):
    if not children: children = set()
    if not traversed_ids: traversed_ids = set()
    if plot_object._id in traversed_ids:
        return children
    else:
        immediate_children = plot_object.references()
        children.add(plot_object)
        traversed_ids.add(plot_object._id)
        children.update(immediate_children)
        for child in list(children):
            if child not in traversed_ids:
                recursively_traverse_plot_object(
                    child,
                    traversed_ids=traversed_ids,
                    children=children)
        return children

class PlotObject(HasProps):
    """ Base class for all plot-related objects """

    __metaclass__ = Viewable

    session = Instance   # bokeh.session.Session

    def __init__(self, *args, **kwargs):
        # Eventually should use our own memo instead of storing
        # an attribute on the class
        if "id" in kwargs:
            self._id = kwargs.pop("id")
        else:
            self._id = str(uuid4())
        self._dirty = True
        self._callbacks_dirty = False
        self._callbacks = {}
        self._callback_queue = []
        self._block_callbacks = False
        if '_block_events'  not in kwargs:
            super(PlotObject, self).__init__(*args, **kwargs)
            self.setup_events()
        else:
            self._block_callbacks = True
            super(PlotObject, self).__init__(*args, **kwargs)

    def setup_events(self):
        pass

    @classmethod
    def load_json(cls, attrs, instance=None):
        """Loads all json into a instance of cls, EXCEPT any references
        which are handled in finalize
        """
        if 'id' not in attrs:
            raise RuntimeError("Unable to find 'id' attribute in JSON: %r" % attrs)
        _id = attrs.pop('id')

        if not instance:
            instance = cls(id=_id, _block_events=True)

        ref_props = {}
        for p in instance.properties_with_refs():
            if p in attrs:
                ref_props[p] = attrs.pop(p)
        instance._ref_props = ref_props
        instance.update(**attrs)
        return instance

    def finalize(self, models):
        """Convert any references into instances
        models is a dict of id->model mappings
        """
        if hasattr(self, "_ref_props"):
            props = resolve_json(self._ref_props, models)
            self.update(**props)
        self.setup_events()

    def references(self):
        """Returns all PlotObjects that this object has references to
        """
        return traverse_plot_object(self)

    #---------------------------------------------------------------------
    # View Model connection methods
    #
    # Whereas a rich client rendering framework can maintain view state
    # alongside model state, we need an explicit send/receive protocol for
    # communicating with a set of view models that reside on the front end.
    # Many of the calls one would expect in a rich client map instead to
    # batched updates on the M-VM-V approach.
    #---------------------------------------------------------------------
    def vm_props(self, withvalues=False):
        """ Returns the ViewModel-related properties of this object.  If
        **withvalues** is True, then returns attributes with values as a
        dict.  Otherwise, returns a list of attribute names.
        """
        props = self.changed_vars()
        if "session" in props:
            props.remove("session")
        if withvalues:
            return dict((k,getattr(self,k)) for k in props)
        else:
            return props

    def old_vm_props(self, withvalues=False):
        """ Returns the ViewModel-related properties of this object.  If
        **withvalues** is True, then returns attributes with values as a
        dict.  Otherwise, returns a list of attribute names.
        """
        props = set(self.properties())
        if "session" in props:
            props.remove("session")
        if withvalues:
            return dict((k,getattr(self,k)) for k in props)
        else:
            return props

    def vm_serialize(self):
        """ Returns a dictionary of the attributes of this object, in
        a layout corresponding to what BokehJS expects at unmarshalling time.
        """
        attrs = self.vm_props(withvalues=True)
        attrs['id'] = self._id
        return attrs

    def update(self, **kwargs):
        for k,v in kwargs.iteritems():
            setattr(self, k, v)

    @usesession
    def pull(self, session=None, ref=None):
        """ Pulls information from the given session and ref id into this
        object.  If no session is provided, then uses self.session.
        If no ref is given, uses self._id.
        """
        # Read session values into a new dict, and fill those into self
        newattrs = session.load(ref, asdict=True)
        # Loop over attributes and call setattr() instead of doing a bulk
        # self.__dict__.update because some attributes may be properties.
        self.update(newattrs["attributes"])

    @usesession
    def push(self, session=None):
        """ Pushes the update values from this object into the given
        session (or self.session, if none is provided).
        """
        session.store(self)

    def __str__(self):
        return "%s, ViewModel:%s, ref _id: %s" % (self.__class__.__name__,
                self.__view_model__, getattr(self, "_id", None))

    def on_change(self, attrname, obj, callbackname):
        """when attrname of self changes, call callbackname
        on obj
        """
        callbacks = self._callbacks.setdefault(attrname, [])
        callback = dict(obj=obj,
                        callbackname=callbackname)
        if callback not in callbacks:
            callbacks.append(callback)
        self._callbacks_dirty = True

    def _trigger(self, attrname, old, new):
        """attrname of self changed.  So call all callbacks
        """
        callbacks = self._callbacks.get(attrname)
        if callbacks:
            for callback in callbacks:
                getattr(callback['obj'], callback['callbackname'])(
                    self, attrname, old, new)


    def create_html_snippet(
            self, server=False, embed_base_url="", embed_save_loc=".",
            static_path="http://localhost:5006/bokeh/static/"):
        """create_html_snippet is used to embed a plot in an html page.

        create_html_snippet returns the embed string to be put in html.
        This will be a <script> tag.

        To embed a plot dependent on the Bokeh Plot Server, set server=True,
        otherwise a file with the data for the plot will be built.

        embed_base_url is used for non-server embedding.  This is used
        as the root of the url where the embed.js file will be saved.

        embed_save_loc controls where the embed.js will be actually written to.

        static_path controls where the embed snippet looks to find
        bokeh.js and the other resources it needs for bokeh.
        """
        if server:
            if embed_base_url == "":
                embed_base_url = False
            return self._build_server_snippet(embed_base_url)[1]
        embed_filename = "%s.embed.js" % self._id
        full_embed_save_loc = os.path.join(embed_save_loc, embed_filename)
        js_code, embed_snippet = self._build_static_embed_snippet(
            static_path, embed_base_url)
        with open(full_embed_save_loc,"w") as f:
            f.write(js_code)
        return embed_snippet

    def inject_snippet(
            self, server=False, embed_base_url="", embed_save_loc=".",
            static_path="http://localhost:5006/bokeh/static/"):
        warnings.warn("inject_snippet is deprecated, please use create_html_snippet")
        return self.create_html_snippet(
            server, embed_base_url, embed_save_loc, static_path)

    def _build_server_snippet(self, base_url=False):
        sess = self._session
        modelid = self._id
        typename = self.__view_model__
        if not base_url:
            base_url = sess.root_url
        split = urlparse.urlsplit(base_url)
        if split.scheme == 'http':
            ws_conn_string = "ws://%s/bokeh/sub" % split.netloc
        else:
            ws_conn_string = "wss://%s/bokeh/sub" % split.netloc

        f_dict = dict(
            docid = sess.docid,
            ws_conn_string = ws_conn_string,
            docapikey = sess.apikey,
            root_url = base_url,
            modelid = modelid,
            modeltype = typename,
            script_url = base_url + "/bokeh/embed.js")
        e_str = '''<script src="%(script_url)s" bokeh_plottype="serverconn"
        bokeh_docid="%(docid)s" bokeh_ws_conn_string="%(ws_conn_string)s"
        bokeh_docapikey="%(docapikey)s" bokeh_root_url="%(root_url)s"
        bokeh_modelid="%(modelid)s" bokeh_modeltype="%(modeltype)s" async="true"></script>
        '''
        return "", e_str % f_dict

    def _build_static_embed_snippet(self, static_path, embed_base_url):


        embed_filename = "%s.embed.js" % self._id
        full_embed_path = embed_base_url + embed_filename

        js_str = self._session.embed_js(self._id, static_path)


        sess = self._session
        modelid = self._id
        typename = self.__view_model__
        embed_filename = full_embed_path
        f_dict = dict(modelid = modelid, modeltype = typename,
                      embed_filename=embed_filename)
        e_str = '''<script src="%(embed_filename)s" bokeh_plottype="embeddata"
        bokeh_modelid="%(modelid)s" bokeh_modeltype="%(modeltype)s" async="true"></script>
        '''
        return js_str, e_str % f_dict



class DataSource(PlotObject):
    """ Base class for data sources """
    # List of names of the fields of each tuple in self.data
    # ordering is incoporated here
    column_names = List()
    selected = List() #index of selected points
    def columns(self, *columns):
        """ Returns a ColumnsRef object that points to a column or set of
        columns on this data source
        """
        return ColumnsRef(source=self, columns=list(columns))

class ColumnsRef(HasProps):
    source = Instance(DataSource, has_ref=True)
    columns = List(String)

class ColumnDataSource(DataSource):
    # Maps names of columns to sequences or arrays
    data = Dict()

    # Maps field/column name to a DataRange or FactorRange object. If the
    # field is not in the dict, then a range is created automatically.
    cont_ranges = Dict()
    discrete_ranges = Dict()

    def __init__(self, *args, **kw):
        """ Modify the basic DataSource/PlotObj constructor so that if we
        are called with a single argument that is a dict, then we treat
        that implicitly as our "data" attribute.
        """
        if len(args) == 1 and "data" not in kw:
            kw["data"] = args[0]
        for name, data in kw.get("data", {}).items():
            self.add(data, name)
        super(ColumnDataSource, self).__init__(**kw)

    def add(self, data, name=None):
        """ Appends the data to the list of columns.  Returns the name
        that was inserted.
        """
        if name is None:
            n = len(self.data)
            while "Series %d"%n in self.data:
                n += 1
            name = "Series %d"%n
        self.column_names.append(name)
        self.data[name] = data
        return name

    def remove(self, name):
        try:
            self.column_names.remove(name)
            del self.data[name]
        except (ValueError, KeyError):
            warnings.warn("Unable to find column '%s' in datasource" % name)


class ObjectArrayDataSource(DataSource):
    # List of tuples of values
    data = List()

    # Maps field/column name to a DataRange or FactorRange object. If the
    # field is not in the dict, then a range is created automatically.
    cont_ranges = Dict()
    discrete_ranges = Dict()

class PandasDataSource(DataSource):
    """ Represents serverside data.  This gets stored into the plot server's
    database, but it does not have any client side representation.  Instead,
    a PandasPlotSource needs to be created and pointed at it.
    """

    data = Dict()

class Range1d(PlotObject):
    start = Float()
    end = Float()

class DataRange(PlotObject):
    sources = List(ColumnsRef, has_ref=True)
    def vm_serialize(self):
        props = self.vm_props(withvalues=True)
        props['id'] = self._id
        sources = props.pop("sources")
        props["sources"] = [{"ref":cr.source, "columns":cr.columns} for cr in sources]
        return props

    def finalize(self, models):
        super(DataRange, self).finalize(models)
        for idx, source in enumerate(self.sources):
            if isinstance(source, dict):
                self.sources[idx] = ColumnsRef(
                    source=source['ref'],
                    columns=source['columns'])

    def references(self):
        return [x.source for x in self.sources]

class DataRange1d(DataRange):
    """ Represents a range in a scalar dimension """
    sources = List(ColumnsRef, has_ref=True)
    rangepadding = Float(0.1)
    start = Float
    end = Float


class FactorRange(DataRange):
    """ Represents a range in a categorical dimension """
    sources = List(ColumnsRef, has_ref=True)
    values = List
    columns = List

class Glyph(PlotObject):

    data_source = Instance(DataSource, has_ref=True)
    xdata_range = Instance(DataRange1d, has_ref=True)
    ydata_range = Instance(DataRange1d, has_ref=True)

    # How to intepret the values in the data_source
    units = Enum("screen", "data")

    # Instance of bokeh.glyphs.Glyph; not declaring it explicitly below
    # because of circular imports. The renderers should get moved out
    # into another module...
    glyph = Instance()
    # glyph used when data is unselected.  optional
    nonselection_glyph = Instance()
    # glyph used when data is selected.  optional
    selection_glyph = Instance()

    def vm_serialize(self):
        # Glyphs need to serialize their state a little differently,
        # because the internal glyph instance is turned into a glyphspec
        data =  {"id" : self._id,
                 "data_source": self.data_source,
                 "xdata_range": self.xdata_range,
                 "ydata_range": self.ydata_range,
                 "glyphspec": self.glyph.to_glyphspec()
                 }
        if self.selection_glyph:
            data['selection_glyphspec'] = self.selection_glyph.to_glyphspec()
        if self.nonselection_glyph:
            data['nonselection_glyphspec'] = self.nonselection_glyph.to_glyphspec()
        return data

    def finalize(self, models):
        super(Glyph, self).finalize(models)
        ## FIXME: we shouldn't have to do this i think..
        if hasattr(self, 'glyphspec'):
            glyphspec = self.glyphspec
            del self.glyphspec
            self.glyph = PlotObject.get_class(glyphspec['type'])(**glyphspec)
        else:
            self.glyph = None
        if hasattr(self, 'selection_glyphspec'):
            selection_glyphspec = self.selection_glyphspec
            del self.selection_glyphspec
            temp = PlotObject.get_class(selection_glyphspec['type'])
            self.selection_glyph = temp(**selection_glyphspec)

        else:
            self.selection_glyph = None
        if hasattr(self, 'nonselection_glyphspec'):
            nonselection_glyphspec = self.nonselection_glyphspec
            del self.nonselection_glyphspec
            temp = PlotObject.get_class(nonselection_glyphspec['type'])
            self.nonselection_glyph = temp(**nonselection_glyphspec)

        else:
            self.nonselection_glyph = None



class Plot(PlotObject):

    data_sources = List
    title = String("Bokeh Plot")

    x_range = Instance(DataRange1d, has_ref=True)
    y_range = Instance(DataRange1d, has_ref=True)
    png = String('')
    title = String('')
    outline_props = Include(LineProps, prefix="outline")

    # We shouldn't need to create mappers manually on the Python side
    #xmapper = Instance(LinearMapper)
    #ymapper = Instance(LinearMapper)
    #mapper = Instance(GridMapper)

    # A list of all renderers on this plot; this includes guides as well
    # as glyph renderers
    renderers = List(has_ref=True)
    tools = List(has_ref=True)

    # TODO: These don't appear in the CS source, but are created by mpl.py, so
    # I'm leaving them here for initial compatibility testing.
    axes = List(has_ref=True)

    # TODO: How do we want to handle syncing of the different layers?
    # image = List
    # underlay = List
    # glyph = List
    #
    # annotation = List

    height = Int(600)
    width = Int(600)

    background_fill = Color("white")
    border_fill = Color("white")
    canvas_width = Int(400)
    canvas_height = Int(400)
    outer_width = Int(400)
    outer_height = Int(400)
    min_border_top = Int(50)
    min_border_bottom = Int(50)
    min_border_left = Int(50)
    min_border_right = Int(50)
    min_border = Int(50)
    script_inject_snippet = String("")


    def _get_script_inject_snippet(self):
        from session import HTMLFileSession
        if isinstance(self._session, HTMLFileSession):
            self.script_inject_snippet
            return ""
        else:
            return self.create_html_snippet(server=True)

    def vm_props(self, *args, **kw):
        # FIXME: We need to duplicate the height and width into canvas and
        # outer height/width.  This is a quick fix for the gorpiness, but this
        # needs to be fixed more structurally on the JS side, and then this
        # should be revisited on the Python side.
        if hasattr(self.session, "root_url"):
            self.script_inject_snippet = self.create_html_snippet(server=True)
        if "canvas_width" not in self._changed_vars:
            self.canvas_width = self.width
        if "outer_width" not in self._changed_vars:
            self.outer_width = self.width
        if "canvas_height" not in self._changed_vars:
            self.canvas_height = self.height
        if "outer_height" not in self._changed_vars:
            self.outer_height = self.height
        return super(Plot, self).vm_props(*args, **kw)

class GMapPlot(PlotObject):

    center_lat = Float
    center_lng = Float
    zoom_level = Int(12)

    data_sources = List
    title = String("Bokeh Plot")

    png = String('')
    title = String('')

    # A list of all renderers on this plot; this includes guides as well
    # as glyph renderers
    renderers = List(has_ref=True)
    tools = List(has_ref=True)

    # TODO: These don't appear in the CS source, but are created by mpl.py, so
    # I'm leaving them here for initial compatibility testing.
    axes = List(has_ref=True)
    x_range = Instance(Range1d, has_ref=True)
    y_range = Instance(Range1d, has_ref=True)

    # TODO: How do we want to handle syncing of the different layers?
    # image = List
    # underlay = List
    # glyph = List
    #
    # annotation = List

    height = Int(800)
    width = Int(800)

    border_fill = Color("white")
    border_symmetry = String("h")
    canvas_width = Int(800)
    canvas_height = Int(800)
    outer_width = Int(800)
    outer_height = Int(800)
    min_border_top = Int(50)
    min_border_bottom = Int(50)
    min_border_left = Int(50)
    min_border_right = Int(50)
    min_border = Int(50)

    def vm_serialize(self):
        # Glyphs need to serialize their state a little differently,
        # because the internal glyph instance is turned into a glyphspec
        data = super(GMapPlot, self).vm_serialize()
        data.pop('center_lat', None)
        data.pop('center_lng', None)
        data.pop('zoom_level', None)
        data["map_options"] = {
            'lat': self.center_lat,
            'lng': self.center_lng,
            'zoom': self.zoom_level
        }
        self._session.raw_js_snippets(self)
        return data

    @classmethod
    def load_json(cls, attrs, instance=None):
        """Loads all json into a instance of cls, EXCEPT any references
        which are handled in finalize
        """
        inst = super(GMapPlot, cls).load_json(attrs, instance=instance)
        if hasattr(inst, 'map_options'):
            mo = inst.map_options
            del inst.map_options
            inst.center_lat = mo['lat']
            inst.center_lng = mo['lng']
            inst.zoom_level = mo['zoom']
        return inst

    def get_raw_js(self):
        return '<script src="https://maps.googleapis.com/maps/api/js?sensor=false"></script>'

    def vm_props(self, *args, **kw):
        # FIXME: We need to duplicate the height and width into canvas and
        # outer height/width.  This is a quick fix for the gorpiness, but this
        # needs to be fixed more structurally on the JS side, and then this
        # should be revisited on the Python side.
        if "canvas_width" not in self._changed_vars:
            self.canvas_width = self.width
        if "outer_width" not in self._changed_vars:
            self.outer_width = self.width
        if "canvas_height" not in self._changed_vars:
            self.canvas_height = self.height
        if "outer_height" not in self._changed_vars:
            self.outer_height = self.height
        return super(GMapPlot, self).vm_props(*args, **kw)

class GridPlot(Plot):
    """ A 2D grid of plots """

    children = List(List(has_ref=True), has_ref=True)
    border_space = Int(0)

class GuideRenderer(PlotObject):
    plot = Instance

    def __init__(self, **kwargs):
        super(GuideRenderer, self).__init__(**kwargs)
        if self.plot is not None:
            if self not in self.plot.renderers:
                self.plot.renderers.append(self)

class LinearAxis(GuideRenderer):
    type = String("linear_axis")

    dimension = Int(0)
    location = Either(String('min'), Float)
    bounds = String('auto')

    axis_label = String
    axis_label_standoff = Int
    axis_label_props = Include(TextProps, prefix="axis_label")

    major_label_standoff = Int
    major_label_orientation = Either(Enum("horizontal", "vertical"), Int)
    major_label_props = Include(TextProps, prefix="major_label")

    # Line props
    axis_props = Include(LineProps, prefix="axis")
    tick_props = Include(LineProps, prefix="major_tick")

    major_tick_in = Int
    major_tick_out = Int

class DatetimeAxis(LinearAxis):
    type = String("datetime_axis")
    axis_label = String("date")
    scale = String("time")
    num_labels = Int(8)
    char_width = Int(10)
    fill_ratio = Float(0.3)
    formats = Dict({"days": ["%m/%d/%Y"]})

class Grid(GuideRenderer):
    """ 1D Grid component """
    type = String("grid")

    dimension = Int(0)
    bounds = String('auto')

    # Line props
    grid_props = Include(LineProps, prefix="grid")

class PanTool(PlotObject):
    plot = Instance(Plot, has_ref=True)
    dimensions = List   # valid values: "x", "y"
    dataranges = List(has_ref=True)

class ZoomTool(PlotObject):
    plot = Instance(Plot)
    dimensions = List   # valid values: "x", "y"
    dataranges = List(has_ref=True)

class PreviewSaveTool(PlotObject):
    plot = Instance(Plot)
    dimensions = List   # valid values: "x", "y"
    dataranges = List(has_ref=True)

class EmbedTool(PlotObject):
    plot = Instance(Plot)
    dimensions = List   # valid values: "x", "y"
    dataranges = List(has_ref=True)

class ResizeTool(PlotObject):
    plot = Instance(Plot)

class BoxSelectTool(PlotObject):
    renderers = List(has_ref=True)

class BoxSelectionOverlay(PlotObject):
    __view_model__ = 'BoxSelection'
    tool = Instance(has_ref=True)

class Legend(PlotObject):
    plot = Instance(Plot, has_ref=True)
    legends = Dict()

class DataSlider(PlotObject):
    plot = Instance(Plot, has_ref=True)
    data_source = Instance(has_ref=True)
    field = String()

class DataRangeBoxSelectTool(PlotObject):
    plot = Instance(Plot, has_ref=True)
    xselect = List()
    yselect = List()


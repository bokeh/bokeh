import numpy as np
import logging
import urlparse
import requests
import uuid
import bbmodel
import protocol
import data
import os
import dump
import json
import pandas
from exceptions import DataIntegrityException

from bokeh import protocol
from bokeh.utils import get_json

log = logging.getLogger(__name__)
colors = [
      "#1f77b4",
      "#ff7f0e", "#ffbb78",
      "#2ca02c", "#98df8a",
      "#d62728", "#ff9896",
      "#9467bd", "#c5b0d5",
      "#8c564b", "#c49c94",
      "#e377c2", "#f7b6d2",
      "#7f7f7f",
      "#bcbd22", "#dbdb8d",
      "#17becf", "#9edae5"
    ]


def script_inject(plotclient, modelid, typename):
    pc = plotclient
    f_dict = dict(
        docid = pc.docid,
        ws_conn_string = pc.ws_conn_string,
        docapikey = pc.apikey,
        root_url = pc.root_url,
        modelid = modelid,
        modeltype = typename,
        script_url = pc.root_url + "/bokeh/embed.js")
    e_str = '''<script src="%(script_url)s" bokeh_plottype="serverconn"
bokeh_docid="%(docid)s" bokeh_ws_conn_string="%(ws_conn_string)s"
bokeh_docapikey="%(docapikey)s" bokeh_root_url="%(root_url)s"
bokeh_modelid="%(modelid)s" bokeh_modeltype="%(modeltype)s" async="true"></script>        
        '''
    return e_str % f_dict

def script_inject_escaped(plotclient, modelid, typename):
    pc = plotclient
    f_dict = dict(
        docid = pc.docid,
        ws_conn_string = pc.ws_conn_string,
        docapikey = pc.apikey,
        root_url = pc.root_url,
        modelid = modelid,
        modeltype = typename,
        script_url = pc.root_url + "/bokeh/embed.js")

    e_str = '''&lt; script src="%(script_url)s" bokeh_plottype="serverconn"
bokeh_docid="%(docid)s" bokeh_ws_conn_string="%(ws_conn_string)s"
bokeh_docapikey="%(docapikey)s" bokeh_root_url="%(root_url)s"
    bokeh_modelid="%(modelid)s" bokeh_modeltype="%(modeltype)s" async="true"&gt; &lt;/script&gt;
        '''
    return e_str % f_dict


class BokehMPLBase(object):
    def __init__(self, *args, **kwargs):
        if 'plotclient' in kwargs:
            self.plotclient = kwargs['plotclient']

    def update(self):
        if self.plotclient.bbclient:
            self.plotclient.bbclient.upsert_all(self.allmodels())


    @property
    def foo(self):
        return "bar"

    def _repr_html_(self):
        html = self.plotclient.make_html(
            self.allmodels(),
            model=getattr(self, self.topmodel),
            template="basediv.html",
            script_paths=[],
            css_paths=[]
            )
        html = html.encode('utf-8')
        return html

    def script_inject(self):
        return script_inject(
            self.plotclient, self.plotmodel.id, self.plotmodel.typename)

    def htmldump(self, path=None):
        """ If **path** is provided, then writes output to a file,
        else returns the output as a string.
        """
        html = self.plotclient.make_html(self.allmodels(),
                                         model=getattr(self, self.topmodel),
                                         template="bokeh.html"
                                         )
        if path:
            with open(path, "w+") as f:
                f.write(html.encode("utf-8"))
        else:
            return html.encode("utf-8")

class PandasTable(BokehMPLBase):
    topmodel = 'pivotmodel'
    def __init__(self, pivotmodel, plotclient=None):
        super(PandasTable, self).__init__(pivotmodel, plotclient=plotclient)
        self.pivotmodel = pivotmodel
        if hasattr(self.pivotmodel, 'pandassource'):
            self.pandassource = self.pivotmodel.pandassource

    def groupby(self, columns):
        self.pivotmodel.set('groups', columns)
        self.plotclient.bbclient.update(self.pivotmodel)

    def agg(self, agg):
        self.pivotmodel.set('agg', agg)
        self.plotclient.bbclient.update(self.pivotmodel)

    def sort(self, sort=None, direction=None):
        if sort is None:
            sort = []
        elif isinstance(sort, basestring):
            if direction is None: direction = True
            sort = [{'column' : sort, 'direction' : direction}]
        else:
            if direction is None: direction = [True for x in sort]
            sort = [{'column' : s, 'direction' : d} for
                    s, d in zip(sort, direction)]
        self.pivotmodel.set('sort', sort)
        self.plotclient.bbclient.update(self.pivotmodel)

    def paginate(self, offset, length):
        self.pivotmodel.set('offset', offset)
        self.pivotmodel.set('length', length)
        self.plotclient.bbclient.update(self.pivotmodel)

    def data(self):
        self.pivotmodel.pull()
        return self.pivotmodel.get_data()

    def allmodels(self):
        models = [self.pivotmodel, self.pivotmodel.pandassource]
        return models


class GridPlot(BokehMPLBase):
    topmodel = 'gridmodel'
    def __init__(self, container, children, title, plotclient=None):
        self.gridmodel = container
        self.children = children
        self.title = title
        super(GridPlot, self).__init__(container, children, title,
                                       plotclient=plotclient)

    def allmodels(self):
        models = [self.gridmodel]
        for row in self.children:
            for plot in row:
                models.extend(plot.allmodels())
        return models


class XYPlot(BokehMPLBase):
    topmodel = 'plotmodel'
    def __init__(self, plot, xdata_range, ydata_range,
                 xaxis, yaxis, pantool, zoomtool, selectiontool, embedtool,
                 selectionoverlay, parent, plotclient=None):
        super(XYPlot, self).__init__(
            plot, xdata_range, ydata_range, xaxis, yaxis,
            pantool, zoomtool, selectiontool, selectionoverlay, parent,
            plotclient=plotclient)
        self.plotmodel = plot
        self.xdata_range = xdata_range
        self.ydata_range = ydata_range
        self.pantool = pantool
        self.zoomtool = zoomtool
        self.selectiontool = selectiontool
        self.embedtool = embedtool
        self.selectionoverlay = selectionoverlay
        self.xaxis = xaxis
        self.yaxis = yaxis
        self.parent = parent
        self.last_source = None
        self.color_index = 0
        self.renderers = []
        self.data_sources = []
        self.update()

    def allmodels(self):
        models =  [self.plotmodel,
                   self.xdata_range,
                   self.ydata_range,
                   self.pantool,
                   self.zoomtool,
                   self.selectiontool,
                   self.embedtool,
                   self.selectionoverlay,
                   self.xaxis,
                   self.yaxis]
        models += self.renderers
        models += self.data_sources
        for source in self.data_sources:
            if hasattr(source, 'typename') and \
                    source.typename == 'PandasPlotSource' and \
                    hasattr(self, 'pandassource'):
                models.append(source.pandassource)
        return models

    def scatter(self, *args, **kwargs):
        kwargs['scatter'] = True
        return self.plot(*args, **kwargs)

    def plot(self, x, y=None, color=None, data_source=None,
             scatter=False):
        if data_source and (data_source.typename == 'PandasDataSource'):
            if self.plotclient.plot_sources.get(data_source.id):
                data_source = self.plotclient.plot_sources.get(data_source.id)
            else:
                plotsource = self.plotclient.model(
                    'PandasPlotSource', pandassourceobj=data_source)
                self.plotclient.plot_sources[data_source.id] = plotsource
                plotsource.update()
                data_source = plotsource
        def source_from_array(x, y):
            if y.ndim == 1:
                source = self.plotclient.make_source(x=x, y=y)
                xfield = 'x'
                yfields = ['y']
            elif y.ndim == 2:
                kwargs = {}
                kwargs['x'] = x
                colnames = []
                for colnum in range(y.shape[1]):
                    colname = 'y' + str(colnum)
                    kwargs[colname] = y[:,colnum]
                    colnames.append(colname)
                source = self.plotclient.make_source(**kwargs)
                xfield = 'x'
                yfields = colnames
            else:
                raise Exception, "too many dims"
            return source, xfield, yfields
        if not isinstance(x, basestring):
            if y is None:
                y = x
                x = range(len(y))
                if isinstance(y, np.ndarray):
                    source, xfield, yfields = source_from_array(x, y)
                else:
                    source = self.plotclient.make_source(x=x, y=y)
                    xfield, yfields = ('x', ['y'])
            else:
                if isinstance(y, np.ndarray):
                    source, xfield, yfields = source_from_array(x, y)
                else:
                    source = self.plotclient.make_source(x=x, y=y)
                    xfield, yfields = ('x', ['y'])
        else:
            xfield = x
            if y is None:
                raise Exception, 'must specify X and Y when calling with strings'
            yfields = [y]
            if data_source:
                source = data_source
            else:
                source = self.last_source
        self.last_source = source
        for yfield in yfields:
            if color is None:
                use_color = colors[self.color_index % len(colors)]
            else:
                use_color = color
            self.color_index += 1
            self.scatter(xfield, yfield, source, use_color)
            if not scatter:
                self.line(xfield, yfield, source, use_color)

    def ensure_source_exists(self, sourcerefs, source, columns):
        sources = [x for x in sourcerefs if x['ref']['id'] == source.get('id')]
        existed = True
        if len(sources) == 0:
            sourcerefs.append({'ref' : source.ref(), 'columns' : columns})
            existed = False
        else:
            for col in columns:
                if col not in sources[0]['columns']:
                    sources[0]['columns'].append(col)
                    existed = False
        return existed

    def scatter(self, x, y, data_source, color):
        update = []
        existed = self.ensure_source_exists(
            self.xdata_range.get('sources'),
            data_source, [x])
        if not existed : update.append(self.xdata_range)
        existed = self.ensure_source_exists(
            self.ydata_range.get('sources'),
            data_source, [y])
        if not existed : update.append(self.ydata_range)
        scatterrenderer = self.plotclient.model(
            'ScatterRenderer',
            foreground_color=color,
            data_source=data_source.ref(),
            xfield=x,
            yfield=y,
            xdata_range=self.xdata_range.ref(),
            ydata_range=self.ydata_range.ref(),
            parent=self.plotmodel.ref())
        self.renderers.append(scatterrenderer)
        if data_source not in self.data_sources:
            self.data_sources.append(data_source)
        self.plotmodel.get('renderers').append(scatterrenderer.ref())
        self.selectiontool.get('renderers').append(scatterrenderer.ref())
        update.append(scatterrenderer)
        update.append(self.plotmodel)
        update.append(self.selectiontool)
        update.append(self.embedtool)
        update.append(self.selectionoverlay)
        if self.plotclient.bbclient:
            self.plotclient.bbclient.upsert_all(update)
        self.plotclient.show(self.plotmodel)

    def line(self, x, y, data_source, color):
        update = []
        existed = self.ensure_source_exists(
            self.xdata_range.get('sources'),
            data_source, [x])
        if not existed : update.append(self.xdata_range)
        existed = self.ensure_source_exists(
            self.ydata_range.get('sources'),
            data_source, [y])
        if not existed : update.append(self.ydata_range)
        linerenderer = self.plotclient.model(
            'LineRenderer',
            foreground_color=color,
            data_source=data_source.ref(),
            xfield=x,
            yfield=y,
            xdata_range=self.xdata_range.ref(),
            ydata_range=self.ydata_range.ref(),
            parent=self.plotmodel.ref())
        self.renderers.append(linerenderer)
        if data_source not in self.data_sources:
            self.data_sources.append(data_source)
        self.plotmodel.get('renderers').append(linerenderer.ref())
        update.append(linerenderer)
        update.append(self.plotmodel)
        update.append(self.selectiontool)
        update.append(self.embedtool)
        update.append(self.selectionoverlay)
        if self.plotclient.bbclient:
            self.plotclient.bbclient.upsert_all(update)
        self.plotclient.show(self.plotmodel)


class PlotClient(object):
    def __init__(self, username=None,
                 serverloc=None,
                 userapikey="nokey"):
        #the root url should be just protocol://domain
        self.username = username
        self.root_url = serverloc
        self.session = requests.session()
        self.session.headers.update({'content-type':'application/json'})
        self.session.headers.update({'BOKEHUSER-API-KEY' : userapikey})
        self.session.headers.update({'BOKEHUSER' : username})
        if self.root_url:
            self.update_userinfo()
        else:
            print 'Not using a server, plots will only work in embedded mode'
        self.docid = None
        self.models = {}
        self.clf()
        self._hold = True
        self.bbclient = None
        self.ic = self.model('PlotContext', children=[])

        # Caching pandas plot source so we can be smart about reusing them
        self.plot_sources = {}

    @property
    def ws_conn_string(self):
        split = urlparse.urlsplit(self.root_url)
        #how to fix this in bokeh and wakari?
        if split.scheme == 'http':
            return "ws://%s/bokeh/sub" % split.netloc
        else:
            return "wss://%s/bokeh/sub" % split.netloc
    def update_userinfo(self):
        url = urlparse.urljoin(self.root_url, '/bokeh/userinfo/')
        self.userinfo = get_json(self.session.get(url, verify=False))

    def load_doc(self, docid):
        url = urlparse.urljoin(self.root_url,"/bokeh/getdocapikey/%s" % docid)
        resp = self.session.get(url, verify=False)
        if resp.status_code == 401:
            raise Exception, 'unauthorized'
        apikey = get_json(resp)
        if 'apikey' in apikey:
            self.docid = docid
            self.apikey = apikey['apikey']
            print 'got read write apikey'
        else:
            self.docid = docid
            self.apikey = apikey['readonlyapikey']
            print 'got read only apikey'
        self.models = {}
        url = urlparse.urljoin(self.root_url, "/bokeh/bb/")
        self.bbclient = bbmodel.ContinuumModelsClient(
            docid, url, self.apikey)
        interactive_contexts = self.bbclient.fetch(
            typename='PlotContext')
        if len(interactive_contexts) > 1:
            print 'warning, multiple plot contexts here...'
        self.ic = interactive_contexts[0]

    def make_doc(self, title):
        url = urlparse.urljoin(self.root_url,"/bokeh/doc/")
        data = protocol.serialize_web({'title' : title})
        response = self.session.post(url, data=data, verify=False)
        if response.status_code == 409:
            raise DataIntegrityException
        self.userinfo = get_json(response)

    def remove_doc(self, title):
        matching = [x for x in self.userinfo['docs'] \
                    if x.get('title') == title]
        docid = matching[0]['docid']
        url = urlparse.urljoin(self.root_url,"/bokeh/doc/%s/" % docid)
        response = self.session.delete(url, verify=False)
        if response.status_code == 409:
            raise DataIntegrityException
        self.userinfo = get_json(response)

    def use_doc(self, name):
        self.docname = name
        docs = self.userinfo.get('docs')
        matching = [x for x in docs if x.get('title') == name]
        if len(matching) > 1:
            print 'warning, multiple documents with that title'
        if len(matching) == 0:
            print 'no documents found, creating new document'
            self.make_doc(name)
            return self.use_doc(name)
            docs = self.userinfo.get('docs')
            matching = [x for x in docs if x.get('title') == name]
        self.load_doc(matching[0]['docid'])

    def notebook_connect(self):
        import IPython.core.displaypub as displaypub
        js = get_template('connect.js').render(
            username=self.username,
            root_url = self.root_url,
            docid=self.docid,
            docapikey=self.apikey,
            ws_conn_string=self.ws_conn_string
            )
        msg = """ <p>Connection Information for this %s document, only share with people you trust </p> """  % self.docname
        html = self.html(
            script_paths=[],
            css_paths=[],
            js_snippets=[js],
            html_snippets=[msg],
            template="basediv.html"
            )
        displaypub.publish_display_data('bokeh', {'text/html': html})
        return None

    def notebooksources(self):
        import IPython.core.displaypub as displaypub        
        html = self.html(template="basediv.html",
                         script_paths = dump.notebookscript_paths,
                         html_snippets=["<p>Bokeh Sources</p>"])
        displaypub.publish_display_data('bokeh', {'text/html': html})
        return None

    def model(self, typename, **kwargs):
        if 'client' not in kwargs and self.bbclient:
            kwargs['client'] = self.bbclient
        model = bbmodel.make_model(typename, **kwargs)

        model.set('doc', self.docid)
        if hasattr(self, "apikey"):
            model.set('script_inject_escaped', script_inject_escaped(
                self, model.id, typename))
        self.models[model.id] = model
        return model

    def hold(self, val):
        if val == 'on':
            self._hold = True
        elif val == 'off':
            self._hold = False
        else:
            self._hold = val

    def make_source(self, *args, **kwargs):
        """call this with either kwargs of vectors, or a pandas dataframe
        """
        if len(args) > 0:
            df = args[0]
            model = self.model('PandasDataSource', df=df)
        else:
            output = data.make_source(**kwargs)
            model = self.model(
                'ObjectArrayDataSource',
                data=output
                )
        if self.bbclient:
            self.bbclient.create(model)
        return model
    def _newxyplot(self, title=None, width=300, height=300,
                   is_x_date=False, is_y_date=False,
                   container=None):
        """
        Parameters
        ----------
        x : string of fieldname in data_source, or 1d vector
        y : string of fieldname in data_source or 1d_vector
        data_source : optional if x,y are not strings,
            backbonemodel of a data source
        container : bbmodel of container viewmodel

        Returns
        ----------
        """
        plot = self.model('Plot', width=width, height=height)
        if self.bbclient:
            plot.set('docapikey', self.apikey)
            plot.set('baseurl', self.bbclient.baseurl)
            
        if container:
            parent = container
            plot.set('parent', container.ref())
        else:
            parent = self.ic
            plot.set('parent', self.ic.ref())
        if title is not None: plot.set('title', title)
        xdata_range = self.model(
            'DataRange1d',
            sources=[]
            )
        ydata_range = self.model(
            'DataRange1d',
            sources=[]
            )
        axisclass = 'LinearAxis'
        if is_x_date: axisclass = 'LinearDateAxis'
        xaxis = self.model(
            axisclass, orientation='bottom', ticks=3,
            data_range=xdata_range.ref(), parent=plot.ref())
        axisclass = 'LinearAxis'
        if is_y_date: axisclass = 'LinearDateAxis'
        yaxis = self.model(
            axisclass, orientation='left', ticks=3,
            data_range=ydata_range.ref(), parent=plot.ref())
        pantool = self.model(
            'PanTool',
            dataranges=[xdata_range.ref(), ydata_range.ref()],
            dimensions=['width', 'height']
            )
        zoomtool = self.model(
            'ZoomTool',
            dataranges=[xdata_range.ref(), ydata_range.ref()],
            dimensions=['width', 'height']
            )
        selecttool = self.model(
            'BoxSelectTool',
            renderers=[])       
        embedtool = self.model(
            'EmbedTool')
        selectoverlay = self.model(
            'BoxSelectionOverlay',
            tool=selecttool.ref())
        plot.set('renderers', [])
        plot.set('axes', [xaxis.ref(), yaxis.ref()])
        plot.set('tools', [pantool.ref(), zoomtool.ref(), selecttool.ref(), embedtool.ref()])
        plot.set('overlays', [selectoverlay.ref()])
        output = XYPlot(
            plot, xdata_range, ydata_range,
            xaxis, yaxis, pantool, zoomtool,
            selecttool, embedtool, selectoverlay, parent,
            plotclient=self)
        return output

    def clf(self):
        self._plot = None
    def clear(self):
        self._plot = None
    def figure(self):
        self._plot = None
    def plot_dates(self, *args, **kwargs):
        kwargs['is_x_date'] = True
        return self.plot(*args, **kwargs)

    def scatter(self, *args, **kwargs):
        kwargs['scatter'] = True
        return self.plot(*args, **kwargs)

    def plot(self, x, y=None, color=None, title=None, width=300, height=300,
             scatter=False, is_x_date=False, is_y_date=False,
             data_source=None, container=None):
        if not self._hold:
            self.figure()
        if not self._plot:
            self._plot =self._newxyplot(
                title=title,
                width=width, height=height,
                is_x_date=is_x_date, is_y_date=is_y_date,
                container=container
                )
        self._plot.plot(x, y=y, color=color,
                        data_source=data_source,
                        scatter=scatter
                        )
        return self._plot

    def pandastable(self, source, sort=[], groups=[],
                    agg='sum', width=600, offset=0, length=100,
                    height=400, container=None):
        if container is None:
            parent = self.ic
        else:
            parent = container
        if isinstance(source, pandas.DataFrame):
            source = self.model('PandasDataSource', df=source)
            source.update()
        table = self.model('PandasPivot',
                           pandassourceobj=source,
                           sort=sort, groups=groups,agg=agg,
                           offset=offset,length=length,
                           width=width, height=height)
        if self.bbclient:
            self.bbclient.create(table)
        if container is None:
            self.show(table)
        return PandasTable(table, self)

    def table(self, data_source, columns, title=None,
              width=600, height=300, container=None):
        if container is None:
            parent = self.ic
        else:
            parent = container
        table = self.model(
            'DataTable', data_source=data_source.ref(),
            columns=columns, parent=parent.ref(),
            width=width,
            height=height)
        if self.bbclient:
            self.bbclient.update(table)
        if container is None:
            self.show(table)

    def _add_source_to_range(self, data_source, columns, range):
        sources = range.get('sources')
        added = False
        for source in sources:
            if source['ref'] == data_source:
                newcolumns = np.unique1d(columns, source['columns']).tolist()
                source['columns'] = newcolumns
                added = True
        if not added:
            sources.append({'ref' : data_source.ref(), 'columns' : columns})

    def grid(self, plots, title=None):
        container = self.model(
            'GridPlotContainer',
            parent=self.ic.ref())
        if title is not None:
            container.set('title', title)
        flatplots = []
        for row in plots:
            for plot in row:
                flatplots.append(plot.plotmodel)
        for plot in flatplots:
            plot.set('parent', container.ref())
        plotrefs = [[x.plotmodel.ref() for x in row] for row in plots]
        container.set('children', plotrefs)
        if self.bbclient:
            to_update = [self.ic, container]
            to_update.extend(flatplots)
            self.bbclient.upsert_all(to_update)
        self.show(container)
        return GridPlot(container, plots, title, self)

    def show(self, plot):
        if self.bbclient:
            self.ic.pull()
        children = self.ic.get('children')
        if children is None: children = []
        if plot.get('id') not in [x['id'] for x in children]:
            children.insert(0, plot.ref())
        self.ic.set('children', children)
        if self.bbclient:
            self.bbclient.update(self.ic)

    def clearic(self):
        self.ic.set('children', [])
        if self.bbclient:
            self.bbclient.update(self.ic)

    def html(self, script_paths=None,
             css_paths=None, js_snippets=[],
             html_snippets=[], template="base.html",
             ):
        import jinja2
        if script_paths is None:
            script_paths = dump.script_paths
        if css_paths is None:
            css_paths=dump.css_paths
        template = get_template(template)
        result = template.render(
            rawjs=dump.inline_scripts(script_paths).decode('utf8'),
            rawcss=dump.inline_css(css_paths).decode('utf8'),
            js_snippets=js_snippets,
            html_snippets=html_snippets
            )
        return result

    def make_html(self, all_models, model=None, template="base.html",
                  script_paths=None, css_paths=None):
        if model is None:
            model = self.ic
        elementid = str(uuid.uuid4())
        plot_js = get_template('plots.js').render(
            elementid=elementid,
            modelid=model.id,
            all_models=protocol.serialize_json([x.to_broadcast_json()\
                                       for x in all_models]),
            modeltype=model.typename,
            )
        plot_div = get_template('plots.html').render(
            elementid=elementid
            )
        result = self.html(js_snippets=[plot_js],
                           template=template,
                           html_snippets=[plot_div],
                           script_paths=script_paths,
                           css_paths=css_paths
                           )
        return result

    def htmldump(self, path=None):
        """if inline, path is a filepath, otherwise,
        path is a dir
        """
        html = self.make_html(self.models.values())
        if path:
            with open(path, "w+") as f:
                f.write(html.encode("utf-8"))
        else:
            return html.encode("utf-8")


def get_template(filename):
    import jinja2
    template = os.path.join(os.path.dirname(__file__),
                            'templates',
                            filename,
                            )
    with open(template) as f:
        return jinja2.Template(f.read())

bbmodel.load_special_types()


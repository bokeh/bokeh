""" Defines the base PlotSession and some example session types.
"""
from __future__ import absolute_import

import logging
from six.moves.urllib.parse import urlsplit

from ..objects import Plot
from .html_file_session import HTMLFileSession
from .plot_server_session import PlotServerSession

logger = logging.getLogger(__file__)

class NotebookSessionMixin(object):
    """ Mix this into ``BaseHTMLSession``. """

    def _get_plot_and_objects(self, *objects):
        if len(objects) == 0:
            objects = list(self._models.values())
        if len(objects) == 1 and isinstance(objects[0], Plot):
            the_plot = objects[0]
            objects = list(self._models.values())
        else:
            the_plot = [m for m in objects if isinstance(m, Plot)][0]

        return the_plot, objects

    def show(self, *objects):
        """ Displays the given objects, or all objects currently associated
        with the session, inline in the IPython Notebook.

        Basicall we return a dummy object that implements _repr_html.
        The reason to do this instead of just having this session object
        implement _repr_html directly is because users will usually want
        to just see one or two plots, and not all the plots and models
        associated with the session.
        """
        import IPython.core.displaypub as displaypub
        displaypub.publish_display_data('bokeh', {'text/html': self.dumps(*objects)})

class NotebookSession(NotebookSessionMixin, HTMLFileSession):
    """ Produces inline HTML suitable for placing into an IPython Notebook. """

    def __init__(self, plot=None):
        HTMLFileSession.__init__(self, filename=None, plot=plot)

    def dumps(self, *objects):
        """ Returns the HTML contents as a string. """
        the_plot, objects = self._get_plot_and_objects(*objects)

        plot_ref = self.get_ref(the_plot)
        elementid = self.make_id()

        js = self._load_template(self.js_template).render(
                    elementid = elementid,
                    modelid = plot_ref["id"],
                    modeltype = plot_ref["type"],
                    all_models = self.serialize_models(objects))

        plot_div = self._load_template(self.div_template).render(elementid=elementid)

        html = self._load_template(self.html_template).render(
                                           html_snippets=[plot_div],
                                           elementid = elementid,
                                           js_snippets = [js])
        return html.encode("utf-8")

    def notebooksources(self):
        import IPython.core.displaypub as displaypub
        js_paths = self.js_paths()
        css_paths = self.css_paths()
        html = self._load_template(self.html_template).render(
            rawjs=self._inline_files(js_paths),
            rawcss=self._inline_files(css_paths),
            js_snippets=[],
            html_snippets=["<p>Configuring embedded BokehJS mode.</p>"])
        displaypub.publish_display_data('bokeh', {'text/html': html})
        return None

class NotebookServerSession(NotebookSessionMixin, PlotServerSession):
    """ An IPython Notebook session that is connected to a plot server. """

    def ws_conn_string(self):
        split = urlsplit(self.root_url)
        #how to fix this in bokeh and wakari?
        if split.scheme == 'http':
            return "ws://%s/bokeh/sub" % split.netloc
        else:
            return "wss://%s/bokeh/sub" % split.netloc

    def dumps(self, *objects):
        """ Returns the HTML contents as a string. """
        the_plot, _ = self._get_plot_and_objects(*objects)
        return the_plot.create_html_snippet(server=True)

    def notebook_connect(self):
        if self.docname is None:
            raise RuntimeError("usedoc() must be called before notebook_connect()")
        import IPython.core.displaypub as displaypub
        msg = """<p>Connecting notebook to document "%s" at server %s</p>""" % \
                (self.docname, self.root_url)
        displaypub.publish_display_data('bokeh', {'text/html': msg})
        return None

from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

from os.path import basename, dirname, exists, join

from jinja2 import Environment, FileSystemLoader

from .handler import Handler
from .script import ScriptHandler
from .server_lifecycle import ServerLifecycleHandler

class DirectoryHandler(Handler):
    """ Load an application directory which modifies a Document """

    def __init__(self, *args, **kwargs):
        super(DirectoryHandler, self).__init__(*args, **kwargs)

        if 'filename' not in kwargs:
            raise ValueError('Must pass a filename to DirectoryHandler')
        src_path = kwargs['filename']
        argv = kwargs.get('argv', [])

        main_py = join(src_path, 'main.py')
        main_ipy = join(src_path, 'main.ipynb')
        if exists(main_py) and exists(main_ipy):
            log.warn("Found both 'main.py' and 'main.ipynb' in %s, using 'main.py'" % (src_path))
            main = main_py
        elif exists(main_py):
            main = main_py
        elif exists(main_ipy):
            main = main_ipy
        else:
            raise ValueError("No 'main.py' or 'main.ipynb' in %s" % (src_path))
        self._path = src_path
        self._main = main
        self._main_handler = ScriptHandler(filename=self._main, argv=argv)

        lifecycle = join(src_path, 'server_lifecycle.py')
        if exists(lifecycle):
            self._lifecycle = lifecycle
            self._lifecycle_handler = ServerLifecycleHandler(filename=self._lifecycle, argv=argv)
        else:
            self._lifecycle = None
            self._lifecycle_handler = Handler() # no-op handler

        self._theme = None
        themeyaml = join(src_path, 'theme.yaml')
        if exists(themeyaml):
            from bokeh.themes import Theme
            self._theme = Theme(filename=themeyaml)

        appstatic = join(src_path, 'static')
        if exists(appstatic):
            self._static = appstatic

        self._template = None
        appindex = join(src_path, 'templates', 'index.html')
        if exists(appindex):
            env = Environment(loader=FileSystemLoader(dirname(appindex)))
            self._template = env.get_template('index.html')

    def url_path(self):
        if self.failed:
            return None
        else:
            # TODO should fix invalid URL characters
            return '/' + basename(self._path)

    def modify_document(self, doc):
        if self.failed:
            return
        # Note: we do NOT copy self._theme, which assumes the Theme
        # class is immutable (has no setters)
        if self._theme is not None:
            doc.theme = self._theme

        if self._template is not None:
            doc.template = self._template

        # This internal handler should never add a template
        self._main_handler.modify_document(doc)

    @property
    def failed(self):
        return self._main_handler.failed or self._lifecycle_handler.failed

    @property
    def error(self):
        return self._main_handler.error or self._lifecycle_handler.error

    @property
    def safe_to_fork(self):
        return self._main_handler.safe_to_fork

    @property
    def error_detail(self):
        return self._main_handler.error_detail or self._lifecycle_handler.error_detail

    def on_server_loaded(self, server_context):
        return self._lifecycle_handler.on_server_loaded(server_context)

    def on_server_unloaded(self, server_context):
        return self._lifecycle_handler.on_server_unloaded(server_context)

    def on_session_created(self, session_context):
        return self._lifecycle_handler.on_session_created(session_context)

    def on_session_destroyed(self, session_context):
        return self._lifecycle_handler.on_session_destroyed(session_context)

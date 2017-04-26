''' Control global configuration options with environment variables.

'''
from __future__ import absolute_import

import codecs
import logging
import os
from os.path import join, abspath, isdir

from .util.paths import ROOT_DIR, bokehjsdir


class Settings(object):
    ''' A class to collect global, overridable Bokeh configuration settings.

    '''

    _prefix = "BOKEH_"
    debugjs = False

    @property
    def _environ(self):
        return os.environ

    def _get(self, key, default=None):
        return self._environ.get(self._prefix + key, default)

    @property
    def _is_dev(self):
        return self._get_bool("DEV", False)

    @property
    def dev(self):
        return self._is_dev

    def _dev_or_default(self, default, dev):
        return dev if dev is not None and self._is_dev else default

    def _get_str(self, key, default, dev=None):
        return self._get(key, self._dev_or_default(default, dev))

    def _get_int(self, key, default, dev=None):
        return int(self._get(key, self._dev_or_default(default, dev)))

    def _get_bool(self, key, default, dev=None):
        value = self._get(key)

        if value is None:
            value = self._dev_or_default(default, dev)
        elif value.lower() in ["true", "yes", "on", "1"]:
            value = True
        elif value.lower() in ["false", "no", "off", "0"]:
            value = False
        else:
            raise ValueError("invalid value %r for boolean property %s%s" % (value, self._prefix, key))

        return value

    def browser(self, default=None):
        ''' Set the default browser that Bokeh should use to show documents
        with.

        '''
        return self._get_str("BROWSER", default, "none")

    def resources(self, default=None):
        ''' Set (override) the type of resources that Bokeh should use when
        outputting documents.

        '''
        return self._get_str("RESOURCES", default, "absolute-dev")

    def rootdir(self, default=None):
        ''' Set the root directory for "relative" resources.

        '''
        return self._get_str("ROOTDIR", default)

    def version(self, default=None):
        ''' Set (override) the standard reported Bokeh version.

        '''
        return self._get_str("VERSION", default)

    def docs_cdn(self, default=None):
        ''' Set the version of BokehJS should use for CDN resources when
        building the docs.

        '''
        return self._get_str("DOCS_CDN", default)

    def docs_version(self, default=None):
        ''' Set the version to use for building the docs.

        '''
        return self._get_str("DOCS_VERSION", default)

    def docs_missing_api_key_ok(self, default=False):
        ''' Control whether a missing google API key should cause the
        docs build to fail immediately.

        '''
        return self._get_str("DOCS_MISSING_API_KEY_OK", default)

    def minified(self, default=None):
        ''' Set whether Bokeh should use minified BokehJS resources.

        '''
        return self._get_bool("MINIFIED", default, False)

    def log_level(self, default=None):
        ''' Set the log level for JavaScript BokehJS code.

        '''
        return self._get_str("LOG_LEVEL", default, "debug")

    def py_log_level(self, default='none'):
        ''' Set the log level for python Bokeh code.

        '''
        level = self._get_str("PY_LOG_LEVEL", default, "debug")
        LEVELS = {'debug': logging.DEBUG,
                  'info' : logging.INFO,
                  'warn' : logging.WARNING,
                  'error': logging.ERROR,
                  'fatal': logging.CRITICAL,
                  'none' : None}
        return LEVELS[level]

    def pretty(self, default=None):
        ''' Set whether JSON strings should be pretty-printed.

        '''
        return self._get_bool("PRETTY", default, True)

    def simple_ids(self, default=None):
        ''' Set whether Bokeh should generate simple numeric model IDs.

        '''
        return self._get_bool("SIMPLE_IDS", default, True)

    def strict(self, default=None):
        ''' Set whether validation should be performed strictly.

        '''
        return self._get_bool("STRICT", default, False)

    def secret_key(self, default=None):
        ''' Set the secret key.

        Should be a long, cryptographically-random secret unique the
        Bokeh deployment.
        '''
        return self._get_str("SECRET_KEY", default)

    def secret_key_bytes(self):
        ''' Return the secret_key, converted to bytes and cached.

        '''
        if not hasattr(self, '_secret_key_bytes'):
            key = self.secret_key()
            if key is None:
                self._secret_key_bytes = None
            else:
                self._secret_key_bytes = codecs.encode(key, "utf-8")
        return self._secret_key_bytes

    def sign_sessions(self, default=False):
        ''' Set whether the server should only allow sessions signed with
        our secret key.

        If True, BOKEH_SECRET_KEY must also be set.

        '''
        return self._get_bool("SIGN_SESSIONS", default)

    # Server settings go here:

    def bokehjssrcdir(self):
        ''' The absolute path of the BokehJS source code in the installed
        Bokeh source tree.

        '''
        if self._is_dev or self.debugjs:
            bokehjssrcdir = abspath(join(ROOT_DIR, '..', 'bokehjs', 'src'))

            if isdir(bokehjssrcdir):
                return bokehjssrcdir

        return None

    def bokehjsdir(self):
        '''

        '''
        return bokehjsdir(self._is_dev or self.debugjs)

    def js_files(self):
        ''' The JS files in the BokehJS directory.

        '''
        bokehjsdir = self.bokehjsdir()
        js_files = []
        for root, dirnames, files in os.walk(bokehjsdir):
            for fname in files:
                if fname.endswith(".js") and 'vendor' not in root:
                    js_files.append(join(root, fname))
        return js_files

    def css_files(self):
        ''' The CSS files in the BokehJS directory.

        '''
        bokehjsdir = self.bokehjsdir()
        js_files = []
        for root, dirnames, files in os.walk(bokehjsdir):
            for fname in files:
                if fname.endswith(".css") and 'vendor' not in root:
                    js_files.append(join(root, fname))
        return js_files

    def nodejs_path(self, default=None):
        return self._get_str("NODEJS_PATH", default)

#: A global settings object that other parts of Bokeh can refer to.
#:
#:
#: ``BOKEH_BROWSER`` --- What browser to use when opening plots.
#:
#:   Valid values are any of the browser names understood by the python
#:   standard library webbrowser_ module.
#:
#: ``BOKEH_DEV`` --- Whether to use development mode.
#:
#:   This uses absolute paths to development (non-minified) BokehJS components,
#:   sets logging to ``debug``, makes generated HTML and JSON human-readable,
#:   etc.
#:
#:   This is a meta variable equivalent to the following environment variables:
#:
#:   - ``BOKEH_BROWSER=none``
#:   - ``BOKEH_LOG_LEVEL=debug``
#:   - ``BOKEH_MINIFIED=false``
#:   - ``BOKEH_PRETTY=true``
#:   - ``BOKEH_PY_LOG_LEVEL=debug``
#:   - ``BOKEH_RESOURCES=absolute-dev``
#:   - ``BOKEH_SIMPLE_IDS=true``
#:
#:  Accepted values are ``yes``/``no``, ``true``/``false`` or ``0``/``1``.
#:
#: ``BOKEH_DOCS_CDN`` --- What version of BokehJS to use when building sphinx
#:   `~bokeh.resources.Resources` class reference for full details.
#:
#: ``BOKEH_DOCS_VERSION`` --- What version of Bokeh to show when building sphinx docs locally.
#:
#:   Useful for re-deployment purposes.
#:
#:   Set to ``"local"`` to use a locally built dev version of BokehJS.
#:
#:   .. note::
#:       This variable is only used when building documentation from the
#:       development version.
#:
#: ``BOKEH_DOCS_CSS_SERVER`` --- Where to get the CSS stylesheet from.
#:
#:   By default use CSS from bokehplots.com
#:
#:   .. note::
#:       This variable is only used when building documentation from the
#:       development version.
#:
#:   Set to ``"local"`` to use a locally built dev version of BokehJS.
#:
#: ``BOKEH_DOCS_MISSING_API_KEY_OK`` --- Whether the docs build should fail without GOOGLE_API_KEY set.
#:
#:   By default, set to `no`, which means the docs build will stop immediately
#:   if the GOOGLE_API_KEY  environment variable is missing. Set to `yes` to
#:   enable docs builds to proceed (but with non-functional Google Maps examples).
#:   Useful for development.
#:
#: ``BOKEH_LOG_LEVEL`` --- The BokehJS console logging level to use.
#:
#:   Valid values are, in order of increasing severity:
#:
#:   - ``trace``
#:   - ``debug``
#:   - ``info``
#:   - ``warn``
#:   - ``error``
#:   - ``fatal``
#:
#:   The default logging level is ``info``.
#:
#:   .. note::
#:       When running server examples, it is the value of this
#:       ``BOKEH_LOG_LEVEL`` that is set for the server that matters.
#:
#: ``BOKEH_MINIFIED`` --- Whether to emit minified JavaScript for ``bokeh.js``.
#:
#:   Accepted values are ``yes``/``no``, ``true``/``false`` or ``0``/``1``.
#:
#: ``BOKEH_PRETTY`` --- Whether to emit "pretty printed" JSON.
#:
#:   Accepted values are ``yes``/``no``, ``true``/``false`` or ``0``/``1``.
#:
#: ``BOKEH_PY_LOG_LEVEL`` --- The Python logging level to set.
#:
#:   As in the JS side, valid values are, in order of increasing severity:
#:
#:   - ``debug``
#:   - ``info``
#:   - ``warn``
#:   - ``error``
#:   - ``fatal``
#:   - ``none``
#:
#:   The default logging level is ``none``.
#:
#: ``BOKEH_RESOURCES`` --- What kind of BokehJS resources to configure.
#:
#:   For example:  ``inline``, ``cdn``, ``server``. See the
#:   :class:`~bokeh.core.resources.Resources` class reference for full details.
#:
#: ``BOKEH_ROOTDIR`` --- Root directory to use with ``relative`` resources.
#:
#:   See the :class:`~bokeh.resources.Resources` class reference for full
#:   details.
#:
#: ``BOKEH_SIMPLE_IDS`` --- Whether to generate human-friendly object IDs.
#:
#:   Accepted values are ``yes``/``no``, ``true``/``false`` or ``0``/``1``.
#:   Normally Bokeh generates UUIDs for object identifiers. Setting this variable
#:   to an affirmative value will result in more friendly simple numeric IDs
#:   counting up from 1000.
#:
#: ``BOKEH_VERSION`` --- What version of BokehJS to use with ``cdn`` resources.
#:
#:   See the :class:`~bokeh.resources.Resources` class reference for full details.
#:
#: .. _webbrowser: https://docs.python.org/2/library/webbrowser.html
settings = Settings()
del Settings

if settings.secret_key() is not None:
    if len(settings.secret_key()) < 32:
        import warnings
        warnings.warn("BOKEH_SECRET_KEY is recommended to have at least 32 bytes of entropy chosen with a cryptographically-random algorithm")

if settings.sign_sessions() and settings.secret_key() is None:
    import warnings
    warnings.warn("BOKEH_SECRET_KEY must be set if BOKEH_SIGN_SESSIONS is set to true")

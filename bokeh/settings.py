from __future__ import absolute_import

import logging
import os
from os.path import join, abspath, isdir

from .util.paths import ROOT_DIR, bokehjsdir


class Settings(object):
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

    def _dev_or_default(self, default, dev):
        return dev if dev is not None and self._is_dev else default

    def _get_str(self, key, default, dev=None):
        return self._get(key, self._dev_or_default(default, dev))

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
        return self._get_str("BROWSER", default, "none")

    def resources(self, default=None):
        return self._get_str("RESOURCES", default, "absolute-dev")

    def rootdir(self, default=None):
        return self._get_str("ROOTDIR", default)

    def version(self, default=None):
        return self._get_str("VERSION", default)

    def docs_cdn(self, default=None):
        return self._get_str("DOCS_CDN", default)

    def docs_version(self, default=None):
        return self._get_str("DOCS_VERSION", default)

    def minified(self, default=None):
        return self._get_bool("MINIFIED", default, False)

    def log_level(self, default=None):
        return self._get_str("LOG_LEVEL", default, "debug")

    def py_log_level(self, default='none'):
        level = self._get_str("PY_LOG_LEVEL", default, "debug")
        LEVELS = {'debug': logging.DEBUG,
                  'info' : logging.INFO,
                  'warn' : logging.WARNING,
                  'error': logging.ERROR,
                  'fatal': logging.CRITICAL,
                  'none' : None}
        return LEVELS[level]

    def pretty(self, default=None):
        return self._get_bool("PRETTY", default, True)

    def simple_ids(self, default=None):
        return self._get_bool("SIMPLE_IDS", default, True)

    def strict(self, default=None):
        return self._get_bool("STRICT", default, False)

    """
    Server settings go here:
    """

    def bokehjssrcdir(self):
        if self.debugjs:
            bokehjssrcdir = abspath(join(ROOT_DIR, '..', 'bokehjs', 'src'))

            if isdir(bokehjssrcdir):
                return bokehjssrcdir

        return None

    def bokehjsdir(self):
        return bokehjsdir(self.debugjs)

    def js_files(self):
        bokehjsdir = self.bokehjsdir()
        js_files = []
        for root, dirnames, files in os.walk(bokehjsdir):
            for fname in files:
                if fname.endswith(".js") and 'vendor' not in root:
                    js_files.append(join(root, fname))
        return js_files

    def css_files(self):
        bokehjsdir = self.bokehjsdir()
        js_files = []
        for root, dirnames, files in os.walk(bokehjsdir):
            for fname in files:
                if fname.endswith(".css") and 'vendor' not in root:
                    js_files.append(join(root, fname))
        return js_files


settings = Settings()
del Settings

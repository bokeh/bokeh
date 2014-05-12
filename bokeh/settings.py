from os.path import join, dirname, abspath
import os

class Settings(object):
    _prefix = "BOKEH_"
    debugjs = False
    @property
    def _environ(self):
        return os.environ

    def _get_str(self, key, default):
        return self._environ.get(self._prefix + key, default)

    def _get_bool(self, key, default):
        value = self._environ.get(self._prefix + key)

        if value is None:
            value = default
        elif value.lower() in ["true", "yes", "on", "1"]:
            value = True
        elif value.lower() in ["false", "no", "off", "0"]:
            value = False
        else:
            raise ValueError("invalid value %r for boolean property %s%s" % (value, self._prefix, key))

        return value

    def browser(self, default=None):
        return self._get_str("BROWSER", default)

    def resources(self, default=None):
        return self._get_str("RESOURCES", default)

    def rootdir(self, default=None):
        return self._get_str("ROOTDIR", default)

    def version(self, default=None):
        return self._get_str("VERSION", default)

    def minified(self, default=None):
        return self._get_bool("MINIFIED", default)

    def pretty(self, default=None):
        return self._get_bool("PRETTY", default)

    def pythonlib(self, default=None):
        return self._get_str("PYTHONLIB", default)
        
    """
    Server settings go here:
    """
    def serverdir(self):
        return join(dirname(abspath(__file__)), 'server')
        
    def bokehjssrcdir(self):
        if self.debugjs:
            basedir = dirname(dirname(self.serverdir()))
            return join(basedir, 'bokehjs', 'src')
        else:
            return None

    def bokehjsdir(self):
        if self.debugjs:
            basedir = dirname(dirname(self.serverdir()))
            return join(basedir, 'bokehjs', 'build')
        else:
            return join(self.serverdir(), 'static')
            
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

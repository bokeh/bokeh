''' Provide functions and classes to help with various JS and CSS compilation.

'''
from __future__ import absolute_import

import logging
logger = logging.getLogger(__name__)

import io
import os
import sys
import six
import json
import hashlib
from os.path import dirname, join, abspath, exists, isabs
from subprocess import Popen, PIPE

from ..model import Model
from ..settings import settings
from .string import snakify

# XXX: this is the same as bokehjs/src/js/plugin-prelude.js
_plugin_prelude = \
"""
(function outer(modules, cache, entry) {
  if (Bokeh != null) {
    for (var name in modules) {
      Bokeh.require.modules[name] = modules[name];
    }

    for (var i = 0; i < entry.length; i++) {
      var plugin = Bokeh.require(entry[i]);
      Bokeh.Models.register_models(plugin.models);

      for (var name in plugin) {
        if (name !== "models") {
          Bokeh[name] = plugin[name];
        }
      }
    }
  } else {
    throw new Error("Cannot find Bokeh. You have to load it prior to loading plugins.");
  }
})
"""

_plugin_template = \
"""
%(prelude)s
({
  "custom/main": [function(require, module, exports) {
    module.exports = {
      models: {
        %(exports)s
      }
    };
  }, {}],
  %(modules)s
}, {}, ["custom/main"]);
"""

_style_template = \
"""
(function() {
  var head = document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';
  var css = %(css)s;
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
  head.appendChild(style);
}());
"""

_export_template = \
""""%(name)s": require("%(module)s").%(name)s"""

_module_template = \
""""%(module)s": [function(require, module, exports) {\n%(code)s\n}, %(deps)s]"""

class AttrDict(dict):
    ''' Provide a dict subclass that supports access by named attributes.

    '''
    def __getattr__(self, key):
        return self[key]

class CompilationError(RuntimeError):
    ''' A RuntimeError subclass for reporting JS compilation errors.

    '''
    def __init__(self, error):
        super(CompilationError, self).__init__()
        self.line = error.get("line")
        self.column = error.get("column")
        self.message = error.get("message")
        self.text = error.get("text")
        self.annotated = error.get("annotated")

    def __str__(self):
        return self.text

bokehjs_dir = settings.bokehjsdir()

def _detect_nodejs():
    if settings.nodejs_path() is not None:
        nodejs_paths = [settings.nodejs_path()]
    else:
        nodejs_paths = ["nodejs", "node"]

    for nodejs_path in nodejs_paths:
        try:
            Popen([nodejs_path, "--version"], stdout=PIPE, stderr=PIPE)
        except OSError:
            pass
        else:
            return nodejs_path
    else:
        return None

_nodejs = _detect_nodejs()
_npmjs = None if _nodejs is None else join(dirname(_nodejs), "npm")

def _run(app, argv, input=None):
    if _nodejs is None:
        raise RuntimeError('node.js is needed to allow compilation of custom models ' +
                           '("conda install -c bokeh nodejs" or follow https://nodejs.org/en/download/)')

    proc = Popen([app] + argv, stdout=PIPE, stderr=PIPE, stdin=PIPE)
    (stdout, errout) = proc.communicate(input=None if input is None else json.dumps(input).encode())

    if proc.returncode != 0:
        raise RuntimeError(errout)
    else:
        return stdout.decode('utf-8')

def _run_nodejs(argv, input=None):
    return _run(_nodejs, argv, input)

def _run_npmjs(argv, input=None):
    return _run(_npmjs, argv, input)

def _version(run_app):
    try:
        version = run_app(["--version"])
    except RuntimeError:
        return None
    else:
        return version.strip()

def nodejs_version():
    return _version(_run_nodejs)

def npmjs_version():
    return _version(_run_npmjs)

def nodejs_compile(code, lang="javascript", file=None):
    compilejs_script = join(bokehjs_dir, "js", "compile.js")
    output = _run_nodejs([compilejs_script], dict(code=code, lang=lang, file=file))
    return AttrDict(json.loads(output))

class Implementation(object):

    file = None

class Inline(Implementation):

    def __init__(self, code, file=None):
        self.code = code
        self.file = file

class CoffeeScript(Inline):

    @property
    def lang(self):
        return "coffeescript"

class TypeScript(Inline):

    @property
    def lang(self):
        return "typescript"

class JavaScript(Inline):

    @property
    def lang(self):
        return "javascript"

class Less(Inline):

    @property
    def lang(self):
        return "less"

class FromFile(Implementation):

    def __init__(self, path):
        with io.open(path, encoding="utf-8") as f:
            self.code = f.read()
        self.file = path

    @property
    def lang(self):
        if self.file.endswith(".coffee"):
            return "coffeescript"
        if self.file.endswith((".ts", ".tsx")):
            return "typescript"
        if self.file.endswith(".js"):
            return "javascript"
        if self.file.endswith((".css", ".less")):
            return "less"

#: recognized extensions that can be compiled
exts = (".coffee", ".ts", ".tsx", ".js", ".css", ".less")

class CustomModel(object):
    def __init__(self, cls):
        self.cls = cls

    @property
    def name(self):
        return self.cls.__name__

    @property
    def full_name(self):
        name = self.cls.__module__ + "." + self.name
        return name.replace("__main__.", "")

    @property
    def file(self):
        module = sys.modules[self.cls.__module__]

        if hasattr(module, "__file__"):
            return abspath(module.__file__)
        else:
            return None

    @property
    def path(self):
        path = getattr(self.cls, "__base_path__", None)

        if path is not None:
            return path
        elif self.file is not None:
            return dirname(self.file)
        else:
            return os.getcwd()

    @property
    def implementation(self):
        impl = self.cls.__implementation__

        if isinstance(impl, six.string_types):
            if "\n" not in impl and impl.endswith(exts):
                impl = FromFile(impl if isabs(impl) else join(self.path, impl))
            else:
                impl = CoffeeScript(impl)

        if isinstance(impl, Inline) and impl.file is None:
            impl = impl.__class__(impl.code, (self.file or "<string>") + ":" + self.name)

        return impl

    @property
    def dependencies(self):
        return getattr(self.cls, "__dependencies__", {})

    @property
    def module(self):
        return "custom/%s" % snakify(self.full_name)

def gen_custom_models_static():
    custom_models = {}

    for cls in Model.model_class_reverse_map.values():
        impl = getattr(cls, "__implementation__", None)

        if impl is not None:
            model = CustomModel(cls)
            custom_models[model.full_name] = model

    if not custom_models:
        return None

    ordered_models = sorted(custom_models.values(), key=lambda model: model.full_name)

    exports = []
    modules = []

    with io.open(join(bokehjs_dir, "js", "modules.json"), encoding="utf-8") as f:
        known_modules = json.loads(f.read())

    known_modules = set(known_modules["bokehjs"] + known_modules["widgets"])
    custom_impls = {}

    dependencies = []
    for model in ordered_models:
        dependencies.extend(list(model.dependencies.items()))

    if dependencies:
        dependencies = sorted(dependencies, key=lambda name_version: name_version[0])
        _run_npmjs(["install", "--no-progress"] + [ name + "@" + version for (name, version) in dependencies ])

    for model in ordered_models:
        impl = model.implementation
        compiled = nodejs_compile(impl.code, lang=impl.lang, file=impl.file)

        if "error" in compiled:
            raise CompilationError(compiled.error)

        custom_impls[model.full_name] = compiled

    extra_modules = {}

    def resolve_modules(to_resolve, root):
        resolved = {}
        for module in to_resolve:
            if module.startswith(("./", "../")):
                def mkpath(module, ext=""):
                    return abspath(join(root, *module.split("/")) + ext)

                if module.endswith(exts):
                    path = mkpath(module)
                    if not exists(path):
                        raise RuntimeError("no such module: %s" % module)
                else:
                    for ext in exts:
                        path = mkpath(module, ext)
                        if exists(path):
                            break
                    else:
                        raise RuntimeError("no such module: %s" % module)

                impl = FromFile(path)
                compiled = nodejs_compile(impl.code, lang=impl.lang, file=impl.file)

                if "error" in compiled:
                    raise CompilationError(compiled.error)

                if impl.lang == "less":
                    code = _style_template % dict(css=json.dumps(compiled.code))
                    deps = []
                else:
                    code = compiled.code
                    deps = compiled.deps

                sig = hashlib.sha256(code.encode('utf-8')).hexdigest()
                resolved[module] = sig

                deps_map = resolve_deps(deps, dirname(path))

                if sig not in extra_modules:
                    extra_modules[sig] = True
                    modules.append((sig, code, deps_map))
            else:
                raise RuntimeError("no such module: %s" % module)

        return resolved

    def resolve_deps(deps, root):
        custom_modules = set([ model.module for model in custom_models.values() ])
        missing = set(deps) - known_modules - custom_modules
        return resolve_modules(missing, root)

    for model in custom_models.values():
        compiled = custom_impls[model.full_name]
        deps_map = resolve_deps(compiled.deps, model.path)

        exports.append((model.name, model.module))
        modules.append((model.module, compiled.code, deps_map))

    # sort everything by module name
    exports = sorted(exports, key=lambda spec: spec[1])
    modules = sorted(modules, key=lambda spec: spec[0])

    sep = ",\n"

    exports = sep.join([ _export_template % dict(name=name, module=module) for (name, module) in exports ])
    modules = sep.join([ _module_template % dict(module=module, code=code, deps=json.dumps(deps)) for (module, code, deps) in modules ])

    return _plugin_template % dict(prelude=_plugin_prelude, exports=exports, modules=modules)

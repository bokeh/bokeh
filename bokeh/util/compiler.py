#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide functions and classes to help with various JS and CSS compilation.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import hashlib
import io
import json
import os
import re
import sys
from collections import OrderedDict
from os.path import abspath, dirname, exists, isabs, join
from subprocess import PIPE, Popen
from typing import Any, Callable, Dict, List, NamedTuple, Optional, Set, Tuple, Type, Union, cast

# Bokeh imports
from ..model import Model
from ..settings import settings
from .string import snakify

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'bundle_all_models',
    'bundle_models',
    'calc_cache_key',
    'CompilationError',
    'CustomModel',
    'FromFile',
    'get_cache_hook',
    'Implementation',
    'Inline',
    'JavaScript',
    'Less',
    'nodejs_compile',
    'nodejs_version',
    'npmjs_version',
    'set_cache_hook',
    'TypeScript',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class CompilationError(RuntimeError):
    ''' A ``RuntimeError`` subclass for reporting JS compilation errors.

    '''

bokehjs_dir = settings.bokehjsdir()
nodejs_min_version = (10, 13, 0)

def nodejs_version() -> Optional[str]:
    return _version(_run_nodejs)

def npmjs_version() -> Optional[str]:
    return _version(_run_npmjs)

class Compiled(NamedTuple):
    code: str
    deps: List[str] = []

class Error(NamedTuple):
    error: str

def nodejs_compile(code: str, lang: str = "javascript", file: Optional[str] = None) -> Union[Compiled, Error]:
    compilejs_script = join(bokehjs_dir, "js", "compiler.js")
    output = _run_nodejs([compilejs_script], dict(code=code, lang=lang, file=file, bokehjs_dir=bokehjs_dir))
    lines = output.split("\n")
    for i, line in enumerate(lines):
        if not line.startswith("LOG"):
            break
        else:
            print(line)
    obj = json.loads("\n".join(lines[i:]))
    if isinstance(obj, dict):
        if "error" in obj:
            return Error(**obj)
        else:
            return Compiled(**obj)
    else:
        raise RuntimeError("invalid JSON")

class Implementation(object):
    ''' Base class for representing Bokeh custom model implementations.

    '''
    file: Optional[str] = None
    code: Optional[str] = None

    @property
    def lang(self) -> Optional[str]:
        raise NotImplementedError()

class Inline(Implementation):
    ''' Base class for representing Bokeh custom model implementations that may
    be given as inline code in some language.

    Args:
        code (str) :
            The source code for the implementation

        file (str, optional)
            A file path to a file containing the source text (default: None)

    '''
    code: str

    def __init__(self, code: str, file: Optional[str] = None) -> None:
        self.code = code
        self.file = file

class TypeScript(Inline):
    ''' An implementation for a Bokeh custom model in TypeScript

    Example:

        .. code-block:: python

            class MyExt(Model):
                __implementation__ = TypeScript(""" <TypeScript code> """)

    '''
    @property
    def lang(self) -> str:
        return "typescript"

class JavaScript(Inline):
    ''' An implementation for a Bokeh custom model in JavaScript

    Example:

        .. code-block:: python

            class MyExt(Model):
                __implementation__ = JavaScript(""" <JavaScript code> """)

    '''
    @property
    def lang(self) -> str:
        return "javascript"

class Less(Inline):
    ''' An implementation of a Less CSS style sheet.

    '''
    @property
    def lang(self) -> str:
        return "less"

class FromFile(Implementation):
    ''' A custom model implementation read from a separate source file.

    Args:
        path (str) :
            The path to the file containing the extension source code

    '''
    file: str

    def __init__(self, path: str) -> None:
        with io.open(path, encoding="utf-8") as f:
            self.code = f.read()
        self.file = path

    @property
    def lang(self) -> Optional[str]:
        if self.file.endswith(".ts"):
            return "typescript"
        if self.file.endswith(".js"):
            return "javascript"
        if self.file.endswith((".css", ".less")):
            return "less"
        return None

#: recognized extensions that can be compiled
exts = (".ts", ".js", ".css", ".less")

class CustomModel(object):
    ''' Represent a custom (user-defined) Bokeh model.

    '''
    cls: Type[Model]

    def __init__(self, cls: Type[Model]) -> None:
        self.cls = cls

    @property
    def name(self) -> str:
        return self.cls.__name__

    @property
    def full_name(self) -> str:
        name = self.cls.__module__ + "." + self.name
        return name.replace("__main__.", "")

    @property
    def file(self) -> Optional[str]:
        module = sys.modules[self.cls.__module__]

        if hasattr(module, "__file__"):
            return abspath(module.__file__)
        else:
            return None

    @property
    def path(self) -> str:
        path: Optional[str] = getattr(self.cls, "__base_path__", None)

        if path is not None:
            return path
        elif self.file is not None:
            return dirname(self.file)
        else:
            return os.getcwd()

    @property
    def implementation(self) -> Implementation:
        impl = self.cls.__implementation__

        implementation: Implementation
        if isinstance(impl, str):
            if "\n" not in impl and impl.endswith(exts):
                implementation = FromFile(impl if isabs(impl) else join(self.path, impl))
            else:
                implementation = TypeScript(impl)
        else:
            assert(impl)
            implementation = impl

        if isinstance(implementation, Inline) and implementation.file is None:
            file = "%s%s.ts" % (self.file + ":" if self.file else "", self.name)
            implementation = implementation.__class__(implementation.code, file)

        return implementation

    @property
    def dependencies(self) -> Dict[str, str]:
        return cast(Dict[str, str], getattr(self.cls, "__dependencies__", {}))

    @property
    def module(self) -> str:
        return "custom/%s" % snakify(self.full_name)

CacheHook = Callable[[CustomModel, Implementation], Optional[Union[Compiled, Error]]]

_CACHING_IMPLEMENTATION: CacheHook = lambda model, implementation: None

def get_cache_hook() -> CacheHook:
    '''Returns the current cache hook used to look up the compiled
       code given the CustomModel and Implementation'''
    return _CACHING_IMPLEMENTATION

def set_cache_hook(hook: CacheHook) -> None:
    '''Sets a compiled model cache hook used to look up the compiled
       code given the CustomModel and Implementation'''
    global _CACHING_IMPLEMENTATION
    _CACHING_IMPLEMENTATION = hook

def calc_cache_key(custom_models: Dict[str, CustomModel]) -> str:
    ''' Generate a key to cache a custom extension implementation with.

    There is no metadata other than the Model classes, so this is the only
    base to generate a cache key.

    We build the model keys from the list of ``model.full_name``. This is
    not ideal but possibly a better solution can be found found later.

    '''
    model_names = { model.full_name for model in custom_models.values() }
    encoded_names = ",".join(sorted(model_names)).encode('utf-8')
    return hashlib.sha256(encoded_names).hexdigest()

_bundle_cache: Dict[str, str] = {}

def bundle_models(models: Optional[List[Type[Model]]]) -> Optional[str]:
    """Create a bundle of selected `models`. """
    custom_models = _get_custom_models(models)
    if custom_models is None:
        return None

    key = calc_cache_key(custom_models)
    bundle = _bundle_cache.get(key, None)
    if bundle is None:
        try:
            _bundle_cache[key] = bundle = _bundle_models(custom_models)
        except CompilationError as error:
            print("Compilation failed:", file=sys.stderr)
            print(str(error), file=sys.stderr)
            sys.exit(1)
    return bundle

def bundle_all_models() -> Optional[str]:
    """Create a bundle of all models. """
    return bundle_models(None)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_plugin_umd = \
"""\
(function(root, factory) {
    factory(root["Bokeh"]);
})(this, function(Bokeh) {
  var define;
  return %(content)s;
});
"""

# XXX: this is (almost) the same as bokehjs/src/js/plugin-prelude.js
_plugin_prelude = \
"""\
(function outer(modules, entry) {
  if (Bokeh != null) {
    return Bokeh.register_plugin(modules, entry);
  } else {
    throw new Error("Cannot find Bokeh. You have to load it prior to loading plugins.");
  }
})
"""

_plugin_template = \
"""\
%(prelude)s\
({
  "custom/main": function(require, module, exports) {
    var models = {
      %(exports)s
    };
    require("base").register_models(models);
    module.exports = models;
  },
  %(modules)s
}, "custom/main");
"""

_style_template = \
"""\
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
""""%(module)s": function(require, module, exports) {\n%(source)s\n}"""

def _detect_nodejs() -> str:
    nodejs_paths: List[str]
    if settings.nodejs_path() is not None:
        nodejs_paths = [settings.nodejs_path()]
    else:
        nodejs_paths = ["nodejs", "node"]

    for nodejs_path in nodejs_paths:
        try:
            proc = Popen([nodejs_path, "--version"], stdout=PIPE, stderr=PIPE)
            (stdout, _) = proc.communicate()
        except OSError:
            continue

        if proc.returncode != 0:
            continue

        match = re.match(r"^v(\d+)\.(\d+)\.(\d+).*$", stdout.decode("utf-8"))

        if match is not None:
            version = tuple(int(v) for v in match.groups())

            if version >= nodejs_min_version:
                return nodejs_path

    # if we've reached here, no valid version was found
    str_version = ".".join(map(str, nodejs_min_version))
    raise RuntimeError(f'node.js v{str_version} or higher is needed to allow compilation of custom models '
                       '("conda install nodejs" or follow https://nodejs.org/en/download/)')

_nodejs = None
_npmjs = None

def _nodejs_path() -> str:
    global _nodejs
    if _nodejs is None:
        _nodejs = _detect_nodejs()
    return _nodejs

def _npmjs_path() -> str:
    global _npmjs
    if _npmjs is None:
        _npmjs = join(dirname(_nodejs_path()), "npm")
        if sys.platform == "win32":
            _npmjs += '.cmd'
    return _npmjs

def _crlf_cr_2_lf(s: str) -> str:
    return re.sub(r"\\r\\n|\\r|\\n", r"\\n", s)

JSON = Any

def _run(app: str, argv: List[str], input: Optional[JSON] = None) -> str:
    proc = Popen([app] + argv, stdout=PIPE, stderr=PIPE, stdin=PIPE)
    (stdout, errout) = proc.communicate(input=None if input is None else json.dumps(input).encode())

    if proc.returncode != 0:
        raise RuntimeError(errout.decode('utf-8'))
    else:
        return _crlf_cr_2_lf(stdout.decode('utf-8'))

def _run_nodejs(argv: List[str], input: Optional[JSON] = None) -> str:
    return _run(_nodejs_path(), argv, input)

def _run_npmjs(argv: List[str], input: Optional[JSON] = None) -> str:
    return _run(_npmjs_path(), argv, input)

def _version(run_app: Callable[[List[str]], str]) -> Optional[str]:
    try:
        version = run_app(["--version"])
    except RuntimeError:
        return None
    else:
        return version.strip()

def _get_custom_models(models: Optional[List[Type[Model]]]) -> Optional[Dict[str, CustomModel]]:
    """Returns CustomModels for models with a custom `__implementation__`"""
    custom_models: Dict[str, CustomModel] = OrderedDict()

    for cls in models if models is not None else Model.all_models():
        if cls.is_extension():
            model = CustomModel(cls)
            custom_models[model.full_name] = model

    if not custom_models:
        return None
    else:
        return custom_models

def _compile_models(custom_models: Dict[str, CustomModel]) -> Dict[str, Compiled]:
    """Returns the compiled implementation of supplied `models`. """
    ordered_models = sorted(custom_models.values(), key=lambda model: model.full_name)
    custom_impls: Dict[str, Compiled] = {}

    dependencies = []
    for model in ordered_models:
        dependencies.extend(list(model.dependencies.items()))

    if dependencies:
        dependencies = sorted(dependencies, key=lambda name_version: name_version[0])
        _run_npmjs(["install", "--no-progress"] + [ name + "@" + version for (name, version) in dependencies ])

    for model in ordered_models:
        impl = model.implementation
        compiled = _CACHING_IMPLEMENTATION(model, impl)
        if compiled is None:
            compiled = nodejs_compile(impl.code, lang=impl.lang, file=impl.file)

        if isinstance(compiled, Error):
            raise CompilationError(compiled.error)

        custom_impls[model.full_name] = compiled

    return custom_impls

def _bundle_models(custom_models: Dict[str, CustomModel]) -> str:
    """ Create a JavaScript bundle with selected `models`. """
    exports: List[Tuple[str, str]] = []
    modules: List[Tuple[str, str, Dict[str, str]]] = []

    with io.open(join(bokehjs_dir, "js", "bokeh.json"), encoding="utf-8") as f:
        bokeh = json.loads(f.read())

    known_modules: Set[str] = set()
    for artifact in bokeh["artifacts"]:
        canonical = artifact["module"].get("canonical")
        if canonical is not None:
            known_modules.add(canonical)

    custom_impls = _compile_models(custom_models)

    extra_modules: Dict[str, bool] = {}

    def resolve_modules(to_resolve: List[str], root: str) -> Dict[str, str]:
        resolved: Dict[str, str] = {}
        for module in to_resolve:
            if module.startswith(("./", "../")):
                def mkpath(module: str, ext: str = "") -> str:
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

                if isinstance(compiled, Error):
                    raise CompilationError(compiled.error)

                code: str
                deps: List[str]
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
                index = module + ("" if module.endswith("/") else "/") + "index"
                if index not in known_modules:
                    raise RuntimeError("no such module: %s" % module)

        return resolved

    def resolve_deps(deps: List[str], root: str) -> Dict[str, str]:
        custom_modules = set(model.module for model in custom_models.values())
        missing = set(deps) - known_modules - custom_modules
        return resolve_modules(list(missing), root)

    for model in custom_models.values():
        compiled = custom_impls[model.full_name]
        deps_map = resolve_deps(compiled.deps, model.path)

        exports.append((model.name, model.module))
        modules.append((model.module, compiled.code, deps_map))

    # sort everything by module name
    exports = sorted(exports, key=lambda spec: spec[1])
    modules = sorted(modules, key=lambda spec: spec[0])

    for i, (module, code, deps) in enumerate(modules):
        for name, ref in deps.items():
            code = code.replace("""require("%s")""" % name, """require("%s")""" % ref)
            code = code.replace("""require('%s')""" % name, """require('%s')""" % ref)
        modules[i] = (module, code, deps)

    sep = ",\n"

    content = _plugin_template % dict(
        prelude = _plugin_prelude,
        exports = sep.join(_export_template % dict(name=name, module=module) for (name, module) in exports),
        modules = sep.join(_module_template % dict(module=module, source=code) for (module, code, _) in modules),
    )

    return _plugin_umd % dict(content=content)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

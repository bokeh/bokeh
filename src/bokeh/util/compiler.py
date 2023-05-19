#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide functions and classes to help with various JS and CSS compilation.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import hashlib
import json
import os
import re
import sys
from os.path import (
    abspath,
    dirname,
    exists,
    isabs,
    join,
)
from pathlib import Path
from subprocess import PIPE, Popen
from typing import Any, Callable, Sequence

# Bokeh imports
from ..core.has_props import HasProps
from ..settings import settings
from .strings import snakify

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'AttrDict',
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

class AttrDict(dict[str, Any]):
    ''' Provide a dict subclass that supports access by named attributes.

    '''
    def __getattr__(self, key: str) -> Any:
        return self[key]

class CompilationError(RuntimeError):
    ''' A ``RuntimeError`` subclass for reporting JS compilation errors.

    '''
    def __init__(self, error: dict[str, str] | str) -> None:
        super().__init__()
        if isinstance(error, dict):
            self.line = error.get("line")
            self.column = error.get("column")
            self.message = error.get("message")
            self.text = error.get("text", "")
            self.annotated = error.get("annotated")
        else:
            self.text = error

    def __str__(self) -> str:
        return "\n" + self.text.strip()

bokehjs_dir = settings.bokehjsdir()
nodejs_min_version = (14, 0, 0)

def nodejs_version() -> str | None:
    return _version(_run_nodejs)

def npmjs_version() -> str | None:
    return _version(_run_npmjs)

def nodejs_compile(code: str, lang: str = "javascript", file: str | None = None) -> AttrDict:
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
        return AttrDict(obj)
    raise CompilationError(obj)

class Implementation:
    ''' Base class for representing Bokeh custom model implementations.

    '''
    file: str | None = None
    code: str
    @property
    def lang(self) -> str:
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
    def __init__(self, code: str, file: str|None = None) -> None:
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
    def __init__(self, path: str) -> None:
        with open(path, encoding="utf-8") as f:
            self.code = f.read()
        self.file = path

    @property
    def lang(self) -> str:
        if self.file is not None:
            if self.file.endswith(".ts"):
                return "typescript"
            if self.file.endswith(".js"):
                return "javascript"
            if self.file.endswith((".css", ".less")):
                return "less"
        raise ValueError(f"unknown file type {self.file}")

#: recognized extensions that can be compiled
exts = (".ts", ".js", ".css", ".less")

class CustomModel:
    ''' Represent a custom (user-defined) Bokeh model.

    '''
    def __init__(self, cls: type[HasProps]) -> None:
        self.cls = cls

    @property
    def name(self) -> str:
        return self.cls.__name__

    @property
    def full_name(self) -> str:
        name = self.cls.__module__ + "." + self.name
        return name.replace("__main__.", "")

    @property
    def file(self) -> str | None:
        module = sys.modules[self.cls.__module__]

        if hasattr(module, "__file__") and (file := module.__file__) is not None:
            return abspath(file)
        else:
            return None

    @property
    def path(self) -> str:
        path = getattr(self.cls, "__base_path__", None)

        if path is not None:
            return path
        elif self.file is not None:
            return dirname(self.file)
        else:
            return os.getcwd()

    @property
    def implementation(self) -> Implementation:
        impl = getattr(self.cls, "__implementation__")

        if isinstance(impl, str):
            if "\n" not in impl and impl.endswith(exts):
                impl = FromFile(impl if isabs(impl) else join(self.path, impl))
            else:
                impl = TypeScript(impl)

        if isinstance(impl, Inline) and impl.file is None:
            file = f"{self.file + ':' if self.file else ''}{self.name}.ts"
            impl = impl.__class__(impl.code, file)

        return impl

    @property
    def dependencies(self) -> dict[str, str]:
        return getattr(self.cls, "__dependencies__", {})

    @property
    def module(self) -> str:
        return f"custom/{snakify(self.full_name)}"

def get_cache_hook() -> Callable[[CustomModel, Implementation], AttrDict | None]:
    '''Returns the current cache hook used to look up the compiled
       code given the CustomModel and Implementation'''
    return _CACHING_IMPLEMENTATION

def set_cache_hook(hook: Callable[[CustomModel, Implementation], AttrDict | None]) -> None:
    '''Sets a compiled model cache hook used to look up the compiled
       code given the CustomModel and Implementation'''
    global _CACHING_IMPLEMENTATION
    _CACHING_IMPLEMENTATION = hook

def calc_cache_key(custom_models: dict[str, CustomModel]) -> str:
    ''' Generate a key to cache a custom extension implementation with.

    There is no metadata other than the Model classes, so this is the only
    base to generate a cache key.

    We build the model keys from the list of ``model.full_name``. This is
    not ideal but possibly a better solution can be found found later.

    '''
    model_names = {model.full_name for model in custom_models.values()}
    encoded_names = ",".join(sorted(model_names)).encode('utf-8')
    return hashlib.sha256(encoded_names).hexdigest()

_bundle_cache: dict[str, str] = {}

def bundle_models(models: Sequence[type[HasProps]] | None) -> str | None:
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

def bundle_all_models() -> str | None:
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
  let define;
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
    const models = {
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
  const head = document.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  style.type = 'text/css';
  const css = %(css)s;
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
    nodejs_path = settings.nodejs_path()
    nodejs_paths = [nodejs_path] if nodejs_path is not None else ["nodejs", "node"]

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
    version_repr = ".".join(str(x) for x in nodejs_min_version)
    raise RuntimeError(f'node.js v{version_repr} or higher is needed to allow compilation of custom models ' +
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

def _run(app: str, argv: list[str], input: dict[str, Any] | None = None) -> str:
    proc = Popen([app, *argv], stdout=PIPE, stderr=PIPE, stdin=PIPE)
    (stdout, errout) = proc.communicate(input=None if input is None else json.dumps(input).encode())

    if proc.returncode != 0:
        raise RuntimeError(errout.decode('utf-8'))
    else:
        return _crlf_cr_2_lf(stdout.decode('utf-8'))

def _run_nodejs(argv: list[str], input: dict[str, Any] | None = None) -> str:
    return _run(_nodejs_path(), argv, input)

def _run_npmjs(argv: list[str], input: dict[str, Any] | None = None) -> str:
    return _run(_npmjs_path(), argv, input)

def _version(run_app: Callable[[list[str], dict[str, Any] | None], str]) -> str | None:
    try:
        version = run_app(["--version"], None)  # explicit None to make mypy happy
    except RuntimeError:
        return None
    else:
        return version.strip()

def _model_cache_no_op(model: CustomModel, implementation: Implementation) -> AttrDict | None:
    """Return cached compiled implementation"""
    return None

_CACHING_IMPLEMENTATION = _model_cache_no_op

def _get_custom_models(models: Sequence[type[HasProps]] | None) -> dict[str, CustomModel] | None:
    """Returns CustomModels for models with a custom `__implementation__`"""
    custom_models: dict[str, CustomModel] = dict()

    for cls in models or HasProps.model_class_reverse_map.values():
        impl = getattr(cls, "__implementation__", None)

        if impl is not None:
            model = CustomModel(cls)
            custom_models[model.full_name] = model

    return custom_models if custom_models else None

def _compile_models(custom_models: dict[str, CustomModel]) -> dict[str, AttrDict]:
    """Returns the compiled implementation of supplied `models`. """
    ordered_models = sorted(custom_models.values(), key=lambda model: model.full_name)
    custom_impls = {}

    dependencies: list[tuple[str, str]] = []
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
            if "error" in compiled:
                raise CompilationError(compiled.error)

        custom_impls[model.full_name] = compiled

    return custom_impls

def _bundle_models(custom_models: dict[str, CustomModel]) -> str:
    """ Create a JavaScript bundle with selected `models`. """
    exports = []
    modules = []

    lib_dir = Path(bokehjs_dir) / "js" / "lib"
    known_modules: set[str] = set()

    for path in lib_dir.rglob("*.d.ts"):
        s = str(path.relative_to(lib_dir))
        if s.endswith(".d.ts"):
            s = s[:-5] # TODO: removesuffix() (Py 3.9+)
        s = s.replace(os.path.sep, "/")
        known_modules.add(s)

    custom_impls = _compile_models(custom_models)

    extra_modules = {}

    def resolve_modules(to_resolve: set[str], root: str) -> dict[str, str]:
        resolved = {}
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

    def resolve_deps(deps : list[str], root: str) -> dict[str, str]:
        custom_modules = {model.module for model in custom_models.values()}
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

    bare_modules = []
    for i, (module, code, deps) in enumerate(modules):
        for name, ref in deps.items():
            code = code.replace("""require("%s")""" % name, """require("%s")""" % ref)
            code = code.replace("""require('%s')""" % name, """require('%s')""" % ref)
        bare_modules.append((module, code))

    sep = ",\n"

    rendered_exports = sep.join(_export_template % dict(name=name, module=module) for (name, module) in exports)
    rendered_modules = sep.join(_module_template % dict(module=module, source=code) for (module, code) in bare_modules)

    content = _plugin_template % dict(prelude=_plugin_prelude, exports=rendered_exports, modules=rendered_modules)
    return _plugin_umd % dict(content=content)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

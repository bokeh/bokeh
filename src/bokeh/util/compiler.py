#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
from concurrent.futures import Future
from os.path import (
    abspath,
    dirname,
    isabs,
    join,
)
from pathlib import Path
from shutil import which
from subprocess import PIPE, Popen
from threading import Lock
from typing import Any, Callable, Sequence

# Bokeh imports
from .. import __version__
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

bokehjs_dir = settings.bokehjs_path()
nodejs_min_version = (22, 13, 0)

def nodejs_version() -> str | None:
    return _version(_run_nodejs)

def npmjs_version() -> str | None:
    return _version(_run_npmjs)

def nodejs_compile(code: str, lang: str = "javascript", file: str | None = None) -> AttrDict:
    compilejs_script = join(bokehjs_dir, "js", "compiler.js")
    output = _run_nodejs([compilejs_script], dict(code=code, lang=lang, file=file, bokehjs_dir=os.fspath(bokehjs_dir)))
    output = _crlf_cr_2_lf(output)
    lines = output.split("\n")
    i = 0
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
_bundle_futures: dict[str, Future[str]] = {}
_bundle_cache_lock = Lock()
_bundle_compile_lock = Lock()

def bundle_models(models: Sequence[type[HasProps]] | None) -> str | None:
    """Create a bundle of selected `models`. """
    custom_models = _get_custom_models(models)
    if custom_models is None:
        return None

    key = calc_cache_key(custom_models)
    with _bundle_cache_lock:
        if (bundle := _bundle_cache.get(key)) is not None:
            return bundle

        future = _bundle_futures.get(key)
        if future is None:
            future = _bundle_futures[key] = Future()
            compile = True
        else:
            compile = False

    if not compile:
        return future.result()

    try:
        # npm installation and module resolution use shared process state,
        # so distinct bundles are compiled serially.
        with _bundle_compile_lock:
            bundle = _bundle_models(custom_models)
    except BaseException as error:
        with _bundle_cache_lock:
            del _bundle_futures[key]
            future.set_exception(error)
        raise
    else:
        with _bundle_cache_lock:
            _bundle_cache[key] = bundle
            del _bundle_futures[key]
            future.set_result(bundle)
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

def _detect_nodejs() -> Path:
    nodejs_path = settings.nodejs_path()
    if nodejs_path is not None:
        nodejs_paths = [which(nodejs_path) or nodejs_path]
    else:
        nodejs_paths = [path for name in ("nodejs", "node") if (path := which(name)) is not None]

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
                # Version managers can dispatch by the invoked filename (e.g.
                # Volta's node symlink). Keep that name when launching Node.
                return Path(nodejs_path).absolute()

    # if we've reached here, no valid version was found
    version_repr = ".".join(str(x) for x in nodejs_min_version)
    raise RuntimeError(f"node.js v{version_repr} or higher is needed for Bokeh source compilation. "
                       "Install Node.js separately (https://nodejs.org/en/download/ or conda install nodejs), "
                       "or set BOKEH_NODEJS_PATH to an existing compatible runtime.")

_nodejs: Path | None = None
_npmjs: Path | None = None

def _nodejs_path() -> Path:
    global _nodejs
    if _nodejs is None:
        _nodejs = _detect_nodejs()
    return _nodejs

def _find_npmjs() -> Path | None:
    global _npmjs
    if (override := os.environ.get("BOKEH_NPMJS_PATH")) is not None:
        return Path(override)
    if _npmjs is None:
        node = _nodejs_path()
        candidates = [node.parent / "node_modules/npm/bin/npm-cli.js",
                      node.parent.parent / "lib/node_modules/npm/bin/npm-cli.js"]
        if not any(path.is_file() for path in candidates):
            # A version-manager shim may live separately from its selected
            # runtime. Ask Node where it runs without changing its launch path.
            try:
                proc = Popen([node, "--print", "process.execPath"], stdout=PIPE, stderr=PIPE)
                stdout, _ = proc.communicate()
                if proc.returncode == 0:
                    runtime = Path(stdout.decode("utf-8").strip())
                    if runtime.is_absolute():
                        candidates.extend([runtime.parent / "node_modules/npm/bin/npm-cli.js",
                                           runtime.parent.parent / "lib/node_modules/npm/bin/npm-cli.js"])
            except OSError:
                pass
        npm = which("npm.cmd" if sys.platform == "win32" else "npm")
        if npm is not None:
            path = Path(npm).resolve()
            # POSIX npm is commonly a symlink to its CLI. Windows npm.cmd is
            # a shell wrapper, so locate its adjacent JavaScript entry instead.
            if path.suffix in (".js", ".cjs", ".mjs"):
                candidates.append(path)
            candidates.append(path.parent / "node_modules/npm/bin/npm-cli.js")
        _npmjs = next((path for path in candidates if path.is_file()), None)
    return _npmjs

def _npmjs_path() -> Path:
    npm = _find_npmjs()
    if npm is None:
        raise RuntimeError("npm is needed for installing Bokeh compiler tools or extension dependencies. "
                           "Install npm with Node.js and make it available on PATH.")
    return npm

def _nodejs_env(*, npm: bool = False) -> dict[str, str]:
    env = os.environ.copy()
    env["PATH"] = os.pathsep.join([os.fspath(_nodejs_path().parent), env.get("PATH", "")])
    if npm and "BOKEH_NPMJS_PATH" not in env and (npm_path := _find_npmjs()) is not None:
        env["BOKEH_NPMJS_PATH"] = os.fspath(npm_path)
    return env

def _crlf_cr_2_lf(s: str) -> str:
    return re.sub(r"\\r\\n|\\r|\\n", r"\\n", s)

def _run(app: Path, argv: list[str], input: dict[str, Any] | None = None) -> str:
    proc = Popen([app, *argv], stdout=PIPE, stderr=PIPE, stdin=PIPE, env=_nodejs_env())
    (stdout, errout) = proc.communicate(input=None if input is None else json.dumps(input).encode())

    if proc.returncode != 0:
        raise RuntimeError(errout.decode('utf-8'))
    else:
        if errout:
            sys.stderr.write(errout.decode('utf-8'))
        # JSON may contain escaped JavaScript string literals and regexes.
        # Changing those escapes here would alter the bundled program.
        return stdout.decode('utf-8')

def _run_nodejs(argv: list[str], input: dict[str, Any] | None = None) -> str:
    return _run(_nodejs_path(), argv, input)

def _run_npmjs(argv: list[str], input: dict[str, Any] | None = None) -> str:
    return _run(_nodejs_path(), [os.fspath(_npmjs_path()), *argv], input)

def _version(run_app: Callable[[list[str], dict[str, Any] | None], str]) -> str | None:
    try:
        version = run_app(["--version"], None)  # explicit None to make mypy happy
    except (RuntimeError, FileNotFoundError):
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

def _bundle_models(custom_models: dict[str, CustomModel]) -> str:
    """Compile and bundle the complete custom-model graph in one Node request."""
    compiler_dir = bokehjs_dir
    ordered_models = sorted(custom_models.values(), key=lambda model: model.full_name)
    dependencies = sorted(
        (name, version)
        for model in ordered_models
        for name, version in model.dependencies.items()
    )
    if dependencies:
        _run_npmjs(["install", "--no-progress", *[f"{name}@{version}" for name, version in dependencies]])

    models = []
    for model in ordered_models:
        impl = model.implementation
        entry: dict[str, Any] = dict(name=model.name, module=model.module, full_name=model.full_name,
                                    code=impl.code, lang=impl.lang, file=impl.file, path=os.fspath(model.path))
        cached = _CACHING_IMPLEMENTATION(model, impl)
        if cached is not None:
            # Existing cache hooks return the public nodejs_compile CommonJS format.
            # Rolldown consumes it directly alongside newly compiled ESM sources.
            if "error" in cached:
                raise CompilationError(cached.error)
            entry["cached"] = dict(code=cached.code, deps=cached.deps)
        models.append(entry)

    compiler = os.fspath(compiler_dir / "js" / "compiler.js")
    output = _run_nodejs([compiler, "bundle"], dict(models=models, entry=f"custom/main/{calc_cache_key(custom_models)}",
                         bokehjs_dir=os.fspath(compiler_dir), bokeh_version=__version__))
    result = json.loads(output)
    if "error" in result:
        raise CompilationError(result["error"])
    return result["code"]

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

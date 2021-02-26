#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Control global configuration options with environment variables.
A global settings object that other parts of Bokeh can refer to.

Defined Settings
~~~~~~~~~~~~~~~~

Settings are accessible on the ``bokeh.settings.settings`` instance, via
accessor methods. For instance:

.. code-block:: python

    settings.minified()

Bokeh provides the following defined settings:

.. bokeh-settings:: settings
    :module: bokeh.settings

Precedence
~~~~~~~~~~

Setting values are always looked up in the following prescribed order:

immediately supplied values
    These are values that are passed to the setting:

    .. code-block:: python

        settings.minified(minified_val)

    If ``minified_val`` is not None, then it will be returned, as-is.
    Otherwise, if None is passed, then the setting will continute to look
    down the search order for a value. This is useful for passing optional
    function paramters that are None by default. If the parameter is passed
    to the function, then it will take precedence.

previously user-set values
    If the value is set explicity in code:

    .. code-block:: python

        settings.minified = False

    Then this value will take precedence over other sources. Applications
    may use this ability to set values supplied on the command line, so that
    they take precedence over environment variables.

user-specified config override file
    Values from a YAML configuration file that is explicitly loaded:

    .. code-block:: python

        settings.load_config("/path/to/bokeh.yaml)

    Any values from ``bokeh.yaml`` will take precedence over the sources
    below. Applications may offer command line arguments to load such a
    file. e.g. ``bokeh serve --use-config myconf.yaml``

environment variable
    Values found in the associated environment variables:

    .. code-block:: sh

        BOKEH_MINIFIED=no bokeh serve app.py

local user config file
    Bokeh will look for a YAML configuration file in the current user's
    home directory ``${HOME}/.bokeh/bokeh.yaml``.

global system configuration (not yet implemented)
    Future support is planned to load Bokeh settings from global system
    configurations.

local defaults
    These are default values defined when accessing the setting:

    .. code-block:: python

        settings.resources(default="server")

    Local defaults have lower precendence than every other setting mechanism
    except global defaults.

global defaults
    These are default values defined by the setting declarations. They have
    lower precedence than every other setting mechanism.

If no value is obtained after searching all of these locations, then a
RuntimeError will be raised.

API
~~~

There are a few methods on the ``settings`` object:

.. autoclass:: Settings
    :members:

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
import codecs
import os
from os.path import abspath, expanduser, join
from typing import Optional

# External imports
import yaml

# Bokeh imports
from .util.paths import bokehjsdir

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'settings',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def convert_str(value):
    ''' Return a string as-is
    '''
    return value

def convert_bool(value):
    ''' Convert a string to True or False

    If a boolean is passed in, it is returned as-is. Otherwise the function
    maps the following strings, ignoring case:

    * "yes", "1", "on" -> True
    * "no", "0", "off" -> False

    Args:
        value (str):
            A string value to convert to bool

    Returns:
        bool

    Raises:
        ValueError

    '''
    if value in (True, False):
        return value

    val = value.lower()
    if val in ["yes", "1", "on", "true", "True"]:
        return True
    if val in ["no", "0", "off", "false", "False"]:
        return False

    raise ValueError(f"Cannot convert {value} to boolean value")

def convert_str_seq(value):
    ''' Convert a string to a lit of strings

    If a list or tuple is passed in, it is returned as-is.

    Args:
        value (str) :
            A string to convert to a list of strings

    Returns
        list[str]

    '''
    if isinstance(value, (list, tuple)):
        return value

    try:
        return value.split(",")
    except Exception:
        raise ValueError(f"Cannot convert {value} to list value")

_log_levels = {
    "CRITICAL" : logging.CRITICAL,
    "ERROR"    : logging.ERROR,
    "WARNING"  : logging.WARNING,
    "INFO"     : logging.INFO,
    "DEBUG"    : logging.DEBUG,
    "TRACE"    : 9,  # Custom level hard-coded to avoid circular import
    "NONE"     : None,
}

def convert_logging(value):
    '''Convert a string to a Python logging level

    If a log level is passed in, it is returned as-is. Otherwise the function
    understands the following strings, ignoring case:

    * "critical"
    * "error"
    * "warning"
    * "info"
    * "debug"
    * "trace"
    * "none"

    Args:
        value (str):
            A string value to convert to a logging level

    Returns:
        int or None

    Raises:
        ValueError

    '''
    if value in set(_log_levels.values()):
        return value

    value = value.upper()
    if value in _log_levels:
        return _log_levels[value]

    raise ValueError("Cannot convert {} to log level, valid values are: {}".format(value, ", ".join(_log_levels)))

class _Unset: pass

def is_dev():
    return convert_bool(os.environ.get("BOKEH_DEV", False))

class PrioritizedSetting:
    ''' Return a value for a global setting according to configuration precedence.

    The following methods are searched in order for the setting:

    7. immediately supplied values
    6. previously user-set values (e.g. set from command line)
    5. user-specified config override file
    4. environment variable
    3. local user config file
    2. global system config file (not yet implemented)
    1. local defaults
    0. global defaults

    Ref: https://stackoverflow.com/a/11077282/3406693

    If a value cannot be determined, a ValueError is raised.

    The ``env_var`` argument specifies the name of an environment to check for
    setting values, e.g. ``"BOKEH_LOG_LEVEL"``.

    The optional ``default`` argument specified an implicit default value for
    the setting that is returned if no other methods provide a value.

    A ``convert`` agument may be provided to convert values before they are
    returned. For instance to concert log levels in environment variables
    to ``logging`` module values.
    '''

    def __init__(self, name, env_var=None, default=_Unset, dev_default=_Unset, convert=None, help=""):
        self._convert = convert if convert else convert_str
        self._default = default
        self._dev_default = dev_default
        self._env_var = env_var
        self._help = help
        self._name = name
        self._parent = None
        self._user_value = _Unset

    def __call__(self, value=None, default=_Unset):
        '''Return the setting value according to the standard precedence.

        Args:
            value (any, optional):
                An optional immediate value. If not None, the value will
                be converted, then returned.

            default (any, optional):
                An optional default value that only takes precendence over
                implicit default values specified on the property itself.

        Returns:
            str or int or float

        Raises:
            RuntimeError
        '''

        # 7. immediate values
        if value is not None:
            return self._convert(value)

        # 6. previously user-set value
        if self._user_value is not _Unset:
            return self._convert(self._user_value)

        # 5. user-named config file
        if self._parent and self._name in self._parent.config_override:
            return self._convert(self._parent.config_override[self._name])

        # 4. environment variable
        if self._env_var and self._env_var in os.environ:
            return self._convert(os.environ[self._env_var])

        # 3. local config file
        if self._parent and self._name in self._parent.config_user:
            return self._convert(self._parent.config_user[self._name])

        # 2. global config file
        if self._parent and self._name in self._parent.config_system:
            return self._convert(self._parent.config_system[self._name])

        # 1.5 (undocumented) dev defaults take precedence over other defaults
        if is_dev() and self._dev_default is not _Unset:
            return self._convert(self._dev_default)

        # 1. local defaults
        if default is not _Unset:
            return self._convert(default)

        # 0. global defaults
        if self._default is not _Unset:
            return self._convert(self._default)

        raise RuntimeError("No configured value found for setting %r" % self._name)

    def __get__(self, instance, owner):
        return self

    def __set__(self, instance, value):
        self.set_value(value)

    def set_value(self, value):
        ''' Specify a value for this setting programmatically.

        A value set this way takes precedence over all other methods except
        immediate values.

        Args:
            value (str or int or float):
                A user-set value for this setting

        Returns:
            None
        '''
        # This triggers LGTMs "mutable descriptor" warning. Since descriptors
        # are shared among all instances, it is usually not avised to store any
        # data directly on them. But in our case we only ever have one single
        # instance of a Settings object.
        self._user_value = value  # lgtm [py/mutable-descriptor]

    def unset_value(self):
        ''' Unset the previous user value such that the priority is reset.

        '''
        self._user_value = _Unset

    @property
    def env_var(self):
        return self._env_var

    @property
    def default(self):
        return self._default

    @property
    def dev_default(self):
        return self._dev_default

    @property
    def name(self):
        return self._name

    @property
    def help(self):
        return self._help

    @property
    def convert_type(self):
        if self._convert is convert_str: return "String"
        if self._convert is convert_bool: return "Bool"
        if self._convert is convert_logging: return "Log Level"
        if self._convert is convert_str_seq: return "List[String]"

_config_user_locations = (
    join(expanduser("~"), ".bokeh", "bokeh.yaml"),
)

_config_system_locations = ()

class Settings:
    '''

    '''

    def __init__(self):
        self._config_override = {}
        self._config_user = self._try_load_config(_config_user_locations)
        self._config_system = {} # TODO (bev)

        for x in self.__class__.__dict__.values():
            if isinstance(x, PrioritizedSetting):
                x._parent = self

    @property
    def config_system(self):
        return dict(self._config_system)

    @property
    def config_user(self):
        return dict(self._config_user)

    @property
    def config_override(self):
        return dict(self._config_override)

    @property
    def dev(self):
        return is_dev()

    allowed_ws_origin = PrioritizedSetting("allowed_ws_origin", "BOKEH_ALLOW_WS_ORIGIN", default=[], convert=convert_str_seq, help="""
    A comma-separated list of allowed websocket origins for Bokeh server applications.
    """)

    auth_module = PrioritizedSetting("auth_module", "BOKEH_AUTH_MODULE", default=None, help="""
    A path to a Python modules that implements user authentication functions for
    the Bokeh server.

    .. warning::
        The contents of this module will be executed!

    """)

    browser = PrioritizedSetting("browser", "BOKEH_BROWSER", default=None, dev_default="none", help="""
    The default browser that Bokeh should use to show documents with.

    Valid values are any of the browser names understood by the python
    standard library webbrowser_ module.

    .. _webbrowser: https://docs.python.org/2/library/webbrowser.html
    """)

    cdn_version = PrioritizedSetting("version", "BOKEH_CDN_VERSION", default=None, help="""
    What version of BokehJS to use with CDN resources.

    See the :class:`~bokeh.resources.Resources` class reference for full details.
    """)

    cookie_secret = PrioritizedSetting("cookie_secret", "BOKEH_COOKIE_SECRET", default=None, help="""
    Configure the ``cookie_secret`` setting in Tornado. This value is required
    if you use ``get_secure_cookie`` or ``set_secure_cookie``.  It should be a
    long, random sequence of bytes
    """)

    docs_cdn = PrioritizedSetting("docs_cdn", "BOKEH_DOCS_CDN", default=None, help="""
    The version of BokehJS that should be use for loading CDN resources when
    building the docs.

    To build and display the docs using a locally built BokehJS, use ``local``.
    For example:

    .. code-block:: sh

        BOKEH_DOCS_CDN=local make clean serve

    Will build a fresh copy of the docs using the locally built BokehJS and open
    a new browser tab to view them.

    Otherwise, the value is interpreted a version for CDN. For example:

    .. code-block:: sh

        BOKEH_DOCS_CDN=1.4.0rc1 make clean

    will build docs that use BokehJS version ``1.4.0rc1`` from CDN.
    """)

    docs_version = PrioritizedSetting("docs_version", "BOKEH_DOCS_VERSION", default=None, help="""
    The Bokeh version to stipulate when building the docs.

    This setting is necessary to re-deploy existing versions of docs with new
    fixes or changes.
    """)

    ignore_filename = PrioritizedSetting("ignore_filename", "BOKEH_IGNORE_FILENAME", default=False, convert=convert_bool, help="""
    Whether to ignore the current script filename when saving Bokeh content.
    """)

    log_level = PrioritizedSetting("log_level", "BOKEH_LOG_LEVEL", default="info", dev_default="debug", help="""
    Set the log level for JavaScript BokehJS code.

    Valid values are, in order of increasing severity:

    - ``trace``
    - ``debug``
    - ``info``
    - ``warn``
    - ``error``
    - ``fatal``

    """)

    minified = PrioritizedSetting("minified", "BOKEH_MINIFIED", convert=convert_bool, default=True, dev_default=False, help="""
    Whether Bokeh should use minified BokehJS resources.
    """)

    legacy = PrioritizedSetting("legacy", "BOKEH_LEGACY", convert=convert_bool, default=False, dev_default=False, help="""
    Whether Bokeh should use legacy (IE and phantomjs compatible) BokehJS resources.
    """)

    nodejs_path = PrioritizedSetting("nodejs_path", "BOKEH_NODEJS_PATH", default=None, help="""
    Path to the Node executable.

    NodeJS is an optional dependency that is required for PNG and SVG export,
    and for compiling custom extensions. Bokeh will try to automatically locate
    an installed Node executable. Use this environment variable to override the
    location Bokeh finds, or to point to a non-standard location.
    """)

    perform_document_validation = PrioritizedSetting("validate_doc", "BOKEH_VALIDATE_DOC", convert=convert_bool, default=True, help="""
    whether Bokeh should perform validation checks on documents.

    Setting this value to False may afford a small performance improvement.
    """)

    pretty = PrioritizedSetting("pretty", "BOKEH_PRETTY", default=False, dev_default=True, help="""
    Whether JSON strings should be pretty-printed.
    """)

    py_log_level = PrioritizedSetting("py_log_level", "BOKEH_PY_LOG_LEVEL", default="none", dev_default="debug", convert=convert_logging, help="""
    The log level for Python Bokeh code.

    Valid values are, in order of increasing severity:

    - ``trace``
    - ``debug``
    - ``info``
    - ``warn``
    - ``error``
    - ``fatal``
    - ``none``

    """)

    resources = PrioritizedSetting("resources", "BOKEH_RESOURCES", default="cdn", dev_default="absolute-dev", help="""
    What kind of BokehJS resources to configure, e.g ``inline`` or ``cdn``

    See the :class:`~bokeh.resources.Resources` class reference for full details.
    """)

    rootdir = PrioritizedSetting("rootdir", "BOKEH_ROOTDIR", default=None, help="""
    Root directory to use with ``relative`` resources

    See the :class:`~bokeh.resources.Resources` class reference for full details.
    """)

    secret_key = PrioritizedSetting("secret_key", "BOKEH_SECRET_KEY", default=None, help="""
    A long, cryptographically-random secret unique to a Bokeh deployment.
    """)

    sign_sessions = PrioritizedSetting("sign_sessions", "BOKEH_SIGN_SESSIONS", default=False, help="""
    Whether the Boeh server should only allow sessions signed with a secret key.

    If True, ``BOKEH_SECRET_KEY`` must also be set.
    """)

    simple_ids = PrioritizedSetting("simple_ids", "BOKEH_SIMPLE_IDS", default=True, convert=convert_bool, help="""
    Whether Bokeh should use simple integers for model IDs (starting at 1000).

    If False, Bokeh will use UUIDs for object identifiers. This might be needed,
    e.g., if multiple processes are contributing to a single Bokeh Document.
    """)

    ssl_certfile = PrioritizedSetting("ssl_certfile", "BOKEH_SSL_CERTFILE", default=None, help="""
    The path to a certificate file for SSL termination.
    """)

    ssl_keyfile = PrioritizedSetting("ssl_keyfile", "BOKEH_SSL_KEYFILE", default=None, help="""
    The path to a private key file for SSL termination.
    """)

    ssl_password = PrioritizedSetting("ssl_password", "BOKEH_SSL_PASSWORD", default=None, help="""
    A password to decrypt the SSL keyfile, if necessary.
    """)

    strict = PrioritizedSetting("strict", "BOKEH_STRICT", convert=convert_bool, help="""
    Whether validation checks should be strict (i.e. raise errors).
    """)

    xsrf_cookies = PrioritizedSetting("xsrf_cookies", "BOKEH_XSRF_COOKIES", default=False, convert=convert_bool, help="""
    Whether to enable Tornado XSRF cookie protection on the Bokeh server. This
    is only applicable when also using an auth module or custom handlers. See

    https://www.tornadoweb.org/en/stable/guide/security.html#cross-site-request-forgery-protection

    for more information about XSRF protection in Tornado. All PUT, POST, and
    DELETE handlers will need to be appropriately instrumented when this setting
    is active.
    """)

    # Non-settings methods

    def bokehjsdir(self) -> str:
        ''' The location of the BokehJS source tree.

        '''
        return bokehjsdir(self.dev)

    def css_files(self):
        ''' The CSS files in the BokehJS directory.

        '''
        js_files = []
        for root, dirnames, files in os.walk(self.bokehjsdir()):
            for fname in files:
                if fname.endswith(".css"):
                    js_files.append(join(root, fname))
        return js_files

    def js_files(self):
        ''' The JS files in the BokehJS directory.

        '''
        js_files = []
        for root, dirnames, files in os.walk(self.bokehjsdir()):
            for fname in files:
                if fname.endswith(".js"):
                    js_files.append(join(root, fname))
        return js_files

    def load_config(self, location):
        ''' Load a user-specified override config file.

        The file should be a YAML format with ``key: value`` lines.

        '''
        try:
            self._config_override = yaml.load(open(abspath(location)), Loader=yaml.SafeLoader)
        except Exception:
            raise RuntimeError(f"Could not load Bokeh config file: {location}")

    def secret_key_bytes(self) -> Optional[bytes]:
        ''' Return the secret_key, converted to bytes and cached.

        '''
        if not hasattr(self, '_secret_key_bytes'):
            key = self.secret_key()
            if key is None:
                self._secret_key_bytes = None
            else:
                self._secret_key_bytes = codecs.encode(key, "utf-8")
        return self._secret_key_bytes

    def _try_load_config(self, locations):
        for location in locations:
            try:
                return yaml.load(open(location), Loader=yaml.SafeLoader)
            except Exception:
                pass
        return {}

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

settings = Settings()

if settings.secret_key() is not None:
    if len(settings.secret_key()) < 32:
        import warnings
        warnings.warn("BOKEH_SECRET_KEY is recommended to have at least 32 bytes of entropy chosen with a cryptographically-random algorithm")

if settings.sign_sessions() and settings.secret_key() is None:
    import warnings
    warnings.warn("BOKEH_SECRET_KEY must be set if BOKEH_SIGN_SESSIONS is set to True")

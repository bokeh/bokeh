# This deprecation library was adapted from Twisted. Full copyright
# statement retained at the bottom of this file

"""
Deprecation framework for Twisted.

To mark a method or function as being deprecated do this::

    from twisted.python.versions import Version
    from twisted.python.deprecate import deprecated

    @deprecated(Version("Twisted", 8, 0, 0))
    def badAPI(self, first, second):
        '''
        Docstring for badAPI.
        '''
        ...

The newly-decorated badAPI will issue a warning when called. It will also have
a deprecation notice appended to its docstring.

To mark module-level attributes as being deprecated you can use::

    badAttribute = "someValue"

    ...

    deprecatedModuleAttribute(
        Version("Twisted", 8, 0, 0),
        "Use goodAttribute instead.",
        "your.full.module.name",
        "badAttribute")

The deprecated attributes will issue a warning whenever they are accessed. If
the attributes being deprecated are in the same module as the
L{deprecatedModuleAttribute} call is being made from, the C{__name__} global
can be used as the C{moduleName} parameter.

See also L{Version}.

@type DEPRECATION_WARNING_FORMAT: C{str}
@var DEPRECATION_WARNING_FORMAT: The default deprecation warning string format
    to use when one is not provided by the user.
"""

from __future__ import absolute_import

__all__ = [
    'deprecated_module',
    'deprecated',
    'getDeprecationWarningString',
    'getWarningMethod',
    'setWarningMethod',
    'deprecatedModuleAttribute',
    ]

import types, sys, inspect
from warnings import warn, warn_explicit
from dis import findlinestarts


def mergeFunctionMetadata(f, g):
    """
    Overwrite C{g}'s name and docstring with values from C{f}.  Update
    C{g}'s instance dictionary with C{f}'s.

    To use this function safely you must use the return value. In Python 2.3,
    L{mergeFunctionMetadata} will create a new function. In later versions of
    Python, C{g} will be mutated and returned.

    @return: A function that has C{g}'s behavior and metadata merged from
        C{f}.
    """
    try:
        g.__name__ = f.__name__
    except TypeError:
        try:
            merged = types.FunctionType(
                g.func_code, g.func_globals,
                f.__name__, inspect.getargspec(g)[-1],
                g.func_closure)
        except TypeError:
            pass
    else:
        merged = g
    try:
        merged.__doc__ = f.__doc__
    except (TypeError, AttributeError):
        pass
    try:
        merged.__dict__.update(g.__dict__)
        merged.__dict__.update(f.__dict__)
    except (TypeError, AttributeError):
        pass
    merged.__module__ = f.__module__
    return merged


DEPRECATION_WARNING_FORMAT = '%(fqpn)s was deprecated in %(version)s'


# Notionally, part of twisted.python.reflect, but defining it there causes a
# cyclic dependency between this module and that module.  Define it here,
# instead, and let reflect import it to re-expose to the public.
def _fullyQualifiedName(obj):
    """
    Return the fully qualified name of a module, class, method or function.
    Classes and functions need to be module level ones to be correctly
    qualified.

    @rtype: C{str}.
    """
    name = obj.__name__
    if inspect.isclass(obj) or inspect.isfunction(obj):
        moduleName = obj.__module__
        return "%s.%s" % (moduleName, name)
    elif inspect.ismethod(obj):
        className = _fullyQualifiedName(obj.im_class)
        return "%s.%s" % (className, name)
    return name
# Try to keep it looking like something in twisted.python.reflect.
_fullyQualifiedName.__module__ = 'twisted.python.reflect'
_fullyQualifiedName.__name__ = 'fullyQualifiedName'



def getWarningMethod():
    """
    Return the warning method currently used to record deprecation warnings.
    """
    return warn



def setWarningMethod(newMethod):
    """
    Set the warning method to use to record deprecation warnings.

    The callable should take message, category and stacklevel. The return
    value is ignored.
    """
    global warn
    warn = newMethod



def _getDeprecationDocstring(version, replacement=None):
    """
    Generate an addition to a deprecated object's docstring that explains its
    deprecation.

    @param version: the version it was deprecated.
    @type version: L{Version}

    @param replacement: The replacement, if specified.
    @type replacement: C{str} or callable

    @return: a string like "Deprecated in Twisted 27.2.0; please use
        twisted.timestream.tachyon.flux instead."
    """
    doc = "Deprecated in %s" % (version,)
    if replacement:
        doc = "%s; %s" % (doc, _getReplacementString(replacement))
    return doc + "."



def _getReplacementString(replacement):
    """
    Surround a replacement for a deprecated API with some polite text exhorting
    the user to consider it as an alternative.

    @type replacement: C{str} or callable

    @return: a string like "please use twisted.python.modules.getModule
        instead".
    """
    if callable(replacement):
        replacement = _fullyQualifiedName(replacement)
    return "please use %s instead" % (replacement,)



def _getDeprecationWarningString(fqpn, version, format=None, replacement=None):
    """
    Return a string indicating that the Python name was deprecated in the given
    version.

    @param fqpn: Fully qualified Python name of the thing being deprecated
    @type fqpn: C{str}

    @param version: Version that C{fqpn} was deprecated in.
    @type version: L{twisted.python.versions.Version}

    @param format: A user-provided format to interpolate warning values into, or
        L{DEPRECATION_WARNING_FORMAT
        <twisted.python.deprecate.DEPRECATION_WARNING_FORMAT>} if C{None} is
        given.
    @type format: C{str}

    @param replacement: what should be used in place of C{fqpn}. Either pass in
        a string, which will be inserted into the warning message, or a
        callable, which will be expanded to its full import path.
    @type replacement: C{str} or callable

    @return: A textual description of the deprecation
    @rtype: C{str}
    """
    if format is None:
        format = DEPRECATION_WARNING_FORMAT
    warningString = format % {
        'fqpn': fqpn,
        'version': version}
    if replacement:
        warningString = "%s; %s" % (
            warningString, _getReplacementString(replacement))
    return warningString



def getDeprecationWarningString(callableThing, version, format=None,
                                replacement=None):
    """
    Return a string indicating that the callable was deprecated in the given
    version.

    @type callableThing: C{callable}
    @param callableThing: Callable object to be deprecated

    @type version: L{twisted.python.versions.Version}
    @param version: Version that C{callableThing} was deprecated in

    @type format: C{str}
    @param format: A user-provided format to interpolate warning values into,
        or L{DEPRECATION_WARNING_FORMAT
        <twisted.python.deprecate.DEPRECATION_WARNING_FORMAT>} if C{None} is
        given

    @param callableThing: A callable to be deprecated.

    @param version: The L{twisted.python.versions.Version} that the callable
        was deprecated in.

    @param replacement: what should be used in place of the callable. Either
        pass in a string, which will be inserted into the warning message,
        or a callable, which will be expanded to its full import path.
    @type replacement: C{str} or callable

    @return: A string describing the deprecation.
    @rtype: C{str}
    """
    return _getDeprecationWarningString(
        _fullyQualifiedName(callableThing), version, format, replacement)

def deprecated_module(name, version, replacement):
    message = _getDeprecationWarningString(name, version, DEPRECATION_WARNING_FORMAT + ': ' + replacement)
    warn(message, DeprecationWarning, stacklevel=2)

def deprecated(version, replacement=None):
    """
    Return a decorator that marks callables as deprecated.

    @type version: L{twisted.python.versions.Version}
    @param version: The version in which the callable will be marked as
        having been deprecated.  The decorated function will be annotated
        with this version, having it set as its C{deprecatedVersion}
        attribute.

    @param version: the version that the callable was deprecated in.
    @type version: L{twisted.python.versions.Version}

    @param replacement: what should be used in place of the callable. Either
        pass in a string, which will be inserted into the warning message,
        or a callable, which will be expanded to its full import path.
    @type replacement: C{str} or callable
    """
    def deprecationDecorator(function):
        """
        Decorator that marks C{function} as deprecated.
        """
        warningString = getDeprecationWarningString(
            function, version, None, replacement)

        def deprecatedFunction(*args, **kwargs):
            warn(
                warningString,
                DeprecationWarning,
                stacklevel=2)
            return function(*args, **kwargs)

        deprecatedFunction = mergeFunctionMetadata(
            function, deprecatedFunction)
        _appendToDocstring(deprecatedFunction,
                           _getDeprecationDocstring(version, replacement))
        deprecatedFunction.deprecatedVersion = version
        return deprecatedFunction

    return deprecationDecorator



def _appendToDocstring(thingWithDoc, textToAppend):
    """
    Append the given text to the docstring of C{thingWithDoc}.

    If C{thingWithDoc} has no docstring, then the text just replaces the
    docstring. If it has a single-line docstring then it appends a blank line
    and the message text. If it has a multi-line docstring, then in appends a
    blank line a the message text, and also does the indentation correctly.
    """
    if thingWithDoc.__doc__:
        docstringLines = thingWithDoc.__doc__.splitlines()
    else:
        docstringLines = []

    if len(docstringLines) == 0:
        docstringLines.append(textToAppend)
    elif len(docstringLines) == 1:
        docstringLines.extend(['', textToAppend, ''])
    else:
        spaces = docstringLines.pop()
        docstringLines.extend(['',
                               spaces + textToAppend,
                               spaces])
    thingWithDoc.__doc__ = '\n'.join(docstringLines)



class _ModuleProxy(object):
    """
    Python module wrapper to hook module-level attribute access.

    Access to deprecated attributes first checks
    L{_ModuleProxy._deprecatedAttributes}, if the attribute does not appear
    there then access falls through to L{_ModuleProxy._module}, the wrapped
    module object.

    @type _module: C{module}
    @ivar _module: Module on which to hook attribute access.

    @type _deprecatedAttributes: C{dict} mapping C{str} to
        L{_DeprecatedAttribute}
    @ivar _deprecatedAttributes: Mapping of attribute names to objects that
        retrieve the module attribute's original value.
    """
    def __init__(self, module):
        object.__setattr__(self, '_module', module)
        object.__setattr__(self, '_deprecatedAttributes', {})


    def __repr__(self):
        """
        Get a string containing the type of the module proxy and a
        representation of the wrapped module object.
        """
        _module = object.__getattribute__(self, '_module')
        return '<%s module=%r>' % (
            type(self).__name__,
            _module)


    def __setattr__(self, name, value):
        """
        Set an attribute on the wrapped module object.
        """
        _module = object.__getattribute__(self, '_module')
        setattr(_module, name, value)


    def __getattribute__(self, name):
        """
        Get an attribute on the wrapped module object.

        If the specified name has been deprecated then a warning is issued.
        """
        _module = object.__getattribute__(self, '_module')
        _deprecatedAttributes = object.__getattribute__(
            self, '_deprecatedAttributes')

        getter = _deprecatedAttributes.get(name)
        if getter is not None:
            value = getter.get()
        else:
            value = getattr(_module, name)
        return value



class _DeprecatedAttribute(object):
    """
    Wrapper for deprecated attributes.

    This is intended to be used by L{_ModuleProxy}. Calling
    L{_DeprecatedAttribute.get} will issue a warning and retrieve the
    underlying attribute's value.

    @type module: C{module}
    @ivar module: The original module instance containing this attribute

    @type fqpn: C{str}
    @ivar fqpn: Fully qualified Python name for the deprecated attribute

    @type version: L{twisted.python.versions.Version}
    @ivar version: Version that the attribute was deprecated in

    @type message: C{str}
    @ivar message: Deprecation message
    """
    def __init__(self, module, name, version, message):
        """
        Initialise a deprecated name wrapper.
        """
        self.module = module
        self.__name__ = name
        self.fqpn = module.__name__ + '.' + name
        self.version = version
        self.message = message


    def get(self):
        """
        Get the underlying attribute value and issue a deprecation warning.
        """
        # This might fail if the deprecated thing is a module inside a package.
        # In that case, don't emit the warning this time.  The import system
        # will come back again when it's not an AttributeError and we can emit
        # the warning then.
        result = getattr(self.module, self.__name__)
        message = _getDeprecationWarningString(self.fqpn, self.version,
            DEPRECATION_WARNING_FORMAT + ': ' + self.message)
        warn(message, DeprecationWarning, stacklevel=3)
        return result



def _deprecateAttribute(proxy, name, version, message):
    """
    Mark a module-level attribute as being deprecated.

    @type proxy: L{_ModuleProxy}
    @param proxy: The module proxy instance proxying the deprecated attributes

    @type name: C{str}
    @param name: Attribute name

    @type version: L{twisted.python.versions.Version}
    @param version: Version that the attribute was deprecated in

    @type message: C{str}
    @param message: Deprecation message
    """
    _module = object.__getattribute__(proxy, '_module')
    attr = _DeprecatedAttribute(_module, name, version, message)
    # Add a deprecated attribute marker for this module's attribute. When this
    # attribute is accessed via _ModuleProxy a warning is emitted.
    _deprecatedAttributes = object.__getattribute__(
        proxy, '_deprecatedAttributes')
    _deprecatedAttributes[name] = attr



def deprecatedModuleAttribute(version, message, moduleName, name):
    """
    Declare a module-level attribute as being deprecated.

    @type version: L{twisted.python.versions.Version}
    @param version: Version that the attribute was deprecated in

    @type message: C{str}
    @param message: Deprecation message

    @type moduleName: C{str}
    @param moduleName: Fully-qualified Python name of the module containing
        the deprecated attribute; if called from the same module as the
        attributes are being deprecated in, using the C{__name__} global can
        be helpful

    @type name: C{str}
    @param name: Attribute name to deprecate
    """
    module = sys.modules[moduleName]
    if not isinstance(module, _ModuleProxy):
        module = _ModuleProxy(module)
        sys.modules[moduleName] = module

    _deprecateAttribute(module, name, version, message)


def warnAboutFunction(offender, warningString):
    """
    Issue a warning string, identifying C{offender} as the responsible code.

    This function is used to deprecate some behavior of a function.  It differs
    from L{warnings.warn} in that it is not limited to deprecating the behavior
    of a function currently on the call stack.

    @param function: The function that is being deprecated.

    @param warningString: The string that should be emitted by this warning.
    @type warningString: C{str}

    @since: 11.0
    """
    # inspect.getmodule() is attractive, but somewhat
    # broken in Python < 2.6.  See Python bug 4845.
    offenderModule = sys.modules[offender.__module__]
    filename = inspect.getabsfile(offenderModule)
    lineStarts = list(findlinestarts(offender.func_code))
    lastLineNo = lineStarts[-1][1]
    globals = offender.func_globals

    kwargs = dict(
        category=DeprecationWarning,
        filename=filename,
        lineno=lastLineNo,
        module=offenderModule.__name__,
        registry=globals.setdefault("__warningregistry__", {}),
        module_globals=None)

    if sys.version_info[:2] < (2, 5):
        kwargs.pop('module_globals')

    warn_explicit(warningString, **kwargs)



# -*- test-case-name: twisted.python.test.test_deprecate -*-
# Copyright (c) Twisted Matrix Laboratories.

# Copyright (c) 2001-2011
# Allen Short
# Andy Gayton
# Andrew Bennetts
# Antoine Pitrou
# Apple Computer, Inc.
# Benjamin Bruheim
# Bob Ippolito
# Canonical Limited
# Christopher Armstrong
# David Reid
# Donovan Preston
# Eric Mangold
# Eyal Lotem
# Itamar Shtull-Trauring
# James Knight
# Jason A. Mobarak
# Jean-Paul Calderone
# Jessica McKellar
# Jonathan Jacobs
# Jonathan Lange
# Jonathan D. Simms
# Jargen Hermann
# Kevin Horn
# Kevin Turner
# Mary Gardiner
# Matthew Lefkowitz
# Massachusetts Institute of Technology
# Moshe Zadka
# Paul Swartz
# Pavel Pergamenshchik
# Ralph Meijer
# Sean Riley
# Software Freedom Conservancy
# Travis B. Hartwell
# Thijs Triemstra
# Thomas Herve
# Timothy Allen

# Permission is hereby granted, free of charge, to any person obtaining
# a copy of this software and associated documentation files (the
# "Software"), to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so, subject to
# the following conditions:

# The above copyright notice and this permission notice shall be
# included in all copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
# LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
# OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
# WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

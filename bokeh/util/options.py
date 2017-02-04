""" Utilities for specifying, validating, and documenting configuration
options.

"""
from ..core.has_props import HasProps

class Options(HasProps):
    ''' Leverage the Bokeh properties type system for specifying and
    validating configuration options.

    Subclasses of ``Options`` specify a set of configuration options
    using standard Bokeh properties:

    .. code-block:: python

        class ConnectOpts(Options):

            host = String(default="127.0.0.1", help="a host value")

            port = Int(default=5590, help="a port value")

    Then a ``ConnectOpts`` can be created by passing a dictionary
    containing keys and values corresponding to the configuration options,
    as well as any additional keys and values. The items corresponding
    to the properties on ``ConnectOpts`` will be ***removed*** from the
    dictionary. This can be useful for functions that accept their own
    set of config keyword arguments in addition to some set of Bokeh model
    properties.

    '''

    def __init__(self, kw=None):

        # remove any items that match our declared properties
        props = {}
        for k in self.properties():
            if k in kw:
                props[k] = kw.pop(k)

        super(Options, self).__init__(**props)

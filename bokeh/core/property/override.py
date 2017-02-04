''' Provide the ``Override`` class, for overriding base class property
attributes.

.. note::
    This class should normally be imported from ``bokeh.core.properties``
    instead of directly from this module.

'''

class Override(object):
    ''' Override attributes of Bokeh property in derived Models.

    When subclassing a Bokeh Model, it may be desirable to change some of the
    attributes of the property itself, from those on the base class. This is
    accomplished using the ``Override`` class.

    Currently, ``Override`` can only be use to override the ``default`` value
    for the property.

    Keyword Args:
        default (obj) : a default value for this property on a subclass

    Example:

        Consider the following class definitions:

        .. code-block:: python

            from bokeh.model import Model
            from bokeh.properties import Int, Override

            class Parent(Model):
                foo = Int(default=10)

            class Child(Parent):
                foo = Override(default=20)

        The parent class has an integer property ``foo`` with default value
        10.  The child class uses the following code:

        .. code-block:: python

            foo = Override(default=20)

        to specify that the default value for the ``foo`` property should be
        20 on instances of the child class:

        .. code-block:: python

            >>> p = Parent()
            >>> p.foo
            10

            >>> c = Child()
            >>> c.foo
            20

    '''

    def __init__(self, **kwargs):
        if len(kwargs) == 0:
            raise ValueError("Override() doesn't override anything, needs keyword args")
        self.default_overridden = 'default' in kwargs
        if self.default_overridden:
            self.default = kwargs.pop('default')
        if len(kwargs) > 0:
            raise ValueError("Unknown keyword args to Override: %r" % (kwargs))

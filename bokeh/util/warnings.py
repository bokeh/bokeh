''' Provide Bokeh-specific warning subclasses.

The primary use of these subclasses to to force them to be unconditionally
displayed to users by default.

'''

class BokehDeprecationWarning(DeprecationWarning):
    ''' A Bokeh-specific ``DeprecationWarning`` subclass.

    Used to selectively filter Bokeh deprecations for unconditional display.

    '''

class BokehUserWarning(UserWarning):
    ''' A Bokeh-specific ``UserWarning`` subclass.

    Used to selectively filter Bokeh warnings for unconditional display.

    '''

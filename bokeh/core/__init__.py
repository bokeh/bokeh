#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' The ``bokeh.core`` package provides modules that are useful for implementing
Bokeh itself. Documentation for all of them can be accessed through the
sidebar menu. Most of the modules here are probably not of general interest
to most users. However, some are more useful, especially to anyone writing
custom extensions to Bokeh. These are listed below:

:ref:`bokeh.core.enums`
    Properties on Bokeh models support automatic type validation, including
    specifying and validating enumerated values. There are many enumerations
    used across Bokeh. This section has documentation on all the ones that
    are built-in, as well as information about how to create new ones.

:ref:`bokeh.core.properties`
    The fundamental building block of Bokeh apps and documents is the Bokeh
    models, for instance plots, ranges, axes, etc. Bokeh models are comprised
    of properties, which are named attributes with specified types. Model
    properties can automatically validate and serialize themselves. This
    section describes all the property types that can be attached to Bokeh
    models, which is of interest when creating custom extensions.

:ref:`bokeh.core.property_mixins`
    Some collections of properties appear together often. Property mixins
    are groups of properties, such as a ``fill_color`` and ``fill_alpha``,
    that make up a single unit that can be easily applied to Bokeh models
    all at once.

:ref:`bokeh.core.validation`
    When serializing a Document for use by BokehJS, the Bokeh python
    library attempts to detect potential or actual usage problems. These
    are reported as validation warnings or errors, which have unique
    numeric codes and names associated with them. This section is useful
    to find out more specifics about such warnings and errors.

'''

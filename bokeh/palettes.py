###########################################################################
# License regarding the Viridis, Magma, Plasma and Inferno colormaps:
# New matplotlib colormaps by Nathaniel J. Smith, Stefan van der Walt,
# and (in the case of viridis) Eric Firing.
#
# The Viridis, Magma, Plasma, and Inferno colormaps are released under the
# CC0 license / public domain dedication. We would appreciate credit if you
# use or redistribute these colormaps, but do not impose any legal
# restrictions.
#
# To the extent possible under law, the persons who associated CC0 with
# mpl-colormaps have waived all copyright and related or neighboring rights
# to mpl-colormaps.
#
# You should have received a copy of the CC0 legalcode along with this
# work.  If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
###########################################################################
# This product includes color specifications and designs developed by
# Cynthia Brewer (http://colorbrewer2.org/).  The Brewer colormaps are
# licensed under the Apache v2 license. You may obtain a copy of the
# License at http://www.apache.org/licenses/LICENSE-2.0
###########################################################################
# License regarding the D3 color palettes (Category10, Category20,
# Category20b, and Category 20c):
#
# Copyright 2010-2015 Mike Bostock
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
#
# * Redistributions of source code must retain the above copyright notice, this
#   list of conditions and the following disclaimer.
#
# * Redistributions in binary form must reproduce the above copyright notice,
#   this list of conditions and the following disclaimer in the documentation
#   and/or other materials provided with the distribution.
#
# * Neither the name of the author nor the names of contributors may be used to
#   endorse or promote products derived from this software without specific
#   prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE
# FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
# DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
# SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
# CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
# OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
###########################################################################
""" Provide a collection of palettes for color mapping.

In the context of Bokeh, a *palette* is a simple plain Python list of (hex) RGB color
strings. For example the ``Blues8`` palette which looks like :bokeh-palette:`Blues8`
is defined as:

.. code-block:: python

    ['#084594', '#2171b5', '#4292c6', '#6baed6', '#9ecae1', '#c6dbef', '#deebf7', '#f7fbff']

This module contains the following sets of palettes:

* All `ColorBrewer`_ palettes
* Categorical `D3`_ palettes
* The `Matplotlib`_ palettes Magma, Inferno, Plasma, and Viridis
* Palettes designed for color-deficient usability

Additionally, you can also use any of the 256-color perceptually uniform
Bokeh palettes from the external `colorcet`_ package, if it is installed.

----

Every pre-built palette is available as a module attributes, e.g.
``bokeh.palettes.YlGn3`` or ``bokeh.palettes.Viridis256``. The name of each
pre-built palette can be found in the ``__palettes__`` module attribute.

There are also functions such as :func:`~bokeh.palettes.magma` and
:func:`~bokeh.palettes.viridis` that can generate lists of colors of
arbitrary size from special larger palettes.

The Brewer palettes are also collected and grouped by name in a
``brewer`` dictionary, e.g.: ``brewer['Spectral'][6]``. Similarly there are
attributes ``d3``, ``mpl``, and ``colorblind`` that have dictionaries
corresponding to the those groups of palettes.

Finally, all palettes are collected in the ``all_palettes`` palettes
module attrubute, and the "small" palettes (i.e. excluding the ones with 256
colors) are collected and in a ``small_palettes`` attribute.

Built-in Palettes
-----------------

Matplotlib Palettes
~~~~~~~~~~~~~~~~~~~

Bokeh includes the `Matplotlib`_ palettes Magma, Inferno, Plasma, and
Viridis. This section shows the pre-defined small palettes in this groups.
There are also large 256-color versions of these palettes, shown below
in the `Large Palettes`_ section.

.. bokeh-palette-group:: mpl

D3 Palettes
~~~~~~~~~~~

Bokeh includes the categorical palettes from `D3`_, which are shown below:

.. bokeh-palette-group:: d3

Brewer Palettes
~~~~~~~~~~~~~~~

Bokeh includes all the `ColorBrewer`_ palettes, shown below:

.. bokeh-palette-group:: brewer

Usability Palettes
~~~~~~~~~~~~~~~~~~

Bokeh includes some palettes that are useful for addressing color
deficiencies. These are shown below. Additional, several 256-color
perceptually uniform palettes are available in the external
`colorcet`_ package.

.. bokeh-palette-group:: colorblind

Large Palettes
~~~~~~~~~~~~~~

In addition to all the palettes shown above, which are available in the
``small_palettes`` attribute, the ``bokeh.palettes`` module also has some
larger palettes with 256 colors. These are shown below:

:Greys256: :bokeh-palette:`grey(256)` (brewer)

:Inferno256: :bokeh-palette:`inferno(256)` (mpl)

:Magma256: :bokeh-palette:`magma(256)` (mpl)

:Plasma256: :bokeh-palette:`plasma(256)` (mpl)

:Viridis256: :bokeh-palette:`viridis(256)` (mpl)

Other Attributes
----------------

In addition to all the palettes described in the section above, there are the
following notable attributes in the ``bokeh.palettes`` module:

.. data:: __palettes__

    A alphabetical list of the names of all individual palettes in this
    module.

    For example, a the lists of the first eight palette names is given
    by:

    .. code-block:: python

        >>> bp.__palettes__[:8]
        ['Accent3', 'Accent4', 'Accent5', 'Accent6', 'Accent7', 'Accent8', 'Blues3', 'Blues4']


    .. note::
        The full list of all palettes is also available as an enumeration from
        ``bokeh.core.enums``:

        .. bokeh-enum:: Palette
            :module: bokeh.core.enums
            :noindex:

.. data:: all_palettes

    All built-in palette groups. This dictionary is indexed with a palette
    name to obtain a complete group of palettes, e.g. ``Viridis``, and then
    further indexed with an integer to select a palette of a specific size
    from the group:

    .. code-block:: python

        >> all_palettes['Viridis'][4]
        ['#440154', '#30678D', '#35B778', '#FDE724']

    The resulting palette looks like: :bokeh-palette:`all_palettes['Viridis'][4]`

.. data:: brewer

    Palette groups included from `ColorBrewer`_. This dictionary is indexed with
    a palette name to obtain a complete group of palettes, e.g. ``YlGnBu``,
    and then further indexed with an integer to select a palette of a specific
    size from the group:

    .. code-block:: python

        >> brewer['YlGnBu'][4]
        ['#225ea8', '#41b6c4', '#a1dab4', '#ffffcc']

    The resulting palette looks like: :bokeh-palette:`brewer['YlGnBu'][4]`

.. data:: d3

    Categorical palette groups included from `D3`_. This dictionary is indexed
    with a palette name to obtain a complete group of palettes, e.g.
    ``Category20b``, and then further indexed with an integer to select a
    palette of a specific size from the group:

    .. code-block:: python

        >> d3['Category20b'][4]
        ['#393b79', '#5254a3', '#6b6ecf', '#9c9ede']

    The resulting palette looks like: :bokeh-palette:`d3['Category20b'][4]`

    The names of the D3 palette groups are: ``Category10``, ``Category20``,
    ``Category20b``, ``Category20c``

.. data:: mpl

    Palette groups included from `Matplotlib`_. This dictionary is indexed with
    a palette name to obtain a complete group of palettes, e.g. ``Plasma``,
    and then further indexed with an integer to select a palette of a specific
    size from the group:

    .. code-block:: python

        >> mpl['Plasma'][4]
        ['#440154', '#30678D', '#35B778', '#FDE724']

    The resulting palette looks like: :bokeh-palette:`mpl['Plasma'][4]`

    The names of the MPL palette groups are: ``Inferno``, ``Magma``
    ``Plasma``, ``Viridis``

.. data:: small_palettes

    All palette groups, excluding 256-length palettes. This dictionary is
    indexed with a palette name to obtain a complete group of palettes, e.g.
    ``Viridis``, and then further indexed with an integer to select a palette
    of a specific size from the group:

    .. code-block:: python

        >> small_palettes['Viridis'][4]
        ['#440154', '#30678D', '#35B778', '#FDE724']

    The resulting palette looks like: :bokeh-palette:`small_palettes['Viridis'][4]`

Functions
---------

The ``bokeh.palettes`` module also has several functions that can be used
to generate palettes of arbitrary size.

.. autofunction:: bokeh.palettes.gray(n)
.. autofunction:: bokeh.palettes.grey(n)
.. autofunction:: bokeh.palettes.inferno(n)
.. autofunction:: bokeh.palettes.linear_palette(palette, n)
.. autofunction:: bokeh.palettes.magma(n)
.. autofunction:: bokeh.palettes.viridis(n)

Licenses
--------

The respective licenses for all the palettes included in Bokeh are
viewable as a comment at the top of the :bokeh-tree:`bokeh/palettes.py`
source file.

.. _ColorBrewer: http://colorbrewer2.org/#type=sequential&scheme=BuGn&n=3
.. _colorcet: https://bokeh.github.io/colorcet
.. _D3: https://github.com/d3/d3-3.x-api-reference/blob/master/Ordinal-Scales.md#categorical-colors
.. _Matplotlib: http://matplotlib.org/examples/color/colormaps_reference.html

"""

import sys as _sys
import types as _types

# Notes to developers:
#
# In order to prevent users from unintentionally modifying built-in palettes
# (which can result in subtle bugs), the bokeh.palettes modules uses the
# "class module" trick, to install a _PalettesModule instance in place of the
# actual module. The _PalettesModule should provide palettes as simple methods
# accepting only self, that return *new* lists of colors. These functions will
# automatically be turned into property getters with the _autoprop class
# decorator below, making the palettes appear to be simple module attributes,
# but guaranteeing that every usage is a new copy of the list of colors.
#
# An example of an appropriate palette method would be:
#
#    def YlGn3(self): return ["#31a354", "#addd8e", "#f7fcb9"]
#
# Once defined, this will be available to users as bokeh.palettes.YlGn3
#
# Any "real" functions that the "module" should have should be added to the
# exclusion list inside _autoprop, or have their names start with "_". Any
# other methods on _PalettesModule will be automatically made into properties.
#
# Because of the complicated and unusual nature of the "class module", Sphinx
# requires some manual assistance to correctly generate documentation. When
# making any changes to this file, please makes sure to check and appropriately
# update the docstring at the top.

def _autoprop(cls):
    for k, v in cls.__dict__.items():
        if k.startswith('_'): continue
        if k in ['linear_palette', 'magma', 'inferno', 'plasma', 'viridis', 'grey', 'gray']:
            continue
        setattr(cls, k, property(v))
    return cls

@_autoprop
class _PalettesModule(_types.ModuleType):
    def YlGn3(self): return ["#31a354", "#addd8e", "#f7fcb9"]
    def YlGn4(self): return ["#238443", "#78c679", "#c2e699", "#ffffcc"]
    def YlGn5(self): return ["#006837", "#31a354", "#78c679", "#c2e699", "#ffffcc"]
    def YlGn6(self): return ["#006837", "#31a354", "#78c679", "#addd8e", "#d9f0a3", "#ffffcc"]
    def YlGn7(self): return ["#005a32", "#238443", "#41ab5d", "#78c679", "#addd8e", "#d9f0a3", "#ffffcc"]
    def YlGn8(self): return ["#005a32", "#238443", "#41ab5d", "#78c679", "#addd8e", "#d9f0a3", "#f7fcb9", "#ffffe5"]
    def YlGn9(self): return ["#004529", "#006837", "#238443", "#41ab5d", "#78c679", "#addd8e", "#d9f0a3", "#f7fcb9", "#ffffe5"]

    def YlGnBu3(self): return ["#2c7fb8", "#7fcdbb", "#edf8b1"]
    def YlGnBu4(self): return ["#225ea8", "#41b6c4", "#a1dab4", "#ffffcc"]
    def YlGnBu5(self): return ["#253494", "#2c7fb8", "#41b6c4", "#a1dab4", "#ffffcc"]
    def YlGnBu6(self): return ["#253494", "#2c7fb8", "#41b6c4", "#7fcdbb", "#c7e9b4", "#ffffcc"]
    def YlGnBu7(self): return ["#0c2c84", "#225ea8", "#1d91c0", "#41b6c4", "#7fcdbb", "#c7e9b4", "#ffffcc"]
    def YlGnBu8(self): return ["#0c2c84", "#225ea8", "#1d91c0", "#41b6c4", "#7fcdbb", "#c7e9b4", "#edf8b1", "#ffffd9"]
    def YlGnBu9(self): return ["#081d58", "#253494", "#225ea8", "#1d91c0", "#41b6c4", "#7fcdbb", "#c7e9b4", "#edf8b1", "#ffffd9"]

    def GnBu3(self): return ["#43a2ca", "#a8ddb5", "#e0f3db"]
    def GnBu4(self): return ["#2b8cbe", "#7bccc4", "#bae4bc", "#f0f9e8"]
    def GnBu5(self): return ["#0868ac", "#43a2ca", "#7bccc4", "#bae4bc", "#f0f9e8"]
    def GnBu6(self): return ["#0868ac", "#43a2ca", "#7bccc4", "#a8ddb5", "#ccebc5", "#f0f9e8"]
    def GnBu7(self): return ["#08589e", "#2b8cbe", "#4eb3d3", "#7bccc4", "#a8ddb5", "#ccebc5", "#f0f9e8"]
    def GnBu8(self): return ["#08589e", "#2b8cbe", "#4eb3d3", "#7bccc4", "#a8ddb5", "#ccebc5", "#e0f3db", "#f7fcf0"]
    def GnBu9(self): return ["#084081", "#0868ac", "#2b8cbe", "#4eb3d3", "#7bccc4", "#a8ddb5", "#ccebc5", "#e0f3db", "#f7fcf0"]

    def BuGn3(self): return ["#2ca25f", "#99d8c9", "#e5f5f9"]
    def BuGn4(self): return ["#238b45", "#66c2a4", "#b2e2e2", "#edf8fb"]
    def BuGn5(self): return ["#006d2c", "#2ca25f", "#66c2a4", "#b2e2e2", "#edf8fb"]
    def BuGn6(self): return ["#006d2c", "#2ca25f", "#66c2a4", "#99d8c9", "#ccece6", "#edf8fb"]
    def BuGn7(self): return ["#005824", "#238b45", "#41ae76", "#66c2a4", "#99d8c9", "#ccece6", "#edf8fb"]
    def BuGn8(self): return ["#005824", "#238b45", "#41ae76", "#66c2a4", "#99d8c9", "#ccece6", "#e5f5f9", "#f7fcfd"]
    def BuGn9(self): return ["#00441b", "#006d2c", "#238b45", "#41ae76", "#66c2a4", "#99d8c9", "#ccece6", "#e5f5f9", "#f7fcfd"]

    def PuBuGn3(self): return ["#1c9099", "#a6bddb", "#ece2f0"]
    def PuBuGn4(self): return ["#02818a", "#67a9cf", "#bdc9e1", "#f6eff7"]
    def PuBuGn5(self): return ["#016c59", "#1c9099", "#67a9cf", "#bdc9e1", "#f6eff7"]
    def PuBuGn6(self): return ["#016c59", "#1c9099", "#67a9cf", "#a6bddb", "#d0d1e6", "#f6eff7"]
    def PuBuGn7(self): return ["#016450", "#02818a", "#3690c0", "#67a9cf", "#a6bddb", "#d0d1e6", "#f6eff7"]
    def PuBuGn8(self): return ["#016450", "#02818a", "#3690c0", "#67a9cf", "#a6bddb", "#d0d1e6", "#ece2f0", "#fff7fb"]
    def PuBuGn9(self): return ["#014636", "#016c59", "#02818a", "#3690c0", "#67a9cf", "#a6bddb", "#d0d1e6", "#ece2f0", "#fff7fb"]

    def PuBu3(self): return ["#2b8cbe", "#a6bddb", "#ece7f2"]
    def PuBu4(self): return ["#0570b0", "#74a9cf", "#bdc9e1", "#f1eef6"]
    def PuBu5(self): return ["#045a8d", "#2b8cbe", "#74a9cf", "#bdc9e1", "#f1eef6"]
    def PuBu6(self): return ["#045a8d", "#2b8cbe", "#74a9cf", "#a6bddb", "#d0d1e6", "#f1eef6"]
    def PuBu7(self): return ["#034e7b", "#0570b0", "#3690c0", "#74a9cf", "#a6bddb", "#d0d1e6", "#f1eef6"]
    def PuBu8(self): return ["#034e7b", "#0570b0", "#3690c0", "#74a9cf", "#a6bddb", "#d0d1e6", "#ece7f2", "#fff7fb"]
    def PuBu9(self): return ["#023858", "#045a8d", "#0570b0", "#3690c0", "#74a9cf", "#a6bddb", "#d0d1e6", "#ece7f2", "#fff7fb"]

    def BuPu3(self): return ["#8856a7", "#9ebcda", "#e0ecf4"]
    def BuPu4(self): return ["#88419d", "#8c96c6", "#b3cde3", "#edf8fb"]
    def BuPu5(self): return ["#810f7c", "#8856a7", "#8c96c6", "#b3cde3", "#edf8fb"]
    def BuPu6(self): return ["#810f7c", "#8856a7", "#8c96c6", "#9ebcda", "#bfd3e6", "#edf8fb"]
    def BuPu7(self): return ["#6e016b", "#88419d", "#8c6bb1", "#8c96c6", "#9ebcda", "#bfd3e6", "#edf8fb"]
    def BuPu8(self): return ["#6e016b", "#88419d", "#8c6bb1", "#8c96c6", "#9ebcda", "#bfd3e6", "#e0ecf4", "#f7fcfd"]
    def BuPu9(self): return ["#4d004b", "#810f7c", "#88419d", "#8c6bb1", "#8c96c6", "#9ebcda", "#bfd3e6", "#e0ecf4", "#f7fcfd"]

    def RdPu3(self): return ["#c51b8a", "#fa9fb5", "#fde0dd"]
    def RdPu4(self): return ["#ae017e", "#f768a1", "#fbb4b9", "#feebe2"]
    def RdPu5(self): return ["#7a0177", "#c51b8a", "#f768a1", "#fbb4b9", "#feebe2"]
    def RdPu6(self): return ["#7a0177", "#c51b8a", "#f768a1", "#fa9fb5", "#fcc5c0", "#feebe2"]
    def RdPu7(self): return ["#7a0177", "#ae017e", "#dd3497", "#f768a1", "#fa9fb5", "#fcc5c0", "#feebe2"]
    def RdPu8(self): return ["#7a0177", "#ae017e", "#dd3497", "#f768a1", "#fa9fb5", "#fcc5c0", "#fde0dd", "#fff7f3"]
    def RdPu9(self): return ["#49006a", "#7a0177", "#ae017e", "#dd3497", "#f768a1", "#fa9fb5", "#fcc5c0", "#fde0dd", "#fff7f3"]

    def PuRd3(self): return ["#dd1c77", "#c994c7", "#e7e1ef"]
    def PuRd4(self): return ["#ce1256", "#df65b0", "#d7b5d8", "#f1eef6"]
    def PuRd5(self): return ["#980043", "#dd1c77", "#df65b0", "#d7b5d8", "#f1eef6"]
    def PuRd6(self): return ["#980043", "#dd1c77", "#df65b0", "#c994c7", "#d4b9da", "#f1eef6"]
    def PuRd7(self): return ["#91003f", "#ce1256", "#e7298a", "#df65b0", "#c994c7", "#d4b9da", "#f1eef6"]
    def PuRd8(self): return ["#91003f", "#ce1256", "#e7298a", "#df65b0", "#c994c7", "#d4b9da", "#e7e1ef", "#f7f4f9"]
    def PuRd9(self): return ["#67001f", "#980043", "#ce1256", "#e7298a", "#df65b0", "#c994c7", "#d4b9da", "#e7e1ef", "#f7f4f9"]

    def OrRd3(self): return ["#e34a33", "#fdbb84", "#fee8c8"]
    def OrRd4(self): return ["#d7301f", "#fc8d59", "#fdcc8a", "#fef0d9"]
    def OrRd5(self): return ["#b30000", "#e34a33", "#fc8d59", "#fdcc8a", "#fef0d9"]
    def OrRd6(self): return ["#b30000", "#e34a33", "#fc8d59", "#fdbb84", "#fdd49e", "#fef0d9"]
    def OrRd7(self): return ["#990000", "#d7301f", "#ef6548", "#fc8d59", "#fdbb84", "#fdd49e", "#fef0d9"]
    def OrRd8(self): return ["#990000", "#d7301f", "#ef6548", "#fc8d59", "#fdbb84", "#fdd49e", "#fee8c8", "#fff7ec"]
    def OrRd9(self): return ["#7f0000", "#b30000", "#d7301f", "#ef6548", "#fc8d59", "#fdbb84", "#fdd49e", "#fee8c8", "#fff7ec"]

    def YlOrRd3(self): return ["#f03b20", "#feb24c", "#ffeda0"]
    def YlOrRd4(self): return ["#e31a1c", "#fd8d3c", "#fecc5c", "#ffffb2"]
    def YlOrRd5(self): return ["#bd0026", "#f03b20", "#fd8d3c", "#fecc5c", "#ffffb2"]
    def YlOrRd6(self): return ["#bd0026", "#f03b20", "#fd8d3c", "#feb24c", "#fed976", "#ffffb2"]
    def YlOrRd7(self): return ["#b10026", "#e31a1c", "#fc4e2a", "#fd8d3c", "#feb24c", "#fed976", "#ffffb2"]
    def YlOrRd8(self): return ["#b10026", "#e31a1c", "#fc4e2a", "#fd8d3c", "#feb24c", "#fed976", "#ffeda0", "#ffffcc"]
    def YlOrRd9(self): return ["#800026", "#bd0026", "#e31a1c", "#fc4e2a", "#fd8d3c", "#feb24c", "#fed976", "#ffeda0", "#ffffcc"]

    def YlOrBr3(self): return ["#d95f0e", "#fec44f", "#fff7bc"]
    def YlOrBr4(self): return ["#cc4c02", "#fe9929", "#fed98e", "#ffffd4"]
    def YlOrBr5(self): return ["#993404", "#d95f0e", "#fe9929", "#fed98e", "#ffffd4"]
    def YlOrBr6(self): return ["#993404", "#d95f0e", "#fe9929", "#fec44f", "#fee391", "#ffffd4"]
    def YlOrBr7(self): return ["#8c2d04", "#cc4c02", "#ec7014", "#fe9929", "#fec44f", "#fee391", "#ffffd4"]
    def YlOrBr8(self): return ["#8c2d04", "#cc4c02", "#ec7014", "#fe9929", "#fec44f", "#fee391", "#fff7bc", "#ffffe5"]
    def YlOrBr9(self): return ["#662506", "#993404", "#cc4c02", "#ec7014", "#fe9929", "#fec44f", "#fee391", "#fff7bc", "#ffffe5"]

    def Purples3(self): return ["#756bb1", "#bcbddc", "#efedf5"]
    def Purples4(self): return ["#6a51a3", "#9e9ac8", "#cbc9e2", "#f2f0f7"]
    def Purples5(self): return ["#54278f", "#756bb1", "#9e9ac8", "#cbc9e2", "#f2f0f7"]
    def Purples6(self): return ["#54278f", "#756bb1", "#9e9ac8", "#bcbddc", "#dadaeb", "#f2f0f7"]
    def Purples7(self): return ["#4a1486", "#6a51a3", "#807dba", "#9e9ac8", "#bcbddc", "#dadaeb", "#f2f0f7"]
    def Purples8(self): return ["#4a1486", "#6a51a3", "#807dba", "#9e9ac8", "#bcbddc", "#dadaeb", "#efedf5", "#fcfbfd"]
    def Purples9(self): return ["#3f007d", "#54278f", "#6a51a3", "#807dba", "#9e9ac8", "#bcbddc", "#dadaeb", "#efedf5", "#fcfbfd"]

    def Blues3(self): return ["#3182bd", "#9ecae1", "#deebf7"]
    def Blues4(self): return ["#2171b5", "#6baed6", "#bdd7e7", "#eff3ff"]
    def Blues5(self): return ["#08519c", "#3182bd", "#6baed6", "#bdd7e7", "#eff3ff"]
    def Blues6(self): return ["#08519c", "#3182bd", "#6baed6", "#9ecae1", "#c6dbef", "#eff3ff"]
    def Blues7(self): return ["#084594", "#2171b5", "#4292c6", "#6baed6", "#9ecae1", "#c6dbef", "#eff3ff"]
    def Blues8(self): return ["#084594", "#2171b5", "#4292c6", "#6baed6", "#9ecae1", "#c6dbef", "#deebf7", "#f7fbff"]
    def Blues9(self): return ["#08306b", "#08519c", "#2171b5", "#4292c6", "#6baed6", "#9ecae1", "#c6dbef", "#deebf7", "#f7fbff"]

    def Greens3(self): return ["#31a354", "#a1d99b", "#e5f5e0"]
    def Greens4(self): return ["#238b45", "#74c476", "#bae4b3", "#edf8e9"]
    def Greens5(self): return ["#006d2c", "#31a354", "#74c476", "#bae4b3", "#edf8e9"]
    def Greens6(self): return ["#006d2c", "#31a354", "#74c476", "#a1d99b", "#c7e9c0", "#edf8e9"]
    def Greens7(self): return ["#005a32", "#238b45", "#41ab5d", "#74c476", "#a1d99b", "#c7e9c0", "#edf8e9"]
    def Greens8(self): return ["#005a32", "#238b45", "#41ab5d", "#74c476", "#a1d99b", "#c7e9c0", "#e5f5e0", "#f7fcf5"]
    def Greens9(self): return ["#00441b", "#006d2c", "#238b45", "#41ab5d", "#74c476", "#a1d99b", "#c7e9c0", "#e5f5e0", "#f7fcf5"]

    def Oranges3(self): return ["#e6550d", "#fdae6b", "#fee6ce"]
    def Oranges4(self): return ["#d94701", "#fd8d3c", "#fdbe85", "#feedde"]
    def Oranges5(self): return ["#a63603", "#e6550d", "#fd8d3c", "#fdbe85", "#feedde"]
    def Oranges6(self): return ["#a63603", "#e6550d", "#fd8d3c", "#fdae6b", "#fdd0a2", "#feedde"]
    def Oranges7(self): return ["#8c2d04", "#d94801", "#f16913", "#fd8d3c", "#fdae6b", "#fdd0a2", "#feedde"]
    def Oranges8(self): return ["#8c2d04", "#d94801", "#f16913", "#fd8d3c", "#fdae6b", "#fdd0a2", "#fee6ce", "#fff5eb"]
    def Oranges9(self): return ["#7f2704", "#a63603", "#d94801", "#f16913", "#fd8d3c", "#fdae6b", "#fdd0a2", "#fee6ce", "#fff5eb"]

    def Reds3(self): return ["#de2d26", "#fc9272", "#fee0d2"]
    def Reds4(self): return ["#cb181d", "#fb6a4a", "#fcae91", "#fee5d9"]
    def Reds5(self): return ["#a50f15", "#de2d26", "#fb6a4a", "#fcae91", "#fee5d9"]
    def Reds6(self): return ["#a50f15", "#de2d26", "#fb6a4a", "#fc9272", "#fcbba1", "#fee5d9"]
    def Reds7(self): return ["#99000d", "#cb181d", "#ef3b2c", "#fb6a4a", "#fc9272", "#fcbba1", "#fee5d9"]
    def Reds8(self): return ["#99000d", "#cb181d", "#ef3b2c", "#fb6a4a", "#fc9272", "#fcbba1", "#fee0d2", "#fff5f0"]
    def Reds9(self): return ["#67000d", "#a50f15", "#cb181d", "#ef3b2c", "#fb6a4a", "#fc9272", "#fcbba1", "#fee0d2", "#fff5f0"]

    def Greys3(self):  return ["#636363", "#bdbdbd", "#f0f0f0"]
    def Greys4(self):  return ["#525252", "#969696", "#cccccc", "#f7f7f7"]
    def Greys5(self):  return ["#252525", "#636363", "#969696", "#cccccc", "#f7f7f7"]
    def Greys6(self):  return ["#252525", "#636363", "#969696", "#bdbdbd", "#d9d9d9", "#f7f7f7"]
    def Greys7(self):  return ["#252525", "#525252", "#737373", "#969696", "#bdbdbd", "#d9d9d9", "#f7f7f7"]
    def Greys8(self):  return ["#252525", "#525252", "#737373", "#969696", "#bdbdbd", "#d9d9d9", "#f0f0f0", "#ffffff"]
    def Greys9(self):  return ["#000000", "#252525", "#525252", "#737373", "#969696", "#bdbdbd", "#d9d9d9", "#f0f0f0", "#ffffff"]
    def Greys10(self): return ['#000000', '#1c1c1c', '#383838', '#555555', '#717171', '#8d8d8d', '#aaaaaa', '#c6c6c6', '#e2e2e2', '#ffffff']
    def Greys11(self): return ['#000000', '#191919', '#333333', '#4c4c4c', '#666666', '#7f7f7f', '#999999', '#b2b2b2', '#cccccc', '#e5e5e5', '#ffffff']
    def Greys256(self):
        return [
            "#000000", "#010101", "#020202", "#030303", "#040404", "#050505", "#060606", "#070707", "#080808", "#090909", "#0a0a0a", "#0b0b0b",
            "#0c0c0c", "#0d0d0d", "#0e0e0e", "#0f0f0f", "#101010", "#111111", "#121212", "#131313", "#141414", "#151515", "#161616", "#171717",
            "#181818", "#191919", "#1a1a1a", "#1b1b1b", "#1c1c1c", "#1d1d1d", "#1e1e1e", "#1f1f1f", "#202020", "#212121", "#222222", "#232323",
            "#242424", "#252525", "#262626", "#272727", "#282828", "#292929", "#2a2a2a", "#2b2b2b", "#2c2c2c", "#2d2d2d", "#2e2e2e", "#2f2f2f",
            "#303030", "#313131", "#323232", "#333333", "#343434", "#353535", "#363636", "#373737", "#383838", "#393939", "#3a3a3a", "#3b3b3b",
            "#3c3c3c", "#3d3d3d", "#3e3e3e", "#3f3f3f", "#404040", "#414141", "#424242", "#434343", "#444444", "#454545", "#464646", "#474747",
            "#484848", "#494949", "#4a4a4a", "#4b4b4b", "#4c4c4c", "#4d4d4d", "#4e4e4e", "#4f4f4f", "#505050", "#515151", "#525252", "#535353",
            "#545454", "#555555", "#565656", "#575757", "#585858", "#595959", "#5a5a5a", "#5b5b5b", "#5c5c5c", "#5d5d5d", "#5e5e5e", "#5f5f5f",
            "#606060", "#616161", "#626262", "#636363", "#646464", "#656565", "#666666", "#676767", "#686868", "#696969", "#6a6a6a", "#6b6b6b",
            "#6c6c6c", "#6d6d6d", "#6e6e6e", "#6f6f6f", "#707070", "#717171", "#727272", "#737373", "#747474", "#757575", "#767676", "#777777",
            "#787878", "#797979", "#7a7a7a", "#7b7b7b", "#7c7c7c", "#7d7d7d", "#7e7e7e", "#7f7f7f", "#808080", "#818181", "#828282", "#838383",
            "#848484", "#858585", "#868686", "#878787", "#888888", "#898989", "#8a8a8a", "#8b8b8b", "#8c8c8c", "#8d8d8d", "#8e8e8e", "#8f8f8f",
            "#909090", "#919191", "#929292", "#939393", "#949494", "#959595", "#969696", "#979797", "#989898", "#999999", "#9a9a9a", "#9b9b9b",
            "#9c9c9c", "#9d9d9d", "#9e9e9e", "#9f9f9f", "#a0a0a0", "#a1a1a1", "#a2a2a2", "#a3a3a3", "#a4a4a4", "#a5a5a5", "#a6a6a6", "#a7a7a7",
            "#a8a8a8", "#a9a9a9", "#aaaaaa", "#ababab", "#acacac", "#adadad", "#aeaeae", "#afafaf", "#b0b0b0", "#b1b1b1", "#b2b2b2", "#b3b3b3",
            "#b4b4b4", "#b5b5b5", "#b6b6b6", "#b7b7b7", "#b8b8b8", "#b9b9b9", "#bababa", "#bbbbbb", "#bcbcbc", "#bdbdbd", "#bebebe", "#bfbfbf",
            "#c0c0c0", "#c1c1c1", "#c2c2c2", "#c3c3c3", "#c4c4c4", "#c5c5c5", "#c6c6c6", "#c7c7c7", "#c8c8c8", "#c9c9c9", "#cacaca", "#cbcbcb",
            "#cccccc", "#cdcdcd", "#cecece", "#cfcfcf", "#d0d0d0", "#d1d1d1", "#d2d2d2", "#d3d3d3", "#d4d4d4", "#d5d5d5", "#d6d6d6", "#d7d7d7",
            "#d8d8d8", "#d9d9d9", "#dadada", "#dbdbdb", "#dcdcdc", "#dddddd", "#dedede", "#dfdfdf", "#e0e0e0", "#e1e1e1", "#e2e2e2", "#e3e3e3",
            "#e4e4e4", "#e5e5e5", "#e6e6e6", "#e7e7e7", "#e8e8e8", "#e9e9e9", "#eaeaea", "#ebebeb", "#ececec", "#ededed", "#eeeeee", "#efefef",
            "#f0f0f0", "#f1f1f1", "#f2f2f2", "#f3f3f3", "#f4f4f4", "#f5f5f5", "#f6f6f6", "#f7f7f7", "#f8f8f8", "#f9f9f9", "#fafafa", "#fbfbfb",
            "#fcfcfc", "#fdfdfd", "#fefefe", "#ffffff"]

    def PuOr3(self):  return ["#998ec3", "#f7f7f7", "#f1a340"]
    def PuOr4(self):  return ["#5e3c99", "#b2abd2", "#fdb863", "#e66101"]
    def PuOr5(self):  return ["#5e3c99", "#b2abd2", "#f7f7f7", "#fdb863", "#e66101"]
    def PuOr6(self):  return ["#542788", "#998ec3", "#d8daeb", "#fee0b6", "#f1a340", "#b35806"]
    def PuOr7(self):  return ["#542788", "#998ec3", "#d8daeb", "#f7f7f7", "#fee0b6", "#f1a340", "#b35806"]
    def PuOr8(self):  return ["#542788", "#8073ac", "#b2abd2", "#d8daeb", "#fee0b6", "#fdb863", "#e08214", "#b35806"]
    def PuOr9(self):  return ["#542788", "#8073ac", "#b2abd2", "#d8daeb", "#f7f7f7", "#fee0b6", "#fdb863", "#e08214", "#b35806"]
    def PuOr10(self): return ["#2d004b", "#542788", "#8073ac", "#b2abd2", "#d8daeb", "#fee0b6", "#fdb863", "#e08214", "#b35806", "#7f3b08"]
    def PuOr11(self): return ["#2d004b", "#542788", "#8073ac", "#b2abd2", "#d8daeb", "#f7f7f7", "#fee0b6", "#fdb863", "#e08214", "#b35806", "#7f3b08"]

    def BrBG3(self):  return ["#5ab4ac", "#f5f5f5", "#d8b365"]
    def BrBG4(self):  return ["#018571", "#80cdc1", "#dfc27d", "#a6611a"]
    def BrBG5(self):  return ["#018571", "#80cdc1", "#f5f5f5", "#dfc27d", "#a6611a"]
    def BrBG6(self):  return ["#01665e", "#5ab4ac", "#c7eae5", "#f6e8c3", "#d8b365", "#8c510a"]
    def BrBG7(self):  return ["#01665e", "#5ab4ac", "#c7eae5", "#f5f5f5", "#f6e8c3", "#d8b365", "#8c510a"]
    def BrBG8(self):  return ["#01665e", "#35978f", "#80cdc1", "#c7eae5", "#f6e8c3", "#dfc27d", "#bf812d", "#8c510a"]
    def BrBG9(self):  return ["#01665e", "#35978f", "#80cdc1", "#c7eae5", "#f5f5f5", "#f6e8c3", "#dfc27d", "#bf812d", "#8c510a"]
    def BrBG10(self): return ["#003c30", "#01665e", "#35978f", "#80cdc1", "#c7eae5", "#f6e8c3", "#dfc27d", "#bf812d", "#8c510a", "#543005"]
    def BrBG11(self): return ["#003c30", "#01665e", "#35978f", "#80cdc1", "#c7eae5", "#f5f5f5", "#f6e8c3", "#dfc27d", "#bf812d", "#8c510a", "#543005"]

    def PRGn3(self):  return ["#7fbf7b", "#f7f7f7", "#af8dc3"]
    def PRGn4(self):  return ["#008837", "#a6dba0", "#c2a5cf", "#7b3294"]
    def PRGn5(self):  return ["#008837", "#a6dba0", "#f7f7f7", "#c2a5cf", "#7b3294"]
    def PRGn6(self):  return ["#1b7837", "#7fbf7b", "#d9f0d3", "#e7d4e8", "#af8dc3", "#762a83"]
    def PRGn7(self):  return ["#1b7837", "#7fbf7b", "#d9f0d3", "#f7f7f7", "#e7d4e8", "#af8dc3", "#762a83"]
    def PRGn8(self):  return ["#1b7837", "#5aae61", "#a6dba0", "#d9f0d3", "#e7d4e8", "#c2a5cf", "#9970ab", "#762a83"]
    def PRGn9(self):  return ["#1b7837", "#5aae61", "#a6dba0", "#d9f0d3", "#f7f7f7", "#e7d4e8", "#c2a5cf", "#9970ab", "#762a83"]
    def PRGn10(self): return ["#00441b", "#1b7837", "#5aae61", "#a6dba0", "#d9f0d3", "#e7d4e8", "#c2a5cf", "#9970ab", "#762a83", "#40004b"]
    def PRGn11(self): return ["#00441b", "#1b7837", "#5aae61", "#a6dba0", "#d9f0d3", "#f7f7f7", "#e7d4e8", "#c2a5cf", "#9970ab", "#762a83", "#40004b"]

    def PiYG3(self):  return ["#a1d76a", "#f7f7f7", "#e9a3c9"]
    def PiYG4(self):  return ["#4dac26", "#b8e186", "#f1b6da", "#d01c8b"]
    def PiYG5(self):  return ["#4dac26", "#b8e186", "#f7f7f7", "#f1b6da", "#d01c8b"]
    def PiYG6(self):  return ["#4d9221", "#a1d76a", "#e6f5d0", "#fde0ef", "#e9a3c9", "#c51b7d"]
    def PiYG7(self):  return ["#4d9221", "#a1d76a", "#e6f5d0", "#f7f7f7", "#fde0ef", "#e9a3c9", "#c51b7d"]
    def PiYG8(self):  return ["#4d9221", "#7fbc41", "#b8e186", "#e6f5d0", "#fde0ef", "#f1b6da", "#de77ae", "#c51b7d"]
    def PiYG9(self):  return ["#4d9221", "#7fbc41", "#b8e186", "#e6f5d0", "#f7f7f7", "#fde0ef", "#f1b6da", "#de77ae", "#c51b7d"]
    def PiYG10(self): return ["#276419", "#4d9221", "#7fbc41", "#b8e186", "#e6f5d0", "#fde0ef", "#f1b6da", "#de77ae", "#c51b7d", "#8e0152"]
    def PiYG11(self): return ["#276419", "#4d9221", "#7fbc41", "#b8e186", "#e6f5d0", "#f7f7f7", "#fde0ef", "#f1b6da", "#de77ae", "#c51b7d", "#8e0152"]

    def RdBu3(self):  return ["#67a9cf", "#f7f7f7", "#ef8a62"]
    def RdBu4(self):  return ["#0571b0", "#92c5de", "#f4a582", "#ca0020"]
    def RdBu5(self):  return ["#0571b0", "#92c5de", "#f7f7f7", "#f4a582", "#ca0020"]
    def RdBu6(self):  return ["#2166ac", "#67a9cf", "#d1e5f0", "#fddbc7", "#ef8a62", "#b2182b"]
    def RdBu7(self):  return ["#2166ac", "#67a9cf", "#d1e5f0", "#f7f7f7", "#fddbc7", "#ef8a62", "#b2182b"]
    def RdBu8(self):  return ["#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#fddbc7", "#f4a582", "#d6604d", "#b2182b"]
    def RdBu9(self):  return ["#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#f7f7f7", "#fddbc7", "#f4a582", "#d6604d", "#b2182b"]
    def RdBu10(self): return ["#053061", "#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#fddbc7", "#f4a582", "#d6604d", "#b2182b", "#67001f"]
    def RdBu11(self): return ["#053061", "#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#f7f7f7", "#fddbc7", "#f4a582", "#d6604d", "#b2182b", "#67001f"]

    def RdGy3(self):  return ["#999999", "#ffffff", "#ef8a62"]
    def RdGy4(self):  return ["#404040", "#bababa", "#f4a582", "#ca0020"]
    def RdGy5(self):  return ["#404040", "#bababa", "#ffffff", "#f4a582", "#ca0020"]
    def RdGy6(self):  return ["#4d4d4d", "#999999", "#e0e0e0", "#fddbc7", "#ef8a62", "#b2182b"]
    def RdGy7(self):  return ["#4d4d4d", "#999999", "#e0e0e0", "#ffffff", "#fddbc7", "#ef8a62", "#b2182b"]
    def RdGy8(self):  return ["#4d4d4d", "#878787", "#bababa", "#e0e0e0", "#fddbc7", "#f4a582", "#d6604d", "#b2182b"]
    def RdGy9(self):  return ["#4d4d4d", "#878787", "#bababa", "#e0e0e0", "#ffffff", "#fddbc7", "#f4a582", "#d6604d", "#b2182b"]
    def RdGy10(self): return ["#1a1a1a", "#4d4d4d", "#878787", "#bababa", "#e0e0e0", "#fddbc7", "#f4a582", "#d6604d", "#b2182b", "#67001f"]
    def RdGy11(self): return ["#1a1a1a", "#4d4d4d", "#878787", "#bababa", "#e0e0e0", "#ffffff", "#fddbc7", "#f4a582", "#d6604d", "#b2182b", "#67001f"]

    def RdYlBu3(self):  return ["#91bfdb", "#ffffbf", "#fc8d59"]
    def RdYlBu4(self):  return ["#2c7bb6", "#abd9e9", "#fdae61", "#d7191c"]
    def RdYlBu5(self):  return ["#2c7bb6", "#abd9e9", "#ffffbf", "#fdae61", "#d7191c"]
    def RdYlBu6(self):  return ["#4575b4", "#91bfdb", "#e0f3f8", "#fee090", "#fc8d59", "#d73027"]
    def RdYlBu7(self):  return ["#4575b4", "#91bfdb", "#e0f3f8", "#ffffbf", "#fee090", "#fc8d59", "#d73027"]
    def RdYlBu8(self):  return ["#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#fee090", "#fdae61", "#f46d43", "#d73027"]
    def RdYlBu9(self):  return ["#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027"]
    def RdYlBu10(self): return ["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"]
    def RdYlBu11(self): return ["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"]

    def Spectral3(self):  return ["#99d594", "#ffffbf", "#fc8d59"]
    def Spectral4(self):  return ["#2b83ba", "#abdda4", "#fdae61", "#d7191c"]
    def Spectral5(self):  return ["#2b83ba", "#abdda4", "#ffffbf", "#fdae61", "#d7191c"]
    def Spectral6(self):  return ["#3288bd", "#99d594", "#e6f598", "#fee08b", "#fc8d59", "#d53e4f"]
    def Spectral7(self):  return ["#3288bd", "#99d594", "#e6f598", "#ffffbf", "#fee08b", "#fc8d59", "#d53e4f"]
    def Spectral8(self):  return ["#3288bd", "#66c2a5", "#abdda4", "#e6f598", "#fee08b", "#fdae61", "#f46d43", "#d53e4f"]
    def Spectral9(self):  return ["#3288bd", "#66c2a5", "#abdda4", "#e6f598", "#ffffbf", "#fee08b", "#fdae61", "#f46d43", "#d53e4f"]
    def Spectral10(self): return ["#5e4fa2", "#3288bd", "#66c2a5", "#abdda4", "#e6f598", "#fee08b", "#fdae61", "#f46d43", "#d53e4f", "#9e0142"]
    def Spectral11(self): return ["#5e4fa2", "#3288bd", "#66c2a5", "#abdda4", "#e6f598", "#ffffbf", "#fee08b", "#fdae61", "#f46d43", "#d53e4f", "#9e0142"]

    def RdYlGn3(self):  return ["#91cf60", "#ffffbf", "#fc8d59"]
    def RdYlGn4(self):  return ["#1a9641", "#a6d96a", "#fdae61", "#d7191c"]
    def RdYlGn5(self):  return ["#1a9641", "#a6d96a", "#ffffbf", "#fdae61", "#d7191c"]
    def RdYlGn6(self):  return ["#1a9850", "#91cf60", "#d9ef8b", "#fee08b", "#fc8d59", "#d73027"]
    def RdYlGn7(self):  return ["#1a9850", "#91cf60", "#d9ef8b", "#ffffbf", "#fee08b", "#fc8d59", "#d73027"]
    def RdYlGn8(self):  return ["#1a9850", "#66bd63", "#a6d96a", "#d9ef8b", "#fee08b", "#fdae61", "#f46d43", "#d73027"]
    def RdYlGn9(self):  return ["#1a9850", "#66bd63", "#a6d96a", "#d9ef8b", "#ffffbf", "#fee08b", "#fdae61", "#f46d43", "#d73027"]
    def RdYlGn10(self): return ["#006837", "#1a9850", "#66bd63", "#a6d96a", "#d9ef8b", "#fee08b", "#fdae61", "#f46d43", "#d73027", "#a50026"]
    def RdYlGn11(self): return ["#006837", "#1a9850", "#66bd63", "#a6d96a", "#d9ef8b", "#ffffbf", "#fee08b", "#fdae61", "#f46d43", "#d73027", "#a50026"]

    # http://colorbrewer2.org/?type=qualitative&scheme=Accent&n=8
    def Accent3(self): return self.Accent8[:3]
    def Accent4(self): return self.Accent8[:4]
    def Accent5(self): return self.Accent8[:5]
    def Accent6(self): return self.Accent8[:6]
    def Accent7(self): return self.Accent8[:7]
    def Accent8(self): return ['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#386cb0', '#f0027f', '#bf5b17', '#666666']

    # http://colorbrewer2.org/?type=qualitative&scheme=Dark2&n=8
    def Dark2_3(self): return self.Dark2_8[:3]
    def Dark2_4(self): return self.Dark2_8[:4]
    def Dark2_5(self): return self.Dark2_8[:5]
    def Dark2_6(self): return self.Dark2_8[:6]
    def Dark2_7(self): return self.Dark2_8[:7]
    def Dark2_8(self): return ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666']

    # http://colorbrewer2.org/?type=qualitative&scheme=Paired&n=12
    def Paired3(self):  return self.Paired12[:3]
    def Paired4(self):  return self.Paired12[:4]
    def Paired5(self):  return self.Paired12[:5]
    def Paired6(self):  return self.Paired12[:6]
    def Paired7(self):  return self.Paired12[:7]
    def Paired8(self):  return self.Paired12[:8]
    def Paired9(self):  return self.Paired12[:9]
    def Paired10(self): return self.Paired12[:10]
    def Paired11(self): return self.Paired12[:11]
    def Paired12(self): return ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928']

    # http://colorbrewer2.org/?type=qualitative&scheme=Pastel1&n=9
    def Pastel1_3(self): return self.Pastel1_9[:3]
    def Pastel1_4(self): return self.Pastel1_9[:4]
    def Pastel1_5(self): return self.Pastel1_9[:5]
    def Pastel1_6(self): return self.Pastel1_9[:6]
    def Pastel1_7(self): return self.Pastel1_9[:7]
    def Pastel1_8(self): return self.Pastel1_9[:8]
    def Pastel1_9(self): return ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec', '#f2f2f2']

    # http://colorbrewer2.org/?type=qualitative&scheme=Pastel2&n=8
    def Pastel2_3(self): return self.Pastel2_8[:3]
    def Pastel2_4(self): return self.Pastel2_8[:4]
    def Pastel2_5(self): return self.Pastel2_8[:5]
    def Pastel2_6(self): return self.Pastel2_8[:6]
    def Pastel2_7(self): return self.Pastel2_8[:7]
    def Pastel2_8(self): return ['#b3e2cd', '#fdcdac', '#cbd5e8', '#f4cae4', '#e6f5c9', '#fff2ae', '#f1e2cc', '#cccccc']

    # http://colorbrewer2.org/?type=qualitative&scheme=Set1&n=9
    def Set1_3(self): return self.Set1_9[:3]
    def Set1_4(self): return self.Set1_9[:4]
    def Set1_5(self): return self.Set1_9[:5]
    def Set1_6(self): return self.Set1_9[:6]
    def Set1_7(self): return self.Set1_9[:7]
    def Set1_8(self): return self.Set1_9[:8]
    def Set1_9(self): return ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999']

    # http://colorbrewer2.org/?type=qualitative&scheme=Set2&n=8
    def Set2_3(self): return self.Set2_8[:3]
    def Set2_4(self): return self.Set2_8[:4]
    def Set2_5(self): return self.Set2_8[:5]
    def Set2_6(self): return self.Set2_8[:6]
    def Set2_7(self): return self.Set2_8[:7]
    def Set2_8(self): return ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3']

    # http://colorbrewer2.org/?type=qualitative&scheme=Set3&n=12
    def Set3_3(self):  return self.Set3_12[:3]
    def Set3_4(self):  return self.Set3_12[:4]
    def Set3_5(self):  return self.Set3_12[:5]
    def Set3_6(self):  return self.Set3_12[:6]
    def Set3_7(self):  return self.Set3_12[:7]
    def Set3_8(self):  return self.Set3_12[:8]
    def Set3_9(self):  return self.Set3_12[:9]
    def Set3_10(self): return self.Set3_12[:10]
    def Set3_11(self): return self.Set3_12[:11]
    def Set3_12(self): return ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f']

    def Inferno3(self):  return ['#000003', '#BA3655', '#FCFEA4']
    def Inferno4(self):  return ['#000003', '#781C6D', '#ED6825', '#FCFEA4']
    def Inferno5(self):  return ['#000003', '#550F6D', '#BA3655', '#F98C09', '#FCFEA4']
    def Inferno6(self):  return ['#000003', '#410967', '#932567', '#DC5039', '#FBA40A', '#FCFEA4']
    def Inferno7(self):  return ['#000003', '#32095D', '#781C6D', '#BA3655', '#ED6825', '#FBB318', '#FCFEA4']
    def Inferno8(self):  return ['#000003', '#270B52', '#63146E', '#9E2963', '#D24742', '#F57C15', '#FABF25', '#FCFEA4']
    def Inferno9(self):  return ['#000003', '#1F0C47', '#550F6D', '#88216A', '#BA3655', '#E35832', '#F98C09', '#F8C931', '#FCFEA4']
    def Inferno10(self): return ['#000003', '#1A0B40', '#4A0B6A', '#781C6D', '#A42C60', '#CD4247', '#ED6825', '#FB9906', '#F7CF3A', '#FCFEA4']
    def Inferno11(self): return ['#000003', '#160B39', '#410967', '#6A176E', '#932567', '#BA3655', '#DC5039', '#F2751A', '#FBA40A', '#F6D542', '#FCFEA4']
    def Inferno256(self):
        return [
            '#000003', '#000004', '#000006', '#010007', '#010109', '#01010B', '#02010E', '#020210', '#030212', '#040314', '#040316', '#050418',
            '#06041B', '#07051D', '#08061F', '#090621', '#0A0723', '#0B0726', '#0D0828', '#0E082A', '#0F092D', '#10092F', '#120A32', '#130A34',
            '#140B36', '#160B39', '#170B3B', '#190B3E', '#1A0B40', '#1C0C43', '#1D0C45', '#1F0C47', '#200C4A', '#220B4C', '#240B4E', '#260B50',
            '#270B52', '#290B54', '#2B0A56', '#2D0A58', '#2E0A5A', '#300A5C', '#32095D', '#34095F', '#350960', '#370961', '#390962', '#3B0964',
            '#3C0965', '#3E0966', '#400966', '#410967', '#430A68', '#450A69', '#460A69', '#480B6A', '#4A0B6A', '#4B0C6B', '#4D0C6B', '#4F0D6C',
            '#500D6C', '#520E6C', '#530E6D', '#550F6D', '#570F6D', '#58106D', '#5A116D', '#5B116E', '#5D126E', '#5F126E', '#60136E', '#62146E',
            '#63146E', '#65156E', '#66156E', '#68166E', '#6A176E', '#6B176E', '#6D186E', '#6E186E', '#70196E', '#72196D', '#731A6D', '#751B6D',
            '#761B6D', '#781C6D', '#7A1C6D', '#7B1D6C', '#7D1D6C', '#7E1E6C', '#801F6B', '#811F6B', '#83206B', '#85206A', '#86216A', '#88216A',
            '#892269', '#8B2269', '#8D2369', '#8E2468', '#902468', '#912567', '#932567', '#952666', '#962666', '#982765', '#992864', '#9B2864',
            '#9C2963', '#9E2963', '#A02A62', '#A12B61', '#A32B61', '#A42C60', '#A62C5F', '#A72D5F', '#A92E5E', '#AB2E5D', '#AC2F5C', '#AE305B',
            '#AF315B', '#B1315A', '#B23259', '#B43358', '#B53357', '#B73456', '#B83556', '#BA3655', '#BB3754', '#BD3753', '#BE3852', '#BF3951',
            '#C13A50', '#C23B4F', '#C43C4E', '#C53D4D', '#C73E4C', '#C83E4B', '#C93F4A', '#CB4049', '#CC4148', '#CD4247', '#CF4446', '#D04544',
            '#D14643', '#D24742', '#D44841', '#D54940', '#D64A3F', '#D74B3E', '#D94D3D', '#DA4E3B', '#DB4F3A', '#DC5039', '#DD5238', '#DE5337',
            '#DF5436', '#E05634', '#E25733', '#E35832', '#E45A31', '#E55B30', '#E65C2E', '#E65E2D', '#E75F2C', '#E8612B', '#E9622A', '#EA6428',
            '#EB6527', '#EC6726', '#ED6825', '#ED6A23', '#EE6C22', '#EF6D21', '#F06F1F', '#F0701E', '#F1721D', '#F2741C', '#F2751A', '#F37719',
            '#F37918', '#F47A16', '#F57C15', '#F57E14', '#F68012', '#F68111', '#F78310', '#F7850E', '#F8870D', '#F8880C', '#F88A0B', '#F98C09',
            '#F98E08', '#F99008', '#FA9107', '#FA9306', '#FA9506', '#FA9706', '#FB9906', '#FB9B06', '#FB9D06', '#FB9E07', '#FBA007', '#FBA208',
            '#FBA40A', '#FBA60B', '#FBA80D', '#FBAA0E', '#FBAC10', '#FBAE12', '#FBB014', '#FBB116', '#FBB318', '#FBB51A', '#FBB71C', '#FBB91E',
            '#FABB21', '#FABD23', '#FABF25', '#FAC128', '#F9C32A', '#F9C52C', '#F9C72F', '#F8C931', '#F8CB34', '#F8CD37', '#F7CF3A', '#F7D13C',
            '#F6D33F', '#F6D542', '#F5D745', '#F5D948', '#F4DB4B', '#F4DC4F', '#F3DE52', '#F3E056', '#F3E259', '#F2E45D', '#F2E660', '#F1E864',
            '#F1E968', '#F1EB6C', '#F1ED70', '#F1EE74', '#F1F079', '#F1F27D', '#F2F381', '#F2F485', '#F3F689', '#F4F78D', '#F5F891', '#F6FA95',
            '#F7FB99', '#F9FC9D', '#FAFDA0', '#FCFEA4']

    def Magma3(self):  return ['#000003', '#B53679', '#FBFCBF']
    def Magma4(self):  return ['#000003', '#711F81', '#F0605D', '#FBFCBF']
    def Magma5(self):  return ['#000003', '#4F117B', '#B53679', '#FB8660', '#FBFCBF']
    def Magma6(self):  return ['#000003', '#3B0F6F', '#8C2980', '#DD4968', '#FD9F6C', '#FBFCBF']
    def Magma7(self):  return ['#000003', '#2B115E', '#711F81', '#B53679', '#F0605D', '#FEAE76', '#FBFCBF']
    def Magma8(self):  return ['#000003', '#221150', '#5D177E', '#972C7F', '#D1426E', '#F8755C', '#FEB97F', '#FBFCBF']
    def Magma9(self):  return ['#000003', '#1B1044', '#4F117B', '#812581', '#B53679', '#E55063', '#FB8660', '#FEC286', '#FBFCBF']
    def Magma10(self): return ['#000003', '#170F3C', '#430F75', '#711F81', '#9E2E7E', '#CB3E71', '#F0605D', '#FC9366', '#FEC78B', '#FBFCBF']
    def Magma11(self): return ['#000003', '#140D35', '#3B0F6F', '#63197F', '#8C2980', '#B53679', '#DD4968', '#F66E5B', '#FD9F6C', '#FDCD90', '#FBFCBF']
    def Magma256(self):
        return [
            '#000003', '#000004', '#000006', '#010007', '#010109', '#01010B', '#02020D', '#02020F', '#030311', '#040313', '#040415', '#050417',
            '#060519', '#07051B', '#08061D', '#09071F', '#0A0722', '#0B0824', '#0C0926', '#0D0A28', '#0E0A2A', '#0F0B2C', '#100C2F', '#110C31',
            '#120D33', '#140D35', '#150E38', '#160E3A', '#170F3C', '#180F3F', '#1A1041', '#1B1044', '#1C1046', '#1E1049', '#1F114B', '#20114D',
            '#221150', '#231152', '#251155', '#261157', '#281159', '#2A115C', '#2B115E', '#2D1060', '#2F1062', '#301065', '#321067', '#341068',
            '#350F6A', '#370F6C', '#390F6E', '#3B0F6F', '#3C0F71', '#3E0F72', '#400F73', '#420F74', '#430F75', '#450F76', '#470F77', '#481078',
            '#4A1079', '#4B1079', '#4D117A', '#4F117B', '#50127B', '#52127C', '#53137C', '#55137D', '#57147D', '#58157E', '#5A157E', '#5B167E',
            '#5D177E', '#5E177F', '#60187F', '#61187F', '#63197F', '#651A80', '#661A80', '#681B80', '#691C80', '#6B1C80', '#6C1D80', '#6E1E81',
            '#6F1E81', '#711F81', '#731F81', '#742081', '#762181', '#772181', '#792281', '#7A2281', '#7C2381', '#7E2481', '#7F2481', '#812581',
            '#822581', '#842681', '#852681', '#872781', '#892881', '#8A2881', '#8C2980', '#8D2980', '#8F2A80', '#912A80', '#922B80', '#942B80',
            '#952C80', '#972C7F', '#992D7F', '#9A2D7F', '#9C2E7F', '#9E2E7E', '#9F2F7E', '#A12F7E', '#A3307E', '#A4307D', '#A6317D', '#A7317D',
            '#A9327C', '#AB337C', '#AC337B', '#AE347B', '#B0347B', '#B1357A', '#B3357A', '#B53679', '#B63679', '#B83778', '#B93778', '#BB3877',
            '#BD3977', '#BE3976', '#C03A75', '#C23A75', '#C33B74', '#C53C74', '#C63C73', '#C83D72', '#CA3E72', '#CB3E71', '#CD3F70', '#CE4070',
            '#D0416F', '#D1426E', '#D3426D', '#D4436D', '#D6446C', '#D7456B', '#D9466A', '#DA4769', '#DC4869', '#DD4968', '#DE4A67', '#E04B66',
            '#E14C66', '#E24D65', '#E44E64', '#E55063', '#E65162', '#E75262', '#E85461', '#EA5560', '#EB5660', '#EC585F', '#ED595F', '#EE5B5E',
            '#EE5D5D', '#EF5E5D', '#F0605D', '#F1615C', '#F2635C', '#F3655C', '#F3675B', '#F4685B', '#F56A5B', '#F56C5B', '#F66E5B', '#F6705B',
            '#F7715B', '#F7735C', '#F8755C', '#F8775C', '#F9795C', '#F97B5D', '#F97D5D', '#FA7F5E', '#FA805E', '#FA825F', '#FB8460', '#FB8660',
            '#FB8861', '#FB8A62', '#FC8C63', '#FC8E63', '#FC9064', '#FC9265', '#FC9366', '#FD9567', '#FD9768', '#FD9969', '#FD9B6A', '#FD9D6B',
            '#FD9F6C', '#FDA16E', '#FDA26F', '#FDA470', '#FEA671', '#FEA873', '#FEAA74', '#FEAC75', '#FEAE76', '#FEAF78', '#FEB179', '#FEB37B',
            '#FEB57C', '#FEB77D', '#FEB97F', '#FEBB80', '#FEBC82', '#FEBE83', '#FEC085', '#FEC286', '#FEC488', '#FEC689', '#FEC78B', '#FEC98D',
            '#FECB8E', '#FDCD90', '#FDCF92', '#FDD193', '#FDD295', '#FDD497', '#FDD698', '#FDD89A', '#FDDA9C', '#FDDC9D', '#FDDD9F', '#FDDFA1',
            '#FDE1A3', '#FCE3A5', '#FCE5A6', '#FCE6A8', '#FCE8AA', '#FCEAAC', '#FCECAE', '#FCEEB0', '#FCF0B1', '#FCF1B3', '#FCF3B5', '#FCF5B7',
            '#FBF7B9', '#FBF9BB', '#FBFABD', '#FBFCBF']

    def Plasma3(self):  return ['#0C0786', '#CA4678', '#EFF821']
    def Plasma4(self):  return ['#0C0786', '#9B179E', '#EC7853', '#EFF821']
    def Plasma5(self):  return ['#0C0786', '#7C02A7', '#CA4678', '#F79341', '#EFF821']
    def Plasma6(self):  return ['#0C0786', '#6A00A7', '#B02A8F', '#E06461', '#FCA635', '#EFF821']
    def Plasma7(self):  return ['#0C0786', '#5C00A5', '#9B179E', '#CA4678', '#EC7853', '#FDB22F', '#EFF821']
    def Plasma8(self):  return ['#0C0786', '#5201A3', '#8908A5', '#B83289', '#DA5A68', '#F38748', '#FDBB2B', '#EFF821']
    def Plasma9(self):  return ['#0C0786', '#4A02A0', '#7C02A7', '#A82296', '#CA4678', '#E56B5C', '#F79341', '#FDC328', '#EFF821']
    def Plasma10(self): return ['#0C0786', '#45039E', '#7200A8', '#9B179E', '#BC3685', '#D7566C', '#EC7853', '#FA9D3A', '#FCC726', '#EFF821']
    def Plasma11(self): return ['#0C0786', '#40039C', '#6A00A7', '#8F0DA3', '#B02A8F', '#CA4678', '#E06461', '#F1824C', '#FCA635', '#FCCC25', '#EFF821']
    def Plasma256(self):
        return [
            '#0C0786', '#100787', '#130689', '#15068A', '#18068B', '#1B068C', '#1D068D', '#1F058E', '#21058F', '#230590', '#250591', '#270592',
            '#290593', '#2B0594', '#2D0494', '#2F0495', '#310496', '#330497', '#340498', '#360498', '#380499', '#3A049A', '#3B039A', '#3D039B',
            '#3F039C', '#40039C', '#42039D', '#44039E', '#45039E', '#47029F', '#49029F', '#4A02A0', '#4C02A1', '#4E02A1', '#4F02A2', '#5101A2',
            '#5201A3', '#5401A3', '#5601A3', '#5701A4', '#5901A4', '#5A00A5', '#5C00A5', '#5E00A5', '#5F00A6', '#6100A6', '#6200A6', '#6400A7',
            '#6500A7', '#6700A7', '#6800A7', '#6A00A7', '#6C00A8', '#6D00A8', '#6F00A8', '#7000A8', '#7200A8', '#7300A8', '#7500A8', '#7601A8',
            '#7801A8', '#7901A8', '#7B02A8', '#7C02A7', '#7E03A7', '#7F03A7', '#8104A7', '#8204A7', '#8405A6', '#8506A6', '#8607A6', '#8807A5',
            '#8908A5', '#8B09A4', '#8C0AA4', '#8E0CA4', '#8F0DA3', '#900EA3', '#920FA2', '#9310A1', '#9511A1', '#9612A0', '#9713A0', '#99149F',
            '#9A159E', '#9B179E', '#9D189D', '#9E199C', '#9F1A9B', '#A01B9B', '#A21C9A', '#A31D99', '#A41E98', '#A51F97', '#A72197', '#A82296',
            '#A92395', '#AA2494', '#AC2593', '#AD2692', '#AE2791', '#AF2890', '#B02A8F', '#B12B8F', '#B22C8E', '#B42D8D', '#B52E8C', '#B62F8B',
            '#B7308A', '#B83289', '#B93388', '#BA3487', '#BB3586', '#BC3685', '#BD3784', '#BE3883', '#BF3982', '#C03B81', '#C13C80', '#C23D80',
            '#C33E7F', '#C43F7E', '#C5407D', '#C6417C', '#C7427B', '#C8447A', '#C94579', '#CA4678', '#CB4777', '#CC4876', '#CD4975', '#CE4A75',
            '#CF4B74', '#D04D73', '#D14E72', '#D14F71', '#D25070', '#D3516F', '#D4526E', '#D5536D', '#D6556D', '#D7566C', '#D7576B', '#D8586A',
            '#D95969', '#DA5A68', '#DB5B67', '#DC5D66', '#DC5E66', '#DD5F65', '#DE6064', '#DF6163', '#DF6262', '#E06461', '#E16560', '#E26660',
            '#E3675F', '#E3685E', '#E46A5D', '#E56B5C', '#E56C5B', '#E66D5A', '#E76E5A', '#E87059', '#E87158', '#E97257', '#EA7356', '#EA7455',
            '#EB7654', '#EC7754', '#EC7853', '#ED7952', '#ED7B51', '#EE7C50', '#EF7D4F', '#EF7E4E', '#F0804D', '#F0814D', '#F1824C', '#F2844B',
            '#F2854A', '#F38649', '#F38748', '#F48947', '#F48A47', '#F58B46', '#F58D45', '#F68E44', '#F68F43', '#F69142', '#F79241', '#F79341',
            '#F89540', '#F8963F', '#F8983E', '#F9993D', '#F99A3C', '#FA9C3B', '#FA9D3A', '#FA9F3A', '#FAA039', '#FBA238', '#FBA337', '#FBA436',
            '#FCA635', '#FCA735', '#FCA934', '#FCAA33', '#FCAC32', '#FCAD31', '#FDAF31', '#FDB030', '#FDB22F', '#FDB32E', '#FDB52D', '#FDB62D',
            '#FDB82C', '#FDB92B', '#FDBB2B', '#FDBC2A', '#FDBE29', '#FDC029', '#FDC128', '#FDC328', '#FDC427', '#FDC626', '#FCC726', '#FCC926',
            '#FCCB25', '#FCCC25', '#FCCE25', '#FBD024', '#FBD124', '#FBD324', '#FAD524', '#FAD624', '#FAD824', '#F9D924', '#F9DB24', '#F8DD24',
            '#F8DF24', '#F7E024', '#F7E225', '#F6E425', '#F6E525', '#F5E726', '#F5E926', '#F4EA26', '#F3EC26', '#F3EE26', '#F2F026', '#F2F126',
            '#F1F326', '#F0F525', '#F0F623', '#EFF821']

    def Viridis3(self):  return ['#440154', '#208F8C', '#FDE724']
    def Viridis4(self):  return ['#440154', '#30678D', '#35B778', '#FDE724']
    def Viridis5(self):  return ['#440154', '#3B518A', '#208F8C', '#5BC862', '#FDE724']
    def Viridis6(self):  return ['#440154', '#404387', '#29788E', '#22A784', '#79D151', '#FDE724']
    def Viridis7(self):  return ['#440154', '#443982', '#30678D', '#208F8C', '#35B778', '#8DD644', '#FDE724']
    def Viridis8(self):  return ['#440154', '#46317E', '#365A8C', '#277E8E', '#1EA087', '#49C16D', '#9DD93A', '#FDE724']
    def Viridis9(self):  return ['#440154', '#472B7A', '#3B518A', '#2C718E', '#208F8C', '#27AD80', '#5BC862', '#AADB32', '#FDE724']
    def Viridis10(self): return ['#440154', '#472777', '#3E4989', '#30678D', '#25828E', '#1E9C89', '#35B778', '#6BCD59', '#B2DD2C', '#FDE724']
    def Viridis11(self): return ['#440154', '#482374', '#404387', '#345E8D', '#29788E', '#208F8C', '#22A784', '#42BE71', '#79D151', '#BADE27', '#FDE724']
    def Viridis256(self):
        return [
            '#440154', '#440255', '#440357', '#450558', '#45065A', '#45085B', '#46095C', '#460B5E', '#460C5F', '#460E61', '#470F62', '#471163',
            '#471265', '#471466', '#471567', '#471669', '#47186A', '#48196B', '#481A6C', '#481C6E', '#481D6F', '#481E70', '#482071', '#482172',
            '#482273', '#482374', '#472575', '#472676', '#472777', '#472878', '#472A79', '#472B7A', '#472C7B', '#462D7C', '#462F7C', '#46307D',
            '#46317E', '#45327F', '#45347F', '#453580', '#453681', '#443781', '#443982', '#433A83', '#433B83', '#433C84', '#423D84', '#423E85',
            '#424085', '#414186', '#414286', '#404387', '#404487', '#3F4587', '#3F4788', '#3E4888', '#3E4989', '#3D4A89', '#3D4B89', '#3D4C89',
            '#3C4D8A', '#3C4E8A', '#3B508A', '#3B518A', '#3A528B', '#3A538B', '#39548B', '#39558B', '#38568B', '#38578C', '#37588C', '#37598C',
            '#365A8C', '#365B8C', '#355C8C', '#355D8C', '#345E8D', '#345F8D', '#33608D', '#33618D', '#32628D', '#32638D', '#31648D', '#31658D',
            '#31668D', '#30678D', '#30688D', '#2F698D', '#2F6A8D', '#2E6B8E', '#2E6C8E', '#2E6D8E', '#2D6E8E', '#2D6F8E', '#2C708E', '#2C718E',
            '#2C728E', '#2B738E', '#2B748E', '#2A758E', '#2A768E', '#2A778E', '#29788E', '#29798E', '#287A8E', '#287A8E', '#287B8E', '#277C8E',
            '#277D8E', '#277E8E', '#267F8E', '#26808E', '#26818E', '#25828E', '#25838D', '#24848D', '#24858D', '#24868D', '#23878D', '#23888D',
            '#23898D', '#22898D', '#228A8D', '#228B8D', '#218C8D', '#218D8C', '#218E8C', '#208F8C', '#20908C', '#20918C', '#1F928C', '#1F938B',
            '#1F948B', '#1F958B', '#1F968B', '#1E978A', '#1E988A', '#1E998A', '#1E998A', '#1E9A89', '#1E9B89', '#1E9C89', '#1E9D88', '#1E9E88',
            '#1E9F88', '#1EA087', '#1FA187', '#1FA286', '#1FA386', '#20A485', '#20A585', '#21A685', '#21A784', '#22A784', '#23A883', '#23A982',
            '#24AA82', '#25AB81', '#26AC81', '#27AD80', '#28AE7F', '#29AF7F', '#2AB07E', '#2BB17D', '#2CB17D', '#2EB27C', '#2FB37B', '#30B47A',
            '#32B57A', '#33B679', '#35B778', '#36B877', '#38B976', '#39B976', '#3BBA75', '#3DBB74', '#3EBC73', '#40BD72', '#42BE71', '#44BE70',
            '#45BF6F', '#47C06E', '#49C16D', '#4BC26C', '#4DC26B', '#4FC369', '#51C468', '#53C567', '#55C666', '#57C665', '#59C764', '#5BC862',
            '#5EC961', '#60C960', '#62CA5F', '#64CB5D', '#67CC5C', '#69CC5B', '#6BCD59', '#6DCE58', '#70CE56', '#72CF55', '#74D054', '#77D052',
            '#79D151', '#7CD24F', '#7ED24E', '#81D34C', '#83D34B', '#86D449', '#88D547', '#8BD546', '#8DD644', '#90D643', '#92D741', '#95D73F',
            '#97D83E', '#9AD83C', '#9DD93A', '#9FD938', '#A2DA37', '#A5DA35', '#A7DB33', '#AADB32', '#ADDC30', '#AFDC2E', '#B2DD2C', '#B5DD2B',
            '#B7DD29', '#BADE27', '#BDDE26', '#BFDF24', '#C2DF22', '#C5DF21', '#C7E01F', '#CAE01E', '#CDE01D', '#CFE11C', '#D2E11B', '#D4E11A',
            '#D7E219', '#DAE218', '#DCE218', '#DFE318', '#E1E318', '#E4E318', '#E7E419', '#E9E419', '#ECE41A', '#EEE51B', '#F1E51C', '#F3E51E',
            '#F6E61F', '#F8E621', '#FAE622', '#FDE724']

    def Category10_3(self):  return self.Category10_10[:3]
    def Category10_4(self):  return self.Category10_10[:4]
    def Category10_5(self):  return self.Category10_10[:5]
    def Category10_6(self):  return self.Category10_10[:6]
    def Category10_7(self):  return self.Category10_10[:7]
    def Category10_8(self):  return self.Category10_10[:8]
    def Category10_9(self):  return self.Category10_10[:9]
    def Category10_10(self): return ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']

    def Category20_3(self):  return self.Category20_20[:3]
    def Category20_4(self):  return self.Category20_20[:4]
    def Category20_5(self):  return self.Category20_20[:5]
    def Category20_6(self):  return self.Category20_20[:6]
    def Category20_7(self):  return self.Category20_20[:7]
    def Category20_8(self):  return self.Category20_20[:8]
    def Category20_9(self):  return self.Category20_20[:9]
    def Category20_10(self): return self.Category20_20[:10]
    def Category20_11(self): return self.Category20_20[:11]
    def Category20_12(self): return self.Category20_20[:12]
    def Category20_13(self): return self.Category20_20[:13]
    def Category20_14(self): return self.Category20_20[:14]
    def Category20_15(self): return self.Category20_20[:15]
    def Category20_16(self): return self.Category20_20[:16]
    def Category20_17(self): return self.Category20_20[:17]
    def Category20_18(self): return self.Category20_20[:18]
    def Category20_19(self): return self.Category20_20[:19]
    def Category20_20(self):
        return ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5',
                '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5']

    def Category20b_3(self):  return self.Category20b_20[:3]
    def Category20b_4(self):  return self.Category20b_20[:4]
    def Category20b_5(self):  return self.Category20b_20[:5]
    def Category20b_6(self):  return self.Category20b_20[:6]
    def Category20b_7(self):  return self.Category20b_20[:7]
    def Category20b_8(self):  return self.Category20b_20[:8]
    def Category20b_9(self):  return self.Category20b_20[:9]
    def Category20b_10(self): return self.Category20b_20[:10]
    def Category20b_11(self): return self.Category20b_20[:11]
    def Category20b_12(self): return self.Category20b_20[:12]
    def Category20b_13(self): return self.Category20b_20[:13]
    def Category20b_14(self): return self.Category20b_20[:14]
    def Category20b_15(self): return self.Category20b_20[:15]
    def Category20b_16(self): return self.Category20b_20[:16]
    def Category20b_17(self): return self.Category20b_20[:17]
    def Category20b_18(self): return self.Category20b_20[:18]
    def Category20b_19(self): return self.Category20b_20[:19]
    def Category20b_20(self):
        return ['#393b79', '#5254a3', '#6b6ecf', '#9c9ede', '#637939', '#8ca252', '#b5cf6b', '#cedb9c', '#8c6d31', '#bd9e39',
                '#e7ba52', '#e7cb94', '#843c39', '#ad494a', '#d6616b', '#e7969c', '#7b4173', '#a55194', '#ce6dbd', '#de9ed6']

    def Category20c_3(self):  return self.Category20c_20[:3]
    def Category20c_4(self):  return self.Category20c_20[:4]
    def Category20c_5(self):  return self.Category20c_20[:5]
    def Category20c_6(self):  return self.Category20c_20[:6]
    def Category20c_7(self):  return self.Category20c_20[:7]
    def Category20c_8(self):  return self.Category20c_20[:8]
    def Category20c_9(self):  return self.Category20c_20[:9]
    def Category20c_10(self): return self.Category20c_20[:10]
    def Category20c_11(self): return self.Category20c_20[:11]
    def Category20c_12(self): return self.Category20c_20[:12]
    def Category20c_13(self): return self.Category20c_20[:13]
    def Category20c_14(self): return self.Category20c_20[:14]
    def Category20c_15(self): return self.Category20c_20[:15]
    def Category20c_16(self): return self.Category20c_20[:16]
    def Category20c_17(self): return self.Category20c_20[:17]
    def Category20c_18(self): return self.Category20c_20[:18]
    def Category20c_19(self): return self.Category20c_20[:19]
    def Category20c_20(self):
        return ['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#e6550d', '#fd8d3c', '#fdae6b', '#fdd0a2', '#31a354', '#74c476',
                '#a1d99b', '#c7e9c0', '#756bb1', '#9e9ac8', '#bcbddc', '#dadaeb', '#636363', '#969696', '#bdbdbd', '#d9d9d9']

    # colorblind friendly palette from http://jfly.iam.u-tokyo.ac.jp/color/
    # ['orange ', 'skyblue', 'blugren', 'yellow ', 'blue   ', 'vermill', 'redprpl', 'black  '] # key
    # ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7', '#000000'] # original, poor in b&w
    def Colorblind3(self): return self.Colorblind8[:3]
    def Colorblind4(self): return self.Colorblind8[:4]
    def Colorblind5(self): return self.Colorblind8[:5]
    def Colorblind6(self): return self.Colorblind8[:6]
    def Colorblind7(self): return self.Colorblind8[:7]
    def Colorblind8(self):
        #      ['blue   ', 'orange ', 'yellow ', 'blugren', 'skyblue', 'vermill', 'redprpl', 'black  '] # key
        return ['#0072B2', '#E69F00', '#F0E442', '#009E73', '#56B4E9', '#D55E00', '#CC79A7', '#000000'] # reordered


    def YlGn(self):     return { 3: self.YlGn3,     4: self.YlGn4,     5: self.YlGn5,     6: self.YlGn6,     7: self.YlGn7,     8: self.YlGn8,     9: self.YlGn9 }
    def YlGnBu(self):   return { 3: self.YlGnBu3,   4: self.YlGnBu4,   5: self.YlGnBu5,   6: self.YlGnBu6,   7: self.YlGnBu7,   8: self.YlGnBu8,   9: self.YlGnBu9 }
    def GnBu(self):     return { 3: self.GnBu3,     4: self.GnBu4,     5: self.GnBu5,     6: self.GnBu6,     7: self.GnBu7,     8: self.GnBu8,     9: self.GnBu9 }
    def BuGn(self):     return { 3: self.BuGn3,     4: self.BuGn4,     5: self.BuGn5,     6: self.BuGn6,     7: self.BuGn7,     8: self.BuGn8,     9: self.BuGn9 }
    def PuBuGn(self):   return { 3: self.PuBuGn3,   4: self.PuBuGn4,   5: self.PuBuGn5,   6: self.PuBuGn6,   7: self.PuBuGn7,   8: self.PuBuGn8,   9: self.PuBuGn9 }
    def PuBu(self):     return { 3: self.PuBu3,     4: self.PuBu4,     5: self.PuBu5,     6: self.PuBu6,     7: self.PuBu7,     8: self.PuBu8,     9: self.PuBu9 }
    def BuPu(self):     return { 3: self.BuPu3,     4: self.BuPu4,     5: self.BuPu5,     6: self.BuPu6,     7: self.BuPu7,     8: self.BuPu8,     9: self.BuPu9 }
    def RdPu(self):     return { 3: self.RdPu3,     4: self.RdPu4,     5: self.RdPu5,     6: self.RdPu6,     7: self.RdPu7,     8: self.RdPu8,     9: self.RdPu9 }
    def PuRd(self):     return { 3: self.PuRd3,     4: self.PuRd4,     5: self.PuRd5,     6: self.PuRd6,     7: self.PuRd7,     8: self.PuRd8,     9: self.PuRd9 }
    def OrRd(self):     return { 3: self.OrRd3,     4: self.OrRd4,     5: self.OrRd5,     6: self.OrRd6,     7: self.OrRd7,     8: self.OrRd8,     9: self.OrRd9 }
    def YlOrRd(self):   return { 3: self.YlOrRd3,   4: self.YlOrRd4,   5: self.YlOrRd5,   6: self.YlOrRd6,   7: self.YlOrRd7,   8: self.YlOrRd8,   9: self.YlOrRd9 }
    def YlOrBr(self):   return { 3: self.YlOrBr3,   4: self.YlOrBr4,   5: self.YlOrBr5,   6: self.YlOrBr6,   7: self.YlOrBr7,   8: self.YlOrBr8,   9: self.YlOrBr9 }
    def Purples(self):  return { 3: self.Purples3,  4: self.Purples4,  5: self.Purples5,  6: self.Purples6,  7: self.Purples7,  8: self.Purples8,  9: self.Purples9 }
    def Blues(self):    return { 3: self.Blues3,    4: self.Blues4,    5: self.Blues5,    6: self.Blues6,    7: self.Blues7,    8: self.Blues8,    9: self.Blues9 }
    def Greens(self):   return { 3: self.Greens3,   4: self.Greens4,   5: self.Greens5,   6: self.Greens6,   7: self.Greens7,   8: self.Greens8,   9: self.Greens9 }
    def Oranges(self):  return { 3: self.Oranges3,  4: self.Oranges4,  5: self.Oranges5,  6: self.Oranges6,  7: self.Oranges7,  8: self.Oranges8,  9: self.Oranges9 }
    def Reds(self):     return { 3: self.Reds3,     4: self.Reds4,     5: self.Reds5,     6: self.Reds6,     7: self.Reds7,     8: self.Reds8,     9: self.Reds9 }
    def Greys(self):    return { 3: self.Greys3,    4: self.Greys4,    5: self.Greys5,    6: self.Greys6,    7: self.Greys7,    8: self.Greys8,    9: self.Greys9,    256: self.Greys256 } # NOQA
    def PuOr(self):     return { 3: self.PuOr3,     4: self.PuOr4,     5: self.PuOr5,     6: self.PuOr6,     7: self.PuOr7,     8: self.PuOr8,     9: self.PuOr9,     10: self.PuOr10,     11: self.PuOr11 } # NOQA
    def BrBG(self):     return { 3: self.BrBG3,     4: self.BrBG4,     5: self.BrBG5,     6: self.BrBG6,     7: self.BrBG7,     8: self.BrBG8,     9: self.BrBG9,     10: self.BrBG10,     11: self.BrBG11 } # NOQA
    def PRGn(self):     return { 3: self.PRGn3,     4: self.PRGn4,     5: self.PRGn5,     6: self.PRGn6,     7: self.PRGn7,     8: self.PRGn8,     9: self.PRGn9,     10: self.PRGn10,     11: self.PRGn11 } # NOQA
    def PiYG(self):     return { 3: self.PiYG3,     4: self.PiYG4,     5: self.PiYG5,     6: self.PiYG6,     7: self.PiYG7,     8: self.PiYG8,     9: self.PiYG9,     10: self.PiYG10,     11: self.PiYG11 } # NOQA
    def RdBu(self):     return { 3: self.RdBu3,     4: self.RdBu4,     5: self.RdBu5,     6: self.RdBu6,     7: self.RdBu7,     8: self.RdBu8,     9: self.RdBu9,     10: self.RdBu10,     11: self.RdBu11 } # NOQA
    def RdGy(self):     return { 3: self.RdGy3,     4: self.RdGy4,     5: self.RdGy5,     6: self.RdGy6,     7: self.RdGy7,     8: self.RdGy8,     9: self.RdGy9,     10: self.RdGy10,     11: self.RdGy11 } # NOQA
    def RdYlBu(self):   return { 3: self.RdYlBu3,   4: self.RdYlBu4,   5: self.RdYlBu5,   6: self.RdYlBu6,   7: self.RdYlBu7,   8: self.RdYlBu8,   9: self.RdYlBu9,   10: self.RdYlBu10,   11: self.RdYlBu11 } # NOQA
    def Spectral(self): return { 3: self.Spectral3, 4: self.Spectral4, 5: self.Spectral5, 6: self.Spectral6, 7: self.Spectral7, 8: self.Spectral8, 9: self.Spectral9, 10: self.Spectral10, 11: self.Spectral11 } # NOQA
    def RdYlGn(self):   return { 3: self.RdYlGn3,   4: self.RdYlGn4,   5: self.RdYlGn5,   6: self.RdYlGn6,   7: self.RdYlGn7,   8: self.RdYlGn8,   9: self.RdYlGn9,   10: self.RdYlGn10,   11: self.RdYlGn11 } # NOQA
    def Accent(self):   return { 3: self.Accent3,   4: self.Accent4,   5: self.Accent5,   6: self.Accent6,   7: self.Accent7,   8: self.Accent8 }
    def Dark2(self):    return { 3: self.Dark2_3,   4: self.Dark2_4,   5: self.Dark2_5,   6: self.Dark2_6,   7: self.Dark2_7,   8: self.Dark2_8 }
    def Paired(self):   return { 3: self.Paired3,   4: self.Paired4,   5: self.Paired5,   6: self.Paired6,   7: self.Paired7,   8: self.Paired8,   9: self.Paired9,   10: self.Paired10,   11: self.Paired11,  12: self.Paired12 } # NOQA
    def Pastel1(self):  return { 3: self.Pastel1_3, 4: self.Pastel1_4, 5: self.Pastel1_5, 6: self.Pastel1_6, 7: self.Pastel1_7, 8: self.Pastel1_8, 9: self.Pastel1_9 } # NOQA
    def Pastel2(self):  return { 3: self.Pastel2_3, 4: self.Pastel2_4, 5: self.Pastel2_5, 6: self.Pastel2_6, 7: self.Pastel2_7, 8: self.Pastel2_8 }
    def Set1(self):     return { 3: self.Set1_3,    4: self.Set1_4,    5: self.Set1_5,    6: self.Set1_6,    7: self.Set1_7,    8: self.Set1_8,    9: self.Set1_9 }
    def Set2(self):     return { 3: self.Set2_3,    4: self.Set2_4,    5: self.Set2_5,    6: self.Set2_6,    7: self.Set2_7,    8: self.Set2_8 }
    def Set3(self):     return { 3: self.Set3_3,    4: self.Set3_4,    5: self.Set3_5,    6: self.Set3_6,    7: self.Set3_7,    8: self.Set3_8,    9: self.Set3_9,    10: self.Set3_10,    11: self.Set3_11,   12: self.Set3_12 } # NOQA
    def Magma(self):    return { 3: self.Magma3,    4: self.Magma4,    5: self.Magma5,    6: self.Magma6,    7: self.Magma7,    8: self.Magma8,    9: self.Magma9,    10: self.Magma10,    11: self.Magma11,   256: self.Magma256 } # NOQA
    def Inferno(self):  return { 3: self.Inferno3,  4: self.Inferno4,  5: self.Inferno5,  6: self.Inferno6,  7: self.Inferno7,  8: self.Inferno8,  9: self.Inferno9,  10: self.Inferno10,  11: self.Inferno11, 256: self.Inferno256 } # NOQA
    def Plasma(self):   return { 3: self.Plasma3,   4: self.Plasma4,   5: self.Plasma5,   6: self.Plasma6,   7: self.Plasma7,   8: self.Plasma8,   9: self.Plasma9,   10: self.Plasma10,   11: self.Plasma11,  256: self.Plasma256 } # NOQA
    def Viridis(self):  return { 3: self.Viridis3,  4: self.Viridis4,  5: self.Viridis5,  6: self.Viridis6,  7: self.Viridis7,  8: self.Viridis8,  9: self.Viridis9,  10: self.Viridis10,  11: self.Viridis11, 256: self.Viridis256 } # NOQA
    def Category10(self):
        return { 3: self.Category10_3, 4: self.Category10_4, 5: self.Category10_5, 6: self.Category10_6,
                 7: self.Category10_7, 8: self.Category10_8, 9: self.Category10_9, 10: self.Category10_10 }
    def Category20(self):
        return { 3:  self.Category20_3,   4:  self.Category20_4,   5:  self.Category20_5,   6:  self.Category20_6,   7:  self.Category20_7,
                 8:  self.Category20_8,   9:  self.Category20_9,   10: self.Category20_10,  11: self.Category20_11,  12: self.Category20_12,
                 13: self.Category20_13,  14: self.Category20_14,  15: self.Category20_15,  16: self.Category20_16,  17: self.Category20_17,
                 18: self.Category20_18,  19: self.Category20_19,  20: self.Category20_20 }
    def Category20b(self):
        return { 3:  self.Category20b_3,  4:  self.Category20b_4,  5:  self.Category20b_5,  6:  self.Category20b_6,  7:  self.Category20b_7,
                 8:  self.Category20b_8,  9:  self.Category20b_9,  10: self.Category20b_10, 11: self.Category20b_11, 12: self.Category20b_12,
                 13: self.Category20b_13, 14: self.Category20b_14, 15: self.Category20b_15, 16: self.Category20b_16, 17: self.Category20b_17,
                 18: self.Category20b_18, 19: self.Category20b_19, 20: self.Category20b_20 }
    def Category20c(self):
        return { 3:  self.Category20c_3,  4:  self.Category20c_4,  5:  self.Category20c_5,  6:  self.Category20c_6,  7:  self.Category20c_7,
                 8:  self.Category20c_8,  9:  self.Category20c_9,  10: self.Category20c_10, 11: self.Category20c_11, 12: self.Category20c_12,
                 13: self.Category20c_13, 14: self.Category20c_14, 15: self.Category20c_15, 16: self.Category20c_16, 17: self.Category20c_17,
                 18: self.Category20c_18, 19: self.Category20c_19, 20: self.Category20c_20 }
    def Colorblind(self):
        return { 3: self.Colorblind3, 4: self.Colorblind4, 5: self.Colorblind5, 6: self.Colorblind6, 7: self.Colorblind7, 8: self.Colorblind8 }

    def brewer(self):
        return {
            "YlGn"     : self.YlGn,
            "YlGnBu"   : self.YlGnBu,
            "GnBu"     : self.GnBu,
            "BuGn"     : self.BuGn,
            "PuBuGn"   : self.PuBuGn,
            "PuBu"     : self.PuBu,
            "BuPu"     : self.BuPu,
            "RdPu"     : self.RdPu,
            "PuRd"     : self.PuRd,
            "OrRd"     : self.OrRd,
            "YlOrRd"   : self.YlOrRd,
            "YlOrBr"   : self.YlOrBr,
            "Purples"  : self.Purples,
            "Blues"    : self.Blues,
            "Greens"   : self.Greens,
            "Oranges"  : self.Oranges,
            "Reds"     : self.Reds,
            "Greys"    : self.Greys,
            "PuOr"     : self.PuOr,
            "BrBG"     : self.BrBG,
            "PRGn"     : self.PRGn,
            "PiYG"     : self.PiYG,
            "RdBu"     : self.RdBu,
            "RdGy"     : self.RdGy,
            "RdYlBu"   : self.RdYlBu,
            "Spectral" : self.Spectral,
            "RdYlGn"   : self.RdYlGn,
            "Accent"   : self.Accent,
            "Dark2"    : self.Dark2,
            "Paired"   : self.Paired,
            "Pastel1"  : self.Pastel1,
            "Pastel2"  : self.Pastel2,
            "Set1"     : self.Set1,
            "Set2"     : self.Set2,
            "Set3"     : self.Set3,
        }

    def d3(self):
        return {
            "Category10"  : self.Category10,
            "Category20"  : self.Category20,
            "Category20b" : self.Category20b,
            "Category20c" : self.Category20c,
        }

    def mpl(self):
        return {
            "Magma"   : self.Magma,
            "Inferno" : self.Inferno,
            "Plasma"  : self.Plasma,
            "Viridis" : self.Viridis,
        }

    def colorblind(self):
        return {
            "Colorblind" : self.Colorblind
        }

    def all_palettes(self):
        palettes = self.brewer
        palettes.update(self.d3)
        palettes["Colorblind"] = self.Colorblind
        palettes["Magma"]      = self.Magma
        palettes["Inferno"]    = self.Inferno
        palettes["Plasma"]     = self.Plasma
        palettes["Viridis"]    = self.Viridis
        return palettes

    def small_palettes(self):
        palettes = self.all_palettes
        del palettes["Greys"][256]
        del palettes["Magma"][256]
        del palettes["Inferno"][256]
        del palettes["Plasma"][256]
        del palettes["Viridis"][256]
        return palettes

    @property
    def __palettes__(self):
        __palettes__ = []
        for name, palettes in sorted(self.all_palettes.items(), key=lambda arg: arg[0]):
            name = name + "_" if name[-1].isdigit() else name
            __palettes__ += [ name + str(index) for index in sorted(palettes.keys()) ]
        return __palettes__

    def __dir__(self):
        return [name for name in dir(type(self)) if not name.startswith('_')]

    def linear_palette(self, palette, n):
        ''' Generate a new palette as a subset of a given palette.

        Given an input ``palette``, take ``n`` colors from it by dividing its
        length into ``n`` (approximately) evenly spaced indices.

        Args:

            palette (list[str]) : a list of hex RGB color strings
            n (int) : the size of the output palette to generate

        Returns:
            list [str] : a list of hex RGB color strings

        Raises:
            ``ValueError`` if ``n > len(palette)``

        '''
        import math
        import numpy as np
        if n > len(palette):
            raise ValueError("Requested %(r)s colors, function can only return colors up to the base palette's length (%(l)s)" % dict(r=n, l=len(palette)))
        return [ palette[int(math.floor(i))] for i in np.linspace(0, len(palette)-1, num=n) ]

    def magma(self, n):
        ''' Generate a palette of colors or from the Magma palette.

        The full Magma palette that serves as input for deriving new palettes
        has 256 colors, and looks like:

        :bokeh-palette:`magma(256)`

        Args:
            n (int) : size of the palette to generate

        Returns:
            list[str] : a list of hex RGB color strings

        Raises:
            ``ValueError`` if n is greater than the base palette length of 256

        Examples:

        .. code-block:: python

            >>> magma(6)
            ['#000003', '#3B0F6F', '#8C2980', '#DD4968', '#FD9F6C', '#FBFCBF']

        The resulting palette looks like: :bokeh-palette:`magma(6)`

        '''
        return self.linear_palette(self.Magma256, n)

    def inferno(self, n):
        ''' Generate a palette of colors or from the Inferno palette.

        The full Inferno palette that serves as input for deriving new palettes
        has 256 colors, and looks like:

        :bokeh-palette:`inferno(256)`

        Args:
            n (int) : size of the palette to generate

        Returns:
            list[str] : a list of hex RGB color strings

        Raises:
            ``ValueError`` if n is greater than the base palette length of 256

        Examples:

        .. code-block:: python

            >>> inferno(6)
            ['#000003', '#410967', '#932567', '#DC5039', '#FBA40A', '#FCFEA4']

        The resulting palette looks like: :bokeh-palette:`inferno(6)`

        '''
        return self.linear_palette(self.Inferno256, n)

    def plasma(self, n):
        ''' Generate a palette of colors or from the Plasma palette.

        The full Plasma palette that serves as input for deriving new palettes
        has 256 colors, and looks like:

        :bokeh-palette:`plasma(256)`

        Args:
            n (int) : size of the palette to generate

        Returns:
            list[str] : a list of hex RGB color strings

        Raises:
            ``ValueError`` if n is greater than the base palette length of 256

        Examples:

        .. code-block:: python

            >>> plasma(6)
            ['#0C0786', '#6A00A7', '#B02A8F', '#E06461', '#FCA635', '#EFF821']

        The resulting palette looks like: :bokeh-palette:`plasma(6)`

        '''
        return self.linear_palette(self.Plasma256, n)

    def viridis(self, n):
        ''' Generate a palette of colors or from the Viridis palette.

        The full Viridis palette that serves as input for deriving new palettes
        has 256 colors, and looks like:

        :bokeh-palette:`viridis(256)`

        Args:
            n (int) : size of the palette to generate

        Returns:
            list[str] : a list of hex RGB color strings

        Raises:
            ``ValueError`` if n is greater than the base palette length of 256

        Examples:

        .. code-block:: python

            >>> viridis(6)
            ['#440154', '#404387', '#29788E', '#22A784', '#79D151', '#FDE724']

        The resulting palette looks like: :bokeh-palette:`viridis(6)`

        '''
        return self.linear_palette(self.Viridis256, n)

    def grey(self, n):
        ''' Generate a palette of colors or from the Greys palette.

        The full Greys palette that serves as input for deriving new palettes
        has 256 colors, and looks like:

        :bokeh-palette:`grey(256)`

        Args:
            n (int) : size of the palette to generate

        Returns:
            list[str] : a list of hex RGB color strings

        Raises:
            ``ValueError`` if n is greater than the base palette length of 256

        Examples:

        .. code-block:: python

            >>> grey(6)
            ['#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff']

        The resulting palette looks like: :bokeh-palette:`gray(6)`

        .. note::
            This function also has the alternate spelling ``gray``

        '''
        return self.linear_palette(self.Greys256, n)

    def gray(self, n):
        ''' Generate a palette of colors or from the Greys palette.

        The full Greys palette that serves as input for deriving new palettes
        has 256 colors, and looks like:

        :bokeh-palette:`grey(256)`

        Args:
            n (int) : size of the palette to generate

        Returns:
            list[str] : a list of hex RGB color strings

        Raises:
            ``ValueError`` if n is greater than the base palette length of 256

        Examples:

        .. code-block:: python

            >>> gray(6)
            ['#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff']

        The resulting palette looks like: :bokeh-palette:`grey(6)`

        .. note::
            This function also has the alternate spelling ``grey``

        '''
        return self.linear_palette(self.Greys256, n)

# need to explicitly transfer the docstring for Sphinx docs to build correctly
_mod = _PalettesModule('bokeh.palettes')
_mod.__doc__ = __doc__
_mod.__all__ = dir(_mod)
_sys.modules['bokeh.palettes'] = _mod
del _autoprop, _mod, _sys, _types

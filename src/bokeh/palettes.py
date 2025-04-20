#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
# License regarding the Turbo colormap:
#
# Copyright 2019 Google LLC.
# SPDX-License-Identifier: Apache-2.0
#
# Author: Anton Mikhailov
#
#-----------------------------------------------------------------------------
# License regarding the Viridis, Magma, Plasma and Inferno colormaps:
#
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
#-----------------------------------------------------------------------------
# License regarding the brewer palettes:
#
# This product includes color specifications and designs developed by
# Cynthia Brewer (http://colorbrewer2.org/).  The Brewer colormaps are
# licensed under the Apache v2 license. You may obtain a copy of the
# License at http://www.apache.org/licenses/LICENSE-2.0
#-----------------------------------------------------------------------------
# License regarding the cividis palette from https://github.com/pnnl/cmaputil
#
# Copyright (c) 2017, Battelle Memorial Institute
#
# 1.  Battelle Memorial Institute (hereinafter Battelle) hereby grants
# permission to any person or entity lawfully obtaining a copy of this software
# and associated documentation files (hereinafter "the Software") to
# redistribute and use the Software in source and binary forms, with or without
# modification. Such person or entity may use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and may permit
# others to do so, subject to the following conditions:
#
# + Redistributions of source code must retain the above copyright notice, this
# list of conditions and the following disclaimers.
#
# + Redistributions in binary form must reproduce the above copyright notice,
# this list of conditions and the following disclaimer in the documentation
# and/or other materials provided with the distribution.
#
# + Other than as used herein, neither the name Battelle Memorial Institute or
# Battelle may be used in any form whatsoever without the express written
# consent of Battelle.
#
# 2.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
# THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
# ARE DISCLAIMED. IN NO EVENT SHALL BATTELLE OR CONTRIBUTORS BE LIABLE FOR ANY
# DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
# (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
# ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#-----------------------------------------------------------------------------
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
#-----------------------------------------------------------------------------
# License regarding Paul Tol's color schemes (Bright, HighContrast, Vibrant,
# Muted, MediumContrast, PaleTextBackground, DarkText, Light, Sunset, BuRd,
# TolPRGn, TolYlOrBr, Iridescent, TolRainbow)
#
# Copyright (c) 2021, Paul Tol
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
# * Neither the name of the copyright holder nor the names of contributors may
#   be used to endorse or promote products derived from this software without
#   specific prior written permission.
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
#-----------------------------------------------------------------------------
""" Provide a collection of palettes for color mapping.

In the context of Bokeh, a *palette* is a simple plain Python list of (hex) RGB color
strings. For example the ``Blues8`` palette which looks like :bokeh-palette:`Blues8`
is defined as:

.. code-block:: python

    ('#084594', '#2171b5', '#4292c6', '#6baed6', '#9ecae1', '#c6dbef', '#deebf7', '#f7fbff')

This module contains the following sets of palettes:

* All `ColorBrewer`_ palettes
* Categorical `D3`_ palettes
* The `Matplotlib`_ palettes Magma, Inferno, Plasma, and Viridis
* A Bokeh palette comprised of the Bokeh shutter logo colors
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
attributes ``d3``, ``mpl``, and ``tol`` that have dictionaries
corresponding to the those groups of palettes.

Finally, all palettes are collected in the ``all_palettes`` palettes
module attribute, and the "small" palettes (i.e. excluding the ones with 256
colors) are collected and in a ``small_palettes`` attribute.

Built-in Palettes
-----------------

Matplotlib Palettes
~~~~~~~~~~~~~~~~~~~

Bokeh includes the `Matplotlib`_ palettes Magma, Inferno, Plasma, Viridis, and
Cividis. This section shows the pre-defined small palettes in this group.
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

Bokeh Palette
~~~~~~~~~~~~~~~

Bokeh's own palette, comprised of the shutter logo colors:

.. bokeh-palette-group:: bokeh

Accessible Palettes
~~~~~~~~~~~~~~~~~~~

Bokeh includes some palettes that are useful for addressing
color deficiencies, which contains `Paul Tol's color schemes`_, and
``Colorblind`` from https://jfly.uni-koeln.de/color/#pallet.

.. bokeh-palette-group:: tol
.. bokeh-palette-group:: colorblind

The following palettes are also introduced in `Paul Tol's color schemes`_
but with different usage. ``PaleTextBackground`` should be used for the
background of black text. ``DarkText`` is meant for text itself on a white
background. The idea is to use one dark color for support, not all combined
and not for just one word.

:PaleTextBackground: :bokeh-palette:`PaleTextBackground`

:DarkText: :bokeh-palette:`DarkText`

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

:Cividis256: :bokeh-palette:`cividis(256)` (mpl)

:Turbo256: :bokeh-palette:`turbo(256)` (mpl)

Many other 256-color perceptually uniform palettes are
available in the external `colorcet`_ package.

Other Attributes
----------------

In addition to all the palettes described in the section above, there are the
following notable attributes in the ``bokeh.palettes`` module:

.. data:: __palettes__

    An alphabetical list of the names of all individual palettes in this
    module.

    For example, the first eight palette names are:

    .. code-block:: python

        >>> bp.__palettes__[:8]
        ('Accent3', 'Accent4', 'Accent5', 'Accent6', 'Accent7', 'Accent8', 'Blues3', 'Blues4')


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
        ('#440154', '#30678D', '#35B778', '#FDE724')

    The resulting palette looks like: :bokeh-palette:`all_palettes['Viridis'][4]`

.. data:: brewer

    Palette groups included from `ColorBrewer`_. This dictionary is indexed with
    a palette name to obtain a complete group of palettes, e.g. ``YlGnBu``,
    and then further indexed with an integer to select a palette of a specific
    size from the group:

    .. code-block:: python

        >> brewer['YlGnBu'][4]
        ('#225ea8', '#41b6c4', '#a1dab4', '#ffffcc')

    The resulting palette looks like: :bokeh-palette:`brewer['YlGnBu'][4]`

.. data:: d3

    Categorical palette groups included from `D3`_. This dictionary is indexed
    with a palette name to obtain a complete group of palettes, e.g.
    ``Category20b``, and then further indexed with an integer to select a
    palette of a specific size from the group:

    .. code-block:: python

        >> d3['Category20b'][4]
        ('#393b79', '#5254a3', '#6b6ecf', '#9c9ede')

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
        ('#440154', '#30678D', '#35B778', '#FDE724')

    The resulting palette looks like: :bokeh-palette:`mpl['Plasma'][4]`

    The names of the MPL palette groups are: ``Inferno``, ``Magma``
    ``Plasma``, ``Viridis``

.. data:: tol

    A set of accessible palettes from `Paul Tol's color schemes`_. This
    dictionary is indexed with a palette name to obtain a complete group of
    palettes, e.g. ``Bright``, and then further indexed with an integer to
    select a palette of a specific size from the group:

    .. code-block:: python

        >> tol['Bright'][4]
        ('#4477AA', '#EE6677', '#228833', '#CCBB44')

    The resulting palette looks like: :bokeh-palette:`tol['Bright'][4]`

    The names of the Tol palette groups are: ``Bright``, ``HighContrast``,
    ``Vibrant``, ``Muted``, ``MediumContrast``, ``Light``,
    ``Sunset``, ``BuRd``, ``TolPRGn``, ``TolYlOrBr``, ``Iridescent``,
    ``TolRainbow``

.. data:: small_palettes

    All palette groups, excluding 256-length palettes. This dictionary is
    indexed with a palette name to obtain a complete group of palettes, e.g.
    ``Viridis``, and then further indexed with an integer to select a palette
    of a specific size from the group:

    .. code-block:: python

        >> small_palettes['Viridis'][4]
        ('#440154', '#30678D', '#35B778', '#FDE724')

    The resulting palette looks like: :bokeh-palette:`small_palettes['Viridis'][4]`

Functions
---------

The ``bokeh.palettes`` module also has several functions that can be used
to generate palettes of arbitrary size.

.. autofunction:: bokeh.palettes.cividis(n)
.. autofunction:: bokeh.palettes.diverging_palette(palette1, palette2, n, midpoint)
.. autofunction:: bokeh.palettes.gray(n)
.. autofunction:: bokeh.palettes.grey(n)
.. autofunction:: bokeh.palettes.inferno(n)
.. autofunction:: bokeh.palettes.interp_palette(palette, n)
.. autofunction:: bokeh.palettes.linear_palette(palette, n)
.. autofunction:: bokeh.palettes.magma(n)
.. autofunction:: bokeh.palettes.varying_alpha_palette(palette, n, start_alpha, end_alpha)
.. autofunction:: bokeh.palettes.viridis(n)

Licenses
--------

The respective licenses for all the palettes included in Bokeh are
viewable as a comment at the top of the :bokeh-tree:`src/bokeh/palettes.py`
source file.

.. _ColorBrewer: http://colorbrewer2.org/#type=sequential&scheme=BuGn&n=3
.. _colorcet: https://colorcet.holoviz.org
.. _D3: https://github.com/d3/d3-3.x-api-reference/blob/master/Ordinal-Scales.md#categorical-colors
.. _Matplotlib: http://matplotlib.org/examples/color/colormaps_reference.html
.. _`Paul Tol's color schemes`: https://personal.sron.nl/~pault/

"""

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
import math
from copy import deepcopy
from typing import TYPE_CHECKING, TypeAlias

# External imports
import numpy as np

# Bokeh imports
from .colors.util import RGB, NamedColor

if TYPE_CHECKING:
    import numpy.typing as npt

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

# __all__ just using everything as-is

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Palette: TypeAlias = tuple[str, ...]
PaletteCollection: TypeAlias = dict[int, Palette]
PaletteMap: TypeAlias = dict[str, PaletteCollection]

YlGn3 = ("#31a354", "#addd8e", "#f7fcb9")
YlGn4 = ("#238443", "#78c679", "#c2e699", "#ffffcc")
YlGn5 = ("#006837", "#31a354", "#78c679", "#c2e699", "#ffffcc")
YlGn6 = ("#006837", "#31a354", "#78c679", "#addd8e", "#d9f0a3", "#ffffcc")
YlGn7 = ("#005a32", "#238443", "#41ab5d", "#78c679", "#addd8e", "#d9f0a3", "#ffffcc")
YlGn8 = ("#005a32", "#238443", "#41ab5d", "#78c679", "#addd8e", "#d9f0a3", "#f7fcb9", "#ffffe5")
YlGn9 = ("#004529", "#006837", "#238443", "#41ab5d", "#78c679", "#addd8e", "#d9f0a3", "#f7fcb9", "#ffffe5")

YlGnBu3 = ("#2c7fb8", "#7fcdbb", "#edf8b1")
YlGnBu4 = ("#225ea8", "#41b6c4", "#a1dab4", "#ffffcc")
YlGnBu5 = ("#253494", "#2c7fb8", "#41b6c4", "#a1dab4", "#ffffcc")
YlGnBu6 = ("#253494", "#2c7fb8", "#41b6c4", "#7fcdbb", "#c7e9b4", "#ffffcc")
YlGnBu7 = ("#0c2c84", "#225ea8", "#1d91c0", "#41b6c4", "#7fcdbb", "#c7e9b4", "#ffffcc")
YlGnBu8 = ("#0c2c84", "#225ea8", "#1d91c0", "#41b6c4", "#7fcdbb", "#c7e9b4", "#edf8b1", "#ffffd9")
YlGnBu9 = ("#081d58", "#253494", "#225ea8", "#1d91c0", "#41b6c4", "#7fcdbb", "#c7e9b4", "#edf8b1", "#ffffd9")

GnBu3 = ("#43a2ca", "#a8ddb5", "#e0f3db")
GnBu4 = ("#2b8cbe", "#7bccc4", "#bae4bc", "#f0f9e8")
GnBu5 = ("#0868ac", "#43a2ca", "#7bccc4", "#bae4bc", "#f0f9e8")
GnBu6 = ("#0868ac", "#43a2ca", "#7bccc4", "#a8ddb5", "#ccebc5", "#f0f9e8")
GnBu7 = ("#08589e", "#2b8cbe", "#4eb3d3", "#7bccc4", "#a8ddb5", "#ccebc5", "#f0f9e8")
GnBu8 = ("#08589e", "#2b8cbe", "#4eb3d3", "#7bccc4", "#a8ddb5", "#ccebc5", "#e0f3db", "#f7fcf0")
GnBu9 = ("#084081", "#0868ac", "#2b8cbe", "#4eb3d3", "#7bccc4", "#a8ddb5", "#ccebc5", "#e0f3db", "#f7fcf0")

BuGn3 = ("#2ca25f", "#99d8c9", "#e5f5f9")
BuGn4 = ("#238b45", "#66c2a4", "#b2e2e2", "#edf8fb")
BuGn5 = ("#006d2c", "#2ca25f", "#66c2a4", "#b2e2e2", "#edf8fb")
BuGn6 = ("#006d2c", "#2ca25f", "#66c2a4", "#99d8c9", "#ccece6", "#edf8fb")
BuGn7 = ("#005824", "#238b45", "#41ae76", "#66c2a4", "#99d8c9", "#ccece6", "#edf8fb")
BuGn8 = ("#005824", "#238b45", "#41ae76", "#66c2a4", "#99d8c9", "#ccece6", "#e5f5f9", "#f7fcfd")
BuGn9 = ("#00441b", "#006d2c", "#238b45", "#41ae76", "#66c2a4", "#99d8c9", "#ccece6", "#e5f5f9", "#f7fcfd")

PuBuGn3 = ("#1c9099", "#a6bddb", "#ece2f0")
PuBuGn4 = ("#02818a", "#67a9cf", "#bdc9e1", "#f6eff7")
PuBuGn5 = ("#016c59", "#1c9099", "#67a9cf", "#bdc9e1", "#f6eff7")
PuBuGn6 = ("#016c59", "#1c9099", "#67a9cf", "#a6bddb", "#d0d1e6", "#f6eff7")
PuBuGn7 = ("#016450", "#02818a", "#3690c0", "#67a9cf", "#a6bddb", "#d0d1e6", "#f6eff7")
PuBuGn8 = ("#016450", "#02818a", "#3690c0", "#67a9cf", "#a6bddb", "#d0d1e6", "#ece2f0", "#fff7fb")
PuBuGn9 = ("#014636", "#016c59", "#02818a", "#3690c0", "#67a9cf", "#a6bddb", "#d0d1e6", "#ece2f0", "#fff7fb")

PuBu3 = ("#2b8cbe", "#a6bddb", "#ece7f2")
PuBu4 = ("#0570b0", "#74a9cf", "#bdc9e1", "#f1eef6")
PuBu5 = ("#045a8d", "#2b8cbe", "#74a9cf", "#bdc9e1", "#f1eef6")
PuBu6 = ("#045a8d", "#2b8cbe", "#74a9cf", "#a6bddb", "#d0d1e6", "#f1eef6")
PuBu7 = ("#034e7b", "#0570b0", "#3690c0", "#74a9cf", "#a6bddb", "#d0d1e6", "#f1eef6")
PuBu8 = ("#034e7b", "#0570b0", "#3690c0", "#74a9cf", "#a6bddb", "#d0d1e6", "#ece7f2", "#fff7fb")
PuBu9 = ("#023858", "#045a8d", "#0570b0", "#3690c0", "#74a9cf", "#a6bddb", "#d0d1e6", "#ece7f2", "#fff7fb")

BuPu3 = ("#8856a7", "#9ebcda", "#e0ecf4")
BuPu4 = ("#88419d", "#8c96c6", "#b3cde3", "#edf8fb")
BuPu5 = ("#810f7c", "#8856a7", "#8c96c6", "#b3cde3", "#edf8fb")
BuPu6 = ("#810f7c", "#8856a7", "#8c96c6", "#9ebcda", "#bfd3e6", "#edf8fb")
BuPu7 = ("#6e016b", "#88419d", "#8c6bb1", "#8c96c6", "#9ebcda", "#bfd3e6", "#edf8fb")
BuPu8 = ("#6e016b", "#88419d", "#8c6bb1", "#8c96c6", "#9ebcda", "#bfd3e6", "#e0ecf4", "#f7fcfd")
BuPu9 = ("#4d004b", "#810f7c", "#88419d", "#8c6bb1", "#8c96c6", "#9ebcda", "#bfd3e6", "#e0ecf4", "#f7fcfd")

RdPu3 = ("#c51b8a", "#fa9fb5", "#fde0dd")
RdPu4 = ("#ae017e", "#f768a1", "#fbb4b9", "#feebe2")
RdPu5 = ("#7a0177", "#c51b8a", "#f768a1", "#fbb4b9", "#feebe2")
RdPu6 = ("#7a0177", "#c51b8a", "#f768a1", "#fa9fb5", "#fcc5c0", "#feebe2")
RdPu7 = ("#7a0177", "#ae017e", "#dd3497", "#f768a1", "#fa9fb5", "#fcc5c0", "#feebe2")
RdPu8 = ("#7a0177", "#ae017e", "#dd3497", "#f768a1", "#fa9fb5", "#fcc5c0", "#fde0dd", "#fff7f3")
RdPu9 = ("#49006a", "#7a0177", "#ae017e", "#dd3497", "#f768a1", "#fa9fb5", "#fcc5c0", "#fde0dd", "#fff7f3")

PuRd3 = ("#dd1c77", "#c994c7", "#e7e1ef")
PuRd4 = ("#ce1256", "#df65b0", "#d7b5d8", "#f1eef6")
PuRd5 = ("#980043", "#dd1c77", "#df65b0", "#d7b5d8", "#f1eef6")
PuRd6 = ("#980043", "#dd1c77", "#df65b0", "#c994c7", "#d4b9da", "#f1eef6")
PuRd7 = ("#91003f", "#ce1256", "#e7298a", "#df65b0", "#c994c7", "#d4b9da", "#f1eef6")
PuRd8 = ("#91003f", "#ce1256", "#e7298a", "#df65b0", "#c994c7", "#d4b9da", "#e7e1ef", "#f7f4f9")
PuRd9 = ("#67001f", "#980043", "#ce1256", "#e7298a", "#df65b0", "#c994c7", "#d4b9da", "#e7e1ef", "#f7f4f9")

OrRd3 = ("#e34a33", "#fdbb84", "#fee8c8")
OrRd4 = ("#d7301f", "#fc8d59", "#fdcc8a", "#fef0d9")
OrRd5 = ("#b30000", "#e34a33", "#fc8d59", "#fdcc8a", "#fef0d9")
OrRd6 = ("#b30000", "#e34a33", "#fc8d59", "#fdbb84", "#fdd49e", "#fef0d9")
OrRd7 = ("#990000", "#d7301f", "#ef6548", "#fc8d59", "#fdbb84", "#fdd49e", "#fef0d9")
OrRd8 = ("#990000", "#d7301f", "#ef6548", "#fc8d59", "#fdbb84", "#fdd49e", "#fee8c8", "#fff7ec")
OrRd9 = ("#7f0000", "#b30000", "#d7301f", "#ef6548", "#fc8d59", "#fdbb84", "#fdd49e", "#fee8c8", "#fff7ec")

YlOrRd3 = ("#f03b20", "#feb24c", "#ffeda0")
YlOrRd4 = ("#e31a1c", "#fd8d3c", "#fecc5c", "#ffffb2")
YlOrRd5 = ("#bd0026", "#f03b20", "#fd8d3c", "#fecc5c", "#ffffb2")
YlOrRd6 = ("#bd0026", "#f03b20", "#fd8d3c", "#feb24c", "#fed976", "#ffffb2")
YlOrRd7 = ("#b10026", "#e31a1c", "#fc4e2a", "#fd8d3c", "#feb24c", "#fed976", "#ffffb2")
YlOrRd8 = ("#b10026", "#e31a1c", "#fc4e2a", "#fd8d3c", "#feb24c", "#fed976", "#ffeda0", "#ffffcc")
YlOrRd9 = ("#800026", "#bd0026", "#e31a1c", "#fc4e2a", "#fd8d3c", "#feb24c", "#fed976", "#ffeda0", "#ffffcc")

YlOrBr3 = ("#d95f0e", "#fec44f", "#fff7bc")
YlOrBr4 = ("#cc4c02", "#fe9929", "#fed98e", "#ffffd4")
YlOrBr5 = ("#993404", "#d95f0e", "#fe9929", "#fed98e", "#ffffd4")
YlOrBr6 = ("#993404", "#d95f0e", "#fe9929", "#fec44f", "#fee391", "#ffffd4")
YlOrBr7 = ("#8c2d04", "#cc4c02", "#ec7014", "#fe9929", "#fec44f", "#fee391", "#ffffd4")
YlOrBr8 = ("#8c2d04", "#cc4c02", "#ec7014", "#fe9929", "#fec44f", "#fee391", "#fff7bc", "#ffffe5")
YlOrBr9 = ("#662506", "#993404", "#cc4c02", "#ec7014", "#fe9929", "#fec44f", "#fee391", "#fff7bc", "#ffffe5")

Purples3 = ("#756bb1", "#bcbddc", "#efedf5")
Purples4 = ("#6a51a3", "#9e9ac8", "#cbc9e2", "#f2f0f7")
Purples5 = ("#54278f", "#756bb1", "#9e9ac8", "#cbc9e2", "#f2f0f7")
Purples6 = ("#54278f", "#756bb1", "#9e9ac8", "#bcbddc", "#dadaeb", "#f2f0f7")
Purples7 = ("#4a1486", "#6a51a3", "#807dba", "#9e9ac8", "#bcbddc", "#dadaeb", "#f2f0f7")
Purples8 = ("#4a1486", "#6a51a3", "#807dba", "#9e9ac8", "#bcbddc", "#dadaeb", "#efedf5", "#fcfbfd")
Purples9 = ("#3f007d", "#54278f", "#6a51a3", "#807dba", "#9e9ac8", "#bcbddc", "#dadaeb", "#efedf5", "#fcfbfd")
Purples256 = (
    "#3f007d", "#40017e", "#40027e", "#41047f", "#42057f", "#420680", "#430780", "#440981", "#440a82", "#450b82", "#460c83", "#460d83",
    "#470f84", "#481084", "#481185", "#491285", "#4a1486", "#4a1587", "#4b1687", "#4c1788", "#4c1888", "#4d1a89", "#4d1b89", "#4e1c8a",
    "#4f1d8b", "#4f1f8b", "#50208c", "#51218c", "#51228d", "#52238d", "#53258e", "#53268f", "#54278f", "#552890", "#552a90", "#562b91",
    "#572c92", "#582e92", "#582f93", "#593093", "#5a3294", "#5a3395", "#5b3495", "#5c3696", "#5c3797", "#5d3897", "#5e3a98", "#5e3b98",
    "#5f3c99", "#603e9a", "#613f9a", "#61409b", "#62429c", "#63439c", "#63449d", "#64459e", "#65479e", "#65489f", "#66499f", "#674ba0",
    "#674ca1", "#684da1", "#694fa2", "#6950a3", "#6a51a3", "#6b53a4", "#6c54a5", "#6c55a5", "#6d57a6", "#6e58a7", "#6e5aa8", "#6f5ba8",
    "#705ca9", "#705eaa", "#715faa", "#7261ab", "#7262ac", "#7363ad", "#7465ad", "#7566ae", "#7567af", "#7669af", "#776ab0", "#776cb1",
    "#786db2", "#796eb2", "#7970b3", "#7a71b4", "#7b72b4", "#7b74b5", "#7c75b6", "#7d77b7", "#7d78b7", "#7e79b8", "#7f7bb9", "#807cba",
    "#807dba", "#817ebb", "#827fbb", "#8380bb", "#8481bc", "#8582bc", "#8683bd", "#8784bd", "#8885be", "#8986be", "#8a86bf", "#8b87bf",
    "#8c88bf", "#8d89c0", "#8e8ac0", "#8e8bc1", "#8f8cc1", "#908dc2", "#918ec2", "#928fc3", "#9390c3", "#9490c3", "#9591c4", "#9692c4",
    "#9793c5", "#9894c5", "#9995c6", "#9a96c6", "#9b97c6", "#9c98c7", "#9d99c7", "#9e9ac8", "#9e9bc8", "#9f9cc9", "#a09dca", "#a19eca",
    "#a29fcb", "#a3a0cb", "#a4a1cc", "#a5a2cd", "#a6a3cd", "#a7a4ce", "#a8a6cf", "#a9a7cf", "#aaa8d0", "#aba9d0", "#acaad1", "#adabd2",
    "#aeacd2", "#aeadd3", "#afaed4", "#b0afd4", "#b1b1d5", "#b2b2d5", "#b3b3d6", "#b4b4d7", "#b5b5d7", "#b6b6d8", "#b7b7d9", "#b8b8d9",
    "#b9b9da", "#babadb", "#bbbbdb", "#bcbddc", "#bdbedc", "#bebedd", "#bebfdd", "#bfc0de", "#c0c1de", "#c1c2df", "#c2c3df", "#c3c4e0",
    "#c4c5e0", "#c5c6e1", "#c6c7e1", "#c7c8e1", "#c8c8e2", "#c9c9e2", "#cacae3", "#cbcbe3", "#cccce4", "#cdcde4", "#cecee5", "#cecfe5",
    "#cfd0e6", "#d0d1e6", "#d1d2e7", "#d2d2e7", "#d3d3e8", "#d4d4e8", "#d5d5e9", "#d6d6e9", "#d7d7e9", "#d8d8ea", "#d9d9ea", "#dadaeb",
    "#dadaeb", "#dbdbec", "#dcdcec", "#dcdcec", "#ddddec", "#dedded", "#dedeed", "#dfdfed", "#e0dfee", "#e0e0ee", "#e1e0ee", "#e2e1ef",
    "#e2e2ef", "#e3e2ef", "#e4e3f0", "#e4e3f0", "#e5e4f0", "#e6e5f1", "#e6e5f1", "#e7e6f1", "#e8e6f2", "#e8e7f2", "#e9e8f2", "#eae8f2",
    "#eae9f3", "#ebe9f3", "#eceaf3", "#ecebf4", "#edebf4", "#eeecf4", "#eeecf5", "#efedf5", "#efedf5", "#f0eef5", "#f0eef6", "#f1eff6",
    "#f1eff6", "#f1f0f6", "#f2f0f7", "#f2f0f7", "#f3f1f7", "#f3f1f7", "#f3f2f8", "#f4f2f8", "#f4f3f8", "#f5f3f8", "#f5f4f9", "#f5f4f9",
    "#f6f4f9", "#f6f5f9", "#f7f5fa", "#f7f6fa", "#f8f6fa", "#f8f7fa", "#f8f7fb", "#f9f7fb", "#f9f8fb", "#faf8fb", "#faf9fc", "#faf9fc",
    "#fbfafc", "#fbfafc", "#fcfbfd", "#fcfbfd")

Blues3 = ("#3182bd", "#9ecae1", "#deebf7")
Blues4 = ("#2171b5", "#6baed6", "#bdd7e7", "#eff3ff")
Blues5 = ("#08519c", "#3182bd", "#6baed6", "#bdd7e7", "#eff3ff")
Blues6 = ("#08519c", "#3182bd", "#6baed6", "#9ecae1", "#c6dbef", "#eff3ff")
Blues7 = ("#084594", "#2171b5", "#4292c6", "#6baed6", "#9ecae1", "#c6dbef", "#eff3ff")
Blues8 = ("#084594", "#2171b5", "#4292c6", "#6baed6", "#9ecae1", "#c6dbef", "#deebf7", "#f7fbff")
Blues9 = ("#08306b", "#08519c", "#2171b5", "#4292c6", "#6baed6", "#9ecae1", "#c6dbef", "#deebf7", "#f7fbff")
Blues256 = (
    "#08306b", "#08316d", "#08326e", "#083370", "#083471", "#083573", "#083674", "#083776", "#083877", "#083979", "#083a7a", "#083b7c",
    "#083c7d", "#083d7f", "#083e81", "#084082", "#084184", "#084285", "#084387", "#084488", "#08458a", "#08468b", "#08478d", "#08488e",
    "#084990", "#084a91", "#084b93", "#084c95", "#084d96", "#084e98", "#084f99", "#08509b", "#08519c", "#09529d", "#0a539e", "#0a549e",
    "#0b559f", "#0c56a0", "#0d57a1", "#0e58a2", "#0e59a2", "#0f5aa3", "#105ba4", "#115ca5", "#125da6", "#125ea6", "#135fa7", "#1460a8",
    "#1561a9", "#1562a9", "#1663aa", "#1764ab", "#1865ac", "#1966ad", "#1967ad", "#1a68ae", "#1b69af", "#1c6ab0", "#1c6bb0", "#1d6cb1",
    "#1e6db2", "#1f6eb3", "#206fb4", "#2070b4", "#2171b5", "#2272b6", "#2373b6", "#2474b7", "#2575b7", "#2676b8", "#2777b8", "#2979b9",
    "#2a7ab9", "#2b7bba", "#2c7cba", "#2d7dbb", "#2e7ebc", "#2f7fbc", "#3080bd", "#3181bd", "#3282be", "#3383be", "#3484bf", "#3585bf",
    "#3686c0", "#3787c0", "#3888c1", "#3989c1", "#3a8ac2", "#3b8bc2", "#3c8cc3", "#3d8dc4", "#3e8ec4", "#3f8fc5", "#4090c5", "#4191c6",
    "#4292c6", "#4493c7", "#4594c7", "#4695c8", "#4896c8", "#4997c9", "#4a98c9", "#4b98ca", "#4d99ca", "#4e9acb", "#4f9bcb", "#519ccc",
    "#529dcc", "#539ecd", "#549fcd", "#56a0ce", "#57a0ce", "#58a1cf", "#5aa2cf", "#5ba3d0", "#5ca4d0", "#5da5d1", "#5fa6d1", "#60a7d2",
    "#61a7d2", "#63a8d3", "#64a9d3", "#65aad4", "#66abd4", "#68acd5", "#69add5", "#6aaed6", "#6caed6", "#6dafd7", "#6fb0d7", "#71b1d7",
    "#72b2d8", "#74b3d8", "#75b4d8", "#77b5d9", "#79b5d9", "#7ab6d9", "#7cb7da", "#7db8da", "#7fb9da", "#81badb", "#82bbdb", "#84bcdb",
    "#85bcdc", "#87bddc", "#89bedc", "#8abfdd", "#8cc0dd", "#8dc1dd", "#8fc2de", "#91c3de", "#92c4de", "#94c4df", "#95c5df", "#97c6df",
    "#99c7e0", "#9ac8e0", "#9cc9e1", "#9dcae1", "#9fcae1", "#a0cbe2", "#a1cbe2", "#a3cce3", "#a4cce3", "#a5cde3", "#a6cee4", "#a8cee4",
    "#a9cfe5", "#aacfe5", "#abd0e6", "#add0e6", "#aed1e7", "#afd1e7", "#b0d2e7", "#b2d2e8", "#b3d3e8", "#b4d3e9", "#b5d4e9", "#b7d4ea",
    "#b8d5ea", "#b9d6ea", "#bad6eb", "#bcd7eb", "#bdd7ec", "#bed8ec", "#bfd8ed", "#c1d9ed", "#c2d9ee", "#c3daee", "#c4daee", "#c6dbef",
    "#c7dbef", "#c7dcef", "#c8dcf0", "#c9ddf0", "#caddf0", "#cadef0", "#cbdef1", "#ccdff1", "#cddff1", "#cde0f1", "#cee0f2", "#cfe1f2",
    "#d0e1f2", "#d0e2f2", "#d1e2f3", "#d2e3f3", "#d3e3f3", "#d3e4f3", "#d4e4f4", "#d5e5f4", "#d6e5f4", "#d6e6f4", "#d7e6f5", "#d8e7f5",
    "#d9e7f5", "#d9e8f5", "#dae8f6", "#dbe9f6", "#dce9f6", "#dceaf6", "#ddeaf7", "#deebf7", "#dfebf7", "#dfecf7", "#e0ecf8", "#e1edf8",
    "#e2edf8", "#e3eef8", "#e3eef9", "#e4eff9", "#e5eff9", "#e6f0f9", "#e7f0fa", "#e7f1fa", "#e8f1fa", "#e9f2fa", "#eaf2fb", "#eaf3fb",
    "#ebf3fb", "#ecf4fb", "#edf4fc", "#eef5fc", "#eef5fc", "#eff6fc", "#f0f6fd", "#f1f7fd", "#f2f7fd", "#f2f8fd", "#f3f8fe", "#f4f9fe",
    "#f5f9fe", "#f5fafe", "#f6faff", "#f7fbff")

Greens3 = ("#31a354", "#a1d99b", "#e5f5e0")
Greens4 = ("#238b45", "#74c476", "#bae4b3", "#edf8e9")
Greens5 = ("#006d2c", "#31a354", "#74c476", "#bae4b3", "#edf8e9")
Greens6 = ("#006d2c", "#31a354", "#74c476", "#a1d99b", "#c7e9c0", "#edf8e9")
Greens7 = ("#005a32", "#238b45", "#41ab5d", "#74c476", "#a1d99b", "#c7e9c0", "#edf8e9")
Greens8 = ("#005a32", "#238b45", "#41ab5d", "#74c476", "#a1d99b", "#c7e9c0", "#e5f5e0", "#f7fcf5")
Greens9 = ("#00441b", "#006d2c", "#238b45", "#41ab5d", "#74c476", "#a1d99b", "#c7e9c0", "#e5f5e0", "#f7fcf5")
Greens256 = (
    "#00441b", "#00451c", "#00471c", "#00481d", "#00491d", "#004a1e", "#004c1e", "#004d1f", "#004e1f", "#005020", "#005120", "#005221",
    "#005321", "#005522", "#005622", "#005723", "#005924", "#005a24", "#005b25", "#005c25", "#005e26", "#005f26", "#006027", "#006227",
    "#006328", "#006428", "#006529", "#006729", "#00682a", "#00692a", "#006b2b", "#006c2c", "#006d2c", "#016e2d", "#026f2e", "#03702e",
    "#05712f", "#067230", "#077331", "#087432", "#097532", "#0a7633", "#0b7734", "#0c7735", "#0d7836", "#0e7936", "#107a37", "#117b38",
    "#127c39", "#137d39", "#147e3a", "#157f3b", "#16803c", "#17813d", "#18823d", "#19833e", "#1a843f", "#1c8540", "#1d8640", "#1e8741",
    "#1f8742", "#208843", "#218944", "#228a44", "#238b45", "#248c46", "#258d47", "#268e47", "#278f48", "#289049", "#29914a", "#2a924a",
    "#2b934b", "#2c944c", "#2d954d", "#2e964d", "#2f974e", "#2f984f", "#309950", "#319a50", "#329b51", "#339c52", "#349d53", "#359e53",
    "#369f54", "#37a055", "#38a156", "#39a257", "#3aa357", "#3ba458", "#3ca559", "#3da65a", "#3ea75a", "#3fa85b", "#3fa95c", "#40aa5d",
    "#42ab5d", "#43ac5e", "#45ad5f", "#46ae60", "#48ae60", "#4aaf61", "#4bb062", "#4db163", "#4eb264", "#50b264", "#52b365", "#53b466",
    "#55b567", "#56b567", "#58b668", "#5ab769", "#5bb86a", "#5db96b", "#5eb96b", "#60ba6c", "#62bb6d", "#63bc6e", "#65bd6f", "#66bd6f",
    "#68be70", "#6abf71", "#6bc072", "#6dc072", "#6ec173", "#70c274", "#72c375", "#73c476", "#75c477", "#76c578", "#78c679", "#79c67a",
    "#7ac77b", "#7cc87c", "#7dc87e", "#7fc97f", "#80ca80", "#81ca81", "#83cb82", "#84cc83", "#86cc85", "#87cd86", "#88ce87", "#8ace88",
    "#8bcf89", "#8dd08a", "#8ed08b", "#90d18d", "#91d28e", "#92d28f", "#94d390", "#95d391", "#97d492", "#98d594", "#99d595", "#9bd696",
    "#9cd797", "#9ed798", "#9fd899", "#a0d99b", "#a2d99c", "#a3da9d", "#a4da9e", "#a5db9f", "#a7dba0", "#a8dca2", "#a9dca3", "#aadda4",
    "#abdda5", "#acdea6", "#aedea7", "#afdfa8", "#b0dfaa", "#b1e0ab", "#b2e0ac", "#b4e1ad", "#b5e1ae", "#b6e2af", "#b7e2b1", "#b8e3b2",
    "#bae3b3", "#bbe4b4", "#bce4b5", "#bde5b6", "#bee5b8", "#c0e6b9", "#c1e6ba", "#c2e7bb", "#c3e7bc", "#c4e8bd", "#c6e8bf", "#c7e9c0",
    "#c8e9c1", "#c9eac2", "#caeac3", "#cbeac4", "#cbebc5", "#ccebc6", "#cdecc7", "#ceecc8", "#cfecc9", "#d0edca", "#d1edcb", "#d2edcc",
    "#d3eecd", "#d4eece", "#d5efcf", "#d6efd0", "#d7efd1", "#d8f0d2", "#d9f0d3", "#daf0d4", "#dbf1d5", "#dbf1d6", "#dcf2d7", "#ddf2d8",
    "#def2d9", "#dff3da", "#e0f3db", "#e1f3dc", "#e2f4dd", "#e3f4de", "#e4f5df", "#e5f5e0", "#e5f5e1", "#e6f5e1", "#e7f6e2", "#e7f6e3",
    "#e8f6e3", "#e8f6e4", "#e9f7e5", "#e9f7e5", "#eaf7e6", "#ebf7e7", "#ebf7e7", "#ecf8e8", "#ecf8e8", "#edf8e9", "#edf8ea", "#eef8ea",
    "#eff9eb", "#eff9ec", "#f0f9ec", "#f0f9ed", "#f1faee", "#f1faee", "#f2faef", "#f2faf0", "#f3faf0", "#f4fbf1", "#f4fbf2", "#f5fbf2",
    "#f5fbf3", "#f6fcf4", "#f6fcf4", "#f7fcf5")

Oranges3 = ("#e6550d", "#fdae6b", "#fee6ce")
Oranges4 = ("#d94701", "#fd8d3c", "#fdbe85", "#feedde")
Oranges5 = ("#a63603", "#e6550d", "#fd8d3c", "#fdbe85", "#feedde")
Oranges6 = ("#a63603", "#e6550d", "#fd8d3c", "#fdae6b", "#fdd0a2", "#feedde")
Oranges7 = ("#8c2d04", "#d94801", "#f16913", "#fd8d3c", "#fdae6b", "#fdd0a2", "#feedde")
Oranges8 = ("#8c2d04", "#d94801", "#f16913", "#fd8d3c", "#fdae6b", "#fdd0a2", "#fee6ce", "#fff5eb")
Oranges9 = ("#7f2704", "#a63603", "#d94801", "#f16913", "#fd8d3c", "#fdae6b", "#fdd0a2", "#fee6ce", "#fff5eb")
Oranges256 = (
    "#7f2704", "#802704", "#812804", "#832804", "#842904", "#852904", "#862a04", "#882a04", "#892b04", "#8a2b04", "#8b2c04", "#8c2c04",
    "#8e2d04", "#8f2d04", "#902e04", "#912e04", "#932f03", "#942f03", "#952f03", "#963003", "#973003", "#993103", "#9a3103", "#9b3203",
    "#9c3203", "#9e3303", "#9f3303", "#a03403", "#a13403", "#a23503", "#a43503", "#a53603", "#a63603", "#a83703", "#a93703", "#ab3803",
    "#ad3803", "#ae3903", "#b03903", "#b13a03", "#b33b02", "#b53b02", "#b63c02", "#b83c02", "#b93d02", "#bb3d02", "#bd3e02", "#be3f02",
    "#c03f02", "#c14002", "#c34002", "#c54102", "#c64102", "#c84202", "#c94202", "#cb4302", "#cd4401", "#ce4401", "#d04501", "#d14501",
    "#d34601", "#d54601", "#d64701", "#d84801", "#d94801", "#da4902", "#db4a02", "#db4b03", "#dc4c03", "#dd4d04", "#de4e05", "#de5005",
    "#df5106", "#e05206", "#e15307", "#e15407", "#e25508", "#e35608", "#e45709", "#e4580a", "#e5590a", "#e65a0b", "#e75b0b", "#e75c0c",
    "#e85d0c", "#e95e0d", "#ea5f0e", "#eb600e", "#eb610f", "#ec620f", "#ed6310", "#ee6410", "#ee6511", "#ef6612", "#f06712", "#f16813",
    "#f16913", "#f26b15", "#f26c16", "#f26d17", "#f36e19", "#f36f1a", "#f3701b", "#f4711c", "#f4721e", "#f5741f", "#f57520", "#f57622",
    "#f67723", "#f67824", "#f67925", "#f77a27", "#f77b28", "#f87d29", "#f87e2b", "#f87f2c", "#f9802d", "#f9812e", "#f98230", "#fa8331",
    "#fa8532", "#fb8634", "#fb8735", "#fb8836", "#fc8937", "#fc8a39", "#fc8b3a", "#fd8c3b", "#fd8e3d", "#fd8f3e", "#fd9040", "#fd9141",
    "#fd9243", "#fd9344", "#fd9446", "#fd9547", "#fd9649", "#fd974a", "#fd984b", "#fd994d", "#fd9a4e", "#fd9b50", "#fd9c51", "#fd9d53",
    "#fd9e54", "#fd9f56", "#fda057", "#fda159", "#fda25a", "#fda35c", "#fda45d", "#fda55f", "#fda660", "#fda762", "#fda863", "#fda965",
    "#fdab66", "#fdac67", "#fdad69", "#fdae6a", "#fdaf6c", "#fdb06e", "#fdb170", "#fdb271", "#fdb373", "#fdb475", "#fdb576", "#fdb678",
    "#fdb77a", "#fdb87c", "#fdb97d", "#fdba7f", "#fdbb81", "#fdbd83", "#fdbe84", "#fdbf86", "#fdc088", "#fdc189", "#fdc28b", "#fdc38d",
    "#fdc48f", "#fdc590", "#fdc692", "#fdc794", "#fdc895", "#fdc997", "#fdca99", "#fdcb9b", "#fdcd9c", "#fdce9e", "#fdcfa0", "#fdd0a2",
    "#fdd1a3", "#fdd1a4", "#fdd2a6", "#fdd3a7", "#fdd3a9", "#fdd4aa", "#fdd5ab", "#fdd5ad", "#fdd6ae", "#fdd7af", "#fdd7b1", "#fdd8b2",
    "#fdd9b4", "#fdd9b5", "#fddab6", "#fddbb8", "#fedcb9", "#fedcbb", "#feddbc", "#fedebd", "#fedebf", "#fedfc0", "#fee0c1", "#fee0c3",
    "#fee1c4", "#fee2c6", "#fee2c7", "#fee3c8", "#fee4ca", "#fee5cb", "#fee5cc", "#fee6ce", "#fee6cf", "#fee7d0", "#fee7d1", "#fee8d2",
    "#fee8d2", "#fee9d3", "#fee9d4", "#feead5", "#feead6", "#feebd7", "#feebd8", "#feecd9", "#feecda", "#feeddb", "#feeddc", "#feeddc",
    "#ffeedd", "#ffeede", "#ffefdf", "#ffefe0", "#fff0e1", "#fff0e2", "#fff1e3", "#fff1e4", "#fff2e5", "#fff2e6", "#fff3e6", "#fff3e7",
    "#fff4e8", "#fff4e9", "#fff5ea", "#fff5eb")

Reds3 = ("#de2d26", "#fc9272", "#fee0d2")
Reds4 = ("#cb181d", "#fb6a4a", "#fcae91", "#fee5d9")
Reds5 = ("#a50f15", "#de2d26", "#fb6a4a", "#fcae91", "#fee5d9")
Reds6 = ("#a50f15", "#de2d26", "#fb6a4a", "#fc9272", "#fcbba1", "#fee5d9")
Reds7 = ("#99000d", "#cb181d", "#ef3b2c", "#fb6a4a", "#fc9272", "#fcbba1", "#fee5d9")
Reds8 = ("#99000d", "#cb181d", "#ef3b2c", "#fb6a4a", "#fc9272", "#fcbba1", "#fee0d2", "#fff5f0")
Reds9 = ("#67000d", "#a50f15", "#cb181d", "#ef3b2c", "#fb6a4a", "#fc9272", "#fcbba1", "#fee0d2", "#fff5f0")
Reds256 = (
    "#67000d", "#69000d", "#6b010e", "#6d010e", "#6f020e", "#71020e", "#73030f", "#75030f", "#77040f", "#79040f", "#7a0510", "#7c0510",
    "#7e0610", "#800610", "#820711", "#840711", "#860811", "#880811", "#8a0812", "#8c0912", "#8e0912", "#900a12", "#920a13", "#940b13",
    "#960b13", "#980c13", "#9a0c14", "#9c0d14", "#9d0d14", "#9f0e14", "#a10e15", "#a30f15", "#a50f15", "#a60f15", "#a81016", "#a91016",
    "#aa1016", "#ab1016", "#ac1117", "#ad1117", "#af1117", "#b01217", "#b11218", "#b21218", "#b31218", "#b51318", "#b61319", "#b71319",
    "#b81419", "#b91419", "#bb141a", "#bc141a", "#bd151a", "#be151a", "#bf151b", "#c1161b", "#c2161b", "#c3161b", "#c4161c", "#c5171c",
    "#c7171c", "#c8171c", "#c9181d", "#ca181d", "#cb181d", "#cc191e", "#ce1a1e", "#cf1c1f", "#d01d1f", "#d11e1f", "#d21f20", "#d32020",
    "#d42121", "#d52221", "#d72322", "#d82422", "#d92523", "#da2723", "#db2824", "#dc2924", "#dd2a25", "#de2b25", "#e02c26", "#e12d26",
    "#e22e27", "#e32f27", "#e43027", "#e53228", "#e63328", "#e83429", "#e93529", "#ea362a", "#eb372a", "#ec382b", "#ed392b", "#ee3a2c",
    "#ef3c2c", "#f03d2d", "#f03f2e", "#f0402f", "#f14130", "#f14331", "#f14432", "#f24633", "#f24734", "#f34935", "#f34a36", "#f34c37",
    "#f44d38", "#f44f39", "#f4503a", "#f5523a", "#f5533b", "#f6553c", "#f6563d", "#f6583e", "#f7593f", "#f75b40", "#f75c41", "#f85d42",
    "#f85f43", "#f96044", "#f96245", "#f96346", "#fa6547", "#fa6648", "#fa6849", "#fb694a", "#fb6b4b", "#fb6c4c", "#fb6d4d", "#fb6e4e",
    "#fb7050", "#fb7151", "#fb7252", "#fb7353", "#fb7555", "#fb7656", "#fb7757", "#fb7858", "#fb7a5a", "#fb7b5b", "#fb7c5c", "#fb7d5d",
    "#fc7f5f", "#fc8060", "#fc8161", "#fc8262", "#fc8464", "#fc8565", "#fc8666", "#fc8767", "#fc8969", "#fc8a6a", "#fc8b6b", "#fc8d6d",
    "#fc8e6e", "#fc8f6f", "#fc9070", "#fc9272", "#fc9373", "#fc9474", "#fc9576", "#fc9777", "#fc9879", "#fc997a", "#fc9b7c", "#fc9c7d",
    "#fc9d7f", "#fc9e80", "#fca082", "#fca183", "#fca285", "#fca486", "#fca588", "#fca689", "#fca78b", "#fca98c", "#fcaa8d", "#fcab8f",
    "#fcad90", "#fcae92", "#fcaf93", "#fcb095", "#fcb296", "#fcb398", "#fcb499", "#fcb69b", "#fcb79c", "#fcb89e", "#fcb99f", "#fcbba1",
    "#fcbca2", "#fcbda4", "#fcbea5", "#fcbfa7", "#fcc1a8", "#fcc2aa", "#fcc3ab", "#fcc4ad", "#fdc5ae", "#fdc6b0", "#fdc7b2", "#fdc9b3",
    "#fdcab5", "#fdcbb6", "#fdccb8", "#fdcdb9", "#fdcebb", "#fdd0bc", "#fdd1be", "#fdd2bf", "#fdd3c1", "#fdd4c2", "#fdd5c4", "#fdd7c6",
    "#fed8c7", "#fed9c9", "#fedaca", "#fedbcc", "#fedccd", "#fedecf", "#fedfd0", "#fee0d2", "#fee1d3", "#fee1d4", "#fee2d5", "#fee3d6",
    "#fee3d7", "#fee4d8", "#fee5d8", "#fee5d9", "#fee6da", "#fee7db", "#fee7dc", "#fee8dd", "#fee8de", "#fee9df", "#feeae0", "#feeae1",
    "#ffebe2", "#ffece3", "#ffece4", "#ffede5", "#ffeee6", "#ffeee7", "#ffefe8", "#fff0e8", "#fff0e9", "#fff1ea", "#fff2eb", "#fff2ec",
    "#fff3ed", "#fff4ee", "#fff4ef", "#fff5f0")

Greys3 = ("#636363", "#bdbdbd", "#f0f0f0")
Greys4 = ("#525252", "#969696", "#cccccc", "#f7f7f7")
Greys5 = ("#252525", "#636363", "#969696", "#cccccc", "#f7f7f7")
Greys6 = ("#252525", "#636363", "#969696", "#bdbdbd", "#d9d9d9", "#f7f7f7")
Greys7 = ("#252525", "#525252", "#737373", "#969696", "#bdbdbd", "#d9d9d9", "#f7f7f7")
Greys8 = ("#252525", "#525252", "#737373", "#969696", "#bdbdbd", "#d9d9d9", "#f0f0f0", "#ffffff")
Greys9 = ("#000000", "#252525", "#525252", "#737373", "#969696", "#bdbdbd", "#d9d9d9", "#f0f0f0", "#ffffff")
Greys10 = ('#000000', '#1c1c1c', '#383838', '#555555', '#717171', '#8d8d8d', '#aaaaaa', '#c6c6c6', '#e2e2e2', '#ffffff')
Greys11 = ('#000000', '#191919', '#333333', '#4c4c4c', '#666666', '#7f7f7f', '#999999', '#b2b2b2', '#cccccc', '#e5e5e5', '#ffffff')
Greys256 = (
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
    "#fcfcfc", "#fdfdfd", "#fefefe", "#ffffff")

PuOr3 = ("#998ec3", "#f7f7f7", "#f1a340")
PuOr4 = ("#5e3c99", "#b2abd2", "#fdb863", "#e66101")
PuOr5 = ("#5e3c99", "#b2abd2", "#f7f7f7", "#fdb863", "#e66101")
PuOr6 = ("#542788", "#998ec3", "#d8daeb", "#fee0b6", "#f1a340", "#b35806")
PuOr7 = ("#542788", "#998ec3", "#d8daeb", "#f7f7f7", "#fee0b6", "#f1a340", "#b35806")
PuOr8 = ("#542788", "#8073ac", "#b2abd2", "#d8daeb", "#fee0b6", "#fdb863", "#e08214", "#b35806")
PuOr9 = ("#542788", "#8073ac", "#b2abd2", "#d8daeb", "#f7f7f7", "#fee0b6", "#fdb863", "#e08214", "#b35806")
PuOr10 = ("#2d004b", "#542788", "#8073ac", "#b2abd2", "#d8daeb", "#fee0b6", "#fdb863", "#e08214", "#b35806", "#7f3b08")
PuOr11 = ("#2d004b", "#542788", "#8073ac", "#b2abd2", "#d8daeb", "#f7f7f7", "#fee0b6", "#fdb863", "#e08214", "#b35806", "#7f3b08")

BrBG3 = ("#5ab4ac", "#f5f5f5", "#d8b365")
BrBG4 = ("#018571", "#80cdc1", "#dfc27d", "#a6611a")
BrBG5 = ("#018571", "#80cdc1", "#f5f5f5", "#dfc27d", "#a6611a")
BrBG6 = ("#01665e", "#5ab4ac", "#c7eae5", "#f6e8c3", "#d8b365", "#8c510a")
BrBG7 = ("#01665e", "#5ab4ac", "#c7eae5", "#f5f5f5", "#f6e8c3", "#d8b365", "#8c510a")
BrBG8 = ("#01665e", "#35978f", "#80cdc1", "#c7eae5", "#f6e8c3", "#dfc27d", "#bf812d", "#8c510a")
BrBG9 = ("#01665e", "#35978f", "#80cdc1", "#c7eae5", "#f5f5f5", "#f6e8c3", "#dfc27d", "#bf812d", "#8c510a")
BrBG10 = ("#003c30", "#01665e", "#35978f", "#80cdc1", "#c7eae5", "#f6e8c3", "#dfc27d", "#bf812d", "#8c510a", "#543005")
BrBG11 = ("#003c30", "#01665e", "#35978f", "#80cdc1", "#c7eae5", "#f5f5f5", "#f6e8c3", "#dfc27d", "#bf812d", "#8c510a", "#543005")

PRGn3 = ("#7fbf7b", "#f7f7f7", "#af8dc3")
PRGn4 = ("#008837", "#a6dba0", "#c2a5cf", "#7b3294")
PRGn5 = ("#008837", "#a6dba0", "#f7f7f7", "#c2a5cf", "#7b3294")
PRGn6 = ("#1b7837", "#7fbf7b", "#d9f0d3", "#e7d4e8", "#af8dc3", "#762a83")
PRGn7 = ("#1b7837", "#7fbf7b", "#d9f0d3", "#f7f7f7", "#e7d4e8", "#af8dc3", "#762a83")
PRGn8 = ("#1b7837", "#5aae61", "#a6dba0", "#d9f0d3", "#e7d4e8", "#c2a5cf", "#9970ab", "#762a83")
PRGn9 = ("#1b7837", "#5aae61", "#a6dba0", "#d9f0d3", "#f7f7f7", "#e7d4e8", "#c2a5cf", "#9970ab", "#762a83")
PRGn10 = ("#00441b", "#1b7837", "#5aae61", "#a6dba0", "#d9f0d3", "#e7d4e8", "#c2a5cf", "#9970ab", "#762a83", "#40004b")
PRGn11 = ("#00441b", "#1b7837", "#5aae61", "#a6dba0", "#d9f0d3", "#f7f7f7", "#e7d4e8", "#c2a5cf", "#9970ab", "#762a83", "#40004b")

PiYG3 = ("#a1d76a", "#f7f7f7", "#e9a3c9")
PiYG4 = ("#4dac26", "#b8e186", "#f1b6da", "#d01c8b")
PiYG5 = ("#4dac26", "#b8e186", "#f7f7f7", "#f1b6da", "#d01c8b")
PiYG6 = ("#4d9221", "#a1d76a", "#e6f5d0", "#fde0ef", "#e9a3c9", "#c51b7d")
PiYG7 = ("#4d9221", "#a1d76a", "#e6f5d0", "#f7f7f7", "#fde0ef", "#e9a3c9", "#c51b7d")
PiYG8 = ("#4d9221", "#7fbc41", "#b8e186", "#e6f5d0", "#fde0ef", "#f1b6da", "#de77ae", "#c51b7d")
PiYG9 = ("#4d9221", "#7fbc41", "#b8e186", "#e6f5d0", "#f7f7f7", "#fde0ef", "#f1b6da", "#de77ae", "#c51b7d")
PiYG10 = ("#276419", "#4d9221", "#7fbc41", "#b8e186", "#e6f5d0", "#fde0ef", "#f1b6da", "#de77ae", "#c51b7d", "#8e0152")
PiYG11 = ("#276419", "#4d9221", "#7fbc41", "#b8e186", "#e6f5d0", "#f7f7f7", "#fde0ef", "#f1b6da", "#de77ae", "#c51b7d", "#8e0152")

RdBu3 = ("#67a9cf", "#f7f7f7", "#ef8a62")
RdBu4 = ("#0571b0", "#92c5de", "#f4a582", "#ca0020")
RdBu5 = ("#0571b0", "#92c5de", "#f7f7f7", "#f4a582", "#ca0020")
RdBu6 = ("#2166ac", "#67a9cf", "#d1e5f0", "#fddbc7", "#ef8a62", "#b2182b")
RdBu7 = ("#2166ac", "#67a9cf", "#d1e5f0", "#f7f7f7", "#fddbc7", "#ef8a62", "#b2182b")
RdBu8 = ("#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#fddbc7", "#f4a582", "#d6604d", "#b2182b")
RdBu9 = ("#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#f7f7f7", "#fddbc7", "#f4a582", "#d6604d", "#b2182b")
RdBu10 = ("#053061", "#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#fddbc7", "#f4a582", "#d6604d", "#b2182b", "#67001f")
RdBu11 = ("#053061", "#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#f7f7f7", "#fddbc7", "#f4a582", "#d6604d", "#b2182b", "#67001f")

RdGy3 = ("#999999", "#ffffff", "#ef8a62")
RdGy4 = ("#404040", "#bababa", "#f4a582", "#ca0020")
RdGy5 = ("#404040", "#bababa", "#ffffff", "#f4a582", "#ca0020")
RdGy6 = ("#4d4d4d", "#999999", "#e0e0e0", "#fddbc7", "#ef8a62", "#b2182b")
RdGy7 = ("#4d4d4d", "#999999", "#e0e0e0", "#ffffff", "#fddbc7", "#ef8a62", "#b2182b")
RdGy8 = ("#4d4d4d", "#878787", "#bababa", "#e0e0e0", "#fddbc7", "#f4a582", "#d6604d", "#b2182b")
RdGy9 = ("#4d4d4d", "#878787", "#bababa", "#e0e0e0", "#ffffff", "#fddbc7", "#f4a582", "#d6604d", "#b2182b")
RdGy10 = ("#1a1a1a", "#4d4d4d", "#878787", "#bababa", "#e0e0e0", "#fddbc7", "#f4a582", "#d6604d", "#b2182b", "#67001f")
RdGy11 = ("#1a1a1a", "#4d4d4d", "#878787", "#bababa", "#e0e0e0", "#ffffff", "#fddbc7", "#f4a582", "#d6604d", "#b2182b", "#67001f")

RdYlBu3 = ("#91bfdb", "#ffffbf", "#fc8d59")
RdYlBu4 = ("#2c7bb6", "#abd9e9", "#fdae61", "#d7191c")
RdYlBu5 = ("#2c7bb6", "#abd9e9", "#ffffbf", "#fdae61", "#d7191c")
RdYlBu6 = ("#4575b4", "#91bfdb", "#e0f3f8", "#fee090", "#fc8d59", "#d73027")
RdYlBu7 = ("#4575b4", "#91bfdb", "#e0f3f8", "#ffffbf", "#fee090", "#fc8d59", "#d73027")
RdYlBu8 = ("#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#fee090", "#fdae61", "#f46d43", "#d73027")
RdYlBu9 = ("#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027")
RdYlBu10 = ("#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026")
RdYlBu11 = ("#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026")

Spectral3 = ("#99d594", "#ffffbf", "#fc8d59")
Spectral4 = ("#2b83ba", "#abdda4", "#fdae61", "#d7191c")
Spectral5 = ("#2b83ba", "#abdda4", "#ffffbf", "#fdae61", "#d7191c")
Spectral6 = ("#3288bd", "#99d594", "#e6f598", "#fee08b", "#fc8d59", "#d53e4f")
Spectral7 = ("#3288bd", "#99d594", "#e6f598", "#ffffbf", "#fee08b", "#fc8d59", "#d53e4f")
Spectral8 = ("#3288bd", "#66c2a5", "#abdda4", "#e6f598", "#fee08b", "#fdae61", "#f46d43", "#d53e4f")
Spectral9 = ("#3288bd", "#66c2a5", "#abdda4", "#e6f598", "#ffffbf", "#fee08b", "#fdae61", "#f46d43", "#d53e4f")
Spectral10 = ("#5e4fa2", "#3288bd", "#66c2a5", "#abdda4", "#e6f598", "#fee08b", "#fdae61", "#f46d43", "#d53e4f", "#9e0142")
Spectral11 = ("#5e4fa2", "#3288bd", "#66c2a5", "#abdda4", "#e6f598", "#ffffbf", "#fee08b", "#fdae61", "#f46d43", "#d53e4f", "#9e0142")

RdYlGn3 = ("#91cf60", "#ffffbf", "#fc8d59")
RdYlGn4 = ("#1a9641", "#a6d96a", "#fdae61", "#d7191c")
RdYlGn5 = ("#1a9641", "#a6d96a", "#ffffbf", "#fdae61", "#d7191c")
RdYlGn6 = ("#1a9850", "#91cf60", "#d9ef8b", "#fee08b", "#fc8d59", "#d73027")
RdYlGn7 = ("#1a9850", "#91cf60", "#d9ef8b", "#ffffbf", "#fee08b", "#fc8d59", "#d73027")
RdYlGn8 = ("#1a9850", "#66bd63", "#a6d96a", "#d9ef8b", "#fee08b", "#fdae61", "#f46d43", "#d73027")
RdYlGn9 = ("#1a9850", "#66bd63", "#a6d96a", "#d9ef8b", "#ffffbf", "#fee08b", "#fdae61", "#f46d43", "#d73027")
RdYlGn10 = ("#006837", "#1a9850", "#66bd63", "#a6d96a", "#d9ef8b", "#fee08b", "#fdae61", "#f46d43", "#d73027", "#a50026")
RdYlGn11 = ("#006837", "#1a9850", "#66bd63", "#a6d96a", "#d9ef8b", "#ffffbf", "#fee08b", "#fdae61", "#f46d43", "#d73027", "#a50026")

# http://colorbrewer2.org/?type=qualitative&scheme=Accent&n=8
Accent8 = ('#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#386cb0', '#f0027f', '#bf5b17', '#666666')
Accent7 = Accent8[:7]
Accent6 = Accent8[:6]
Accent5 = Accent8[:5]
Accent4 = Accent8[:4]
Accent3 = Accent8[:3]

# http://colorbrewer2.org/?type=qualitative&scheme=Dark2&n=8
Dark2_8 = ('#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666')
Dark2_7 = Dark2_8[:7]
Dark2_6 = Dark2_8[:6]
Dark2_5 = Dark2_8[:5]
Dark2_4 = Dark2_8[:4]
Dark2_3 = Dark2_8[:3]

# http://colorbrewer2.org/?type=qualitative&scheme=Paired&n=12
Paired12 = ('#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928')
Paired11 = Paired12[:11]
Paired10 = Paired12[:10]
Paired9 = Paired12[:9]
Paired8 = Paired12[:8]
Paired7 = Paired12[:7]
Paired6 = Paired12[:6]
Paired5 = Paired12[:5]
Paired4 = Paired12[:4]
Paired3 = Paired12[:3]

# http://colorbrewer2.org/?type=qualitative&scheme=Pastel1&n=9
Pastel1_9 = ('#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec', '#f2f2f2')
Pastel1_8 = Pastel1_9[:8]
Pastel1_7 = Pastel1_9[:7]
Pastel1_6 = Pastel1_9[:6]
Pastel1_5 = Pastel1_9[:5]
Pastel1_4 = Pastel1_9[:4]
Pastel1_3 = Pastel1_9[:3]

# http://colorbrewer2.org/?type=qualitative&scheme=Pastel2&n=8
Pastel2_8 = ('#b3e2cd', '#fdcdac', '#cbd5e8', '#f4cae4', '#e6f5c9', '#fff2ae', '#f1e2cc', '#cccccc')
Pastel2_7 = Pastel2_8[:7]
Pastel2_6 = Pastel2_8[:6]
Pastel2_5 = Pastel2_8[:5]
Pastel2_4 = Pastel2_8[:4]
Pastel2_3 = Pastel2_8[:3]

# http://colorbrewer2.org/?type=qualitative&scheme=Set1&n=9
Set1_9 = ('#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999')
Set1_8 = Set1_9[:8]
Set1_7 = Set1_9[:7]
Set1_6 = Set1_9[:6]
Set1_5 = Set1_9[:5]
Set1_4 = Set1_9[:4]
Set1_3 = Set1_9[:3]

# http://colorbrewer2.org/?type=qualitative&scheme=Set2&n=8
Set2_8 = ('#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3')
Set2_7 = Set2_8[:7]
Set2_6 = Set2_8[:6]
Set2_5 = Set2_8[:5]
Set2_4 = Set2_8[:4]
Set2_3 = Set2_8[:3]

# http://colorbrewer2.org/?type=qualitative&scheme=Set3&n=12
Set3_12 = ('#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f')
Set3_11 = Set3_12[:11]
Set3_10 = Set3_12[:10]
Set3_9 = Set3_12[:9]
Set3_8 = Set3_12[:8]
Set3_7 = Set3_12[:7]
Set3_6 = Set3_12[:6]
Set3_5 = Set3_12[:5]
Set3_4 = Set3_12[:4]
Set3_3 = Set3_12[:3]

Inferno3 = ('#000003', '#BA3655', '#FCFEA4')
Inferno4 = ('#000003', '#781C6D', '#ED6825', '#FCFEA4')
Inferno5 = ('#000003', '#550F6D', '#BA3655', '#F98C09', '#FCFEA4')
Inferno6 = ('#000003', '#410967', '#932567', '#DC5039', '#FBA40A', '#FCFEA4')
Inferno7 = ('#000003', '#32095D', '#781C6D', '#BA3655', '#ED6825', '#FBB318', '#FCFEA4')
Inferno8 = ('#000003', '#270B52', '#63146E', '#9E2963', '#D24742', '#F57C15', '#FABF25', '#FCFEA4')
Inferno9 = ('#000003', '#1F0C47', '#550F6D', '#88216A', '#BA3655', '#E35832', '#F98C09', '#F8C931', '#FCFEA4')
Inferno10 = ('#000003', '#1A0B40', '#4A0B6A', '#781C6D', '#A42C60', '#CD4247', '#ED6825', '#FB9906', '#F7CF3A', '#FCFEA4')
Inferno11 = ('#000003', '#160B39', '#410967', '#6A176E', '#932567', '#BA3655', '#DC5039', '#F2751A', '#FBA40A', '#F6D542', '#FCFEA4')
Inferno256 = (
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
    '#F7FB99', '#F9FC9D', '#FAFDA0', '#FCFEA4')

Magma3 = ('#000003', '#B53679', '#FBFCBF')
Magma4 = ('#000003', '#711F81', '#F0605D', '#FBFCBF')
Magma5 = ('#000003', '#4F117B', '#B53679', '#FB8660', '#FBFCBF')
Magma6 = ('#000003', '#3B0F6F', '#8C2980', '#DD4968', '#FD9F6C', '#FBFCBF')
Magma7 = ('#000003', '#2B115E', '#711F81', '#B53679', '#F0605D', '#FEAE76', '#FBFCBF')
Magma8 = ('#000003', '#221150', '#5D177E', '#972C7F', '#D1426E', '#F8755C', '#FEB97F', '#FBFCBF')
Magma9 = ('#000003', '#1B1044', '#4F117B', '#812581', '#B53679', '#E55063', '#FB8660', '#FEC286', '#FBFCBF')
Magma10 = ('#000003', '#170F3C', '#430F75', '#711F81', '#9E2E7E', '#CB3E71', '#F0605D', '#FC9366', '#FEC78B', '#FBFCBF')
Magma11 = ('#000003', '#140D35', '#3B0F6F', '#63197F', '#8C2980', '#B53679', '#DD4968', '#F66E5B', '#FD9F6C', '#FDCD90', '#FBFCBF')
Magma256 = (
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
    '#FBF7B9', '#FBF9BB', '#FBFABD', '#FBFCBF')

Plasma3 = ('#0C0786', '#CA4678', '#EFF821')
Plasma4 = ('#0C0786', '#9B179E', '#EC7853', '#EFF821')
Plasma5 = ('#0C0786', '#7C02A7', '#CA4678', '#F79341', '#EFF821')
Plasma6 = ('#0C0786', '#6A00A7', '#B02A8F', '#E06461', '#FCA635', '#EFF821')
Plasma7 = ('#0C0786', '#5C00A5', '#9B179E', '#CA4678', '#EC7853', '#FDB22F', '#EFF821')
Plasma8 = ('#0C0786', '#5201A3', '#8908A5', '#B83289', '#DA5A68', '#F38748', '#FDBB2B', '#EFF821')
Plasma9 = ('#0C0786', '#4A02A0', '#7C02A7', '#A82296', '#CA4678', '#E56B5C', '#F79341', '#FDC328', '#EFF821')
Plasma10 = ('#0C0786', '#45039E', '#7200A8', '#9B179E', '#BC3685', '#D7566C', '#EC7853', '#FA9D3A', '#FCC726', '#EFF821')
Plasma11 = ('#0C0786', '#40039C', '#6A00A7', '#8F0DA3', '#B02A8F', '#CA4678', '#E06461', '#F1824C', '#FCA635', '#FCCC25', '#EFF821')
Plasma256 = (
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
    '#F1F326', '#F0F525', '#F0F623', '#EFF821')

Viridis3 = ('#440154', '#208F8C', '#FDE724')
Viridis4 = ('#440154', '#30678D', '#35B778', '#FDE724')
Viridis5 = ('#440154', '#3B518A', '#208F8C', '#5BC862', '#FDE724')
Viridis6 = ('#440154', '#404387', '#29788E', '#22A784', '#79D151', '#FDE724')
Viridis7 = ('#440154', '#443982', '#30678D', '#208F8C', '#35B778', '#8DD644', '#FDE724')
Viridis8 = ('#440154', '#46317E', '#365A8C', '#277E8E', '#1EA087', '#49C16D', '#9DD93A', '#FDE724')
Viridis9 = ('#440154', '#472B7A', '#3B518A', '#2C718E', '#208F8C', '#27AD80', '#5BC862', '#AADB32', '#FDE724')
Viridis10 = ('#440154', '#472777', '#3E4989', '#30678D', '#25828E', '#1E9C89', '#35B778', '#6BCD59', '#B2DD2C', '#FDE724')
Viridis11 = ('#440154', '#482374', '#404387', '#345E8D', '#29788E', '#208F8C', '#22A784', '#42BE71', '#79D151', '#BADE27', '#FDE724')
Viridis256 = (
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
    '#F6E61F', '#F8E621', '#FAE622', '#FDE724')

Cividis3 = ('#00204C', '#7B7B78', '#FFE945')
Cividis4 = ('#00204C', '#565C6C', '#A69C75', '#FFE945')
Cividis5 = ('#00204C', '#404C6B', '#7B7B78', '#BCAE6E', '#FFE945')
Cividis6 = ('#00204C', '#31446B', '#666870', '#958F78', '#CAB969', '#FFE945')
Cividis7 = ('#00204C', '#223D6C', '#565C6C', '#7B7B78', '#A69C75', '#D3C065', '#FFE945')
Cividis8 = ('#00204C', '#15396D', '#49536B', '#6C6D72', '#8D8878', '#B2A672', '#D9C661', '#FFE945')
Cividis9 = ('#00204C', '#01356E', '#404C6B', '#5F636E', '#7B7B78', '#9B9377', '#BCAE6E', '#DFCB5D', '#FFE945')
Cividis10 = ('#00204C', '#00336E', '#37476B', '#565C6C', '#6F7073', '#898578', '#A69C75', '#C3B46C', '#E3CD5B', '#FFE945')
Cividis11 = ('#00204C', '#00316F', '#31446B', '#4D556B', '#666870', '#7B7B78', '#958F78', '#AEA373', '#CAB969', '#E6D059', '#FFE945')
Cividis256 = (
    '#00204C', '#00204E', '#002150', '#002251', '#002353', '#002355', '#002456', '#002558', '#00265A', '#00265B', '#00275D', '#00285F',
    '#002861', '#002963', '#002A64', '#002A66', '#002B68', '#002C6A', '#002D6C', '#002D6D', '#002E6E', '#002E6F', '#002F6F', '#002F6F',
    '#00306F', '#00316F', '#00316F', '#00326E', '#00336E', '#00346E', '#00346E', '#01356E', '#06366E', '#0A376D', '#0E376D', '#12386D',
    '#15396D', '#17396D', '#1A3A6C', '#1C3B6C', '#1E3C6C', '#203C6C', '#223D6C', '#243E6C', '#263E6C', '#273F6C', '#29406B', '#2B416B',
    '#2C416B', '#2E426B', '#2F436B', '#31446B', '#32446B', '#33456B', '#35466B', '#36466B', '#37476B', '#38486B', '#3A496B', '#3B496B',
    '#3C4A6B', '#3D4B6B', '#3E4B6B', '#404C6B', '#414D6B', '#424E6B', '#434E6B', '#444F6B', '#45506B', '#46506B', '#47516B', '#48526B',
    '#49536B', '#4A536B', '#4B546B', '#4C556B', '#4D556B', '#4E566B', '#4F576C', '#50586C', '#51586C', '#52596C', '#535A6C', '#545A6C',
    '#555B6C', '#565C6C', '#575D6D', '#585D6D', '#595E6D', '#5A5F6D', '#5B5F6D', '#5C606D', '#5D616E', '#5E626E', '#5F626E', '#5F636E',
    '#60646E', '#61656F', '#62656F', '#63666F', '#64676F', '#65676F', '#666870', '#676970', '#686A70', '#686A70', '#696B71', '#6A6C71',
    '#6B6D71', '#6C6D72', '#6D6E72', '#6E6F72', '#6F6F72', '#6F7073', '#707173', '#717273', '#727274', '#737374', '#747475', '#757575',
    '#757575', '#767676', '#777776', '#787876', '#797877', '#7A7977', '#7B7A77', '#7B7B78', '#7C7B78', '#7D7C78', '#7E7D78', '#7F7E78',
    '#807E78', '#817F78', '#828078', '#838178', '#848178', '#858278', '#868378', '#878478', '#888578', '#898578', '#8A8678', '#8B8778',
    '#8C8878', '#8D8878', '#8E8978', '#8F8A78', '#908B78', '#918C78', '#928C78', '#938D78', '#948E78', '#958F78', '#968F77', '#979077',
    '#989177', '#999277', '#9A9377', '#9B9377', '#9C9477', '#9D9577', '#9E9676', '#9F9776', '#A09876', '#A19876', '#A29976', '#A39A75',
    '#A49B75', '#A59C75', '#A69C75', '#A79D75', '#A89E74', '#A99F74', '#AAA074', '#ABA174', '#ACA173', '#ADA273', '#AEA373', '#AFA473',
    '#B0A572', '#B1A672', '#B2A672', '#B4A771', '#B5A871', '#B6A971', '#B7AA70', '#B8AB70', '#B9AB70', '#BAAC6F', '#BBAD6F', '#BCAE6E',
    '#BDAF6E', '#BEB06E', '#BFB16D', '#C0B16D', '#C1B26C', '#C2B36C', '#C3B46C', '#C5B56B', '#C6B66B', '#C7B76A', '#C8B86A', '#C9B869',
    '#CAB969', '#CBBA68', '#CCBB68', '#CDBC67', '#CEBD67', '#D0BE66', '#D1BF66', '#D2C065', '#D3C065', '#D4C164', '#D5C263', '#D6C363',
    '#D7C462', '#D8C561', '#D9C661', '#DBC760', '#DCC860', '#DDC95F', '#DECA5E', '#DFCB5D', '#E0CB5D', '#E1CC5C', '#E3CD5B', '#E4CE5B',
    '#E5CF5A', '#E6D059', '#E7D158', '#E8D257', '#E9D356', '#EBD456', '#ECD555', '#EDD654', '#EED753', '#EFD852', '#F0D951', '#F1DA50',
    '#F3DB4F', '#F4DC4E', '#F5DD4D', '#F6DE4C', '#F7DF4B', '#F9E049', '#FAE048', '#FBE147', '#FCE246', '#FDE345', '#FFE443', '#FFE542',
    '#FFE642', '#FFE743', '#FFE844', '#FFE945')

Turbo3 = ('#30123b', '#a1fc3d', '#7a0402')
Turbo4 = ('#30123b', '#1ae4b6', '#f9ba38', '#7a0402')
Turbo5 = ('#30123b', '#2ab9ed', '#a1fc3d', '#fb8022', '#7a0402')
Turbo6 = ('#30123b', '#3e9bfe', '#46f783', '#e1dc37', '#ef5a11', '#7a0402')
Turbo7 = ('#30123b', '#4584f9', '#1ae4b6', '#a1fc3d', '#f9ba38', '#e5460a', '#7a0402')
Turbo8 = ('#30123b', '#4675ed', '#1ccdd7', '#61fc6c', '#cfea34', '#fe9b2d', '#db3a07', '#7a0402')
Turbo9 = ('#30123b', '#4668e0', '#2ab9ed', '#2ff09a', '#a1fc3d', '#ecd139', '#fb8022', '#d23005', '#7a0402')
Turbo10 = ('#30123b', '#4560d6', '#36a8f9', '#1ae4b6', '#71fd5f', '#c5ef33', '#f9ba38', '#f66b18', '#cb2b03', '#7a0402')
Turbo11 = ('#30123b', '#4458cb', '#3e9bfe', '#18d5cc', '#46f783', '#a1fc3d', '#e1dc37', '#fda631', '#ef5a11', '#c52602', '#7a0402')
Turbo256 = (
    '#30123b', '#311542', '#32184a', '#341b51', '#351e58', '#36215f', '#372365', '#38266c', '#392972', '#3a2c79', '#3b2f7f', '#3c3285',
    '#3c358b', '#3d3791', '#3e3a96', '#3f3d9c', '#4040a1', '#4043a6', '#4145ab', '#4148b0', '#424bb5', '#434eba', '#4350be', '#4353c2',
    '#4456c7', '#4458cb', '#455bce', '#455ed2', '#4560d6', '#4563d9', '#4666dd', '#4668e0', '#466be3', '#466de6', '#4670e8', '#4673eb',
    '#4675ed', '#4678f0', '#467af2', '#467df4', '#467ff6', '#4682f8', '#4584f9', '#4587fb', '#4589fc', '#448cfd', '#438efd', '#4291fe',
    '#4193fe', '#4096fe', '#3f98fe', '#3e9bfe', '#3c9dfd', '#3ba0fc', '#39a2fc', '#38a5fb', '#36a8f9', '#34aaf8', '#33acf6', '#31aff5',
    '#2fb1f3', '#2db4f1', '#2bb6ef', '#2ab9ed', '#28bbeb', '#26bde9', '#25c0e6', '#23c2e4', '#21c4e1', '#20c6df', '#1ec9dc', '#1dcbda',
    '#1ccdd7', '#1bcfd4', '#1ad1d2', '#19d3cf', '#18d5cc', '#18d7ca', '#17d9c7', '#17dac4', '#17dcc2', '#17debf', '#18e0bd', '#18e1ba',
    '#19e3b8', '#1ae4b6', '#1be5b4', '#1de7b1', '#1ee8af', '#20e9ac', '#22eba9', '#24eca6', '#27eda3', '#29eea0', '#2cef9d', '#2ff09a',
    '#32f197', '#35f394', '#38f491', '#3bf48d', '#3ff58a', '#42f687', '#46f783', '#4af880', '#4df97c', '#51f979', '#55fa76', '#59fb72',
    '#5dfb6f', '#61fc6c', '#65fc68', '#69fd65', '#6dfd62', '#71fd5f', '#74fe5c', '#78fe59', '#7cfe56', '#80fe53', '#84fe50', '#87fe4d',
    '#8bfe4b', '#8efe48', '#92fe46', '#95fe44', '#98fe42', '#9bfd40', '#9efd3e', '#a1fc3d', '#a4fc3b', '#a6fb3a', '#a9fb39', '#acfa37',
    '#aef937', '#b1f836', '#b3f835', '#b6f735', '#b9f534', '#bbf434', '#bef334', '#c0f233', '#c3f133', '#c5ef33', '#c8ee33', '#caed33',
    '#cdeb34', '#cfea34', '#d1e834', '#d4e735', '#d6e535', '#d8e335', '#dae236', '#dde036', '#dfde36', '#e1dc37', '#e3da37', '#e5d838',
    '#e7d738', '#e8d538', '#ead339', '#ecd139', '#edcf39', '#efcd39', '#f0cb3a', '#f2c83a', '#f3c63a', '#f4c43a', '#f6c23a', '#f7c039',
    '#f8be39', '#f9bc39', '#f9ba38', '#fab737', '#fbb537', '#fbb336', '#fcb035', '#fcae34', '#fdab33', '#fda932', '#fda631', '#fda330',
    '#fea12f', '#fe9e2e', '#fe9b2d', '#fe982c', '#fd952b', '#fd9229', '#fd8f28', '#fd8c27', '#fc8926', '#fc8624', '#fb8323', '#fb8022',
    '#fa7d20', '#fa7a1f', '#f9771e', '#f8741c', '#f7711b', '#f76e1a', '#f66b18', '#f56817', '#f46516', '#f36315', '#f26014', '#f15d13',
    '#ef5a11', '#ee5810', '#ed550f', '#ec520e', '#ea500d', '#e94d0d', '#e84b0c', '#e6490b', '#e5460a', '#e3440a', '#e24209', '#e04008',
    '#de3e08', '#dd3c07', '#db3a07', '#d93806', '#d73606', '#d63405', '#d43205', '#d23005', '#d02f04', '#ce2d04', '#cb2b03', '#c92903',
    '#c72803', '#c52602', '#c32402', '#c02302', '#be2102', '#bb1f01', '#b91e01', '#b61c01', '#b41b01', '#b11901', '#ae1801', '#ac1601',
    '#a91501', '#a61401', '#a31201', '#a01101', '#9d1001', '#9a0e01', '#970d01', '#940c01', '#910b01', '#8e0a01', '#8b0901', '#870801',
    '#840701', '#810602', '#7d0502', '#7a0402')

Category10_10 = ('#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf')
Category10_9 = Category10_10[:9]
Category10_8 = Category10_10[:8]
Category10_7 = Category10_10[:7]
Category10_6 = Category10_10[:6]
Category10_5 = Category10_10[:5]
Category10_4 = Category10_10[:4]
Category10_3 = Category10_10[:3]

Category20_20 = (
    '#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5',
    '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5')
Category20_19 = Category20_20[:19]
Category20_18 = Category20_20[:18]
Category20_17 = Category20_20[:17]
Category20_16 = Category20_20[:16]
Category20_15 = Category20_20[:15]
Category20_14 = Category20_20[:14]
Category20_13 = Category20_20[:13]
Category20_12 = Category20_20[:12]
Category20_11 = Category20_20[:11]
Category20_10 = Category20_20[:10]
Category20_9 = Category20_20[:9]
Category20_8 = Category20_20[:8]
Category20_7 = Category20_20[:7]
Category20_6 = Category20_20[:6]
Category20_5 = Category20_20[:5]
Category20_4 = Category20_20[:4]
Category20_3 = Category20_20[:3]

Category20b_20 = (
    '#393b79', '#5254a3', '#6b6ecf', '#9c9ede', '#637939', '#8ca252', '#b5cf6b', '#cedb9c', '#8c6d31', '#bd9e39',
    '#e7ba52', '#e7cb94', '#843c39', '#ad494a', '#d6616b', '#e7969c', '#7b4173', '#a55194', '#ce6dbd', '#de9ed6')
Category20b_19 = Category20b_20[:19]
Category20b_18 = Category20b_20[:18]
Category20b_17 = Category20b_20[:17]
Category20b_16 = Category20b_20[:16]
Category20b_15 = Category20b_20[:15]
Category20b_14 = Category20b_20[:14]
Category20b_13 = Category20b_20[:13]
Category20b_12 = Category20b_20[:12]
Category20b_11 = Category20b_20[:11]
Category20b_10 = Category20b_20[:10]
Category20b_9 = Category20b_20[:9]
Category20b_8 = Category20b_20[:8]
Category20b_7 = Category20b_20[:7]
Category20b_6 = Category20b_20[:6]
Category20b_5 = Category20b_20[:5]
Category20b_4 = Category20b_20[:4]
Category20b_3 = Category20b_20[:3]

Category20c_20 = (
    '#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#e6550d', '#fd8d3c', '#fdae6b', '#fdd0a2', '#31a354', '#74c476',
    '#a1d99b', '#c7e9c0', '#756bb1', '#9e9ac8', '#bcbddc', '#dadaeb', '#636363', '#969696', '#bdbdbd', '#d9d9d9')
Category20c_19 = Category20c_20[:19]
Category20c_18 = Category20c_20[:18]
Category20c_17 = Category20c_20[:17]
Category20c_16 = Category20c_20[:16]
Category20c_15 = Category20c_20[:15]
Category20c_14 = Category20c_20[:14]
Category20c_13 = Category20c_20[:13]
Category20c_12 = Category20c_20[:12]
Category20c_11 = Category20c_20[:11]
Category20c_10 = Category20c_20[:10]
Category20c_9 = Category20c_20[:9]
Category20c_8 = Category20c_20[:8]
Category20c_7 = Category20c_20[:7]
Category20c_6 = Category20c_20[:6]
Category20c_5 = Category20c_20[:5]
Category20c_4 = Category20c_20[:4]
Category20c_3 = Category20c_20[:3]

# colorblind friendly palette from http://jfly.iam.u-tokyo.ac.jp/color/
#             ('blue   ', 'orange ', 'yellow ', 'blugren', 'skyblue', 'vermill', 'redprpl', 'black  ') # key
Colorblind8 = ('#0072B2', '#E69F00', '#F0E442', '#009E73', '#56B4E9', '#D55E00', '#CC79A7', '#000000') # reordered
Colorblind7 = Colorblind8[:7]
Colorblind6 = Colorblind8[:6]
Colorblind5 = Colorblind8[:5]
Colorblind4 = Colorblind8[:4]
Colorblind3 = Colorblind8[:3]

#-----------------------------------------------------------------------------
# Palettes created by Paul Tol (https://personal.sron.nl/~pault/)
Bright7 = ('#4477AA', '#EE6677', '#228833', '#CCBB44', '#66CCEE', '#AA3377', '#BBBBBB')
Bright6 = Bright7[:6]
Bright5 = Bright7[:5]
Bright4 = Bright7[:4]
Bright3 = Bright7[:3]

HighContrast3 = ('#004488', '#DDAA33', '#BB5566')

Vibrant7 = ('#EE7733', '#0077BB', '#33BBEE', '#EE3377', '#CC3311', '#009988', '#BBBBBB')
Vibrant6 = Vibrant7[:6]
Vibrant5 = Vibrant7[:5]
Vibrant4 = Vibrant7[:4]
Vibrant3 = Vibrant7[:3]

Muted9 = ('#CC6677', '#332288', '#DDCC77', '#117733', '#88CCEE', '#882255', '#44AA99', '#999933', '#AA4499')
Muted8 = Muted9[:8]
Muted7 = Muted9[:7]
Muted6 = Muted9[:6]
Muted5 = Muted9[:5]
Muted4 = Muted9[:4]
Muted3 = Muted9[:3]

MediumContrast6 = ('#6699CC', '#004488', '#EECC66', '#994455', '#997700', '#EE99AA')
MediumContrast5 = MediumContrast6[:5]
MediumContrast4 = MediumContrast6[:4]
MediumContrast3 = MediumContrast6[:3]

PaleTextBackground = ('#BBCCEE', '#CCEEFF', '#CCDDAA', '#EEEEBB', '#FFCCCC', '#DDDDDD')

DarkText = ('#222255', '#225555', '#225522', '#666633', '#663333', '#555555')

Light9 = ('#77AADD', '#EE8866', '#EEDD88', '#FFAABB', '#99DDFF', '#44BB99', '#BBCC33', '#AAAA00', '#DDDDDD')
Light8 = Light9[:8]
Light7 = Light9[:7]
Light6 = Light9[:6]
Light5 = Light9[:5]
Light4 = Light9[:4]
Light3 = Light9[:3]

Sunset11 = ('#364B9A', '#4A7BB7', '#6EA6CD', '#98CAE1', '#C2E4EF', '#EAECCC', '#FEDA8B', '#FDB366', '#F67E4B', '#DD3D2D', '#A50026')
Sunset10 = ('#364B9A', '#4E7FB9', '#77AED1', '#A5D2E5', '#D3E7DF', '#F5E2A7', '#FDC072', '#F78951', '#DF4430', '#A50026')
Sunset9 = ('#364B9A', '#5384BC', '#83B8D7', '#87DDEB', '#EAECCC', '#FDD081', '#F99858', '#E34D34', '#A50026')
Sunset8 = ('#364B9A', '#598DC0', '#92C4DE', '#CDE6E5', '#F8DF9D', '#FCAB62', '#E75839', '#A50026')
Sunset7 = ('#364B9A', '#6197C5', '#A5D2E5', '#EAECCC', '#FDC072', '#ED6841', '#A50026')
Sunset6 = ('#364B9A', '#6EA6CD', '#C2E4EF', '#FEDA8B', '#F67E4B', '#A50026')
Sunset5 = ('#364B9A', '#83B8D7', '#EAECCC', '#F99858', '#A50026')
Sunset4 = ('#364B9A', '#A5D2E5', '#FDC072', '#A50026')
Sunset3 = ('#364B9A', '#EAECCC', '#A50026')

BuRd9 = ('#2166AC', '#4393C3', '#92C5DE', '#D1E5F0', '#F7F7F7', '#FDDBC7', '#F4A582', '#D6604D', '#B2182B')
BuRd8 = ('#2166AC', '#4E9AC6', '#A3CEE3', '#E1ECF3', '#FAE7DB', '#F6B495', '#DA6954', '#B2182B')
BuRd7 = ('#2166AC', '#5DA3CB', '#BBDAEA', '#F7F7F7', '#FAC9B0', '#E0775E', '#B2182B')
BuRd6 = ('#2166AC', '#72B1D3', '#D8E8F1', '#FBE0D0', '#E8896C', '#B2182B')
BuRd5 = ('#2166AC', '#92C5DE', '#F7F7F7', '#F4A582', '#B2182B')
BuRd4 = ('#2166AC', '#BBDAEA', '#FAC9B0', '#B2182B')
BuRd3 = ('#2166AC', '#F7F7F7', '#B2182B')

# This is similar to the Brewer PRGn scheme, with green A6DBA0 shifted to ACD39E to make it print-friendly.
TolPRGn9 = ('#762A83', '#9970AB', '#C2A5CF', '#E7D4E8', '#F7F7F7', '#D9F0D3', '#ACD39E', '#5AAE61', '#1B7837')
TolPRGn8 = ('#762A83', '#9E77B0', '#CCB2D6', '#EDE3EE', '#E5F3E2', '#B8DBAD', '#65B369', '#1B7837')
TolPRGn7 = ('#762A83', '#A681B7', '#DAC4DF', '#F7F7F7', '#CAE6C1', '#75BA75', '#1B7837')
TolPRGn6 = ('#762A83', '#B18FC0', '#EADBEB', '#DEF1DA', '#8BC485', '#1B7837')
TolPRGn5 = ('#762A83', '#C2A5CF', '#F7F7F7', '#ACD39E', '#1B7837')
TolPRGn4 = ('#762A83', '#DAC4DF', '#CAE6C1', '#1B7837')
TolPRGn3 = ('#762A83', '#F7F7F7', '#1B7837')

# This is similar to the Brewer YlOrBr scheme, with orange FE9929 shifted to FB9A29 to make it print-friendly.
TolYlOrBr9 = ('#FFFFE5', '#FFF7BC', '#FEE391', '#FEC44F', '#FB9A29', '#EC7014', '#CC4C02', '#993404', '#662506')
TolYlOrBr8 = ('#FFFFE5', '#FEF4B5', '#FEDA7E', '#FCB23E', '#F2821D', '#D55607', '#A03703', '#662506')
TolYlOrBr7 = ('#FFFFE5', '#FEF0AD', '#FECE65', '#FB9A29', '#E1640E', '#AA3C03', '#662506')
TolYlOrBr6 = ('#FFFFE5', '#FEEBA2', '#FDBB47', '#EF7818', '#B74202', '#662506')
TolYlOrBr5 = ('#FFFFE5', '#FEE391', '#FB9A29', '#CC4C02', '#662506')
TolYlOrBr4 = ('#FFFFE5', '#FECE65', '#E1640E', '#662506')
TolYlOrBr3 = ('#FFFFE5', '#FB9A29', '#662506')

Iridescent23 = (
    '#FEFBE9', '#FCF7D5', '#F5F3C1', '#EAF0B5', '#DDECBF', '#D0E7CA', '#C2E3D2', '#B5DDD8', '#A8D8DC', '#9BD2E1',
    '#8DCBE4', '#81C4E7', '#7BBCE7', '#7EB2E4', '#88A5DD', '#9398D2', '#9B8AC4', '#9D7DB2', '#9A709E', '#906388',
    '#805770', '#684957', '#46353A')
Iridescent22 = Iridescent23[:22]
Iridescent21 = Iridescent23[:21]
Iridescent20 = Iridescent23[:20]
Iridescent19 = Iridescent23[:19]
Iridescent18 = Iridescent23[:18]
Iridescent17 = Iridescent23[:17]
Iridescent16 = Iridescent23[:16]
Iridescent15 = Iridescent23[:15]
Iridescent14 = Iridescent23[:14]
Iridescent13 = Iridescent23[:13]
Iridescent12 = Iridescent23[:12]
Iridescent11 = Iridescent23[:11]
Iridescent10 = Iridescent23[:10]
Iridescent9 = Iridescent23[:9]
Iridescent8 = Iridescent23[:8]
Iridescent7 = Iridescent23[:7]
Iridescent6 = Iridescent23[:6]
Iridescent5 = Iridescent23[:5]
Iridescent4 = Iridescent23[:4]
Iridescent3 = Iridescent23[:3]

# Scheme from https://personal.sron.nl/~pault/#fig:scheme_rainbow_discrete_all
TolRainbow23 = (
    '#E8ECFB', '#D9CCE3', '#CAACCB', '#BA8DB4', '#AA6F9E', '#994F88', '#882E72', '#1965B0', '#437DBF', '#6195CF',
    '#7BAFDE', '#4EB265', '#90C987', '#CAE0AB', '#F7F056', '#F7CB45', '#F4A736', '#EE8026', '#E65518', '#DC050C',
    '#A5170E', '#72190E', '#42150A')
TolRainbow22 = (
    '#D9CCE3', '#CAACCB', '#BA8DB4', '#AA6F9E', '#994F88', '#882E72', '#1965B0', '#437DBF', '#6195CF', '#7BAFDE',
    '#4EB265', '#90C987', '#CAE0AB', '#F7F056', '#F7CB45', '#F4A736', '#EE8026', '#E65518', '#DC050C', '#A5170E',
    '#72190E', '#42150A')
TolRainbow21 = (
    '#D9CCE3', '#CAACCB', '#BA8DB4', '#AA6F9E', '#994F88', '#882E72', '#1965B0', '#437DBF', '#6195CF', '#7BAFDE',
    '#4EB265', '#90C987', '#CAE0AB', '#F7F056', '#F7CB45', '#F4A736', '#EE8026', '#E65518', '#DC050C', '#A5170E', '#72190E')
TolRainbow20 = (
    '#D9CCE3', '#CAACCB', '#BA8DB4', '#AA6F9E', '#994F88', '#882E72', '#1965B0', '#437DBF', '#6195CF', '#7BAFDE',
    '#4EB265', '#90C987', '#CAE0AB', '#F7F056', '#F6C141', '#F1932D', '#E8601C', '#DC050C', '#A5170E', '#72190E')
TolRainbow19 = (
    '#D9CCE3', '#CAACCB', '#BA8DB4', '#AA6F9E', '#994F88', '#882E72', '#1965B0', '#5289C7', '#7BAFDE', '#4EB265',
    '#90C987', '#CAE0AB', '#F7F056', '#F6C141', '#F1932D', '#E8601C', '#DC050C', '#A5170E', '#72190E')
TolRainbow18 = (
    '#D1BBD7', '#BA8DB4', '#AA6F9E', '#994F88', '#882E72', '#1965B0', '#5289C7', '#7BAFDE', '#4EB265', '#90C987',
    '#CAE0AB', '#F7F056', '#F6C141', '#F1932D', '#E8601C', '#DC050C', '#A5170E', '#72190E')
TolRainbow17 = (
    '#D1BBD7', '#BA8DB4', '#AA6F9E', '#994F88', '#882E72', '#1965B0', '#5289C7', '#7BAFDE', '#4EB265', '#90C987',
    '#CAE0AB', '#F7F056', '#F6C141', '#F1932D', '#E8601C', '#DC050C', '#72190E')
TolRainbow16 = (
    '#D1BBD7', '#BA8DB4', '#AA6F9E', '#882E72', '#1965B0', '#5289C7', '#7BAFDE', '#4EB265', '#90C987', '#CAE0AB',
    '#F7F056', '#F6C141', '#F1932D', '#E8601C', '#DC050C', '#72190E')
TolRainbow15 = (
    '#D1BBD7', '#AA6F9E', '#882E72', '#1965B0', '#5289C7', '#7BAFDE', '#4EB265', '#90C987', '#CAE0AB', '#F7F056',
    '#F6C141', '#F1932D', '#E8601C', '#DC050C', '#72190E')
TolRainbow14 = (
    '#D1BBD7', '#AA6F9E', '#882E72', '#1965B0', '#5289C7', '#7BAFDE', '#4EB265', '#90C987', '#CAE0AB', '#F7F056',
    '#F6C141', '#F1932D', '#E8601C', '#DC050C')
TolRainbow13 = (
    '#D1BBD7', '#AA6F9E', '#882E72', '#1965B0', '#5289C7', '#7BAFDE', '#4EB265', '#90C987', '#CAE0AB', '#F7F056',
    '#F4A736', '#E8601C', '#DC050C')
TolRainbow12 = (
    '#D1BBD7', '#AA6F9E', '#882E72', '#1965B0', '#5289C7', '#7BAFDE', '#4EB265', '#CAE0AB', '#F7F056', '#F4A736',
    '#E8601C', '#DC050C')
TolRainbow11 = ('#882E72', '#1965B0', '#5289C7', '#7BAFDE', '#4EB265', '#CAE0AB', '#F7F056', '#F4A736', '#E8601C', '#DC050C', '#72190E')
TolRainbow10 = ('#882E72', '#1965B0', '#7BAFDE', '#4EB265', '#CAE0AB', '#F7F056', '#F4A736', '#E8601C', '#DC050C', '#72190E')
TolRainbow9 = ('#882E72', '#1965B0', '#7BAFDE', '#4EB265', '#CAE0AB', '#F7F056', '#EE8026', '#DC050C', '#72190E')
TolRainbow8 = ('#882E72', '#1965B0', '#7BAFDE', '#4EB265', '#CAE0AB', '#F7F056', '#EE8026', '#DC050C')
TolRainbow7 = ('#882E72', '#1965B0', '#7BAFDE', '#4EB265', '#CAE0AB', '#F7F056', '#DC050C')
TolRainbow6 = ('#1965B0', '#7BAFDE', '#4EB265', '#CAE0AB', '#F7F056', '#DC050C')
TolRainbow5 = ('#1965B0', '#7BAFDE', '#4EB265', '#F7F056', '#DC050C')
TolRainbow4 = ('#1965B0', '#4EB265', '#F7F056', '#DC050C')
TolRainbow3 = ('#1965B0', '#F7F056', '#DC050C')
#-----------------------------------------------------------------------------

# Bokeh palette created from colors of shutter logo
Bokeh8 = ('#EC1557', '#F05223', '#F6A91B', '#A5CD39', '#20B254', '#00AAAE', '#4998D3', '#892889')
Bokeh7 = ('#EC1557', '#F05223', '#F6A91B', '#A5CD39', '#20B254', '#00AAAE', '#892889')
Bokeh6 = Bokeh7[:6]
Bokeh5 = Bokeh7[:5]
Bokeh4 = Bokeh7[:4]
Bokeh3 = Bokeh7[:3]


YlGn     = { 3: YlGn3,     4: YlGn4,     5: YlGn5,     6: YlGn6,     7: YlGn7,     8: YlGn8,     9: YlGn9 }
YlGnBu   = { 3: YlGnBu3,   4: YlGnBu4,   5: YlGnBu5,   6: YlGnBu6,   7: YlGnBu7,   8: YlGnBu8,   9: YlGnBu9 }
GnBu     = { 3: GnBu3,     4: GnBu4,     5: GnBu5,     6: GnBu6,     7: GnBu7,     8: GnBu8,     9: GnBu9 }
BuGn     = { 3: BuGn3,     4: BuGn4,     5: BuGn5,     6: BuGn6,     7: BuGn7,     8: BuGn8,     9: BuGn9 }
PuBuGn   = { 3: PuBuGn3,   4: PuBuGn4,   5: PuBuGn5,   6: PuBuGn6,   7: PuBuGn7,   8: PuBuGn8,   9: PuBuGn9 }
PuBu     = { 3: PuBu3,     4: PuBu4,     5: PuBu5,     6: PuBu6,     7: PuBu7,     8: PuBu8,     9: PuBu9 }
BuPu     = { 3: BuPu3,     4: BuPu4,     5: BuPu5,     6: BuPu6,     7: BuPu7,     8: BuPu8,     9: BuPu9 }
RdPu     = { 3: RdPu3,     4: RdPu4,     5: RdPu5,     6: RdPu6,     7: RdPu7,     8: RdPu8,     9: RdPu9 }
PuRd     = { 3: PuRd3,     4: PuRd4,     5: PuRd5,     6: PuRd6,     7: PuRd7,     8: PuRd8,     9: PuRd9 }
OrRd     = { 3: OrRd3,     4: OrRd4,     5: OrRd5,     6: OrRd6,     7: OrRd7,     8: OrRd8,     9: OrRd9 }
YlOrRd   = { 3: YlOrRd3,   4: YlOrRd4,   5: YlOrRd5,   6: YlOrRd6,   7: YlOrRd7,   8: YlOrRd8,   9: YlOrRd9 }
YlOrBr   = { 3: YlOrBr3,   4: YlOrBr4,   5: YlOrBr5,   6: YlOrBr6,   7: YlOrBr7,   8: YlOrBr8,   9: YlOrBr9 }
Purples  = { 3: Purples3,  4: Purples4,  5: Purples5,  6: Purples6,  7: Purples7,  8: Purples8,  9: Purples9,  256: Purples256 }
Blues    = { 3: Blues3,    4: Blues4,    5: Blues5,    6: Blues6,    7: Blues7,    8: Blues8,    9: Blues9,    256: Blues256   }
Greens   = { 3: Greens3,   4: Greens4,   5: Greens5,   6: Greens6,   7: Greens7,   8: Greens8,   9: Greens9,   256: Greens256  }
Oranges  = { 3: Oranges3,  4: Oranges4,  5: Oranges5,  6: Oranges6,  7: Oranges7,  8: Oranges8,  9: Oranges9,  256: Oranges256 }
Reds     = { 3: Reds3,     4: Reds4,     5: Reds5,     6: Reds6,     7: Reds7,     8: Reds8,     9: Reds9,     256: Reds256    }
Greys    = { 3: Greys3,    4: Greys4,    5: Greys5,    6: Greys6,    7: Greys7,    8: Greys8,    9: Greys9,    256: Greys256   }
PuOr     = { 3: PuOr3,     4: PuOr4,     5: PuOr5,     6: PuOr6,     7: PuOr7,     8: PuOr8,     9: PuOr9,     10: PuOr10,     11: PuOr11 }
BrBG     = { 3: BrBG3,     4: BrBG4,     5: BrBG5,     6: BrBG6,     7: BrBG7,     8: BrBG8,     9: BrBG9,     10: BrBG10,     11: BrBG11 }
PRGn     = { 3: PRGn3,     4: PRGn4,     5: PRGn5,     6: PRGn6,     7: PRGn7,     8: PRGn8,     9: PRGn9,     10: PRGn10,     11: PRGn11 }
PiYG     = { 3: PiYG3,     4: PiYG4,     5: PiYG5,     6: PiYG6,     7: PiYG7,     8: PiYG8,     9: PiYG9,     10: PiYG10,     11: PiYG11 }
RdBu     = { 3: RdBu3,     4: RdBu4,     5: RdBu5,     6: RdBu6,     7: RdBu7,     8: RdBu8,     9: RdBu9,     10: RdBu10,     11: RdBu11 }
RdGy     = { 3: RdGy3,     4: RdGy4,     5: RdGy5,     6: RdGy6,     7: RdGy7,     8: RdGy8,     9: RdGy9,     10: RdGy10,     11: RdGy11 }
RdYlBu   = { 3: RdYlBu3,   4: RdYlBu4,   5: RdYlBu5,   6: RdYlBu6,   7: RdYlBu7,   8: RdYlBu8,   9: RdYlBu9,   10: RdYlBu10,   11: RdYlBu11 }
Spectral = { 3: Spectral3, 4: Spectral4, 5: Spectral5, 6: Spectral6, 7: Spectral7, 8: Spectral8, 9: Spectral9, 10: Spectral10, 11: Spectral11 }
RdYlGn   = { 3: RdYlGn3,   4: RdYlGn4,   5: RdYlGn5,   6: RdYlGn6,   7: RdYlGn7,   8: RdYlGn8,   9: RdYlGn9,   10: RdYlGn10,   11: RdYlGn11 }
Accent   = { 3: Accent3,   4: Accent4,   5: Accent5,   6: Accent6,   7: Accent7,   8: Accent8 }
Dark2    = { 3: Dark2_3,   4: Dark2_4,   5: Dark2_5,   6: Dark2_6,   7: Dark2_7,   8: Dark2_8 }
Paired   = { 3: Paired3,   4: Paired4,   5: Paired5,   6: Paired6,   7: Paired7,   8: Paired8,   9: Paired9,   10: Paired10,   11: Paired11,  12: Paired12 }
Pastel1  = { 3: Pastel1_3, 4: Pastel1_4, 5: Pastel1_5, 6: Pastel1_6, 7: Pastel1_7, 8: Pastel1_8, 9: Pastel1_9 }
Pastel2  = { 3: Pastel2_3, 4: Pastel2_4, 5: Pastel2_5, 6: Pastel2_6, 7: Pastel2_7, 8: Pastel2_8 }
Set1     = { 3: Set1_3,    4: Set1_4,    5: Set1_5,    6: Set1_6,    7: Set1_7,    8: Set1_8,    9: Set1_9 }
Set2     = { 3: Set2_3,    4: Set2_4,    5: Set2_5,    6: Set2_6,    7: Set2_7,    8: Set2_8 }
Set3     = { 3: Set3_3,    4: Set3_4,    5: Set3_5,    6: Set3_6,    7: Set3_7,    8: Set3_8,    9: Set3_9,    10: Set3_10,    11: Set3_11,   12: Set3_12 }
Magma    = { 3: Magma3,    4: Magma4,    5: Magma5,    6: Magma6,    7: Magma7,    8: Magma8,    9: Magma9,    10: Magma10,    11: Magma11,   256: Magma256 }
Inferno  = { 3: Inferno3,  4: Inferno4,  5: Inferno5,  6: Inferno6,  7: Inferno7,  8: Inferno8,  9: Inferno9,  10: Inferno10,  11: Inferno11, 256: Inferno256 }
Plasma   = { 3: Plasma3,   4: Plasma4,   5: Plasma5,   6: Plasma6,   7: Plasma7,   8: Plasma8,   9: Plasma9,   10: Plasma10,   11: Plasma11,  256: Plasma256 }
Viridis  = { 3: Viridis3,  4: Viridis4,  5: Viridis5,  6: Viridis6,  7: Viridis7,  8: Viridis8,  9: Viridis9,  10: Viridis10,  11: Viridis11, 256: Viridis256 }
Cividis  = { 3: Cividis3,  4: Cividis4,  5: Cividis5,  6: Cividis6,  7: Cividis7,  8: Cividis8,  9: Cividis9,  10: Cividis10,  11: Cividis11, 256: Cividis256 }
Turbo    = { 3: Turbo3,    4: Turbo4,    5: Turbo5,    6: Turbo6,    7: Turbo7,    8: Turbo8,    9: Turbo9,    10: Turbo10,    11: Turbo11,   256: Turbo256 }
Category10  = { 3: Category10_3, 4: Category10_4, 5: Category10_5, 6: Category10_6,
                7: Category10_7, 8: Category10_8, 9: Category10_9, 10: Category10_10 }
Category20  = { 3:  Category20_3,   4:  Category20_4,   5:  Category20_5,   6:  Category20_6,   7:  Category20_7,
                8:  Category20_8,   9:  Category20_9,   10: Category20_10,  11: Category20_11,  12: Category20_12,
                13: Category20_13,  14: Category20_14,  15: Category20_15,  16: Category20_16,  17: Category20_17,
                18: Category20_18,  19: Category20_19,  20: Category20_20 }
Category20b = { 3:  Category20b_3,  4:  Category20b_4,  5:  Category20b_5,  6:  Category20b_6,  7:  Category20b_7,
                8:  Category20b_8,  9:  Category20b_9,  10: Category20b_10, 11: Category20b_11, 12: Category20b_12,
                13: Category20b_13, 14: Category20b_14, 15: Category20b_15, 16: Category20b_16, 17: Category20b_17,
                18: Category20b_18, 19: Category20b_19, 20: Category20b_20 }
Category20c = { 3:  Category20c_3,  4:  Category20c_4,  5:  Category20c_5,  6:  Category20c_6,  7:  Category20c_7,
                8:  Category20c_8,  9:  Category20c_9,  10: Category20c_10, 11: Category20c_11, 12: Category20c_12,
                13: Category20c_13, 14: Category20c_14, 15: Category20c_15, 16: Category20c_16, 17: Category20c_17,
                18: Category20c_18, 19: Category20c_19, 20: Category20c_20 }
Colorblind  = { 3: Colorblind3, 4: Colorblind4, 5: Colorblind5, 6: Colorblind6, 7: Colorblind7, 8: Colorblind8 }
Bright = { 3: Bright3, 4: Bright4, 5: Bright5, 6: Bright6, 7: Bright7 }
HighContrast: dict[int, tuple[str, ...]] = { 3: HighContrast3 }
Vibrant = { 3: Vibrant3, 4: Vibrant4, 5: Vibrant5, 6: Vibrant6, 7: Vibrant7 }
Muted = { 3: Muted3, 4: Muted4, 5: Muted5, 6: Muted6, 7: Muted7, 8: Muted8, 9: Muted9 }
MediumContrast = { 3: MediumContrast3, 4: MediumContrast4, 5: MediumContrast5, 6: MediumContrast6 }
Light = { 3: Light3, 4: Light4, 5: Light5, 6: Light6, 7: Light7, 8: Light8, 9: Light9 }
Sunset = { 3: Sunset3, 4: Sunset4, 5: Sunset5, 6: Sunset6, 7: Sunset7, 8: Sunset8, 9: Sunset9, 10: Sunset10, 11: Sunset11 }
BuRd = { 3: BuRd3, 4: BuRd4, 5: BuRd5, 6: BuRd6, 7: BuRd7, 8: BuRd8, 9: BuRd9 }
TolPRGn = { 3: TolPRGn3, 4: TolPRGn4, 5: TolPRGn5, 6: TolPRGn6, 7: TolPRGn7, 8: TolPRGn8, 9: TolPRGn9 }
TolYlOrBr = { 3: TolYlOrBr3, 4: TolYlOrBr4, 5: TolYlOrBr5, 6: TolYlOrBr6, 7: TolYlOrBr7, 8: TolYlOrBr8, 9: TolYlOrBr9 }
Iridescent = { 3:  Iridescent3,  4:  Iridescent4,  5:  Iridescent5,  6:  Iridescent6,  7:  Iridescent7,
                8:  Iridescent8,  9:  Iridescent9,  10: Iridescent10, 11: Iridescent11, 12: Iridescent12,
                13: Iridescent13, 14: Iridescent14, 15: Iridescent15, 16: Iridescent16, 17: Iridescent17,
                18: Iridescent18, 19: Iridescent19, 20: Iridescent20, 21: Iridescent21, 22: Iridescent22, 23: Iridescent23 }
TolRainbow = { 3:  TolRainbow3,  4:  TolRainbow4,  5:  TolRainbow5,  6:  TolRainbow6,  7:  TolRainbow7,
                8:  TolRainbow8,  9:  TolRainbow9,  10: TolRainbow10, 11: TolRainbow11, 12: TolRainbow12,
                13: TolRainbow13, 14: TolRainbow14, 15: TolRainbow15, 16: TolRainbow16, 17: TolRainbow17,
                18: TolRainbow18, 19: TolRainbow19, 20: TolRainbow20, 21: TolRainbow21, 22: TolRainbow22, 23: TolRainbow23 }
Bokeh = { 3: Bokeh3, 4: Bokeh4, 5: Bokeh5, 6: Bokeh6, 7: Bokeh7, 8: Bokeh8 }

brewer = {
    "YlGn"     : YlGn,
    "YlGnBu"   : YlGnBu,
    "GnBu"     : GnBu,
    "BuGn"     : BuGn,
    "PuBuGn"   : PuBuGn,
    "PuBu"     : PuBu,
    "BuPu"     : BuPu,
    "RdPu"     : RdPu,
    "PuRd"     : PuRd,
    "OrRd"     : OrRd,
    "YlOrRd"   : YlOrRd,
    "YlOrBr"   : YlOrBr,
    "Purples"  : Purples,
    "Blues"    : Blues,
    "Greens"   : Greens,
    "Oranges"  : Oranges,
    "Reds"     : Reds,
    "Greys"    : Greys,
    "PuOr"     : PuOr,
    "BrBG"     : BrBG,
    "PRGn"     : PRGn,
    "PiYG"     : PiYG,
    "RdBu"     : RdBu,
    "RdGy"     : RdGy,
    "RdYlBu"   : RdYlBu,
    "Spectral" : Spectral,
    "RdYlGn"   : RdYlGn,
    "Accent"   : Accent,
    "Dark2"    : Dark2,
    "Paired"   : Paired,
    "Pastel1"  : Pastel1,
    "Pastel2"  : Pastel2,
    "Set1"     : Set1,
    "Set2"     : Set2,
    "Set3"     : Set3,
}

bokeh = {
    "Bokeh" : Bokeh,
}

d3 = {
    "Category10"  : Category10,
    "Category20"  : Category20,
    "Category20b" : Category20b,
    "Category20c" : Category20c,
}

mpl = {
    "Magma"   : Magma,
    "Inferno" : Inferno,
    "Plasma"  : Plasma,
    "Viridis" : Viridis,
    "Cividis" : Cividis,
}

tol = {
    "Bright": Bright,
    "HighContrast": HighContrast,
    "Vibrant": Vibrant,
    "Muted": Muted,
    "MediumContrast": MediumContrast,
    "Light": Light,
    "Sunset": Sunset,
    "BuRd": BuRd,
    "TolPRGn": TolPRGn,
    "TolYlOrBr": TolYlOrBr,
    "Iridescent": Iridescent,
    "TolRainbow": TolRainbow,
}

colorblind = {
    "Colorblind" : Colorblind,
}

all_palettes = deepcopy(brewer)
all_palettes.update(d3)
all_palettes.update(tol)
all_palettes["Colorblind"] = Colorblind
all_palettes["Magma"]      = Magma
all_palettes["Inferno"]    = Inferno
all_palettes["Plasma"]     = Plasma
all_palettes["Viridis"]    = Viridis
all_palettes["Cividis"]    = Cividis
all_palettes["Turbo"]      = Turbo
all_palettes["Bokeh"]      = Bokeh

small_palettes = deepcopy(all_palettes)
del small_palettes["Greys"][256]
del small_palettes["Magma"][256]
del small_palettes["Inferno"][256]
del small_palettes["Plasma"][256]
del small_palettes["Viridis"][256]
del small_palettes["Cividis"][256]
del small_palettes["Turbo"][256]

def linear_palette(palette: Palette, n: int) -> Palette:
    """ Generate a new palette as a subset of a given palette.

    Given an input ``palette``, take ``n`` colors from it by dividing its
    length into ``n`` (approximately) evenly spaced indices.

    Args:

        palette (seq[str]) : a sequence of hex RGB color strings
        n (int) : the size of the output palette to generate

    Returns:
        seq[str] : a sequence of hex RGB color strings

    Raises:
        ValueError if n > len(palette)

    """
    if n > len(palette):
        raise ValueError(f"Requested {n} colors, function can only return colors up to the base palette's length ({len(palette)})")
    return tuple( palette[math.floor(i)] for i in np.linspace(0, len(palette)-1, num=n) )

def diverging_palette(palette1: Palette, palette2: Palette, n: int, midpoint: float = 0.5) -> Palette:
    """ Generate a new palette by combining exactly two input palettes.

    Given an input ``palette1`` and ``palette2``, take a combined ``n`` colors,
    and combine input palettes at the relative ``midpoint``.
    ``palette1`` and ``palette2`` are meant to be sequential palettes that proceed
    left to right from perceptually dark to light colors.  In that case the returned
    palette is comprised of the input palettes connected at perceptually light ends.
    Palettes are combined by piecewise linear interpolation.

    Args:

        palette1 (seq[str]) :
            A sequence of hex RGB color strings for the first palette

        palette2 (seq[str]) :
            A sequence of hex RGB color strings for the second palette

        n (int) :
            The size of the output palette to generate

        midpoint (float, optional) :
            Relative position in the returned palette where input palettes are
            connected (default: 0.5)

    Returns:
            seq[str] : a sequence of hex RGB color strings

    Raises:
        ValueError if n is greater than the possible combined length the input palettes
    """

    # flip palette2 so that perceptually light colors are joined
    palette2 = palette2[::-1]

    # determine number of colors from each palette
    n1 = round(midpoint * n)
    n2 = round((1 - midpoint) * n)

    # return piecewise linear interpolation of colors
    return linear_palette(palette1, n1) + linear_palette(palette2, n2)

def varying_alpha_palette(color: str, n: int | None = None, start_alpha: int = 0, end_alpha: int = 255) -> Palette:
    """ Generate a palette that is a single color with linearly varying alpha.

    Alpha may vary from low to high or high to low, depending on the values of
    ``start_alpha`` and ``end_alpha``.

    Args:
        color (str) :
            Named color or RGB(A) hex color string. Any alpha component is
            combined with the ``start_alpha`` to ``end_alpha`` range by
            multiplying them together, so it is the maximum possible alpha that
            can be obtained.

        n (int, optional) :
            The size of the palette to generate. If not specified uses the
            maximum number of colors such that adjacent colors differ by an
            alpha of 1.

        start_alpha (int, optional) :
            The alpha component of the start of the palette is this value (in
            the range 0 to 255) multiplied by the alpha component of the
            ``color`` argument.

        end_alpha (int, optional) :
            The alpha component of the end of the palette is this value (in
            the range 0 to 255) multiplied by the alpha component of the
            ``color`` argument.

    Returns:
        seq[str] : a sequence of hex RGBA color strings

    Raises:
        ValueError if ``color`` is not recognizable as a string name or hex
            RGB(A) string, or if ``start_alpha`` or ``end_alpha`` are outside
            the range 0 to 255 inclusive.

    """

    if not (0 <= start_alpha <= 255):
        raise ValueError(f"start_alpha {start_alpha} must be in the range 0 to 255")

    if not (0 <= end_alpha <= 255):
        raise ValueError(f"end_alpha {end_alpha} must be in the range 0 to 255")

    # Take a copy of RGB color as do not want to alter named colors
    rgba = NamedColor.from_string(color).copy()

    if rgba.a < 1.0:
        start_alpha = round(start_alpha*rgba.a)
        end_alpha = round(end_alpha*rgba.a)

    if n is None or n < 1:
        nn = int(abs(end_alpha - start_alpha)) + 1
    else:
        nn = n

    # Convert alpha to range 0 to 1.
    norm_start_alpha = start_alpha / 255.0
    norm_end_alpha = end_alpha / 255.0

    def set_alpha(rgba: RGB, i: int) -> RGB:
        rgba.a = norm_start_alpha + (norm_end_alpha - norm_start_alpha)*i / (nn-1.0)
        return rgba

    palette = tuple(set_alpha(rgba, i).to_hex() for i in range(nn))

    return palette

def interp_palette(palette: Palette, n: int) -> Palette:
    """ Generate a new palette by interpolating a given palette.

    Linear interpolation is performed separately on each of the RGBA
    components.

    Args:
        palette (seq[str]) :
            A sequence of hex RGB(A) color strings to create new palette from

        n (int) :
            The size of the palette to generate

    Returns:
        tuple[str] : a sequence of hex RGB(A) color strings

    Raises:
        ValueError if ``n`` is negative or the supplied ``palette`` is empty.

    """
    npalette = len(palette)
    if npalette < 1:
        raise ValueError("palette must contain at least one color")
    if n < 0:
        raise ValueError("requested palette length cannot be negative")

    rgba_array = to_rgba_array(palette)
    integers = np.arange(npalette)
    fractions = np.linspace(0, npalette-1, n)

    r = np.interp(fractions, integers, rgba_array[:, 0]).astype(np.uint8)
    g = np.interp(fractions, integers, rgba_array[:, 1]).astype(np.uint8)
    b = np.interp(fractions, integers, rgba_array[:, 2]).astype(np.uint8)
    a = np.interp(fractions, integers, rgba_array[:, 3]) / 255.0  # Remains floating-point

    return tuple(RGB(*args).to_hex() for args in zip(r, g, b, a))

def magma(n: int) -> Palette:
    """ Generate a palette of colors from the Magma palette.

    The full Magma palette that serves as input for deriving new palettes
    has 256 colors, and looks like:

    :bokeh-palette:`magma(256)`

    Args:
        n (int) : size of the palette to generate

    Returns:
        seq[str] : a sequence of hex RGB color strings

    Raises:
        ValueError if n is greater than the base palette length of 256

    Examples:

    .. code-block:: python

        >>> magma(6)
        ('#000003', '#3B0F6F', '#8C2980', '#DD4968', '#FD9F6C', '#FBFCBF')

    The resulting palette looks like: :bokeh-palette:`magma(6)`

    """
    return linear_palette(Magma256, n)

def inferno(n: int) -> Palette:
    """ Generate a palette of colors from the Inferno palette.

    The full Inferno palette that serves as input for deriving new palettes
    has 256 colors, and looks like:

    :bokeh-palette:`inferno(256)`

    Args:
        n (int) : size of the palette to generate

    Returns:
        seq[str] : a sequence of hex RGB color strings

    Raises:
        ValueError if n is greater than the base palette length of 256

    Examples:

    .. code-block:: python

        >>> inferno(6)
        ('#000003', '#410967', '#932567', '#DC5039', '#FBA40A', '#FCFEA4')

    The resulting palette looks like: :bokeh-palette:`inferno(6)`

    """
    return linear_palette(Inferno256, n)

def plasma(n: int) -> Palette:
    """ Generate a palette of colors from the Plasma palette.

    The full Plasma palette that serves as input for deriving new palettes
    has 256 colors, and looks like:

    :bokeh-palette:`plasma(256)`

    Args:
        n (int) : size of the palette to generate

    Returns:
        seq[str] : a sequence of hex RGB color strings

    Raises:
        ValueError if n is greater than the base palette length of 256

    Examples:

    .. code-block:: python

        >>> plasma(6)
        ('#0C0786', '#6A00A7', '#B02A8F', '#E06461', '#FCA635', '#EFF821')

    The resulting palette looks like: :bokeh-palette:`plasma(6)`

    """
    return linear_palette(Plasma256, n)

def viridis(n: int) -> Palette:
    """ Generate a palette of colors from the Viridis palette.

    The full Viridis palette that serves as input for deriving new palettes
    has 256 colors, and looks like:

    :bokeh-palette:`viridis(256)`

    Args:
        n (int) : size of the palette to generate

    Returns:
        seq[str] : a sequence of hex RGB color strings

    Raises:
        ValueError if n is greater than the base palette length of 256

    Examples:

    .. code-block:: python

        >>> viridis(6)
        ('#440154', '#404387', '#29788E', '#22A784', '#79D151', '#FDE724')

    The resulting palette looks like: :bokeh-palette:`viridis(6)`

    """
    return linear_palette(Viridis256, n)

def cividis(n: int) -> Palette:
    """ Generate a palette of colors from the Cividis palette.

    The full Cividis palette that serves as input for deriving new palettes
    has 256 colors, and looks like:

    :bokeh-palette:`cividis(256)`

    Args:
        n (int) : size of the palette to generate

    Returns:
        seq[str] : a sequence of hex RGB color strings

    Raises:
        ValueError if n is greater than the base palette length of 256

    Examples:

    .. code-block:: python

        >>> cividis(6)
        ('#00204C', '#31446B', '#666870', '#958F78', '#CAB969', '#FFE945')

    The resulting palette looks like: :bokeh-palette:`cividis(6)`

    """
    return linear_palette(Cividis256, n)

def turbo(n: int) -> Palette:
    """ Generate a palette of colors from the Turbo palette.

    Turbo is described here:

    https://ai.googleblog.com/2019/08/turbo-improved-rainbow-colormap-for.html

    The full Turbo palette that serves as input for deriving new palettes
    has 256 colors, and looks like:

    :bokeh-palette:`turbo(256)`

    Args:
        n (int) : size of the palette to generate

    Returns:
        seq[str] : a sequence of hex RGB color strings

    Raises:
        ValueError if n is greater than the base palette length of 256

    Examples:

    .. code-block:: python

        >>> turbo(6)
        ('#00204C', '#31446B', '#666870', '#958F78', '#CAB969', '#FFE945')

    The resulting palette looks like: :bokeh-palette:`turbo(6)`

    """
    return linear_palette(Turbo256, n)

def grey(n: int) -> Palette:
    """ Generate a palette of colors from the Greys palette.

    The full Greys palette that serves as input for deriving new palettes
    has 256 colors, and looks like:

    :bokeh-palette:`grey(256)`

    Args:
        n (int) : size of the palette to generate

    Returns:
        seq[str] : a sequence of hex RGB color strings

    Raises:
        ValueError if n is greater than the base palette length of 256

    Examples:

    .. code-block:: python

        >>> grey(6)
        ('#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff')

    The resulting palette looks like: :bokeh-palette:`gray(6)`

    .. note::
        This function also has the alternate spelling ``gray``

    """
    return linear_palette(Greys256, n)

def gray(n: int) -> Palette:
    """ Generate a palette of colors or from the Greys palette.

    The full Greys palette that serves as input for deriving new palettes
    has 256 colors, and looks like:

    :bokeh-palette:`grey(256)`

    Args:
        n (int) : size of the palette to generate

    Returns:
        seq[str] : a sequence of hex RGB color strings

    Raises:
        ValueError if n is greater than the base palette length of 256

    Examples:

    .. code-block:: python

        >>> gray(6)
        ('#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff')

    The resulting palette looks like: :bokeh-palette:`grey(6)`

    .. note::
        This function also has the alternate spelling ``grey``

    """
    return linear_palette(Greys256, n)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def to_rgba_array(palette: Palette) -> npt.NDArray[np.uint8]:
    """ Convert palette to a numpy array of uint8 RGBA components.
    """
    rgba_array = np.empty((len(palette), 4), dtype=np.uint8)

    for i, color in enumerate(palette):
        rgba = NamedColor.from_string(color)
        rgba_array[i] = (rgba.r, rgba.g, rgba.b, rgba.a*255)

    return rgba_array

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

__palettes__: list[str] = []
for name, palettes in sorted(all_palettes.items(), key=lambda arg: arg[0]):
    name = name + "_" if name[-1].isdigit() else name
    __palettes__ += [ name + str(index) for index in sorted(palettes.keys()) ]

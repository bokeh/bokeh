#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide the standard 147 CSS (X11) named colors.

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

# Bokeh imports
from .util import NamedColor

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

aliceblue            = NamedColor("aliceblue",             240,  248,  255)
antiquewhite         = NamedColor("antiquewhite",          250,  235,  215)
aqua                 = NamedColor("aqua",                  0,    255,  255)
aquamarine           = NamedColor("aquamarine",            127,  255,  212)
azure                = NamedColor("azure",                 240,  255,  255)
beige                = NamedColor("beige",                 245,  245,  220)
bisque               = NamedColor("bisque",                255,  228,  196)
black                = NamedColor("black",                 0,    0,    0  )
blanchedalmond       = NamedColor("blanchedalmond",        255,  235,  205)
blue                 = NamedColor("blue",                  0,    0,    255)
blueviolet           = NamedColor("blueviolet",            138,  43,   226)
brown                = NamedColor("brown",                 165,  42,   42 )
burlywood            = NamedColor("burlywood",             222,  184,  135)
cadetblue            = NamedColor("cadetblue",             95,   158,  160)
chartreuse           = NamedColor("chartreuse",            127,  255,  0  )
chocolate            = NamedColor("chocolate",             210,  105,  30 )
coral                = NamedColor("coral",                 255,  127,  80 )
cornflowerblue       = NamedColor("cornflowerblue",        100,  149,  237)
cornsilk             = NamedColor("cornsilk",              255,  248,  220)
crimson              = NamedColor("crimson",               220,  20,   60 )
cyan                 = NamedColor("cyan",                  0,    255,  255)
darkblue             = NamedColor("darkblue",              0,    0,    139)
darkcyan             = NamedColor("darkcyan",              0,    139,  139)
darkgoldenrod        = NamedColor("darkgoldenrod",         184,  134,  11 )
darkgray             = NamedColor("darkgray",              169,  169,  169)
darkgreen            = NamedColor("darkgreen",             0,    100,  0  )
darkgrey             = NamedColor("darkgrey",              169,  169,  169)
darkkhaki            = NamedColor("darkkhaki",             189,  183,  107)
darkmagenta          = NamedColor("darkmagenta",           139,  0,    139)
darkolivegreen       = NamedColor("darkolivegreen",        85,   107,  47 )
darkorange           = NamedColor("darkorange",            255,  140,  0  )
darkorchid           = NamedColor("darkorchid",            153,  50,   204)
darkred              = NamedColor("darkred",               139,  0,    0  )
darksalmon           = NamedColor("darksalmon",            233,  150,  122)
darkseagreen         = NamedColor("darkseagreen",          143,  188,  143)
darkslateblue        = NamedColor("darkslateblue",         72,   61,   139)
darkslategray        = NamedColor("darkslategray",         47,   79,   79 )
darkslategrey        = NamedColor("darkslategrey",         47,   79,   79 )
darkturquoise        = NamedColor("darkturquoise",         0,    206,  209)
darkviolet           = NamedColor("darkviolet",            148,  0,    211)
deeppink             = NamedColor("deeppink",              255,  20,   147)
deepskyblue          = NamedColor("deepskyblue",           0,    191,  255)
dimgray              = NamedColor("dimgray",               105,  105,  105)
dimgrey              = NamedColor("dimgrey",               105,  105,  105)
dodgerblue           = NamedColor("dodgerblue",            30,   144,  255)
firebrick            = NamedColor("firebrick",             178,  34,   34 )
floralwhite          = NamedColor("floralwhite",           255,  250,  240)
forestgreen          = NamedColor("forestgreen",           34,   139,  34 )
fuchsia              = NamedColor("fuchsia",               255,  0,    255)
gainsboro            = NamedColor("gainsboro",             220,  220,  220)
ghostwhite           = NamedColor("ghostwhite",            248,  248,  255)
gold                 = NamedColor("gold",                  255,  215,  0  )
goldenrod            = NamedColor("goldenrod",             218,  165,  32 )
gray                 = NamedColor("gray",                  128,  128,  128)
green                = NamedColor("green",                 0,    128,  0  )
greenyellow          = NamedColor("greenyellow",           173,  255,  47 )
grey                 = NamedColor("grey",                  128,  128,  128)
honeydew             = NamedColor("honeydew",              240,  255,  240)
hotpink              = NamedColor("hotpink",               255,  105,  180)
indianred            = NamedColor("indianred",             205,  92,   92 )
indigo               = NamedColor("indigo",                75,   0,    130)
ivory                = NamedColor("ivory",                 255,  255,  240)
khaki                = NamedColor("khaki",                 240,  230,  140)
lavender             = NamedColor("lavender",              230,  230,  250)
lavenderblush        = NamedColor("lavenderblush",         255,  240,  245)
lawngreen            = NamedColor("lawngreen",             124,  252,  0  )
lemonchiffon         = NamedColor("lemonchiffon",          255,  250,  205)
lightblue            = NamedColor("lightblue",             173,  216,  230)
lightcoral           = NamedColor("lightcoral",            240,  128,  128)
lightcyan            = NamedColor("lightcyan",             224,  255,  255)
lightgoldenrodyellow = NamedColor("lightgoldenrodyellow",  250,  250,  210)
lightgray            = NamedColor("lightgray",             211,  211,  211)
lightgreen           = NamedColor("lightgreen",            144,  238,  144)
lightgrey            = NamedColor("lightgrey",             211,  211,  211)
lightpink            = NamedColor("lightpink",             255,  182,  193)
lightsalmon          = NamedColor("lightsalmon",           255,  160,  122)
lightseagreen        = NamedColor("lightseagreen",         32,   178,  170)
lightskyblue         = NamedColor("lightskyblue",          135,  206,  250)
lightslategray       = NamedColor("lightslategray",        119,  136,  153)
lightslategrey       = NamedColor("lightslategrey",        119,  136,  153)
lightsteelblue       = NamedColor("lightsteelblue",        176,  196,  222)
lightyellow          = NamedColor("lightyellow",           255,  255,  224)
lime                 = NamedColor("lime",                  0,    255,  0  )
limegreen            = NamedColor("limegreen",             50,   205,  50 )
linen                = NamedColor("linen",                 250,  240,  230)
magenta              = NamedColor("magenta",               255,  0,    255)
maroon               = NamedColor("maroon",                128,  0,    0  )
mediumaquamarine     = NamedColor("mediumaquamarine",      102,  205,  170)
mediumblue           = NamedColor("mediumblue",            0,    0,    205)
mediumorchid         = NamedColor("mediumorchid",          186,  85,   211)
mediumpurple         = NamedColor("mediumpurple",          147,  112,  219)
mediumseagreen       = NamedColor("mediumseagreen",        60,   179,  113)
mediumslateblue      = NamedColor("mediumslateblue",       123,  104,  238)
mediumspringgreen    = NamedColor("mediumspringgreen",     0,    250,  154)
mediumturquoise      = NamedColor("mediumturquoise",       72,   209,  204)
mediumvioletred      = NamedColor("mediumvioletred",       199,  21,   133)
midnightblue         = NamedColor("midnightblue",          25,   25,   112)
mintcream            = NamedColor("mintcream",             245,  255,  250)
mistyrose            = NamedColor("mistyrose",             255,  228,  225)
moccasin             = NamedColor("moccasin",              255,  228,  181)
navajowhite          = NamedColor("navajowhite",           255,  222,  173)
navy                 = NamedColor("navy",                  0,    0,    128)
oldlace              = NamedColor("oldlace",               253,  245,  230)
olive                = NamedColor("olive",                 128,  128,  0  )
olivedrab            = NamedColor("olivedrab",             107,  142,  35 )
orange               = NamedColor("orange",                255,  165,  0  )
orangered            = NamedColor("orangered",             255,  69,   0  )
orchid               = NamedColor("orchid",                218,  112,  214)
palegoldenrod        = NamedColor("palegoldenrod",         238,  232,  170)
palegreen            = NamedColor("palegreen",             152,  251,  152)
paleturquoise        = NamedColor("paleturquoise",         175,  238,  238)
palevioletred        = NamedColor("palevioletred",         219,  112,  147)
papayawhip           = NamedColor("papayawhip",            255,  239,  213)
peachpuff            = NamedColor("peachpuff",             255,  218,  185)
peru                 = NamedColor("peru",                  205,  133,  63 )
pink                 = NamedColor("pink",                  255,  192,  203)
plum                 = NamedColor("plum",                  221,  160,  221)
powderblue           = NamedColor("powderblue",            176,  224,  230)
purple               = NamedColor("purple",                128,  0,    128)
rebeccapurple        = NamedColor("rebeccapurple",         102,  51,   153)
red                  = NamedColor("red",                   255,  0,    0  )
rosybrown            = NamedColor("rosybrown",             188,  143,  143)
royalblue            = NamedColor("royalblue",             65,   105,  225)
saddlebrown          = NamedColor("saddlebrown",           139,  69,   19 )
salmon               = NamedColor("salmon",                250,  128,  114)
sandybrown           = NamedColor("sandybrown",            244,  164,  96 )
seagreen             = NamedColor("seagreen",              46,   139,  87 )
seashell             = NamedColor("seashell",              255,  245,  238)
sienna               = NamedColor("sienna",                160,  82,   45 )
silver               = NamedColor("silver",                192,  192,  192)
skyblue              = NamedColor("skyblue",               135,  206,  235)
slateblue            = NamedColor("slateblue",             106,  90,   205)
slategray            = NamedColor("slategray",             112,  128,  144)
slategrey            = NamedColor("slategrey",             112,  128,  144)
snow                 = NamedColor("snow",                  255,  250,  250)
springgreen          = NamedColor("springgreen",           0,    255,  127)
steelblue            = NamedColor("steelblue",             70,   130,  180)
tan                  = NamedColor("tan",                   210,  180,  140)
teal                 = NamedColor("teal",                  0,    128,  128)
thistle              = NamedColor("thistle",               216,  191,  216)
tomato               = NamedColor("tomato",                255,  99,   71 )
turquoise            = NamedColor("turquoise",             64,   224,  208)
violet               = NamedColor("violet",                238,  130,  238)
wheat                = NamedColor("wheat",                 245,  222,  179)
white                = NamedColor("white",                 255,  255,  255)
whitesmoke           = NamedColor("whitesmoke",            245,  245,  245)
yellow               = NamedColor("yellow",                255,  255,  0  )
yellowgreen          = NamedColor("yellowgreen",           154,  205,  50 )

__all__ = NamedColor.__all__

colors = NamedColor.colors

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

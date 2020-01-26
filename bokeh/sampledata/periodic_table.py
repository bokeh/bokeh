#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a periodic table data set. It exposes an attribute ``elements``
which is a pandas Dataframe with the following fields:

.. code-block:: python

    elements['atomic Number']        (units: g/cm^3)
    elements['symbol']
    elements['name']
    elements['atomic mass']          (units: amu)
    elements['CPK']                  (convention for molecular modeling color)
    elements['electronic configuration']
    elements['electronegativity']    (units: Pauling)
    elements['atomic radius']        (units: pm)
    elements['ionic radius']         (units: pm)
    elements['van der waals radius'] (units: pm)
    elements['ionization enerygy']   (units: kJ/mol)
    elements['electron affinity']    (units: kJ/mol)
    elements['phase']                (standard state: solid, liquid, gas)
    elements['bonding type']
    elements['melting point']        (units: K)
    elements['boiling point']        (units: K)
    elements['density']              (units: g/cm^3)
    elements['type']                 (see below)
    elements['year discovered']
    elements['group']
    elements['period']

where element types are:

    actinoid
    alkali metal
    alkaline earth metal
    halogen,
    lanthanoid
    metal
    metalloid
    noble gas
    nonmetal
    transition metalloid

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..util.sampledata import package_csv

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'elements',
)

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

elements = package_csv('periodic_table', 'elements.csv')

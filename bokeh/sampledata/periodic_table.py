'''
This module provides the periodic table as a data set. It exposes an attribute 'elements'
which is a pandas dataframe with the following fields

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

element types: actinoid, alkali metal, alkaline earth metal, halogen, lanthanoid, metal, metalloid, noble gas, nonmetal, transition metalloid

'''
from __future__ import absolute_import

from bokeh.util.dependencies import import_required
pd = import_required('pandas',
              'periodic_table sample data requires Pandas (http://pandas.pydata.org) to be installed')

from os.path import dirname, join

elements = pd.read_csv(join(dirname(__file__), 'elements.csv'))

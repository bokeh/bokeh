'''
This module provides the periodic table as a data set. It exposes an attribute 'elements'
which is a pandas dataframe with the following fields

    elements['Atomic Number']       (units: g/cm^3)
    elements['Symbol']
    elements['Name']
    elements['Atomic Mass']         (units: amu)
    elements['CPK Color']           (convention for molecular modeling)
    elements['Electronic Configuration'] 
    elements['Electronegativity']   (units: Pauling)
    elements['Atomic Radius']       (units: pm)
    elements['Ionic Radius']        (units: pm)
    elements['van der Walls Radius'] (units: pm)
    elements['Ionization Energy']   (units: kJ/mol)
    elements['Electron Affinity']   (units: kJ/mol)
    elements['Phase']               (solid, liquid, gas)
    elements['Bonding Type']
    elements['Melting Point']       (units: K)
    elements['Boiling Point']       (units: K)
    elements['Density']             (units: g/cm^3)
    elements['Metal or Nonmetal']
    elements['Year Discovered']
'''
from os.path import dirname, join

try:
    import pandas as pd
except ImportError as e:
    raise RuntimeError("elements data requires pandas (http://pandas.pydata.org) to be installed")

elements = pd.read_csv(join(dirname(__file__), 'elements.csv'))
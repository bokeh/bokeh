from __future__ import absolute_import

from itertools import cycle


class AttrSpec(object):
    """A container for assigning attributes to values and retrieving them as needed.

    A special function this provides is automatically handling cases where the provided
    iterator is too short compared to the distinct values provided.

    Once created as attr_spec, you can do attr_spec[data_label], where data_label must
    be a one dimensional tuple of values, representing the unique group in the data.
    """

    def __init__(self, df, columns, attribute, iterable):
        self.df = df
        self.columns = self._ensure_list(columns)
        self.attribute = attribute
        self.iterable = cycle(iterable)
        self.attr_map = self._create_attr_map()

    @staticmethod
    def _ensure_list(attr):
        if not isinstance(attr, list):
            return [attr]
        else:
            return attr

    @staticmethod
    def _ensure_tuple(attr):
        if not isinstance(attr, tuple):
            return (attr,)
        else:
            return attr

    def _create_attr_map(self):
        """Creates map between unique values and available attributes."""
        df = self.df.sort(columns=self.columns)
        items = df[self.columns].drop_duplicates()
        items = [tuple(x) for x in items.to_records(index=False)]

        iter_map = {}
        for item in items:
            item = self._ensure_tuple(item)
            iter_map[item] = next(self.iterable)
        return iter_map

    def __getitem__(self, item):
        """Lookup the attribute to use for the given unique group label."""
        return self.attr_map[self._ensure_tuple(item)]


""" Attribute Spec Generators

Flexible and reusable functions for generating Attribute Specs from many input
options.

Since an attribute spec requires the source dataframe, the attribute spec
generator function pattern is to return a function that takes a single input
of a Pandas DataFrame, and returns an AttrSpec object.
"""


def color(cols, palette):
    """Generates a callable that produces a color attribute spec."""
    def color_spec_gen(df):
        return AttrSpec(df, columns=cols, attribute='color', iterable=palette)

    return color_spec_gen

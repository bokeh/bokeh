from ..bbmodel import ContinuumModel, register_type
class PandasModel(ContinuumModel):
    """Pandas class
    attributes:
        path : filesystem path of pickled pandas data
        sort : list of columns to sort by
        groups : list of columns to group by (not implemented)
        agg : agg function (not implemented)
    """
        
register_type('Pandas', PandasModel)

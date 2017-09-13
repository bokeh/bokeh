from .deprecation import deprecated

def _convert_responsive(responsive):
    deprecated((0, 12, 10), "responsive parameter", "sizing_mode='fixed' for responsive=False or sizing_mode='scale_width' for responsive=True")
    if responsive is True:
        return 'scale_width'
    if responsive is False:
        return'fixed'
    raise ValueError("'responsive' may only be True or False, passed %r" % responsive)

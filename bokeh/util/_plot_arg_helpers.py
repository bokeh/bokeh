def _convert_responsive(responsive):
    if responsive is True:
        return 'scale_width'
    if responsive is False:
        return'fixed'
    raise ValueError("'responsive' may only be True or False, passed %r" % responsive)

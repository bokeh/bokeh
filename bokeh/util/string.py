
def encode_utf8(u):
    import sys
    if sys.version_info[0] == 2:
        u = u.encode('utf-8')
    return u

def decode_utf8(u):
    import sys
    if sys.version_info[0] == 2:
        u = u.decode('utf-8')
    return u

def nice_join(seq, sep=", "):
    seq = [str(x) for x in seq]

    if len(seq) <= 1:
        return sep.join(seq)
    else:
        return "%s or %s" % (sep.join(seq[:-1]), seq[-1])
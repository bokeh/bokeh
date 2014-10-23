from bokeh import palettes as pl


def build():
    s = "<table>"
    for i, (k, v) in enumerate(pl.brewer.iteritems()):
        for k1, v1 in v.iteritems():
            s += """
                <tr><td height='20px' width='80px' style='font-size: 12px'>%s</td>
            """ % (k+str(k1))

            for j, a in enumerate(v1):
                s += '<td height="20px" width="20px" style="background-color:%s">' % a
            s += "</tr>"
    s += "</table>"

    return s


if __name__ == "__main__":
    import os
    dname = 'source/docs/reference'

    s = build()

    with open(os.path.join(dname, 'palette_detail.html'), 'w') as fid:
        fid.write(s)

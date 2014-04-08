"API to embed snippets into other's apps"


def _get_CDN_url():
    bokeh_js = 'http://cdn.pydata.org/bokeh-0.4.2.js'
    bokeh_css = 'http://cdn.pydata.org/bokeh-0.4.2.css'
    return bokeh_js, bokeh_css


def _get_file_loc():
    return './static/js'


def _get_file_url():
    return '../static/js/'


def standalone(plot):
    return plot.create_html_snippet()


def inline(plot):
    return plot.create_html_snippet(inline=True)


def inline_CDN(plot):
    return plot.create_html_snippet(bokehJS_url=_get_CDN_url()[0],
                                    bokehCSS_url=_get_CDN_url()[1],
                                    inline=True)


def server(plot):
    return plot.create_html_snippet(server=True)


def hosted_file(plot, bokehJS_url, bokehCSS_url,
                file_loc=_get_file_loc(), file_url=_get_file_url()):
    return plot.create_html_snippet(embed_save_loc=file_loc,
                                    embed_base_url=file_url,
                                    bokehJS_url=bokehJS_url,
                                    bokehCSS_url=bokehCSS_url)


def hosted_CDN(plot, file_loc=_get_file_loc(), file_url=_get_file_url()):
    return plot.create_html_snippet(embed_save_loc=file_loc,
                                    embed_base_url=file_url,
                                    bokehJS_url=_get_CDN_url()[0],
                                    bokehCSS_url=_get_CDN_url()[1])




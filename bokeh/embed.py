

def _get_CDN_url(plot):
    pass

def standalone(plot):
    pass

def inline_CDN(plot):
    return plot.create_html_snippet(
        static_path=_get_CDN_url(), inline=True)

def server(plot):
    return plot.create_html_snippet(server=True)

def selfhosted_file(plot, file_save_loc, file_url, bokehJS_url, bokeh_css_url):
    return plot.create_html_snippet(
        embed_save_loc=file_save_loc, embed_base_url=file_url, 
        static_path=bokehJS_url)


def selfhosted_CDN(plot, file_save_loc, file_url):
    return plot.create_html_snippet(
        embed_save_loc=file_save_loc, embed_base_url=file_url,
        static_path=_get_CDN_url())



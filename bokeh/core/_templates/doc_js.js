var docs_json = {{ docs_json }};
var render_items = {{ render_items }};

function do_embed() {
    Bokeh.embed.embed_items(docs_json, render_items{%- if websocket_url -%}, "{{ websocket_url }}" {%- endif -%});
}

if (typeof Bokeh !== 'undefined') {
    do_embed()
}
else {
    if (typeof window._bokeh_todos === 'undefined') {
        console.log("Bokeh is not yet loaded, deferring call to embed_items")
        window._bokeh_todos = []
    }
    window._bokeh_todos.push(do_embed)
}

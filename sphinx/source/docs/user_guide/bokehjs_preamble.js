<script>
    $(function() {
        var HTML = document.querySelector(".codepen-html").innerHTML;
        $(".codepen-wrap ").each(function(iterEl) {
                var el = $(this),
                        type = "js",
                        codeInside = el.find('.codepen-content')[0].innerText,
                        isCodeInside = codeInside.length,
                        CSS = "",
                        JS = JS = codeInside;
                var data = {
                  title              : el.attr('data-codepen-title'),
                  description        : "",
                  html               : HTML,
                  html_pre_processor : "none",
                  css                : CSS,
                  css_pre_processor  : "none",
                  css_starter        : "neither",
                  css_prefix_free    : false,
                  js                 : JS,
                  js_pre_processor   : "none",
                  js_modernizr       : false,
                  js_library         : "",
                  html_classes       : "",
                  css_external       : "",
                  js_external        : "",
                  template           : true
                };
                var JSONstring =
                  JSON.stringify(data)
                  // Quotes will screw up the JSON
                  .replace(/"/g, "&quot;")
                  .replace(/'/g, "&apos;");
                var jsonInput ='<input type="hidden" name="data" value=\'' +
                          JSONstring + '\'>';
                el.find('form').append(jsonInput);
          });
        });

</script>

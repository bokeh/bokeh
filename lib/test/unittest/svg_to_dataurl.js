/**
        The missing SVG.toDataURL library for your SVG elements

        SVG.toDataURL( [type], [keepNonSafe=false], [keepOutsideViewport=false] )

        type	MIME type of the exported data.
                        Default: image/svg+xml.
                        Must support: image/png.

        [the rest of the parameters only apply when exportin image/png (or other non-svg)]

        keepNonSafe
                Export non-safe (image and foreignObject) elements.
                This will set the Canvas origin-clean property to false, if this data is transferred to Canvas.
                Default: false (to keep origin-clean true).

        keepOutsideViewport
                Export all drawn content, even if not visible.
                Default: false, export only visible viewport, similar to Canvas toDataURL().

        IMPLEMENTATION NOTES

        keepNonSafe and keepOutsideViewport are not supported at all and will be ignored.

        if you don't have canvg, a client-side hackÂ¹ is attempted,
        but this will fail on all current browsers (as of 2010-08)

        Â¹ http://svgopen.org/2010/papers/62-From_SVG_to_Canvas_and_Back/#svg_to_canvas
*/

SVGElement.prototype.toDataURL = function(type, keepNonSafe, keepOutsideViewport) {
        var _svg = this;

        function debug(s) {
                console.log("SVG.toDataURL: " + s);
        }

        function exportSVG() {
                var svg_xml = XMLSerialize(_svg);
                var svg_dataurl = base64dataURLencode(svg_xml);
                return svg_dataurl;
        }

        function XMLSerialize(svg) {

                // quick-n-serialize an SVG dom, needed for IE9 where there's no XMLSerializer nor SVG.xml
                // s: SVG dom, which is the <svg> elemennt
                function XMLSerializerForIE(s) {
                        var out = "";

                        out += "<" + s.nodeName;
                        for (var n = 0; n < s.attributes.length; n++) {
                                out += " " + s.attributes[n].name + "=" + "'" + s.attributes[n].value + "'";
                        }

                        if (s.hasChildNodes()) {
                                out += ">\n";

                                for (var n = 0; n < s.childNodes.length; n++) {
                                        out += XMLSerializerForIE(s.childNodes[n]);
                                }

                                out += "</" + s.nodeName + ">" + "\n";

                        } else out += " />\n";

                        return out;
                }


                if (window.XMLSerializer) {
                        debug("using standard XMLSerializer.serializeToString")
                        return (new XMLSerializer()).serializeToString(svg);
                } else {
                        debug("using custom XMLSerializerForIE")
                        return XMLSerializerForIE(svg);
                }

        }


        var Base64 = {

                // private property
                _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

                // public method for encoding
                encode : function (input) {
                        var output = "";
                        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
                        var i = 0;

                        input = Base64._utf8_encode(input);

                        while (i < input.length) {

                                chr1 = input.charCodeAt(i++);
                                chr2 = input.charCodeAt(i++);
                                chr3 = input.charCodeAt(i++);

                                enc1 = chr1 >> 2;
                                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                                enc4 = chr3 & 63;

                                if (isNaN(chr2)) {
                                        enc3 = enc4 = 64;
                                } else if (isNaN(chr3)) {
                                        enc4 = 64;
                                }

                                output = output +
                                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

                        }

                        return output;
                },

                // public method for decoding
                decode : function (input) {
                        var output = "";
                        var chr1, chr2, chr3;
                        var enc1, enc2, enc3, enc4;
                        var i = 0;

                        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

                        while (i < input.length) {

                                enc1 = this._keyStr.indexOf(input.charAt(i++));
                                enc2 = this._keyStr.indexOf(input.charAt(i++));
                                enc3 = this._keyStr.indexOf(input.charAt(i++));
                                enc4 = this._keyStr.indexOf(input.charAt(i++));

                                chr1 = (enc1 << 2) | (enc2 >> 4);
                                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                                chr3 = ((enc3 & 3) << 6) | enc4;

                                output = output + String.fromCharCode(chr1);

                                if (enc3 != 64) {
                                        output = output + String.fromCharCode(chr2);
                                }
                                if (enc4 != 64) {
                                        output = output + String.fromCharCode(chr3);
                                }

                        }

                        output = Base64._utf8_decode(output);

                        return output;

                },

                // private method for UTF-8 encoding
                _utf8_encode : function (string) {
                        string = string.replace(/\r\n/g,"\n");
                        var utftext = "";

                        for (var n = 0; n < string.length; n++) {

                                var c = string.charCodeAt(n);

                                if (c < 128) {
                                        utftext += String.fromCharCode(c);
                                }
                                else if((c > 127) && (c < 2048)) {
                                        utftext += String.fromCharCode((c >> 6) | 192);
                                        utftext += String.fromCharCode((c & 63) | 128);
                                }
                                else {
                                        utftext += String.fromCharCode((c >> 12) | 224);
                                        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                                        utftext += String.fromCharCode((c & 63) | 128);
                                }

                        }

                        return utftext;
                },

                // private method for UTF-8 decoding
                _utf8_decode : function (utftext) {
                        var string = "";
                        var i = 0;
                        var c = c1 = c2 = 0;

                        while ( i < utftext.length ) {

                                c = utftext.charCodeAt(i);

                                if (c < 128) {
                                        string += String.fromCharCode(c);
                                        i++;
                                }
                                else if((c > 191) && (c < 224)) {
                                        c2 = utftext.charCodeAt(i+1);
                                        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                                        i += 2;
                                }
                                else {
                                        c2 = utftext.charCodeAt(i+1);
                                        c3 = utftext.charCodeAt(i+2);
                                        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                                        i += 3;
                                }

                        }

                        return string;
                }

        }

        function base64dataURLencode(s) {
                var b64 = "data:image/svg+xml;base64,";

                if (window.btoa) {
                        debug("using btoa for base64 encoding");
                        b64 += btoa(s);
                } else {
                        debug("using custom base64 encoding");
                        b64 += Base64.encode(s);
                }

                return b64;
        }

        // WON'T WORK; canvas' origin-clean is dirty
        function exportPNG() {
                var canvas = document.createElement("canvas");
                var ctx = canvas.getContext('2d');
                var img = new Image();
                var svg_xml = XMLSerialize(_svg);
                img.src = base64dataURLencode(svg_xml);

                img.onload = function() {
                        ctx.drawImage(img, 0, 0);
                        // SECURITY_ERR WILL HAPPEN NOW
                        var png_dataurl = canvas.toDataURL();
                        callback(png_dataurl);
                }

                img.onerror = function() {
                        console.log(
                                "Can't export! Maybe your browser doesn't support " +
                                "SVG in img element or SVG input for Canvas drawImage?\n" +
                                "http://en.wikipedia.org/wiki/SVG#Native_support"
                        );
                }

                // TODO: will not return anything
        }

        function exportPNGcanvg() {
                var canvas = document.createElement("canvas");
                var ctx = canvas.getContext('2d');

                // TODO: canvg issue don't require parentNode
                canvas.setAttribute("style", "display: none;");
                document.body.appendChild(canvas);

                var svg_xml = XMLSerialize(_svg);

                canvg(canvas, svg_xml, { ignoreMouse: true, ignoreAnimation: true });
                var png_dataurl = canvas.toDataURL();
                document.body.removeChild(canvas);

                return png_dataurl;
        }

        // BEGIN MAIN

        if (!type) type = "image/svg+xml";

        if (keepOutsideViewport) debug("keepOutsideViewport NOT supported and will be ignored!");
        if (keepNonSafe) debug("keepNonSafe is NOT supported and will be ignored!");

        switch (type) {
                case "image/svg+xml":
                        return exportSVG(this);
                        break;

                case "image/png":

                        if (window.canvg) {
                                debug("Using canvg for png exporting")
                                return exportPNGcanvg(this);
                        } else {
                                debug("Sorry! You don't have canvg. Using native hack for png exporting, THIS WILL FAIL!")
                                return exportPNG(this);
                        }

                        break;

                default:
                        debug("Sorry! Exporting as \"" + type + "\" is not supported!")
        }
}

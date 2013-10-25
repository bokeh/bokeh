
/*
This snippet is added after the regular application.js is built.  the
point is to make sure that we don't clobber any existing definition of
$ (most likely a previous version of jQuery.
 */
var _oldJQ = $;
jQuery.noConflict();
if(typeof($)=="undefined"){
    /* if there was no previous definition of $, put our definition into window.$.  */
    $=_oldJQ;
}



  //The modules for your project will be inlined above
  //this snippet. Ask almond to synchronously require the
  //module value for 'main' here and return it as the
  //value to use for the public API for the built file.
  return require('main');
}));

// Make sure that we don't clobber any existing definition of $ (most
// likely a previous version of jQuery.
var _oldJQ = $;
jQuery.noConflict();
if(typeof($)=="undefined"){
  // if there was no previous definition of $, put our definition into window.$.
  $=_oldJQ;
}

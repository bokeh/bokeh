$(document).ready(function() {

  var menuToggle = $('#js-mobile-menu').unbind();
  $('#js-navigation-menu').removeClass("show");

  menuToggle.on('click', function(e) {
    e.preventDefault();
    $('#js-navigation-menu').slideToggle(function(){
      if($('#js-navigation-menu').is(':hidden')) {
        $('#js-navigation-menu').removeAttr('style');
      }
    });
  });

  $.ajax({
    url: "/en/latest/version.txt",
    cache: false,
    success: function(data) {
      v = $.trim(data)
      style = "font-family: sans-serif;font-size:20px;font-weight:bold;width:100%;height:60px;text-align: center;background-color: pink;color: firebrick;padding: 5px;padding-top:18px; padding-bottom:18px;position:fixed;top:0em; right:0em;z-index:1000000000000"
      loc = window.location.pathname;
      dev = /^\/en\/dev/
      if (dev.exec(loc)) {
        $("body").css({"padding-top":"60px"})
        content = $('<div>The documentation on this page refers to a DEVELOPMENT VERSION. For the latest release, go to <a href="https://bokeh.pydata.org/en/latest/">https://bokeh.pydata.org/en/latest/</a></div>').attr('style', style);
        $('html:first').prepend(content);
      }
      else if (v != window._BOKEH_CURRENT_VERSION) {
        $("body").css({"padding-top":"60px"})
        content = $('<div>The documentation on this page refers to a PREVIOUS VERSION. For the latest release, go to <a href="https://bokeh.pydata.org/en/latest/">https://bokeh.pydata.org/en/latest/</a></div>').attr('style', style);
        $('body').prepend(content);
      }
    }
  });

  var loc = window.location.pathname;

  if (loc.split('docs/').length == 1 ) {
    // If index.html hide toc
    $('.toc .toctree-l1').addClass('hide');
    $('.toc').addClass('obfuscate');

  } else if (loc.split('gallery').length > 1) {
    // If gallery, dispense with toc, and manually add current under second nav
    $('.toc .toctree-l1').addClass('hide');
    $('.toc').addClass('obfuscate');
    $('.second-nav .nav-link a[href="#"]').addClass('current');

  } else {
    // Else, selectively hide toc
    var loc_part = loc.split('docs/')[1].split('.html')[0];

    if (loc_part.split('/').length > 1) {
      loc_part = loc_part.split('/')[0]
    }

    var l1_links = $('.toctree-l1');
    l1_links.each(function(i, l1_link) {
      if ( $(this).hasClass('current') ) {
        $(this).addClass('show');
      } else {
        var href = l1_link.childNodes[0].href;
        var href_part = href.split('docs/')[1].split('/')[0];
        if ( href_part.split('.html').length > 1 ) {
          href_part = href_part.split('.html')[0]
        }
        if (href_part == loc_part) {
          $(this).addClass('show');
        } else {
          $(this).addClass('hide');
        }
      }
    });

    // Add current class to the section of docs we're in
    var nav_links = $('.nav-link.doc-head a');
    nav_links.each(function(i, nav_link) {
      var href = nav_link.href;
      var href_part = href.split('docs/')[1].split('.html')[0];
      if (href_part.split('/').length > 1) {
        href_part = href_part.split('/')[0]
      }
      if (loc_part == href_part) {
        $(this).addClass('current');
      }
    });
  }

  // Expander (used for collapsible code blocks)
  $('.expander-trigger').click(function(){
    $(this).toggleClass("expander-hidden");
  });

});

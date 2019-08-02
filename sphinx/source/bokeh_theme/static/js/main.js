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

  var loc = window.location.pathname;

  // If index.html hide toc
  if (loc.split('docs/').length == 1 ) {
    $('.toc .toctree-l1').addClass('hide');
    $('.toc').addClass('obfuscate');

  }

  // If orphan page, dispense with toc, and manually add current under second nav
  else if ((loc.split('citation').length > 1) ||
           (loc.split('contact').length > 1) ||
           (loc.split('contribute').length > 1) ||
           (loc.split('gallery').length > 1) ||
           (loc.split('team').length > 1) ||
           (loc.split('vision').length > 1)) {

    $('.toc .toctree-l1').addClass('hide');
    $('.toc').addClass('obfuscate');
    $('.second-nav .nav-link a[href="#"]').addClass('current');

  }

  // Else, selectively hide toc
  else {
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
      // skip links to external sites
      if (href.startsWith("https://bokeh.pydata.org")) {
        var href_part = href.split('docs/')[1].split('.html')[0];
        if (href_part.split('/').length > 1) {
          href_part = href_part.split('/')[0]
        }
        if (loc_part == href_part) {
          $(this).addClass('current');
        }
      }
    });
  }

  // Expander (used for collapsible code blocks)
  $('.expander-trigger').click(function(){
    $(this).toggleClass("expander-hidden");
  });

});

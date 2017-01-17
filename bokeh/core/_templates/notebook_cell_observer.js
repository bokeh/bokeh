{#
Registers a MutationObserver that can detect deletion of cells with a
class of 'bokeh_class'

:param inner_block: Javascript block to be executed when deletion detected
:type inner_block: str

The supplied Javascript is executed with the id of the destroyed div in
 scope as variable destroyed_id.

#}

var target = document.getElementById('notebook-container');

var observer = new MutationObserver(function(mutations) {

   for (var i = 0; i < mutations.length; i++) {
      for (var j=0; j < mutations[i].removedNodes.length; j++) {
        for (var k=0; k < mutations[i].removedNodes[j].childNodes.length; k++)
          var bokeh_selector = $(mutations[i].removedNodes[j].childNodes[k]).find(".bokeh_class");
          if (bokeh_selector) {
            if (bokeh_selector.length > 0) {
               var destroyed_id = bokeh_selector[0].id;
                {{inner_block}}
            }
          }
      }
   }
});
observer.observe(target, { childList: true, subtree:true });

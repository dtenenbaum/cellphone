jQuery.noConflict();


"use strict";


var fb_lite = false;
try {
	if (firebug) {
		fb_lite = true;  
		firebug.d.console.cmd.log("initializing firebug logging");
	}
} catch(e) {
	// do nothing
}

function FG_fireDataEvent() {
  // events are documented in the Flanagan Javascript book
  var ev = document.createEvent("Events");
  // initEvent(eventType, canBubble, cancelable)
  ev.initEvent("gaggleDataEvent", true, false); 
  document.dispatchEvent(ev);
} 

function log(message) {
	if (fb_lite) {  
		console.log(message);
	} else {
		if (window.console) {
			console.log(message);
		} 
	}
	if (window.dump) {
	    dump(message + "\n");
	}
}                          


//var carriers = [];

var vis;

jQuery(document).ready(function() {
    log("ho there");
    var div_id = "cytoscapeweb";
    
    var options = {
        // where you have the Cytoscape Web SWF
        swfPath: "swf/CytoscapeWeb",
        // where you have the Flash installer SWF
        flashInstallerPath: "swf/playerProductInstall"
    };
    
    // init
    vis = new org.cytoscapeweb.Visualization(div_id, options);
    
    jQuery("#politics").click(function(){
       log("politics!");
    });

    jQuery("#news_items").click(function(){
       log("news items");
    });

    
    jQuery(".menu_item").click(function(){
       log("menu item clicked") ;
    });
    
    jQuery('.fg-button').hover(
        		function(){ jQuery(this).removeClass('ui-state-default').addClass('ui-state-focus'); },
        		function(){ jQuery(this).removeClass('ui-state-focus').addClass('ui-state-default'); }
        	);
    
    
    jQuery.get('cellphone.graphml', function(data) {
        // draw
       vis.draw({network: data})
    });
    
    vis.ready(function(){
        getCarriers();
    }); // end of vis.ready function
    
    jQuery("#knockout_selected").click(function(){
        var selected = vis.selected("nodes");
        //log("num selected nodes: " + selected.length);
        setIncidentEdgesVisibility(selected, false);
    });
    
    jQuery("#restore_graph").click(function(){
       vis.filter("edges", function(edge) {
           return true;
       });
    });
    
    jQuery("#reactivate_selected").click(function(){
        var selected = vis.selected("nodes");
        //log("num selected nodes: " + selected.length);
        setIncidentEdgesVisibility(selected, true);
        
    });
    
    jQuery('ul.sf-menu').superfish();
	
	jQuery(".menuItem").click(function(){
	    //alert("haha");
	    log("menu item clicked: " + jQuery(this).attr("id"))
		jQuery('ul.sf-menu').superfish();
	})
	
    
    
}); // end of jQuery document ready function



var incident = function(node, edge) {
    var nodeName = node.data["id"];
    var inc = (edge.data['source'] == nodeName || edge.data['target'] == nodeName); 
    return (inc); 
}


var setIncidentEdgesVisibility = function(nodes, visible) {
    for(i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        vis.filter("edges", function(edge){
            if (incident(node, edge)) {
                if (edge.visible == visible) {
                    return (edge.visible); // leave it alone
                } else {
                    return(visible);
                }
            } else {
                return (edge.visible); // leave it alone
            }
        });
    }
}



getCarriers = function() {
    var chash  = {}
    var tmp = [];
    nodes = vis.nodes();
    for (i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        chash[node.data['carrier']] = 1;
    }
    for (var key in chash) {
        tmp.push(key);
    }
    tmp.sort();
    carriers = tmp;
    
}

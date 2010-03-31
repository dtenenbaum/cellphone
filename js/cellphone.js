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


var carriersHash = {"att": "AT&T", "cellularone": "CellularOne", "sprint": "Sprint", "tmobile": "T-Mobile", "uscellular": "US Cellular", "verizon": "Verizon Wireless"};

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
    
    
    // set up listeners
    vis.addListener("click", "edges", gotEdgeEvent);
    vis.addListener("click", "nodes", gotNodeEvent);
    vis.addListener("mouseover", "edges", gotEdgeEvent);
    vis.addListener("mouseover", "nodes", gotNodeEvent);
    vis.addListener("mouseout", "nodes", clearLegend);
    vis.addListener("mouseout", "edges", clearLegend);
    
    
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
    
    jQuery("#knockout_selected_special").click(function(){
        var selected = vis.selected("nodes");
        //log("num selected nodes: " + selected.length);
        setIncidentEdgesVisibility(selected, false);
    });
    
    jQuery("#restore_graph").click(function(){
       vis.filter("edges", function(edge) {
           return true;
       });
    });
    
    jQuery("#reactivate_selected_special").click(function(){
        var selected = vis.selected("nodes");
        //log("num selected nodes: " + selected.length);
        setIncidentEdgesVisibility(selected, true);
        
    });
    
    jQuery('ul.sf-menu').superfish();
	
	jQuery(".menuItem").click(function(){
	    //alert("haha");
	    var menuItem = jQuery(this).attr("id");
	    log("menu item clicked: " + jQuery(this).attr("id"))
		jQuery('ul.sf-menu').superfish();
		// decide whether to further act on this menu item
		if (menuItem.indexOf("special") == -1 && (menuItem.indexOf("knockout") > -1 || menuItem.indexOf("reactivate") > -1)) {
		    //var setAttributeVisibility = function(attribute, value, visible, attrPresent) {
		    var attribute;
		    var value;
		    var attrPresent;
		    var visible;

		    var tmp;
		    if (menuItem.indexOf("carrier") > -1) {
		        attribute = "carrier";
		        tmp = menuItem.split("_");
		        value = tmp[2];
		        visible = (tmp[0] == "reactivate");
		        //attrPresent = true;
		    } else {
		        attrPresent = (menuItem.indexOf("_with_") > -1);
		        visible = (menuItem.indexOf("reactivate") > -1);
		        tmp = menuItem.split("_");
		        attribute = tmp[2];
		    }
		    setAttributeVisibility(attribute, value, visible, attrPresent);
		}
	})
	
    
    
}); // end of jQuery document ready function


var gotNodeEvent = function(evt) {
    var node = evt.target;
    var str = "";
    str += "Node Information:<br/>"
    str += "Name: " + node.data['id'] + "<br/>";
    var attrs = ["camera","email","carrier", "roaming", "hasbeencalled","hascalled"];
    for (i = 0; i < attrs.length; i++) {
        var attr = attrs[i];
        if (node.data[attr] != undefined) {
            str += attr + ": " + node.data[attr] + "<br/>"
        }
    }
    str += "Visible: " + node.visible + "<br/>";
    //todo add selected
    
    jQuery("#event_display").html(str);
}

var gotEdgeEvent = function(evt) {
    var edge = evt.target;
    var str = "";
    str += "Edge information:<br/>"
    str += "Source: " + edge.data['source'] + "<br/>";
    str += "Target: " + edge.data['target'] + "<br/>";
    str += "Visible: " + edge.visible + "<br/>";
    jQuery("#event_display").html(str);
    
}

var clearLegend = function(evt) {
    jQuery("#event_display").html("");
}


var incident = function(node, edge) {
    var nodeName = node.data["id"];
    var inc = (edge.data['source'] == nodeName || edge.data['target'] == nodeName); 
    return (inc); 
}

var setAttributeVisibility = function(attribute, value, visible, attrPresent) {
    log("in setattribute visibility, params are: attribute = " + attribute + ", value = " + value + ", visible = " + visible + ", attrPresent = " + attrPresent);
    var nodes = vis.nodes();
    var nodeList = [];
    
    if (value != undefined) {
        log("carrier = " + carriersHash[value]);
        log("att = " + carriersHash["att"]);
    }
    
    for (i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (value == undefined) {
            // let's say we're reactivating phones without roaming
            // attribute = roaming
            // visible = true
            // attrPresent = false
            if (node.data[attribute] == ("" + attrPresent)) {
                nodeList.push(node);
            }
        } else {
            // we can ignore attrPresent
            if (node.data[attribute] == carriersHash[value]) {
                log ("found one!");
                nodeList.push(node);
            }
        }

        
    }
    setIncidentEdgesVisibility(nodeList, visible);
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

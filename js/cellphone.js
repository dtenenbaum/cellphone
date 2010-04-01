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

var spDialog;

jQuery(document).ready(function() {
    log("ho there");
    var div_id = "cytoscapeweb";
    
    clearLegend();
    jQuery("#event_display").css("width", 250);
    
    
    spDialog = jQuery("#shortest_path_dialog").dialog({autoOpen: false, title: 'Find Shortest Path',
        width: 500,
        buttons: {
            'Close' : function(){ jQuery(this).dialog('close');},
            'Clear' : clearShortestPath,
            'Find Shortest Path(s)': prepareTofindShortestPath
        }
    });
    
    
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
    vis.addListener("select", "nodes", setupSPDialog);
    
    
    jQuery("#politics").click(function(){
       log("politics!");
    });

    jQuery("#news_items").click(function(){
       log("news items");
    });

    jQuery("#shortest_path").click(function(){
       spDialog.dialog('open') ;
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
        setupSPDialog();
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
	
    var sp = floyd(getTestNet());
    log ("sp = " + sp);
    
    
}); // end of jQuery document ready function


var gotNodeEvent = function(evt) {
    jQuery("#event_display").css("backgroundColor", "#1475E3");
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
    jQuery("#event_display").css("backgroundColor", "#1475E3");
    var edge = evt.target;
    var str = "";
    str += "Edge information:<br/>"
    str += "Source: " + edge.data['source'] + "<br/>";
    str += "Target: " + edge.data['target'] + "<br/>";
    str += "Visible: " + edge.visible + "<br/>";
    str += "&nbsp;<br/>\n&nbsp;<br/>\n&nbsp;<br/>\n&nbsp;<br/>\n&nbsp;<br/>\n";
    jQuery("#event_display").html(str);
    
}

var clearLegend = function(evt) {
    jQuery("#event_display").css("backgroundColor", "white");
    jQuery("#event_display").html("&nbsp;<br/>\n&nbsp;<br/>\n&nbsp;<br/>\n&nbsp;<br/>\n&nbsp;<br/>\n&nbsp;<br/>\n&nbsp;<br/>\n&nbsp;<br/>\n&nbsp;<br/>\n&nbsp;<br/>\n&nbsp;<br/>\n");
}

var prepareTofindShortestPath = function() {
    var start = jQuery("#sp_start_node").val();
    var end = jQuery("#sp_end_node").val();
    // todo get delay
    if (start == end) {
        jQuery("#sp_path_display").val("You can't call yourself.");
        return;
    }
    sp = findShortestPath(start,end);
    if (sp == undefined) {
        jQuery("#sp_path_display").val("There is no path between " + start + " and " + end + ".");
        return;
    }
    if (sp.length > 0) {
        log ('got it in one hop');
    } else {
        log("didn't get it yet");
    }
}

var findShortestPath = function(start, end) {
    var shortestPaths = [];
    fn = getRealFirstNeighbors([start]);
    for (i = 0; i < fn.edges.length; i++) {
        var edge = fn.edges[i];
        log("edge source = " + edge.data['source'] + ", target = " + edge.data['target']);
    }
    if (fn.neighbors.length == 0) {
        return undefined;
    }
    
    for (i = 0; i < fn.neighbors.length; i++)  {
        var node = fn.neighbors[i];
        if (node.data['id'] == end) {
            shortestPaths.push(node.data['id']);
        }
    }
    
    return shortestPaths;
    
}

/*
 Find first neighbors of nodes, but throw out all nodes that are not connected by a correctly directed edge,
 and all nodes connected by invisible edges. Trim list of edges accordingly.
 */
var getRealFirstNeighbors = function(nodeIds) {
    var ret = {};
    var targets = {};
    var startNodes = {};
    var neighbors = [];
    var edges = [];
    
    
    
    for (i = 0; i < nodeIds.length; i++) {
        // assume for now that each node id is a string
        startNodes[nodeIds[i]] = 1;
    }

    ret['rootNodes'] = nodeIds;
    
    fn = vis.firstNeighbors(nodeIds);
    
    for (i = 0; i < fn.neighbors.length; i++) {
        var node = fn.neighbors[i];
        targets[node.data['id']] = node;
    }

    
    for (i = 0; i < fn.edges.length; i++) {
        var edge = fn.edges[i];
        if (startNodes[edge.data['source']] == 1 && edge.visible) { // this is a valid edge directionally
            var node = targets[edge.data['target']];
            neighbors.push(node);
            edges.push(edge);
        }
    }
    
    //ignore merged edges for now
    
    ret['neighbors'] = neighbors;
    ret['edges'] = edges;
    
    
    return ret;
}


var clearShortestPath = function() {
    //todo - clear highlighted stuff in network
    log("in clearShortestPath()");
    jQuery("#sp_path_display").val("");
    
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


var setupSPDialog = function() {
    var selectedId = "nothing";
    if (vis.selected("nodes").length == 1) {
        selectedId = "" + vis.selected("nodes")[0].data['id'];
    }
    
    var nodeNames = [];
    var nodes = vis.nodes();
    for (i = 0; i < nodes.length; i++) {
        nodeNames.push(nodes[i].data['id']);
    }
    
    nodeNames.sort();
    var strStart = "";
    var strEnd = ""
    
    for (i = 0; i < nodeNames.length; i++) {
        if (selectedId == nodeNames[i]) {
            strStart += "<option selected>" + nodeNames[i] + "</option>\n";
        } else {
            strStart += "<option>" + nodeNames[i] + "</option>\n";
        }
        strEnd += "<option>" + nodeNames[i] + "</option>\n";

    }
    
    jQuery("#sp_start_node").html(strStart);
    jQuery("#sp_end_node").html(strEnd);
}


var getCarriers = function() {
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


var getTestNet = function() {
    var testNet = [];
    /*
    testNet.push([0,999,3,999]);
    testNet.push([2,0,999,999]);
    testNet.push([999,7,0,1]);
    testNet.push([6,999,999,0]);
    */
    testNet.push([999,1,999,1,1]);
    testNet.push([999,999,999,1,999]);
    testNet.push([999,999,999,999,1]);
    testNet.push([999,999,999,999,999]);
    testNet.push([999,1,999,999,999]);
    
    return testNet;
}


// from alex le
var floyd = function(graphTable)
{
	var n = graphTable.length;
	log("n  = " + n);
	var k = 0;
	//var out = $id('output');

	/* Parse inputs */
	/*
	for( i = 0; i < n; i++)
	{
		for( j = 0; j < n; j++)
		{
			temp = $id('g_' + k);
			graphTable[i][j] = parseInt(temp.value);
			k++;
		}
	}*/

	/* Run Floyd's Algorithm */
	for(i= 0 ; i <n ; i++)
	{
		for( j = 0; j < n; j++)
		{
			if( i != j ) // skip over the current row
			{
				for( k = 0; k < n; k++)
				{
					if( k != i ) // skip over the current column of iteration
					{
						t = min ( graphTable[j][k], graphTable[j][i] + graphTable[i][k]);
						graphTable[j][k] = t;
					}
				}
			}

		}

		//out.value += "After iteration " + i + "\n";
		log("After iteration " + i + ":");
		log(print2DArray(graphTable));
		//print2DArray(graphTable);
		log("end of floyd");
		//return graphTable;
	}
	return graphTable;
}

var min = function (a,b)
{
	return (a>=b) ? b : a;
}


var print2DArray = function(array)
{
	var n = array.length;
	var out = "";
	var i = 0;
	var j = 0;
	for( i = 0; i < n ; i++)
	{
		for( j=0; j < n; j++)
		{
			out += array[i][j];
			if ( j < n - 1)
				out += " \t";
		}
		out += "\n";
	}
	return out;
}

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

var stats;

var spDialog;
var ptDialog;
var statsDialog;

var numIters = 0;
var numPreIters = 0;

var delay = 25;

var nodeMapper = {
    attrName: "hasbeencalled",
    entries: [
        {attrValue: "false", value: "#f5f5f5"},
        {attrValue: "true", value: "#ff0000"}
    ]
};

var edgeMapper = {
    attrName: "hasbeencalled",
    entries: [
        {attrValue: "false", value: "#999999"},
        {attrValue: "true", value: "#ff0000"}
    ]
};

var bypass = {nodes: {}, edges: {}};


var visual_style = {
        nodes: {
            color: {
                discreteMapper: nodeMapper
            }
        },
        edges: {
            color : {
                discreteMapper: edgeMapper
            }
        }
};


var bfspath = [];
var visited = {};
var lastEdgeVisited;


var preVisited = {};
var lastEdgePrevisited;



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
    
    
    ptDialog = jQuery("#phone_tree_dialog").dialog({autoOpen: false, title: 'Phone Tree',
        width: 500,
        position: 'bottom',
        buttons : {
            'Close': function(){ jQuery(this).dialog('close')},
            'Clear': function(){ jQuery("#pt_path_display").val("")},
            'Finish': false,
            'Step': false,
            'Start': startPhoneTree
        }});
        
        
    statsDialog = jQuery("#stats_dialog").dialog({autoOpen :false, title: 'Statistics',
        buttons: {
            'Close': function(){ jQuery(this).dialog('close')}
        }});
    
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
    vis.addListener("select", "nodes", setupDialogs);
    
    
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
    
    jQuery("#phone_tree").click(function(){
       ptDialog.dialog('open');
    });
    
    jQuery('.fg-button').hover(
        		function(){ jQuery(this).removeClass('ui-state-default').addClass('ui-state-focus'); },
        		function(){ jQuery(this).removeClass('ui-state-focus').addClass('ui-state-default'); }
        	);
    
    
    jQuery.get('cellphone.graphml', function(data) {
        // draw
       vis.draw({network: data, visualStyle: visual_style, nodeTooltipsEnabled: true, edgeTooltipsEnabled: true})
       //vis.visualStyle(visual_style);
    });
    
    vis.ready(function(){
        getCarriers();
        setupDialogs();
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
       visited = {};
       bypass = {nodes: {}, edges: {}};
       vis.visualStyleBypass(bypass);
       //todo - set hasbeencalled to false on all edges and nodes - or do we care?
    });
    
    jQuery("#reactivate_selected_special").click(function(){
        var selected = vis.selected("nodes");
        //log("num selected nodes: " + selected.length);
        setIncidentEdgesVisibility(selected, true);
        
    });
    
    jQuery('ul.sf-menu').superfish();
	
	jQuery(".menuItem").click(function(){
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
	
//    var sp = floyd(getTestNet());
//    log ("sp = " + sp);
    
    
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
    var fn = getRealFirstNeighbors([start]);
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
    
    
    var fn = vis.firstNeighbors(nodeIds);
    
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


var setupDialogs = function() {
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
    
    jQuery("#pt_start_node").html(strStart);
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


var getNetwork = function() {
    var nodes = {};
    var allNodes = vis.nodes();
    for (var i = 0; i < allNodes.length; i++) {
        var id = allNodes[i].data['id'];
        var nabes = getRealFirstNeighbors([id]);
        if (nabes['neighbors'].length > 0) {
            nodes[id] = [];
            for (var j = 0; j < nabes['neighbors'].length; j++) {
                nodes[id].push(nabes['neighbors'][j].data['id']);
            }
        }
    }
    return nodes;
}

var dijkstra = function(graph, source) {
    
    var dist = {};
    var previous = {};
    var q = [];
    for (var node in graph) {
        dist[node] = Infinity;
        if (node == source) {
            dist[node] = 0;
        }
        previous[node] = [];
        q.push(node);
    }
    
    while (q.length > 0) {
        var u = getNodeWihSmallestDist(q, dist);
        log("u = " + u);
        if (dist[u] == Infinity) {
            break;
        }
        q = removeItemFromArray(q,u);
        log("2");
        for (var i = 0; i < graph[u].length; i++) {
            log("3");
            var v = graph[u][i];
            log("v = " + v);
            var alt = dist[u] + distBetween(u,v);
            log("alt = " + alt);
            if (alt < dist[v]) {
                dist[v] = alt;
                previous[u].push(v);
            }
        }
    }
    log("\ninput = " + source);
    log("output:");
    
    var ret = returnPopulatedMembers(previous)

    log("# of nodes: " + count(ret));

    
    for (var item in ret) {
        var ary = ret[item];
        log(item + " = " + ary.join(", "));
    }
    
    
    
    return ret; 
}

var count = function(obj) {
    var i = 0;
    for (item in obj) {
        i++;
    }
    return i;
}

var dfs = function(graph, start) {
    visited = {};
    var path = [];
    path.push(start);
    var first =  graph[start];
}


var myfunc = function(source, target) {
    log ("source = " + source + ", target = " + target);
}

var getPhoneTreeDelay = function() {
    var delayStr = jQuery("#pt_delay").val();
    var i = parseInt(delayStr);
    return i;
}



var preVisit = function(start) {
    numPreIters++;
    var fn = getRealFirstNeighbors([start]);
    for (var i = 0; i < fn['neighbors'].length; i++) {
        var target = fn['neighbors'][i].data['id'];
        var key = start + ">"  + target;
        lastEdgePrevisited = key;
        var value = preVisited[key];
        if (value == undefined) value = 0;
        preVisited[key] = ++value;
        if (preVisited[key] > 1) {
            break;
        }
        //log(start + " called " + target);
        preVisit(target);
    }
}

var visit = function(start) {
    
    var func = function() {
      setTimeout(function(){
          numIters++;
          var fn = getRealFirstNeighbors([start]);
          for (var i = 0; i < fn['neighbors'].length; i++) {
              //log("previsit lala: last edge is: " + lastEdgePrevisited + " and count is " + preVisited[lastEdgePrevisited]);

              var target = fn['neighbors'][i].data['id'];
              var key = start + ">" + target;
              lastEdgeVisited = key;
              var value = visited[key];
              if (value == undefined) value = 0;
              visited[key] = ++value;
              if (visited[key] > 1) {
                  break;
              }
              if (stats['callsMade'][start] == undefined) stats['callsMade'][start] = 0;
              if (stats['callsReceived'][target] == undefined) stats['callsMade'][target] = 0;
              ++stats['callsMade'][start];
              ++stats['callsReceived'][target];
              
              
              ++stats['totalCallsMade'];
              ++stats['totalCallsReceived'];



              var status = jQuery("#pt_path_display").val();
              status +=  start + " called " + target + "\n";
              jQuery("#pt_path_display").val(status); //todo - can we keep the bottom of the textarea in view?
              bypass.nodes[target] = {color: "#ff0000"};
              vis.visualStyleBypass(bypass);
              
              visit(target);
          }



          
      }, delay);  
    };
    
    func();
    
}

var getNodeByName = function(name) {
    var nodes = vis.nodes();
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node.data['id'] == name) {
            return node;
        }
    }
}


var simpleToComplexGraph = function(simpleGraph) {
    
}


var returnPopulatedMembers = function(obj) {
    var ret = {};
    for (var item in obj) {
        var ary = obj[item]
        if (ary.length > 0) {
            ret[item] = obj[item];
        }
    }
    return ret;
}

var aShortestPath = function(start, end, previous) {
    var s = [];
    var u = end;
    for (var item in previous) {
        insertAtBeginning(u, s)
        u = previous[u];
    }
    log("output length =  " + s.length);
    return s;
}

var insertAtBeginning = function(item, ary) {
    var ret = [];
    ret.push(item);
    for (var i = 0; i < ary.length; i++) {
        ret.push(ary[i]);
    }
    return ret;
}

var distBetween = function(u,v) {
    return 0;
}

var removeItemFromArray = function(q,u) {
    var arr = [];
    for (var i = 0; i < q.length; i++) {
        if (q[i] == u) {
            // do nothing
        } else {
            arr.push(q[i]);
        }
    }
    return arr;
}

var getNodeWihSmallestDist = function(q, dist) {
    var i;
    for (i = 0; i < q.length; i++) {
        var node = q[i];
        log("i = " + i + ", node = " + node + ",  dist[node] = " + dist[node]);
        if (dist[node] == 0) {
            return node;
        }
    }
    log("oops! no nodes have 0 dist, i = " + i);
    return (q[0]);
}

var startPhoneTree = function() {
    resetStats();
    numIters = 0;
    numPreIters = 0;
    delay = getPhoneTreeDelay();
    var i = 0;
    log("delay = " + delay);
    preVisit(jQuery("#pt_start_node").val());
    log("end of previsit, last edge is: " + lastEdgePrevisited + " and count is " + preVisited[lastEdgePrevisited] + ", iters = " + numPreIters);
    
    
    visit(jQuery("#pt_start_node").val());
    var intervalId = setInterval(function(){
        
        log("lev = " + lastEdgeVisited + " , lepv = " + lastEdgePrevisited + ", v = " +  visited[lastEdgeVisited] + ", pv = " + preVisited[lastEdgePrevisited] + ", iters = " + numIters);
        if (numPreIters == numIters) {
            log("visiting hours are over");
            clearInterval(intervalId);
            //fill stats
            fillStats();
            statsDialog.dialog('open');
        } 
    },25);
}

var fillStats = function() {
    
    jQuery("#total_calls_made").html(stats['totalCallsMade']);
    jQuery("#total_calls_received").html(stats['totalCallsReceived']);
    var phonesCalled = count(stats['callsReceived']);
    jQuery("#total_phones_called").html(phonesCalled);
    
    jQuery("#total_phones_not_called").html(vis.nodes().length - phonesCalled);
    
    
    
}

var resetStats = function() {
    stats = {
        callsMade: {},
        callsReceived: {},
        totalCallsMade: 0,
        totalCallsReceived: 0,
    };    
}

var metrics = 
[
 {"metric":"java_cpu"},
 {"metric":"java_gc_count"},
 {"metric":"java_gc_time_ms"},
 {"metric":"java_mem_mb"},
 {"metric":"java_old_gen_coll_perc_used"},
 {"metric":"java_old_gen_coll_size"},
 {"metric":"java_old_gen_commited", "format":"bytes", "min":0},
 {"metric":"java_old_gen_peak_size", "format":"bytes", "min":0},
 {"metric":"java_old_gen_perc_used"},
 {"metric":"java_old_gen_size"},
 {"metric":"jvm_fd_open_count"},
 {"metric":"jvm_fd_perc_used"},
 {"metric":"jvm_major_faults"},
 {"metric":"jvm_minor_faults"},
 {"metric":"jvm_num_threads"},
 {"metric":"jvm_rss_delta_kb"},
 {"metric":"jvm_rss_kb", "min":0},
 {"metric":"jvm_vsize_delta_kb"},
 {"metric":"jvm_vsize_kb", min:0}
]
;

/* global _ */

/*
 * Complex scripted dashboard
 * This script generates a dashboard object that Grafana can load. It also takes a number of user
 * supplied URL parameters (in the ARGS variable)
 *
 * Return a dashboard object, or a function
 *
 * For async scripts, return a function, this function must take a single callback function as argument,
 * call this callback function with the dashboard object (look at scripted_async.js for an example)
 */

'use strict';

// accessible variables in this scope
var window, document, ARGS, $, jQuery, moment, kbn;

// All url parameters are available via the ARGS object
var ARGS;

var graphType = "flot";

if(!_.isUndefined(ARGS.png)) {
    graphType = "png";
}

function find_filter_values(query){
    var search_url = window.location.protocol + '//' + window.location.host + '/api/datasources/proxy/1/metrics/find/?query=' + query;
    var res = [];
    var req = new XMLHttpRequest();
    req.open('GET', search_url, false);
    req.send(null);

	var index = 0;

	var obj = JSON.parse(req.responseText);
    
	for(var key in obj) {
		if (obj[key].hasOwnProperty("text")) {
        	res.push(obj[key]["text"]);
      }
    }

    return res;
}; // find_filter_values


function createHostGraph(hostName) {
	var hostGraph = 
      	{
	    title: hostName,
        type: 'graph',
        renderer: graphType,
        span: 3,
        fill: 4,
        linewidth: 2,
        targets: [],
	    links: [
		{
		keepTime: true,
              params: "host="+hostName+"&"+graphType,
              targetBlank: true,
              title: "click here to view all metrics",
              type: "absolute",
              url: "dashboard/script/ps.js"
		}
		],
		legend: {show:false}
	};


	var targetValue = "*.*.presence." + hostName + "." + '$current_metric';

	var target = {};

	target["target"] = targetValue;

	hostGraph.targets.push(target);

	return hostGraph;

} // createHostGraph

function createMetricGraph(hostName, metric) {
	var graph = 
      	{
	    title: metric.metric,
        type: 'graph',
        renderer: graphType,
        span: 3,
        fill: 4,
        linewidth: 2,
        targets: [],
	    links: [
	    ]
	    ,
	    legend: {show:false},
	    yaxes: [
	            {
                  "label": "",
                  "show": true,
                  "logBase": 1,
                  "min": null,
                  "max": null,
                  "format": "short"
                },
	            {
                  "label": "",
                  "show": true,
                  "logBase": 1,
                  "min": null,
                  "max": null,
                  "format": "short"
                }
        ]
	};


	var targetValue = "aliasByNode(*.*.presence." + hostName + "." + metric.metric+",3)";

	var target = {};

	target["target"] = targetValue;

    if (!(metric.format===undefined)) {
        graph.yaxes[0].format = metric.format;
    }

    if (!(metric.min===undefined)) {
        graph.yaxes[0].min = metric.min;
    }

	graph.targets.push(target);

	return graph;

} // createMetricGraph

/*
function clusterRow() {

	var row = {
    	title: 'Cluster',
    	height: '300px',
    	showTitle: true,
    	panels: [
      		{
        		title: 'Load average',
        		type: 'graph',
        		renderer: graphType,
        		span: 3,
        		fill: 1,
        		linewidth: 2,
        		targets: [
          			{
	    				"target": "groupByNode(*.*.*ms.ms*.load.load.*, 6, 'sum')"
          			},
        		],
        		tooltip: {
          			shared: true
        		}
      		}
			,
      		{
        		title: 'Memory',
        		type: 'graph',
        		renderer: graphType,
        		span: 3,
        		fill: 1,
        		linewidth: 2,
        		targets: [
          			{
	    				"target": "groupByNode(*.*.*.ms*.memory.*, 5, 'sum')"
          			},
        		],
        		tooltip: {
          			shared: true
        		}
      		}
			,

      		{
        		title: 'CPU',
        		type: 'graph',
        		renderer: graphType,
        		span: 3,
        		fill: 1,
        		linewidth: 2,
        		targets: [
          			{
	    				"target": "groupByNode(*.*.*.ms*.aggregation-cpu-sum.*, 5, 'sum')"
          			},
        		],
        		tooltip: {
          			shared: true
        		}
      		}		

			,

      		{
        		title: 'eth0 packets',
        		type: 'graph',
        		renderer: graphType,
        		span: 3,
        		fill: 1,
        		linewidth: 2,
        		targets: [
          			{
	    				"target": "groupByNode(collectd.*.*.ms*.interface-eth0.if_packets.*, 6, 'sum')"
          			},
        		],
        		tooltip: {
          			shared: true
        		}
      		}

    ] // panels

  
	};

	return row;

} //clusterRow

*/

function topRow(hostName, title) {

	var row = {
    	title: title,
    	height: '300px',
    	showTitle: true,
    	panels: [
      		{
        		title: 'Load average',
        		type: 'graph',
        		renderer: graphType,
        		span: 3,
        		fill: 4,
        		linewidth: 2,
        		targets: [
          			{
	    				"target": "groupByNode(*.*.presence."+hostName+".load.load.*, 6, 'sum')"
          			},
        		],
        		tooltip: {
          			shared: true
        		}
      		}
			,
      		{
        		title: 'Memory',
        		type: 'graph',
        		renderer: graphType,
        		span: 3,
        		fill: 4,
        		linewidth: 2,
        		targets: [
          			{
	    				"target": "groupByNode(*.*.*."+hostName+".memory.memory-buffered, 5, 'sum')"
          			},
          			{
	    				"target": "groupByNode(*.*.*."+hostName+".memory.memory-cached, 5, 'sum')"
          			},
          			{
	    				"target": "groupByNode(*.*.*."+hostName+".memory.memory-free, 5, 'sum')"
          			},
          			{
	    				"target": "groupByNode(*.*.*."+hostName+".memory.memory-used, 5, 'sum')"
          			},
        		],
        		tooltip: {
          			shared: true
        		}
      		}
			,

      		{
        		title: 'CPU',
        		type: 'graph',
        		renderer: graphType,
        		span: 3,
        		fill: 4,
        		linewidth: 2,
        		targets: [
          			{
	    				"target": "groupByNode(*.*.*."+hostName+".aggregation-cpu-sum.*, 5, 'sum')"
          			},
        		],
        		tooltip: {
          			shared: true
        		}
      		}		

			,

      		{
        		title: 'eth0 packets',
        		type: 'graph',
        		renderer: graphType,
        		span: 3,
        		fill: 4,
        		linewidth: 2,
        		targets: [
          			{
	    				"target": "groupByNode(collectd.*.*."+hostName+".interface-eth0.if_packets.*, 6, 'sum')"
          			},
        		],
        		tooltip: {
          			shared: true
        		}
      		}

            ,

                  		{
                    		title: 'eth0 octets',
                    		type: 'graph',
                    		renderer: graphType,
                    		span: 3,
                    		fill: 4,
                    		linewidth: 2,
                    		targets: [
                      			{
            	    				"target": "groupByNode(collectd.*.*."+hostName+".interface-eth0.if_octets.*, 6, 'sum')"
                      			},
                    		],
                    		tooltip: {
                      			shared: true
                    		}
                  		}


    ] // panels

  
	};

	return row;

} //topRow


function aggregateRow() {

    var stacked = true;

    if(!_.isUndefined(ARGS.stack)) {
        if (ARGS.stack!="true") {
            stacked = false;
        }
    }

    var urlParam = !stacked;

	var row = {
    	title: 'Aggregate',
    	height: '300px',
    	showTitle: true,
    	panels: [
    	/*
		{
          "title": "",
          "error": false,
          "span": 3,
          "editable": true,
          "type": "text",
          "isNew": true,
          "id": 7,
          "mode": "text",
          "content": "",
          "links": [],
          "transparent": true
        },*/
      		{
        		title: "Aggregate (stacked) $current_metric",
        		type: 'graph',
        		renderer: graphType,
        		span: 6,
				height: 500,
				stack: true,
        		fill: 4,
        		linewidth: 2,
        		targets: [
          			{
	    				"target": "aliasByNode(*.*.presence.presence*.$current_metric, 3)"
          			},
        		],
        		tooltip: {
          			shared: false
        		}
				,
				legend: {
					show: false
				}

				/*,
				links: [
				    {
                          "type": "absolute",
                          "includeVars": true,
                          "title": stacked?"unstacked":"stacked",
                          "params": "stack="+urlParam,
                          "url": "dashboard/script/ms.js"
                    }
				]
				*/
      		}

            ,

                  		{
                    		title: "Aggregate $current_metric",
                    		type: 'graph',
                    		renderer: graphType,
                    		span: 6,
            				height: 500,
            				stack: false,
                    		fill: 4,
                    		linewidth: 2,
                    		targets: [
                      			{
            	    				"target": "aliasByNode(*.*.presence.presence*.$current_metric, 3)"
                      			},
                    		],
                    		tooltip: {
                      			shared: false
                    		}
            				,
            				legend: {
            					show: false
            				}
            				/*
            				,
            				links: [
            				    {
                                      "type": "absolute",
                                      "includeVars": true,
                                      "title": stacked?"unstacked":"stacked",
                                      "params": "stack="+urlParam,
                                      "url": "dashboard/script/ms.js"
                                }
            				]
            				*/
                  		}


    ] // panels

  
	};

	return row;
}

function frontPage() {

	// Setup some variables
	var dashboard;

	// Intialize a skeleton with nothing but a rows array and service object
	dashboard = {
		editable:true,
  	    rows : [],
	};

	// Set a title
	dashboard.title = 'PS';

	// Set default time
	// time can be overriden in the url using from/to parameters, but this is
	// handled automatically in grafana core during dashboard initialization
	dashboard.time = {
  		from: "now-1h",
  		to: "now"
	};

  dashboard.rows.push(topRow("presence*", "Cluster"));
  dashboard.rows.push(aggregateRow());

var options = [];


var metricArray = [];

for (var j in metrics) {
	var record = metrics[j];
	metricArray.push(record.metric);
} 


var query = metricArray.join(',');

dashboard.templating =  {
    "list": [
      {
        "current": {
          "text": "java_mem_mb",
          "value": "java_mem_mb"
        },
        "datasource": null,
        "hide": 0,
        "includeAll": false,
        "label": "Hosts metric",
        "multi": false,
        "name": "current_metric",
        "options": options,
        "query": query,
        "refresh": 1,
        "regex": "",
        "type": "custom"
      }

    ]
  };


var hosts_row;

hosts_row = {
    title: 'Hosts',
    height: '300px',
    showTitle: true,
    panels: [
      {
        title: 'Average load',
        type: 'graph',
        renderer: graphType,
        span: 3,
        fill: 4,
        linewidth: 2,
        targets: [
          {
	    "target": "*.*.*ms.ms-dev7.$current_metric"
          },
        ],
        tooltip: {
          shared: true
        }
      }
	]
};


var hosts = find_filter_values('*.*.presence.presence*');


var panels = [];

var index = 0;

for (var i in hosts) {

		if (index % 4 ==0) {
		panels.push({
		
		"height": "50px",
          "title": "",
          "error": false,
          "span": 12,
          "editable": true,
          "type": "text",
          "isNew": true,
          "mode": "text",
          "content": "",
          "links": [],
          "transparent": true

			});
		}

		index++;


	var hostName = hosts[i];
	var hostGraph = createHostGraph(hostName);
	panels.push(hostGraph);
}


hosts_row.panels = panels;

dashboard.rows.push(hosts_row); 
                               
return dashboard;
} //frontPage

function hostPage(hostName) {
	//var metrics = ['java_mem_mb', 'java_cpu'];

	var dashboard;

	// Intialize a skeleton with nothing but a rows array and service object
	dashboard = {
		editable:true,
  		rows : [
			topRow(hostName, hostName+' top metrics'),
			{    
				title: hostName,
			    showTitle: true,
				panels: []
			}
		],
		"links": [
    		{
      		"icon": "external link",
      		"tags": [],
      		"type": "link",
      		"url": "dashboard/script/ps.js?"+graphType,
			"title": "Cluster overview"
			}]    		

	};

	// Set a title
	dashboard.title = hostName;

	var index = 0;

	for (var i in metrics) {
		
		if (index % 4 ==0) {
		dashboard.rows[1].panels.push({
		
		"height": "50px",
          "title": "",
          "error": false,
          "span": 12,
          "editable": true,
          "type": "text",
          "isNew": true,
          "mode": "text",
          "content": "",
          "links": [],
          "transparent": true

			});
		}

		index++;

		var metric = metrics[i];
		
		var graph = createMetricGraph(hostName, metric);


		dashboard.rows[1].panels.push(graph);

	}

	return dashboard;
}

if(!_.isUndefined(ARGS.host)) {
	return hostPage(ARGS.host);
}
else {
	return frontPage();
}


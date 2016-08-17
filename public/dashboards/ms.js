var metrics = 
[{"metric":"active5_users"},
 {"metric":"active_users"},
 {"metric":"admin_calls"},
 {"metric":"android_connections"},
 {"metric":"bot_messages_received"},
 {"metric":"bot_messages_sent"},
 {"metric":"bot_users"},
 {"metric":"bot_user_messages_sent"},
 {"metric":"client_connects"},
 {"metric":"client_disconnects"},
 {"metric":"dropped_connections"},
 {"metric":"expired_tokens_presented"},
 {"metric":"fast_reconnect_tokens_accepted"},
 {"metric":"fast_reconnect_tokens_rejected"},
 {"metric":"gateway_connections"},
 {"metric":"http_callbacks_avg_time_millis"},
 {"metric":"http_callbacks_completed"},
 {"metric":"http_callback_errors"},
 {"metric":"http_call_latency_millis_500"},
 {"metric":"http_call_latency_millis_800"},
 {"metric":"http_call_latency_millis_950"},
 {"metric":"http_call_latency_millis_990"},
 {"metric":"ios_connections"},
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
 {"metric":"jvm_vsize_kb", min:0},
 {"metric":"login_requests"},
 {"metric":"messages_dropped"},
 {"metric":"messages_received"},
 {"metric":"messages_sent"},
 {"metric":"messages_team_bytes"},
 {"metric":"mobile_connections"},
 {"metric":"ms_queue_size"},
 {"metric":"ping_reply_millis_500"},
 {"metric":"ping_reply_millis_800"},
 {"metric":"ping_reply_millis_950"},
 {"metric":"ping_reply_millis_990"},
 {"metric":"proxy_to_ms_connects_failed"},
 {"metric":"prx_frames_received"},
 {"metric":"prx_frames_sent"},
 {"metric":"regular_pings"},
 {"metric":"rejected_proxy_reconnects"},
 {"metric":"rl_disconnects"},
 {"metric":"rl_messages_dropped"},
 {"metric":"rl_soft_limit_users"},
 {"metric":"shortcut_pings"},
 {"metric":"socket_connects"},
 {"metric":"socket_disconnects"},
 {"metric":"tokens_issued"},
 {"metric":"tokens_presented"},
 {"metric":"token_ages_millis_500"},
 {"metric":"token_ages_millis_800"},
 {"metric":"token_ages_millis_950"},
 {"metric":"token_ages_millis_990"},
 {"metric":"total_all_channels"},
 {"metric":"total_channels"},
 {"metric":"total_dms"},
 {"metric":"total_groups"},
 {"metric":"total_pending_bytes"},
 {"metric":"total_pending_ops"},
 {"metric":"total_teams"},
 {"metric":"total_users"},
 {"metric":"unretrieved_tokens"},
 {"metric":"user_messages_perc900"},
 {"metric":"user_messages_perc990"},
 {"metric":"user_messages_perc999"},
 {"metric":"user_messages_sent"},
 {"metric":"websocket_errors"}]
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
        renderer: 'png',
        span: 3,
        fill: 1,
        linewidth: 2,
        targets: [],
	    links: [
		{
		keepTime: true,
              params: "host="+hostName,
              targetBlank: true,
              title: "click here to view all metrics",
              type: "absolute",
              url: "dashboard/script/ms.js"
		}
		],
		legend: {show:false}
	};


	var targetValue = "*.*.*ms." + hostName + "." + '$current_metric';

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
        renderer: 'png',
        span: 3,
        fill: 1,
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


	var targetValue = "aliasByNode(*.*.*ms." + hostName + "." + metric.metric+",3)";

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

function clusterRow() {

	var row = {
    	title: 'Cluster',
    	height: '300px',
    	showTitle: true,
    	panels: [
      		{
        		title: 'Load average',
        		type: 'graph',
        		renderer: 'png',
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
        		renderer: 'png',
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
        		renderer: 'png',
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
        		renderer: 'png',
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

function topRow(hostName) {

	var row = {
    	title: hostName+' top metrics',
    	height: '300px',
    	showTitle: true,
    	panels: [
      		{
        		title: 'Load average',
        		type: 'graph',
        		renderer: 'png',
        		span: 3,
        		fill: 1,
        		linewidth: 2,
        		targets: [
          			{
	    				"target": "groupByNode(*.*.*ms."+hostName+".load.load.*, 6, 'sum')"
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
        		renderer: 'png',
        		span: 3,
        		fill: 1,
        		linewidth: 2,
        		targets: [
          			{
	    				"target": "groupByNode(*.*.*."+hostName+".memory.*, 5, 'sum')"
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
        		renderer: 'png',
        		span: 3,
        		fill: 1,
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
        		renderer: 'png',
        		span: 3,
        		fill: 1,
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

    ] // panels

  
	};

	return row;

} //clusterRow


function aggreagateRow() {
	var row = {
    	title: 'Aggregate',
    	height: '300px',
    	showTitle: true,
    	panels: [
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
        },
      		{
        		title: "Aggregate $current_metric",
        		type: 'graph',
        		renderer: 'png',
        		span: 6,
				height: 500,
				stack: true,
        		fill: 1,
        		linewidth: 2,
        		targets: [
          			{
	    				"target": "aliasByNode(*.*.*ms.ms*.$current_metric, 3)"
          			},
        		],
        		tooltip: {
          			shared: false
        		}
				,
				legend: {
					show: false
				}
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
		editable:false,
  	rows : [],
	};

	// Set a title
	dashboard.title = 'MS';

	// Set default time
	// time can be overriden in the url using from/to parameters, but this is
	// handled automatically in grafana core during dashboard initialization
	dashboard.time = {
  		from: "now-1h",
  		to: "now"
	};

  dashboard.rows.push(clusterRow());
  dashboard.rows.push(aggreagateRow());

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
        renderer: 'png',
        span: 3,
        fill: 1,
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


var hosts = find_filter_values('*.*.*ms.ms*');


var panels = [];

var index = 0;

for (var i in hosts) {

		if (index % 4 ==0) {
		panels.push({
		
		"height": "50px",
          "title": "",
          "error": false,
          "span": 12,
          "editable": false,
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
		editable:false,
  		rows : [
			topRow(hostName),
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
      		"url": "dashboard/script/ms.js",
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
          "editable": false,
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


/*
[
          {
            "text": "java_mem_mb",
            "value": "java_mem_mb",
            "selected": true
          },
          {
            "text": "java_cpu",
            "value": "java_cpu",
            "selected": false
          }
        ],
*/

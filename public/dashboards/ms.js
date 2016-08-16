var metrics = [
'java_mem_mb',
'java_cpu',
'ms_queue_size',
'http_callbacks_completed',
'http_callbacks_avg_time_millis',
'java_gc_count',
'java_gc_time_ms',
'mobile_connections',
'ios_connections',
'android_connections',
'gateway_connections',
'total_pending_ops',
'total_pending_bytes',
'proxy_to_ms_connects_failed',
'token_ages_millis_500',
'token_ages_millis_800',
'token_ages_millis_950',
'token_ages_millis_990',
'ping_reply_millis_500',
'ping_reply_millis_800',
'ping_reply_millis_950',
'ping_reply_millis_990',
'http_call_latency_millis_500',
'http_call_latency_millis_800',
'http_call_latency_millis_950',
'http_call_latency_millis_990',
'messages_received',
'messages_sent',
'messages_team_bytes',
'user_messages_sent',
'bot_messages_received',
'bot_messages_sent',
'bot_user_messages_sent',
'messages_dropped',
'prx_frames_received',
'prx_frames_sent',
'admin_calls',
'socket_connects',
'socket_disconnects',
'client_connects',
'client_disconnects',
'websocket_errors',
'dropped_connections',
'login_requests',
'http_callback_errors',
'rl_soft_limit_users',
'rl_messages_dropped',
'rl_disconnects',
'tokens_issued',
'expired_tokens_presented',
'tokens_presented',
'unretrieved_tokens',
'fast_reconnect_tokens_accepted',
'fast_reconnect_tokens_rejected',
'regular_pings',
'shortcut_pings',
'rejected_proxy_reconnects',
'total_users',
'active_users',
'active5_users',
'bot_users',
'user_messages_perc900',
'user_messages_perc990',
'user_messages_perc999',
'java_old_gen_size',
'java_old_gen_commited',
'java_old_gen_perc_used',
'java_old_gen_peak_size',
'java_old_gen_coll_size',
'java_old_gen_coll_perc_used',
'jvm_minor_faults',
'jvm_major_faults',
'jvm_num_threads',
'jvm_vsize_kb',
'jvm_rss_kb',
'jvm_vsize_delta_kb',
'jvm_rss_delta_kb',
'jvm_fd_open_count',
'jvm_fd_perc_used',
'total_teams',
'total_channels',
'total_groups',
'total_dms',
'total_all_channels'
];



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


	var targetValue = "*.*.dev-ms." + hostName + "." + '$current_metric';

	var target = {};

	target["target"] = targetValue;

	hostGraph.targets.push(target);

	return hostGraph;

} // createHostGraph

function createMetricGraph(hostName, metric) {
	var graph = 
      	{
	title: metric,
        type: 'graph',
        span: 3,
        fill: 1,
        linewidth: 2,
        targets: [],
	links: [
	]
	,
	legend: {show:false}

	};


	var targetValue = "aliasByNode(*.*.dev-ms." + hostName + "." + metric+",3)";

	var target = {};

	target["target"] = targetValue;

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
        		span: 3,
        		fill: 1,
        		linewidth: 2,
        		targets: [
          			{
	    				"target": "groupByNode(*.*.dev-ms.ms*.load.load.*, 6, 'sum')"
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
        		span: 3,
        		fill: 1,
        		linewidth: 2,
        		targets: [
          			{
	    				"target": "groupByNode(*.*.dev-ms."+hostName+".load.load.*, 6, 'sum')"
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
    	title: 'Aggreagate',
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
        		span: 6,
				height: 500,
				stack: true,
        		fill: 1,
        		linewidth: 2,
        		targets: [
          			{
	    				"target": "aliasByNode(*.*.dev-ms.ms*.$current_metric, 3)"
          			},
        		],
        		tooltip: {
          			shared: true
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

 /*
for (var j in metrics) {
	var option = {text:metrics[j], value:metrics[j]};
	dashboard.templating.list.options.push(option);
} 
*/

var query = metrics.join(',');

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
        span: 3,
        fill: 1,
        linewidth: 2,
        targets: [
          {
	    "target": "*.*.dev-ms.ms-dev7.$current_metric"
          },
        ],
        tooltip: {
          shared: true
        }
      }
	]
};


var hosts = find_filter_values('*.*.dev-ms.ms*');


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

		if (metric=="java_old_gen_commited") {
			graph.yaxes = [
    {
      "label": "",
      "show": true,
      "logBase": 1,
      "min": 0,
      "max": null,
      "format": "bytes"
    },
    {
      "label": null,
      "show": false,
      "logBase": 1,
      "min": null,
      "max": null,
      "format": "bytes"
    }
		];

			//alert(graph.yaxes);
		 }

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

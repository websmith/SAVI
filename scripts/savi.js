window.SAVI = window.SAVI || {};

// App Dashboard Functionality
SAVI.dashboard = (function($) {
    var start = Date.now(),
        intervalId,
        //$countdown = {},
        totaluptime,
        statuscount,
        dataObj = {};
        
	function init() {
		start = Date.now();
        totaluptime = 0;
        statuscount = { pause: 0, on: 0, off: 0, appearsoff: 0, unknown: 0 };
        
		getUptime(apiKey);
        
        $('#site-list').empty();
        
		intervalId = setInterval(countdown, 1000);        
	}
    
    function getUptime(apikey) {
		var url = "http://api.uptimerobot.com/getMonitors?apiKey="+apikey+"&logs=1&format=json";
        $.ajax({
            url: url,
            type: 'GET',
            context: document.body,
            dataType: 'jsonp',
            timeout: 15000,
            beforeSend: function(){
                $('#site-list').empty();
                var $this = $('#site-list'),
                html = $this.jqmData( "html" ) || "";
                $.mobile.loading( "show", {
                    html: html
                });
            },
            complete: function() {
                $.mobile.loading("hide");
            },
            error: function(x, t, msg) {
                if(t==="timeout"){
                    alert("Server timeout. Please try again later.");
                }
            }
        });
    }
    
    function getMonitors(data) {
        totaluptime += (parseInt(data.alltimeuptimeratio*100)/100);
        data.alert = "alert";
        
        function addList(appendTo, param, name, url, statuscode, status){
		  $(appendTo).append('<li class="status-'+statuscode+'"><a href="#monitor?id='+param+'" class="site-monitor"><h3 class="ui-li-heading">'+name+'</h3><h4 class="ui-li-desc">'+url+'</h4><p class="ui-li-desc ul-li-status status'+statuscode+'">Status: '+status+'</p></a></li>');
            $(appendTo).listview("refresh");
        }
        
        switch (parseInt(data.status)) {
            case 0:
                addList('#site-list', data.id, data.friendlyname, data.url, data.status, 'Paused');
                statuscount.pause += 1;
                break;
            case 1:
                addList('#site-list', data.id, data.friendlyname, data.url, data.status, 'Not Checked');
                statuscount.unknown += 1;
                break;
            case 2:
                addList('#site-list', data.id, data.friendlyname, data.url, data.status, 'Online');
                statuscount.on += 1;
                break;
            case 8:
                addList('#site-list', data.id, data.friendlyname, data.url, data.status, 'Appears Offline');
                statuscount.appearsoff += 1;
                break;
            case 9:
                addList('#site-list', data.id, data.friendlyname, data.url, data.status, 'Offline');
                statuscount.off += 1;
                break;
        }
            
        $('#nav-panel .ui-panel-inner #sitesonline .ui-btn-text span').html(statuscount.on);
        $('#nav-panel .ui-panel-inner #sitesoffline .ui-btn-text span').html(statuscount.off);
        $('#nav-panel .ui-panel-inner #sitespaused .ui-btn-text span').html(statuscount.pause);
        $('#nav-panel .ui-panel-inner #sitesunknown .ui-btn-text span').html(statuscount.unknown);
        $('#nav-panel .ui-panel-inner #sitesappearingoff .ui-btn-text span').html(statuscount.appearsoff);
        $('#site-list').fadeIn();

        return totaluptime;
    }
    
    function initNewMonitor(monitorname, monitorurl) {
        addMonitor(apiKey, monitorname, monitorurl);
    }
    
    function addMonitor(apikey, monitorname, monitorurl) {
        var url = "http://api.uptimerobot.com/newMonitor?apiKey="+apikey+"&monitorFriendlyName="+monitorname+"&monitorURL="+monitorurl+"&monitorType=1&format=json&noJsonCallback=1";
        var request = $.ajax({
            url: url,
            context: document.body,
            dataType: 'jsonp',
        });
            
        clearInterval(intervalId);
        init();
    }

    // count down till next refresh
    function countdown() {
		var now = Date.now(),
			elapsed = parseInt((now - start) / 1000),
			mins = Math.floor((refresh - elapsed) / 60),
			secs = refresh - (mins * 60) - elapsed;
            
		secs = (secs < 10) ? "0" + secs : secs;
        $('#last-update').text('Next Refresh: '+mins + ':' + secs);
        
		if (elapsed > refresh) {
			clearInterval(intervalId);
			init();
		}
	}
    
    function refreshPage() {
        clearInterval(intervalId);
        init();
    }
    
	return {
		init: init,
        initNewMonitor: initNewMonitor,
		getMonitors: getMonitors,
        refreshPage: refreshPage
	};
}(jQuery));


// Monitor Page Functionality
SAVI.monitor = (function($) {
    function init(id) {
        getUptime(apiKey, id);    
    }
    
    function confirmDelete(id){
        console.log('run confirmDelete function');
        if(confirm("Are you sure you want to permanently delete Monitor#: "+id+"?")) {
            deleteMonitor(apiKey, id);
        }
    }
    
    function getUptime(apikey, id){
        var url = "http://api.uptimerobot.com/getMonitors?apiKey="+apikey+"&monitors="+id+"&logs=1&format=json";
        $.ajax({
            url: url,
            type: 'GET',
            context: document.body,
            dataType: 'jsonp',
            beforeSend: function(){
                var $this = $('#site-list'),
                html = $this.jqmData( "html" ) || "";
                $.mobile.loading( "show", {
                    html: html
                });
            },
            complete: function() {
                $.mobile.loading("hide");
            }
        });
    }
    
    function getMonitor(data) {            
        $('.monitor-title, .sitename-data').text(data.friendlyname);
        $('.siteurl-data').text(data.url);
        $('.uptime-data').text(data.alltimeuptimeratio+'%');
        $('#visit-link').attr('href', data.url);
        
        switch (parseInt(data.status)) {
            case 0:
                $('.status-icon-wrap').html('<span class="status-icon'+data.status+'">Paused</span>');
                break;
            case 1:
                $('.status-icon-wrap').html('<span class="status-icon'+data.status+'">Not Checked</span>');
                break;
            case 2:
                $('.status-icon-wrap').html('<span class="status-icon'+data.status+'">OK</span>');
                break;
            case 8:
                $('.status-icon-wrap').html('<span class="status-icon'+data.status+'">Appears Offline</span>');
                break;
            case 9:
                $('.status-icon-wrap').html('<span class="status-icon'+data.status+'">Offline</span>');
                break;
        }
    }
    
    function deleteMonitor(apikey, id) {
        console.log('run deleteMonitor function');
        var url = "http://api.uptimerobot.com/deleteMonitor?apiKey="+apikey+"&monitorID="+id+"&format=json";
        $.ajax({
            url: url,
            type: 'GET',
            context: document.body,
            dataType: 'jsonp'
        });
        
        $.mobile.changePage( "#homepage", { transition: "slideup", changeHash: true, dataURL: './' });
    }

    return {
        init: init,
        getMonitor: getMonitor,
        confirmDelete: confirmDelete
    };
}(jQuery));


// On Homepage Load
$(document).on('pageshow', '#homepage', function() {
    SAVI.dashboard.init();
    
    //When user clicks "Add Site"
    $('#add-site-btn').on('click', function(){
        var newsite = {
            name: $('#site-name').val(),
            url: $('#site-url').val()
        };
        var test = SAVI.dashboard.initNewMonitor(newsite.name,newsite.url);
    });
    
    //User clicks Refresh button
    $('#refresh-btn').on('click', function() {
        SAVI.dashboard.refreshPage();
    });
});


// On Monitor Page Load
$(document).on('pageshow', '#monitor',  function(){
    SAVI.monitor.init(param);
    
    $('#delete-monitor').on('click', function() {
        console.log('click delete');
        SAVI.monitor.confirmDelete(param);
    });
});

// On About Page Load
$(document).on('pageshow', '#about',  function(){    
    $('.display-version').text(appVersion);
});


// API Callback Function
function jsonUptimeRobotApi(data) {
    if ($.mobile.activePage.attr("id") == "homepage") {
        if(data.monitors.monitor.length !== undefined) {
            var objLength = data.monitors.monitor.length;
            var uptime;
            
            $('#site-list').listview({ filter: true });
            
            for (var i in data.monitors.monitor) {
                uptime = SAVI.dashboard.getMonitors(data.monitors.monitor[i]);
            }
            
            var fulluptime = Math.round((uptime/objLength)*100)/100;
            
            $('#nav-panel .ui-panel-inner #totaluptime .ui-btn-text span').html(fulluptime+'%');
            $('#nav-panel .ui-panel-inner #sitesmonitored .ui-btn-text span').html(objLength);
            $("#site-list li:last-child").css("margin-bottom", "40px");
        }
        
        $('.site-monitor').on('click', function(){
            param = this.href.split('=')[1];
        });
    }
    
    else if($.mobile.activePage.attr("id") == "monitor") {
        SAVI.monitor.getMonitor(data.monitors.monitor[0]);
    }
}
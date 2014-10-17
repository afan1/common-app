/*
 * Copyright (c) 2014, Intel Corporation, Jaguar Land Rover
 *
 * This program is licensed under the terms and conditions of the
 * Apache License, version 2.0.  The full text of the Apache License is at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 */

/*global ThemeKeyColor, Settings, loadScript */

/**
 * @module HomescreenApplication
 **/
/**
 * Retrieves list of installed apps from [Tizen Application API](https://developer.tizen.org/dev-guide/2.2.0/org.tizen.web.device.apireference/tizen/application.html)
 * and manages displaing it in app grid view. Class also provides launching of installed app by clicking on app representation in grid view.
 * @class installedApps
 * @static
 **/
/**
 * Global variable which holds the list component in the UI
 * @property appList
 * @type array
 **/
var appList = [];
/**
 * Global variable which holds the identifier of the application information event listener
 * @property listenerID
 * @type string
 * @default null
 **/
var listenerID = null;
/**
 * Global variable which holds the current index of last element in appList
 * @property index
 * @type int
 * @default 0
 **/
var index = 0;

/**
 * Provides hiding installed app grid afted click out of app cells.
 * @method $
 * @static
 **/
$(function() {
	"use strict";
	$("#homeScrAppGridView").live("click", function() {
		$(this).fadeOut();
	});
});

/**
 * Provide logging of app launch success.
 * @method onLaunchSuccess
 * @static
 **/
function onLaunchSuccess() {
	"use strict";
	console.log("App launched...");
}

/**
 * Provide logging of app launch error.
 * @method onError
 * @param err {string} Error message.
 * @static
 **/
function onError(err) {
	"use strict";
	console.error(err.message);
}

/**
 * Provide launch of application.
 * @method onFrameClick
 * @param appData {object} Contains Object of specific app.
 * @static
 **/
function onFrameClick(appData) {
	"use strict";
	//launch application
	var i;
	try {
		var scriptCallback = function(path, status) {
			if (status === "ok") {
				Settings.init();
			}
		};

		for (i = 0; i < appList.length; ++i) {
			if (appList[i].id === appData.id) {
				if (appData.id === "http://com.intel.tizen/intelPocSettings") {
					if (typeof Settings === 'undefined') {
						loadScript('./common/components/settings/js/settings.js', scriptCallback);
					} else {
						Settings.show();
					}
				} else {
					tizen.application.launch(appData.id, onLaunchSuccess, onError);
				}
				break;
			}
		}
	} catch (exc) {
		console.error(exc.message);
	}
}

/**
 * Create app grid view based on appList.
 * @method insertAppFrame
 * @param appFrame {object} Contains Object of specific app from appList property.
 * @static
 **/
function insertAppFrame(appFrame) {
	"use strict";
	var rootDiv = $("<div></div>").addClass("homeScrAppGridFrame").data("app-data", appFrame).click(function() {
		onFrameClick($(this).data("app-data"));
	});
	var hexDivs = $("<div></div><div></div>").appendTo(rootDiv);
	var innerDiv = $("<span></span>").addClass("homeScrAppGridImg").appendTo(rootDiv);
	$("<img />").data("src", appFrame.iconPath).appendTo(innerDiv);
	var textDiv = $("<span />").addClass("homeScrAppGridText").appendTo(rootDiv);
	$("<span />").addClass("homeScrAppGridTitle fontColorNormal fontSizeSmaller fontWeightBold").text(appFrame.appName.substring(0,10).replace("-","")).appendTo(textDiv);
	$("<span />").addClass("homeScrAppGridCategory").text(appFrame.appName).appendTo(textDiv);

	$('.hexrow').last().append(rootDiv);

	var img = new Image();
	var ctx = document.createElement('canvas').getContext('2d');

	img.onload = function() {
		var w = ctx.canvas.width = img.width;
		var h = ctx.canvas.height = img.height;

		// Change icon only in case of Intel POC apps
		if (appFrame.id.indexOf("intelPoc") >= 0) {
			ctx.fillStyle = ThemeKeyColor;
			ctx.fillRect(0, 0, w, h);
			ctx.globalCompositeOperation = 'destination-in';
		}
		ctx.drawImage(img, 0, 0);

		$("span.homeScrAppGridImg img").each(function() {
			if ($(this).data("src") === appFrame.iconPath) {
				$(this)[0].src = ctx.canvas.toDataURL();
			}
		});
	};

	img.onerror = img.onabort = function() {
		$("span.homeScrAppGridImg img").each(function() {
			if ($(this).data("src") === appFrame.iconPath) {
				$(this).attr("src", "/common/images/default_icon.png");
			}
		});
	};

	img.src = appFrame.iconPath;
	console.log("img "+img.src+" app "+appFrame.appName);

	index++;
	appList.push(appFrame);
}

var evalInstalledApps = null;
var extras = 0;

/**
 * Callback method for getting and resorting appList array for Homescreen app using.
 * @method onAppInfoSuccess
 * @param list {array} Contains Objects of apps from evalInstalledApps listener.
 * @static
 **/
function onAppInfoSuccess(list) {
	"use strict";
	var registeredApps = {"Home Screen":"/common/images/homescreen_icon.png",
						   Browser:"/common/images/browser_icon.png", 
						   Boilerplate:"/common/images/boilerplate_icon.png",
						   News:"/common/images/news_icon.png",
						   gestureGame:"/common/images/GestureGame_icon.png",
						   Phone:"/common/images/phone_icon.png",
						   Dashboard:"/common/images/dashboard_icon.png",
						   Weather:"/common/images/weather_icon.png",
						   Handwriting:"/common/images/handwriting_icon.png"};
	var i = 0;
	//console.log("onAppInfoSuccess(list)");
	//console.log(list);
	try {
		index = 0;
		var applications = [];

		applications.push({
			id: "http://com.intel.tizen/intelPocSettings",
			appName: "Settings",
			show: true,
			iconPath: "./common/components/settings/icon.png"
		});

		list.sort(function(x, y) {
			return x.appName > y.appName ? 1 : -1;
		});

		for (i = 0; i < list.length; i++) {

			var app = list[i];
			var newApp = {
				id: app.id,
				appName: app.name,
				style: "background-image: url('file://" + app.iconPath + "');",
				iconPath: app.iconPath,
				css: "app_" + app.id.replace(/\./g, "_").replace(/\ /g, "_"),
				installed: true
			};
			if (registeredApps[app.name]) {
				//console.log(newApp);
				newApp.style = "background-image: url('"+ registeredApps[app.name] + "');";
				newApp.iconPath = registeredApps[app.name];
				//console.log(newApp);
			}
			applications.push(newApp);
		}
		var equals = applications.length+extras === appList.length;

		if (equals) {
			for (var j = 0; j < applications.length; j++) {
				equals = applications[j].id === appList[j].id ? equals : false;
				equals = applications[j].appName === appList[j].appName ? equals : false;
				equals = applications[j].css === appList[j].css ? equals : false;
				equals = applications[j].iconPath === appList[j].iconPath ? equals : false;
			}
		}

		if (!equals) {
			appList = [];
			$('#homeScrAppGridView .homeScrAppGridFrame').remove();
			//$('#homeScrAppGridView .hexrow').remove();

			for (i = 0; i < applications.length; i++) {
				if(i/5==Math.floor(i/5)){
					var rowDiv = $("<div></div>").addClass("hexrow");
					$('#homeScrAppGridView #hexes').append(rowDiv);
				}
				insertAppFrame(applications[i]);
			}
			if(true){
				for (j=0;j<5-applications.length%5;j++){
					insertAppFrame({iconPath:'',appName:'',id:0});
					extras++;
				}
				for (i = 1; i <= 5; i++) {
					var rowDiv = $("<div></div>").addClass("hexrow");
					$('#homeScrAppGridView #hexes').append(rowDiv);
					for (j=1;j<=5;j++){
						insertAppFrame({iconPath:'',appName:'',id:0});
						extras++;
					}
				}
			}
		}
	} catch (exc) {
		console.log(exc.message);
	} finally {
		//Workaround due to https://bugs.tizen.org/jira/browse/TIVI-2018
		window.setTimeout(function() {
			evalInstalledApps();
		}, 1000);

		if (null === listenerID) {
			listenerID = tizen.application.addAppInfoEventListener({
				oninstalled: function(appInfo) {
					console.log('The application ' + appInfo.name + ' is installed');
					evalInstalledApps();
				},
				onupdated: function(appInfo) {
					console.log('The application ' + appInfo.name + ' is updated');
					evalInstalledApps();
				},
				onuninstalled: function(appid) {
					console.log('The application ' + appid + ' is uninstalled');
					evalInstalledApps();
				}
			});
		}
	}
}

/**
 * Listener for installed apps events.
 * @method evalInstalledApps
 * @static
 **/
evalInstalledApps = function() {
	"use strict";
	if (typeof tizen !== 'undefined') {
		try {
			// get the installed applications list
			tizen.application.getAppsInfo(onAppInfoSuccess, function(err) {
				// Workaround due to https://bugs.tizen.org/jira/browse/TIVI-2018
				window.setTimeout(function() {
					evalInstalledApps();
				}, 1000);

				onError(err);
			});
		} catch (exc) {
			console.error(exc.message);
		}
	}
};

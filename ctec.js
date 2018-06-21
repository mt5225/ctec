//global init settings
var cameraSignManager = {};
var RES_BASE = "http://localhost:8081/ctec_res/";
//var API_BASE = "http://localhost:9006/";
var API_BASE = "http://192.168.86.24:9006/";
var LISTENING = false;
var T_Live_Fire_Alarm = {};
var T_Fire_List = {};
var objSign = gui.createLabel("<color=red>IDLE</color>", Rect(5, 38, 120, 30));

function open_camera_live_feed(camObj) {
	if (camObj != null) {
		util.setTimeout(function () {
			selector.select(camObj);
			util.externalEval("window.open('" + RES_BASE + camObj.uid + ".html','info',\"directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,width=1024,height=768\");");
		}, 500);
	}
}

function fly_indoor() {
	var building = world.buildingList.get_Item(0);
	util.setTimeout(function () {
		level.change(building);
		util.setTimeout(function () {
			var floor = building.planList.get_Item(0);
			level.change(floor);
		}, 500);
	}, 100);
}

function init() {
	//init sign
	for (var i = 1; i < 17; i++) {
		if (i < 10) {
			camName = 'Fire0' + i;
			signText = '화재감시 0' + i;
		} else {
			camName = 'Fire' + i;
			signText = '화재감시 ' + i;
		}
		var obj = object.find(camName);
		if (obj != null) {
			cameraSignManager[obj] = signText;
			if (obj.isOpen()) {
				obj.open(false);
			} else {
				obj.open(true);
			}
		}
	}

	//create banner
	util.download({
		"url": RES_BASE + "outline_button.bundle",
		"success": function (res) {
			foreach(var item in pairs(cameraSignManager)) {
				var banner_ui = gui.create(res);
				var camObj = item.key;
				camObj.setTransparent(0.001);
				camObj.setColor(Color.blue);
				var bound = ObjectUtil.CalculateBounds(camObj.gameObject);
				var offsetY = bound.size.y;
				banner_ui.setScale(0.6, 0.6);
				banner_ui.setObject(camObj, Vector3(0, offsetY, 0));
				banner_ui.setText("Button/Text", item.value);
				util.downloadTexture({
					"url": RES_BASE + "demo_panel_001.png",
					"success": function (t) {
						banner_ui.setImage("Button", t);
					}
				});
				banner_ui.regButtonEvent("Button", function () {
					open_camera_live_feed(camObj);
				});
			}
		}
	});

	//enter indoor
	fly_indoor();

}

init();

function show_fire(sensorObj) {
	if (T_Fire_List[sensorObj] == null) {
		var fireEffectObject = object.create("4483E64D87BA49F8AA9AAA693194A541");
		fireEffectObject.setPosition(sensorObj.center);
		T_Fire_List[sensorObj] = fireEffectObject;
	}

}

function remove_recovery_fire_alarm(item) {
	if (table.containskey(T_Fire_List, item)) {
		if (T_Fire_List[item] != null) {
			T_Fire_List[item].destroy();
		}
		table.remove(T_Fire_List, item);
	}
}

function update_fire_alarm_table() {
	foreach(var item in vpairs(table.keys(T_Live_Fire_Alarm))) {
		var tmpArray = string.split(T_Live_Fire_Alarm[item], "|");
		var sensor_status = tmpArray[1];
		var fireObj = object.find(item);
		if (fireObj != null) {
			if (sensor_status == "1") {
				util.setTimeout(function () {
					show_fire(fireObj);
				}, 500);

			} else {
				remove_recovery_fire_alarm(fireObj);
			}
		}
	}
}

function remove_all_fire_alarm() {
	foreach(var item in vpairs(table.keys(T_Fire_List))) {
		if (T_Fire_List[item] != null) {
			T_Fire_List[item].destroy();
		}
	}
}

//create UI button with actions
gui.createButton("Listen", Rect(40, 220, 60, 30), function () {
	if (LISTENING == false) {
		gui.destroy(objSign);
		objSign = gui.createLabel("<color=green>LISTENING</color>", Rect(5, 38, 120, 30));
		LISTENING = true;
		util.setInterval(function () {
			if (LISTENING) {
				//polling for fire information

				util.download({
					"url": API_BASE + "fire",
					"type": "text",
					"success": function (rs) {
						if (string.length(rs) > 10) {
							rs = string.trim(rs);
							var msgArray = string.split(rs, "#");
							for (var i = 0; i < array.count(msgArray); i++) {
								//split and save to live event table
								tmpArray = string.split(msgArray[i], "|");
								T_Live_Fire_Alarm[tmpArray[2]] = msgArray[i];
							}
							update_fire_alarm_table();
						} else {
							remove_all_fire_alarm();
						}

					},
					"error": function (t) {
						print(t);
					}
				});

			}
		},
			3000);
	}
});

gui.createButton("Reset", Rect(40, 260, 60, 30), function () {
	util.clearAllTimers();
	remove_all_fire_alarm();
	table.clear(T_Live_Fire_Alarm);
	table.clear(T_Fire_List);
	gui.destroy(objSign);
	objSign = gui.createLabel("<color=red>IDLE</color>", Rect(5, 38, 120, 30));
	LISTENING = false;
});

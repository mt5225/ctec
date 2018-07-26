//global init settings
var cameraSignManager = {};
var RES_BASE = "http://localhost:8081/ctec_res/";
//var API_BASE = "http://localhost:9006/";
var API_BASE = "http://192.168.86.24:9006/";
var LISTENING = false;
var T_Live_Fire_Alarm = {};
var T_Fire_List = {};
var objSign = gui.createLabel("<color=red>IDLE</color>", Rect(5, 38, 120, 30));
var patrolPath = [];

function open_camera_live_feed(camObj) {
	if (camObj != null) {
		util.setTimeout(function () {
			selector.select(camObj);
			util.externalEval("layer.closeAll();layer.open({type:2,title:'" + camObj.uid + "',offset:'r',anim:-1,isOutAnim:false,resize:false,shade:0,area:['340px','300px'],content:'" + RES_BASE + camObj.uid + ".html'});");
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

var _patrol_index = 0;
var _patrol_timer = null;
var _on_patrol = false;
var _patrol_sign = null;
function patrol() {
	_on_patrol = !_on_patrol;
	if (_on_patrol) {
		util.clearInterval(_patrol_timer);
		_patrol_sign = gui.createLabel("<color=green>PATROL</color>", Rect(5, 60, 120, 30));
		_patrol_timer = util.setInterval(function () {
				if (_patrol_index > array.count(patrolPath) - 1)
					_patrol_index = 0;
				var camObj = object.find(patrolPath[_patrol_index]);
				if (camObj != null) {
					var pos = camObj.pos;
					camera.flyTo({
						"eye": Vector3(pos.x + 5, pos.y + 5, pos.z + 5),
						"target": pos,
						"time": 2.0
					})
					open_camera_live_feed(camObj);
				}
				_patrol_index++;
			}, 6000)
	} else {
		gui.destroy(_patrol_sign);
		util.clearInterval(_patrol_timer);
	}
}

function stop_patrol() {
	if (_patrol_sign != null) {
		gui.destroy(_patrol_sign);
	}
	util.clearInterval(_patrol_timer);
	_on_patrol = false;
	_patrol_index = 0;
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

var _is_fire = false;
function show_fire(sensorObj) {
	if (T_Fire_List[sensorObj] == null) {
		var fireEffectObject = object.create("4483E64D87BA49F8AA9AAA693194A541");
		fireEffectObject.setPosition(sensorObj.center);
		T_Fire_List[sensorObj] = fireEffectObject;
		// stop patrol if any
		stop_patrol();
		// open camera
		if (!_is_fire) {
			_is_fire = true;
			open_camera_live_feed(sensorObj);
			// fit the fire
			var pos = sensorObj.pos;
			camera.flyTo({
				"eye": Vector3(pos.x + 5, pos.y + 5, pos.z + 5),
				"target": pos,
				"time": 2.0
			})
		}
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
	remove_all_fire_alarm();
	table.clear(T_Live_Fire_Alarm);
	table.clear(T_Fire_List);
	stop_patrol();
	util.externalEval("layer.closeAll();");
	util.clearAllTimers();
	gui.destroy(objSign);
	util.setTimeout(function () {
		fly_indoor();
		objSign = gui.createLabel("<color=red>IDLE</color>", Rect(5, 38, 120, 30));
	}, 500);

	LISTENING = false;
});

gui.createButton("Patrol", Rect(40, 300, 60, 30), function () {
	_patrol_index = 0;
	util.download({
		"url": API_BASE + "path",
		"type": "text",
		"success": function (rs) {
			if (string.length(rs) > 3) {
				rs = string.trim(rs);
				patrolPath = string.split(rs, "#");
				patrol();
			}
		},
		"error": function (t) {
			print(t);
		}
	});

});
var myLib = require("./myLib");
var s = require("./localStorage");
var wss = require("./websocket");


exports.channelUpdateEvent = function (channel_ids) {
	var updatedChannels = {};
	for(var i in channel_ids) {
		updatedChannels[channel_ids[i]] = s.ui.mixer.channels[channel_ids[i]];
	}
	wss.broadcastEvent("channelUpdate", updatedChannels);
};

exports.channelMode = function (channel_id, channel) {
	if (!s.ui.mixer.channels[channel_id]) {
		throw Error ('unknown channel_id');
	} else if (s.ui.mixer.channels[channel_id].mode === channel.mode) {
		return false;
	} else {
			if (!channel.timestamp && s.ui.mixer.channels[channel_id].mode !== channel.mode) {
				channel.timestamp = Date.now();
			}
			switch(channel.mode) {
				case 'free':
				case 'defunct':
					if (s.ui.mixer.channels[channel_id].direction !== 'operator') {
						channel.direction = null;
					}
					channel.contact = null;
					if (s.ui.mixer.channels[channel_id].contact && s.ui.mixer.channels[channel_id].contact.modified) {
						//pbxProvider.setPhoneBookEntry(s.ui.mixer.channels[channel_id].contact.number, s.ui.mixer.channels[channel_id].contact.name);
						//addressBook.setContactInfo(s.ui.mixer.channels[channel_id].contact);
					}
				case 'on_hold':
				case 'dial':
				case 'ring':
					return exports.channelUpdateProperties(channel_id, channel);
				default:
					myLib.consoleLog('panic', 'unknown channelMode:', channel.mode);
					throw Error ('unknown channelMode:' + channel.mode);
			}
	}
};

exports.channelUpdateProperties = function (channel_id, data) {
	var changed = false;
	if (!s.ui.mixer.channels[channel_id]) {
		if (data) {
			s.ui.mixer.channels[channel_id] = data;
			changed = true;
		}
	} else if (!data) {
		s.ui.mixer.channels[channel_id] = null;
		changed = true;
	} else {
		for (var key in data) {
			//if (key == 'mode' || s.ui.mixer.channels[channel_id][key] !== data[key]) { // temp. solution to a bug
			if (s.ui.mixer.channels[channel_id][key] !== data[key]) {
				s.ui.mixer.channels[channel_id][key] = data[key];
				changed = true;
			} else {
				myLib.consoleLog('debug', "mixerLib::channelUpdateProperties", "value already set for " + [channel_id, key].join('.'), data[key]);
			}
		}
	}
	if (!changed) {
		myLib.consoleLog('warning', "mixerLib::channelUpdateProperties", "all values already set for " + channel_id, data);
	}
	return changed;
};

exports.channelCreate = function (channel_id, defaults) {
	if (s.ui.mixer.channels[channel_id]) {
		return false;
	} else if (!myLib.checkObjectProperties(defaults, ["type", "label"])) {
		throw Error('invalid input'); 
	} else {
		var channel = {
			type       : null,
			level      : 67,
			direction  : null,
			label      : null,
			mode       : 'defunct',
			muted      : false,
			timestamp  : Date.now(),
			autoanswer : null,
			contact    : null,
			recording  : false
		};
		for(var key in defaults) {
			channel[key] = defaults[key];
		}
		s.ui.mixer.channels[channel_id] = channel;
		return true;
	}
};

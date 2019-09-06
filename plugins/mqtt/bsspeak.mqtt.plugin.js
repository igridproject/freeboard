// # A Freeboard Plugin that uses the Eclipse Paho javascript client to read MQTT messages

(function()
{
	// ### Datasource Definition
	// Please replace the external_scripts location with a local replica of the Paho MQTT client when possible
	// -------------------
	freeboard.loadDatasourcePlugin({
		"type_name"   : "bsspeak_mqtt",
		"display_name": "BSSpeak over MQTT",
        "description" : "Receive data from BigStream Messaging",
		"external_scripts" : [
			"plugins/mqtt/paho-mqtt-min.js"
		],
		"settings"    : [
			{
				"name"         : "server",
				"display_name" : "BS-MQTT Server",
				"type"         : "text",
				"description"  : "Hostname for BigStream MQTT Server",
                "required" : true,
				"default_value": "msg.bs.igridproject.info"
			},
            {
            	"name"        : "topic",
            	"display_name": "Topic",
            	"type"        : "text",
            	"description" : "The topic to subscribe to",
				"required"    : true,
				"default_value": "/bsspeak/job/#"
            }
		],
		// **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
		// * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
		// * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
		// * **updateCallback** : A callback function that you'll call if and when your datasource has an update for freeboard to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
		newInstance   : function(settings, newInstanceCallback, updateCallback)
		{
			newInstanceCallback(new mqttDatasourcePlugin(settings, updateCallback));
		}
	});

	var mqttDatasourcePlugin = function(settings, updateCallback)
	{
 		var self = this;
		var data = {};

		var currentSettings = settings;

		function onConnect() {
			console.log("Connected");
			client.subscribe(currentSettings.topic);
		};
		
		function onConnectionLost(responseObject) {
			if (responseObject.errorCode !== 0)
				console.log("onConnectionLost:"+responseObject.errorMessage);

			client.connect({onSuccess:onConnect,useSSL: true});
		};

		function onMessageArrived(message) {
			data.topic = message.destinationName;
			data.msg = JSON.parse(message.payloadString);

			updateCallback(data);
		};

		// **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
		self.onSettingsChanged = function(newSettings)
		{
			client.disconnect();
			data = {};
			currentSettings = newSettings;
			client.connect({onSuccess:onConnect,
							useSSL: true});
		}

		// **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datasource
		self.updateNow = function()
		{
			// Don't need to do anything here, can't pull an update from MQTT.
			console.log("Updated");
		}

		// **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
		self.onDispose = function()
		{
			if (client.isConnected()) {
				client.disconnect();
			}
			client = {};
		}

		//var client = new Paho.MQTT.Client(currentSettings.server,currentSettings.port,"/ws",currentSettings.client_id);
		var client = new Paho.MQTT.Client("msg.bs.igridproject.info", 443, "/ws","bs_clientid_" + parseInt(Math.random() * 100000, 10));
		client.onConnectionLost = onConnectionLost;
		client.onMessageArrived = onMessageArrived;
		client.connect({onSuccess:onConnect, 
    onFailure: function (message) {
        console.log("CONNECTION FAILURE - " + message.errorMessage);
    },
						useSSL: true});
	}
}());

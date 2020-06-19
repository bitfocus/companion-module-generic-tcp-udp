var tcp           = require('../../tcp');
var udp           = require('../../udp');
var instance_skel = require('../../instance_skel');
var debug;
var log;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions
	self.init_presets();

	return self;
}

instance.prototype.updateConfig = function(config) {
	var self = this;
	self.init_presets();

	if (self.udp !== undefined) {
		self.udp.destroy();
		delete self.udp;
	}

	if (self.socket !== undefined) {
		self.socket.destroy();
		delete self.socket;
	}

	self.config = config;

	if (self.config.prot == 'tcp') {
		self.init_tcp();
	};

	if (self.config.prot == 'udp') {
		self.init_udp();
	};
};

instance.prototype.init = function() {
	var self = this;

	debug = self.debug;
	log = self.log;
	self.init_presets();

	if (self.config.prot == 'tcp') {
		self.init_tcp();
	};

	if (self.config.prot == 'udp') {
		self.init_udp();
	};
};

instance.prototype.init_udp = function() {
	var self = this;

	if (self.udp !== undefined) {
		self.udp.destroy();
		delete self.udp;
	}

	self.status(self.STATE_WARNING, 'Connecting');

	if (self.config.host !== undefined) {
		self.udp = new udp(self.config.host, self.config.port);

		self.udp.on('error', function (err) {
			debug("Network error", err);
			self.status(self.STATE_ERROR, err);
			self.log('error',"Network error: " + err.message);
		});

		// If we get data, thing should be good
		self.udp.on('data', function () {
			self.status(self.STATE_OK);
		});

		self.udp.on('status_change', function (status, message) {
			self.status(status, message);
		});
	}
};

instance.prototype.init_tcp = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
		delete self.socket;
	}

	self.status(self.STATE_WARNING, 'Connecting');

	if (self.config.host) {
		self.socket = new tcp(self.config.host, self.config.port);

		self.socket.on('status_change', function (status, message) {
			self.status(status, message);
		});

		self.socket.on('error', function (err) {
			debug("Network error", err);
			self.status(self.STATE_ERROR, err);
			self.log('error',"Network error: " + err.message);
		});

		self.socket.on('connect', function () {
			self.status(self.STATE_OK);
			debug("Connected");
		})

		self.socket.on('data', function (data) {});
	}
};


// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;

	return [
		{
			type: 'text',
			id: 'info',
			label: 'Information',
			width: 12,
			value: `
				<div class="alert alert-danger">
					<h3>IMPORTANT MESSAGE</h3>
					<div>
						<strong>Please read and understand the following before using this module</strong>
						<br>
						The companion project started out as an attempt to make the everyday life of a technician easier. We've held back generic TCP/UDP modules for a long time
						to ensure that we have ready made actions, presets and feedbacks for as many products as possible.
						<ul>
							<li>You shoudn't need to go around remembering raw TCP commands</li>
							<li>If you have a product we don't support, please file a module request for it</li>
							<li>Do you think your product/device is too insignificant to make a module for, it's not.</li>
							<li>Properitary/inhouse products should also have their own modules.</li>
							<li>Please use Generic TCP/UDP as a last resort</li>
							<li>With generic modules you won't get nice things like presets and feedback</li>
						</ul>
						<a href="https://github.com/bitfocus/companion-module-requests/issues" target="_new" class="btn btn-warning mr-1">See current requests</a>
						<a href="https://github.com/bitfocus/companion-module-requests/issues/new" target="_new" class="btn btn-success">Request support for a product</a>
					</div>
				</div>
			`
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			width: 6,
			regex: self.REGEX_IP
		},
		{
			type: 'textinput',
			id: 'port',
			label: 'Target Port',
			width: 2,
			default: 7000,
			regex: self.REGEX_PORT
        },
		{
			type: 'dropdown',
			id: 'prot',
			label: 'Connect with TCP / UDP',
			default: 'tcp',
			choices:  [
				{ id: 'tcp', label: 'TCP' },
				{ id: 'udp', label: 'UDP' }
			]
		}
	]
};

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
	}

	if (self.udp !== undefined) {
		self.udp.destroy();
	}

	debug("destroy", self.id);;
};

instance.prototype.CHOICES_END = [
	{ id: '',     label: 'None' },
	{ id: '\n',   label: 'LF - \\n (Common UNIX/Mac)' },
	{ id: '\r\n', label: 'CRLF - \\r\\n (Common Windows)' },
	{ id: '\r',   label: 'CR - \\r (Old MacOS)' },
	{ id: '\x00', label: 'NULL - \\x00 (Can happen)' },
	{ id: '\n\r', label: 'LFCR - \\n\\r (Just stupid)' },
];

instance.prototype.init_presets = function () {
	var self = this;
	var presets = [];

	self.setPresetDefinitions(presets);
}

instance.prototype.actions = function(system) {
	var self = this;

	self.system.emit('instance_actions', self.id, {

		'send': {
			label: 'Send Command',
			options: [
				{
					type: 'textinput',
					id: 'id_send',
					label: 'Command:',
					tooltip: 'Use %hh to insert Hex codes',
					default: '',
					width: 6
				},
				{
					type: 'dropdown',
					id: 'id_end',
					label: 'Command End Character:',
					default: '\n',
					choices: self.CHOICES_END
				}

			]
		}
	});
}

instance.prototype.action = function(action) {
	var self = this;
	var cmd;
	var end;

	switch(action.action) {

		case 'send':
			cmd = unescape(action.options.id_send);
			end = action.options.id_end;
			break;

	}

	if (self.config.prot == 'tcp') {

		if (cmd !== undefined) {

			debug('sending ',cmd + end,"to",self.config.host);

			if (self.socket !== undefined && self.socket.connected) {
				self.socket.send(cmd + end);
			}
			else {
				debug('Socket not connected :(');
			}
		}
	}

	if (self.config.prot == 'udp') {

		if (cmd !== undefined ) {

			if (self.udp !== undefined ) {
				debug('sending',cmd + end,"to",self.config.host);

				self.udp.send(cmd + end);
			}
		}
	}
}

instance_skel.extendedBy(instance);
exports = module.exports = instance;

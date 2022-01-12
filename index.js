const tcp = require('../../tcp')
const udp = require('../../udp')
const instance_skel = require('../../instance_skel')

class instance extends instance_skel {
	/**
	 * Create an instance of the module
	 *
	 * @param {EventEmitter} system - the brains of the operation
	 * @param {string} id - the instance ID
	 * @param {Object} config - saved user configuration parameters
	 * @since 1.0.0
	 */
	constructor(system, id, config) {
		super(system, id, config)
		this.actions() // export actions
		this.init_presets() // export presets
	}

	updateConfig(config) {
		this.init_presets()

		if (this.udp !== undefined) {
			this.udp.destroy()
			delete this.udp
		}

		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		this.config = config

		if (this.config.prot == 'tcp') {
			this.init_tcp()
		}

		if (this.config.prot == 'udp') {
			this.init_udp()
		}
	}

	init() {
		this.init_presets()
		if (this.config.prot == 'tcp') {
			this.init_tcp()
		}

		if (this.config.prot == 'udp') {
			this.init_udp()
		}
	}

	init_udp() {
		if (this.udp !== undefined) {
			this.udp.destroy()
			delete this.udp
		}

		this.status(this.STATE_WARNING, 'Connecting')

		if (this.config.host !== undefined) {
			this.udp = new udp(this.config.host, this.config.port)

			this.udp.on('error', function (err) {
				this.debug('Network error', err)
				this.status(this.STATE_ERROR, err)
				this.log('error', 'Network error: ' + err.message)
			})

			// If we get data, thing should be good
			this.udp.on('data', function () {
				this.status(this.STATE_OK)
			})

			this.udp.on('status_change', function (status, message) {
				this.status(status, message)
			})
		}
	}

	init_tcp() {
		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		this.status(this.STATE_WARNING, 'Connecting')

		if (this.config.host) {
			this.socket = new tcp(this.config.host, this.config.port)

			this.socket.on('status_change', function (status, message) {
				this.status(status, message)
			})

			this.socket.on('error', function (err) {
				this.debug('Network error', err)
				this.status(this.STATE_ERROR, err)
				this.log('error', 'Network error: ' + err.message)
			})

			this.socket.on('connect', function () {
				this.status(this.STATE_OK)
				this.debug('Connected')
			})

			this.socket.on('data', function (data) {})
		}
	}

	// Return config fields for web config
	config_fields() {
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
			`,
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 6,
				regex: this.REGEX_IP,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Target Port',
				width: 2,
				default: 7000,
				regex: this.REGEX_PORT,
			},
			{
				type: 'dropdown',
				id: 'prot',
				label: 'Connect with TCP / UDP',
				default: 'tcp',
				choices: [
					{ id: 'tcp', label: 'TCP' },
					{ id: 'udp', label: 'UDP' },
				],
			},
		]
	}

	// When module gets deleted
	destroy() {
		if (this.socket !== undefined) {
			this.socket.destroy()
		}

		if (this.udp !== undefined) {
			this.udp.destroy()
		}

		this.debug('destroy', this.id)
	}

	CHOICES_END = [
		{ id: '', label: 'None' },
		{ id: '\n', label: 'LF - \\n (Common UNIX/Mac)' },
		{ id: '\r\n', label: 'CRLF - \\r\\n (Common Windows)' },
		{ id: '\r', label: 'CR - \\r (Old MacOS)' },
		{ id: '\x00', label: 'NULL - \\x00 (Can happen)' },
		{ id: '\n\r', label: 'LFCR - \\n\\r (Just stupid)' },
	]

	init_presets() {
		let presets = []
		this.setPresetDefinitions(presets)
	}

	actions(system) {
		this.system.emit('instance_actions', this.id, {
			send: {
				label: 'Send Command',
				options: [
					{
						type: 'textwithvariables',
						id: 'id_send',
						label: 'Command:',
						tooltip: 'Use %hh to insert Hex codes',
						default: '',
						width: 6,
					},
					{
						type: 'dropdown',
						id: 'id_end',
						label: 'Command End Character:',
						default: '\n',
						choices: this.CHOICES_END,
					},
				],
			},
		})
	}

	action(action) {
		let cmd
		let end

		switch (action.action) {
			case 'send':
				this.parseVariables(action.options.id_send, function(value) {
					cmd = unescape(value);
				})
				end = action.options.id_end
				break
		}

		/*
		 * create a binary buffer pre-encoded 'latin1' (8bit no change bytes)
		 * sending a string assumes 'utf8' encoding
		 * which then escapes character values over 0x7F
		 * and destroys the 'binary' content
		 */
		let sendBuf = Buffer.from(cmd + end, 'latin1')

		if (sendBuf != '') {
			if (this.config.prot == 'tcp') {
				this.debug('sending ', sendBuf, 'to', this.config.host)

				if (this.socket !== undefined && this.socket.connected) {
					this.socket.send(sendBuf)
				} else {
					this.debug('Socket not connected :(')
				}
			}

			if (this.config.prot == 'udp') {
				if (this.udp !== undefined) {
					this.debug('sending', sendBuf, 'to', this.config.host)

					this.udp.send(sendBuf)
				}
			}
		}
	}
}
exports = module.exports = instance

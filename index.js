import { InstanceBase, InstanceStatus, runEntrypoint, TCPHelper, UDPHelper } from '@companion-module/base'
import { ConfigFields } from './config.js'
import { getActionDefinitions } from './actions.js'

class GenericTcpUdpInstance extends InstanceBase {
	async init(config) {
		this.config = config

		this.setActionDefinitions(getActionDefinitions(this))

		await this.configUpdated(config)
	}

	async configUpdated(config) {
		if (this.udp) {
			this.udp.destroy()
			delete this.udp
		}

		if (this.socket) {
			this.socket.destroy()
			delete this.socket
		}

		this.config = config

		if (this.config.prot == 'tcp') {
			if (this.config.connect_on_send) {
				// On-demand mode - don't create persistent connection
				this.updateStatus(InstanceStatus.Ok, 'Ready (On-demand mode)')
				this.init_tcp_variables()
			} else {
				// Traditional persistent connection mode
				this.init_tcp()
				this.init_tcp_variables()
			}
		}

		if (this.config.prot == 'udp') {
			this.init_udp()

			this.setVariableDefinitions([])
		}
	}

	async destroy() {
		if (this.socket) {
			this.socket.destroy()
		} else if (this.udp) {
			this.udp.destroy()
		} else {
			this.updateStatus(InstanceStatus.Disconnected)
		}
	}

	// Return config fields for web config
	getConfigFields() {
		return ConfigFields
	}

	init_udp() {
		if (this.udp) {
			this.udp.destroy()
			delete this.udp
		}

		this.updateStatus(InstanceStatus.Connecting)

		if (this.config.host) {
			this.udp = new UDPHelper(this.config.host, this.config.port)
			this.updateStatus(InstanceStatus.Ok)

			this.udp.on('error', (err) => {
				this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
				this.log('error', 'Network error: ' + err.message)
			})

			// If we get data, thing should be good
			this.udp.on('listening', () => {
				this.updateStatus(InstanceStatus.Ok)
			})

			this.udp.on('status_change', (status, message) => {
				this.updateStatus(status, message)
			})
		} else {
			this.updateStatus(InstanceStatus.BadConfig)
		}
	}

	init_tcp() {
		if (this.socket) {
			this.socket.destroy()
			delete this.socket
		}

		this.updateStatus(InstanceStatus.Connecting)

		if (this.config.host) {
			this.socket = new TCPHelper(this.config.host, this.config.port)

			this.socket.on('status_change', (status, message) => {
				this.updateStatus(status, message)
			})

			this.socket.on('error', (err) => {
				this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
				this.log('error', 'Network error: ' + err.message)
			})

			this.socket.on('data', (data) => {
				if (this.config.saveresponse) {
					let dataResponse = data

					if (this.config.convertresponse == 'string') {
						dataResponse = data.toString()
					} else if (this.config.convertresponse == 'hex') {
						dataResponse = data.toString('hex')
					}

					this.setVariableValues({ tcp_response: dataResponse })
				}
			})
		} else {
			this.updateStatus(InstanceStatus.BadConfig)
		}
	}

	init_tcp_variables() {
		if (this.config.saveresponse) {
			this.setVariableDefinitions([{ name: 'Last TCP Response', variableId: 'tcp_response' }])
			this.setVariableValues({ tcp_response: '' })
		} else {
			this.setVariableDefinitions([])
		}
	}

	// Create a temporary TCP connection for on-demand sending
	async sendTcpOnDemand(data) {
		return new Promise((resolve, reject) => {
			if (!this.config.host) {
				reject(new Error('No host configured'))
				return
			}

			this.log('debug', 'Creating on-demand TCP connection to ' + this.config.host + ':' + this.config.port)
			
			const tempSocket = new TCPHelper(this.config.host, this.config.port)
			let responseData = null
			let connectionTimeout = null

			// Set timeout for connection
			connectionTimeout = setTimeout(() => {
				tempSocket.destroy()
				reject(new Error('Connection timeout'))
			}, 5000) // 5 second timeout

			tempSocket.on('status_change', (status, message) => {
				if (status === InstanceStatus.Ok) {
					// Connected successfully, send data
					clearTimeout(connectionTimeout)
					this.log('debug', 'On-demand connection established, sending data')
					tempSocket.send(data)
					
					// Close connection after a delay to allow response
					setTimeout(() => {
						tempSocket.destroy()
						resolve(responseData)
					}, 500) // 500ms delay for response
				} else if (status === InstanceStatus.ConnectionFailure) {
					clearTimeout(connectionTimeout)
					tempSocket.destroy()
					reject(new Error(message || 'Connection failed'))
				}
			})

			tempSocket.on('error', (err) => {
				clearTimeout(connectionTimeout)
				this.log('error', 'On-demand TCP error: ' + err.message)
				tempSocket.destroy()
				reject(err)
			})

			tempSocket.on('data', (data) => {
				if (this.config.saveresponse) {
					let dataResponse = data

					if (this.config.convertresponse == 'string') {
						dataResponse = data.toString()
					} else if (this.config.convertresponse == 'hex') {
						dataResponse = data.toString('hex')
					}

					this.setVariableValues({ tcp_response: dataResponse })
					responseData = dataResponse
				}
			})
		})
	}
}

runEntrypoint(GenericTcpUdpInstance, [])

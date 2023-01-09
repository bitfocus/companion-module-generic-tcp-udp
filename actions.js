const CHOICES_END = [
	{ id: '', label: 'None' },
	{ id: '\n', label: 'LF - \\n (Common UNIX/Mac)' },
	{ id: '\r\n', label: 'CRLF - \\r\\n (Common Windows)' },
	{ id: '\r', label: 'CR - \\r (Old MacOS)' },
	{ id: '\x00', label: 'NULL - \\x00 (Can happen)' },
	{ id: '\n\r', label: 'LFCR - \\n\\r (Just stupid)' },
]

export function getActionDefinitions(self) {
	return {
		send: {
			name: 'Send Command',
			options: [
				{
					type: 'textinput',
					id: 'id_send',
					label: 'Command:',
					tooltip: 'Use %hh to insert Hex codes',
					default: '',
					useVariables: true,
				},
				{
					type: 'dropdown',
					id: 'id_end',
					label: 'Command End Character:',
					default: '\n',
					choices: CHOICES_END,
				},
			],
			callback: async (action) => {
				const cmd = unescape(await self.parseVariablesInString(action.options.id_send))

				if (cmd != '') {
					/*
					 * create a binary buffer pre-encoded 'latin1' (8bit no change bytes)
					 * sending a string assumes 'utf8' encoding
					 * which then escapes character values over 0x7F
					 * and destroys the 'binary' content
					 */
					const sendBuf = Buffer.from(cmd + action.options.id_end, 'latin1')

					if (self.config.prot == 'tcp') {
						self.log('debug', 'sending to ' + self.config.host + ': ' + sendBuf.toString())

						if (self.socket !== undefined && self.socket.isConnected) {
							self.socket.send(sendBuf)
						} else {
							self.log('debug', 'Socket not connected :(')
						}
					}

					if (self.config.prot == 'udp') {
						if (self.udp !== undefined) {
							self.log('debug', 'sending to ' + self.config.host + ': ' + sendBuf.toString())

							self.udp.send(sendBuf)
						}
					}
				}
			},
		},
	}
}

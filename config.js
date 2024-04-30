import { Regex } from '@companion-module/base'

const REGEX_IP_OR_HOST =
	'/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]).)+([A-Za-z]|[A-Za-z][A-Za-z0-9-]*[A-Za-z0-9])$/gm'

  export const ConfigFields = [
	{
		type: 'static-text',
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
							<li>You shoudn't need re-program and send raw TCP commands</li>
							<li>If you have a product we don't support, please file a module request for it</li>
							<li>Do you think your product/device is too insignificant to make a module for, it's not.</li>
							<li>Properitary/inhouse products can also have their own modules.</li>
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
		label: 'Target Host name or IP',
		width: 8,
		regex: REGEX_IP_OR_HOST,
	},
	{
		type: 'textinput',
		id: 'port',
		label: 'Target Port',
		width: 4,
		default: 7000,
		regex: Regex.PORT,
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
	{
		type: 'checkbox',
		id: 'saveresponse',
		label: 'Save TCP Response',
		default: false,
		isVisible: (configValues) => configValues.prot === 'tcp',
	},
	{
		type: 'dropdown',
		id: 'convertresponse',
		label: 'Convert TCP Response Format',
		default: 'none',
		choices: [
			{ id: 'none', label: 'No conversion' },
			{ id: 'hex', label: 'To Hex' },
			{ id: 'string', label: 'To String' },
		],
		isVisible: (configValues) => configValues.prot === 'tcp' && !!configValues.saveresponse,
	},
]

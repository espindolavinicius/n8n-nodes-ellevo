import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ElevoApi implements ICredentialType {
	name = 'ellevoApi';
	displayName = 'Ellevo API';
	documentationUrl = 'https://github.com/espindolavinicius/n8n-nodes-ellevo';
	icon = 'file:ellevo.png' as const;

	properties: INodeProperties[] = [
		{
			displayName: 'Ellevo Server URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			placeholder: 'https://helpdesk.yourcompany.com',
			description: 'Base URL of your Ellevo instance (no trailing slash). Example: https://helpdesk.yourcompany.com',
			required: true,
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
		{
			displayName: 'Authentication Type',
			name: 'authType',
			type: 'options',
			options: [
				{
					name: 'Session Cookie (Default)',
					value: 'session',
					description: 'Authenticates via POST /api/mob/seguranca/autenticacao/ID and uses the session cookie',
				},
				{
					name: 'API Key (Authorization header)',
					value: 'apikey',
					description: 'Sends the key directly in the Authorization header',
				},
			],
			default: 'session',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			displayOptions: { show: { authType: ['apikey'] } },
			description: 'API key sent in the Authorization header',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ $credentials.baseUrl }}',
			url: '/api/VersaoSistema/VersaoSistema',
			method: 'GET',
		},
	};
}

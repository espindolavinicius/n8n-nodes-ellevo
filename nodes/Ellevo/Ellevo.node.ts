import {
	IExecuteFunctions, INodeExecutionData, INodeType,
	INodeTypeDescription, NodeOperationError,
	IDataObject, IHttpRequestMethods,
} from 'n8n-workflow';

const sessionCache: { [key: string]: { cookie: string; expiresAt: number } } = {};

export class Ellevo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Ellevo',
		name: 'ellevo',
		icon: 'file:ellevo.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["resource"] + ": " + $parameter["operation"] }}',
		description: 'Interact with Ellevo — Help Desk, Service Desk, CSC and ticket management (333 API endpoints)',
		defaults: { name: 'Ellevo' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'ellevoApi', required: true }],
		properties: [
			{
				displayName: 'Module',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Sistema / System', value: 'sistema', description: 'Version, license, health check' },
					{ name: 'Autenticação / Authentication', value: 'autenticacao', description: 'Login, session, token' },
					{ name: 'Chamado / Ticket', value: 'chamado', description: 'List, search, open, manage tickets' },
					{ name: 'Abertura de Chamado / Open Ticket', value: 'chamadoAbertura', description: 'Form data for ticket opening' },
					{ name: 'Trâmite / Ticket Update', value: 'tramite', description: 'Add updates to tickets' },
					{ name: 'Tarefa / Task', value: 'tarefa', description: 'Manage tasks' },
					{ name: 'Abertura de Tarefa / Open Task', value: 'tarefaAbertura', description: 'Form data for task opening' },
					{ name: 'Providência / Task Update', value: 'providencia', description: 'Add updates to tasks' },
					{ name: 'Aprovação / Approval', value: 'aprovacao', description: 'Approve or reject tickets and tasks' },
					{ name: 'Anexo / Attachment', value: 'anexo', description: 'Upload and download attachments' },
					{ name: 'Instrução / Message', value: 'instrucao', description: 'Internal messages' },
					{ name: 'Usuário / User', value: 'usuario', description: 'User management' },
					{ name: 'Conta / Account', value: 'conta', description: 'Accounts and clients' },
					{ name: 'Notificação / Notification', value: 'notificacao', description: 'Send push notifications' },
					{ name: 'Banco de Soluções / Knowledge Base', value: 'bancoSolucoes', description: 'Knowledge base' },
					{ name: 'Processos Automatizados / Automation', value: 'processos', description: 'Automated processes' },
					{ name: 'Segurança / Security', value: 'seguranca', description: 'User info, avatar, channel tokens' },
					{ name: 'Email', value: 'email', description: 'Send email' },
					{ name: 'Produtos / Products', value: 'produtos', description: 'Products, natures, processes' },
					{ name: 'Grupo / Group', value: 'grupo', description: 'Groups and service paths' },
					{ name: 'Formulário / Form', value: 'formulario', description: 'Forms linked to tickets/tasks' },
					{ name: 'Compromisso / Appointment', value: 'compromisso', description: 'Calendar and appointments' },
					{ name: 'URA / IVR', value: 'ura', description: 'IVR/telephony integration' },
					{ name: 'Visual Studio / Azure DevOps', value: 'visualstudio', description: 'VSTS/Azure DevOps integration' },
					{ name: 'Custom Request', value: 'custom', description: 'Call any Ellevo API endpoint directly' },
				],
				default: 'chamado',
			},
			// ── SISTEMA
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['sistema'] } },
			  options: [
			    { name: 'Get System Version', value: 'getVersao', action: 'Get system version' },
			    { name: 'Get Full Version', value: 'getVersaoGeral', action: 'Get full version info' },
			    { name: 'Get Site GUID', value: 'getSiteGuid', action: 'Get site GUID' },
			    { name: 'Verify Connectivity', value: 'verify', action: 'Verify connectivity' },
			    { name: 'Get General Settings', value: 'getConfig', action: 'Get general settings' },
			    { name: 'List Licensed Modules', value: 'getLicenca', action: 'List licensed modules' },
			  ], default: 'getVersao' },
			// ── AUTENTICAÇÃO
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['autenticacao'] } },
			  options: [
			    { name: 'Authenticate by ID', value: 'authById', action: 'Authenticate by user ID' },
			    { name: 'Authenticate by Username/Password', value: 'authByNome', action: 'Authenticate by username and password' },
			    { name: 'Check Authentication', value: 'checkAuth', action: 'Check if authenticated' },
			    { name: 'Get User Token', value: 'getToken', action: 'Get user token' },
			    { name: 'Verify Session', value: 'verificarSessao', action: 'Verify active session' },
			  ], default: 'authByNome' },
			// ── CHAMADO
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['chamado'] } },
			  options: [
			    { name: 'List Tickets', value: 'getAll', action: 'List tickets' },
			    { name: 'Get Ticket by ID', value: 'getById', action: 'Get ticket by ID' },
			    { name: 'Search Tickets (advanced)', value: 'buscar', action: 'Search tickets with filters' },
			    { name: 'Open Ticket', value: 'post', action: 'Open new ticket' },
			    { name: 'Reopen Ticket', value: 'reabrir', action: 'Reopen closed ticket' },
			    { name: 'Change Priority', value: 'alterarPrioridade', action: 'Change ticket priority' },
			    { name: 'Change Stage', value: 'alterarEstagio', action: 'Change ticket stage' },
			    { name: 'List Unread', value: 'naoLidos', action: 'List unread tickets' },
			    { name: 'List In Approval', value: 'emAprovacao', action: 'List tickets in approval' },
			    { name: 'Total In Approval', value: 'totalAprovacao', action: 'Total tickets in approval' },
			    { name: 'By Responsible', value: 'porResponsavel', action: 'List tickets by responsible' },
			    { name: 'Without Update', value: 'semTramite', action: 'List tickets without update' },
			    { name: 'Total Count', value: 'total', action: 'Get total ticket count' },
			    { name: 'All In Approval (Global)', value: 'todosEmAprovacao', action: 'All tickets in approval globally' },
			    { name: 'Last by CPF', value: 'ultimosPorCpf', action: 'Last tickets by user CPF' },
			    { name: 'Mark as Read', value: 'marcarLido', action: 'Mark ticket as read' },
			  ], default: 'getAll' },
			// ── CHAMADO ABERTURA
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['chamadoAbertura'] } },
			  options: [
			    { name: 'Next Ticket Number', value: 'proximoNumero', action: 'Get next ticket number' },
			    { name: 'List Clients', value: 'buscarClientes', action: 'List clients' },
			    { name: 'List Requesters', value: 'buscarSolicitantes', action: 'List requesters' },
			    { name: 'List Paths', value: 'buscarCaminhos', action: 'List service paths' },
			    { name: 'List Natures', value: 'buscarNaturezas', action: 'List natures' },
			    { name: 'List Severities', value: 'buscarSeveridades', action: 'List severities' },
			    { name: 'List Responsible', value: 'buscarResponsaveis', action: 'List responsible users' },
			    { name: 'Default Responsible', value: 'responsavelPadrao', action: 'Get default responsible' },
			    { name: 'Origin Versions', value: 'versoesOrigem', action: 'Get origin versions' },
			    { name: 'Release Versions', value: 'versoesLiberacao', action: 'Get release versions' },
			    { name: 'Register Ticket', value: 'registrar', action: 'Register new ticket' },
			    { name: 'Register Ticket with Form', value: 'registrarForm', action: 'Register ticket with form data' },
			  ], default: 'buscarClientes' },
			// ── TRAMITE
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['tramite'] } },
			  options: [
			    { name: 'Get Update', value: 'get', action: 'Get ticket update' },
			    { name: 'List Status Options', value: 'listarStatus', action: 'List available status' },
			    { name: 'List Reasons', value: 'listarMotivos', action: 'List reasons' },
			    { name: 'List Activities', value: 'listarAtividades', action: 'List activities' },
			    { name: 'Add Update', value: 'post', action: 'Add update to ticket' },
			  ], default: 'post' },
			// ── TAREFA
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['tarefa'] } },
			  options: [
			    { name: 'List Tasks', value: 'getAll', action: 'List tasks' },
			    { name: 'Get Task by ID', value: 'getById', action: 'Get task by ID' },
			    { name: 'Unread Tasks', value: 'naoLidas', action: 'List unread tasks' },
			    { name: 'Tasks In Approval', value: 'emAprovacao', action: 'Tasks in approval' },
			    { name: 'Total In Approval', value: 'totalAprovacao', action: 'Total tasks in approval' },
			    { name: 'Without Update', value: 'semProvidencia', action: 'Tasks without update' },
			    { name: 'Total Count', value: 'total', action: 'Get total task count' },
			    { name: 'All In Approval (Global)', value: 'todasAprovacao', action: 'All tasks in approval globally' },
			    { name: 'Open Task', value: 'post', action: 'Open new task' },
			    { name: 'Update Responsible', value: 'alterarResponsavel', action: 'Update task responsible' },
			  ], default: 'getAll' },
			// ── TAREFA ABERTURA
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['tarefaAbertura'] } },
			  options: [
			    { name: 'Next Task Number', value: 'proximoNumero', action: 'Get next task number' },
			    { name: 'List Paths', value: 'buscarCaminhos', action: 'List paths' },
			    { name: 'List Clients', value: 'buscarClientes', action: 'List clients' },
			    { name: 'List Natures', value: 'buscarNaturezas', action: 'List natures' },
			    { name: 'Default Nature', value: 'naturezaPadrao', action: 'Get default nature' },
			    { name: 'List Priorities', value: 'buscarPrioridades', action: 'List priorities' },
			    { name: 'List Locations', value: 'buscarLocalizacoes', action: 'List locations' },
			    { name: 'List Responsible', value: 'buscarResponsaveis', action: 'List responsible users' },
			    { name: 'Default Responsible', value: 'responsavelPadrao', action: 'Get default responsible' },
			    { name: 'Register Task', value: 'registrar', action: 'Register new task' },
			  ], default: 'registrar' },
			// ── PROVIDENCIA
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['providencia'] } },
			  options: [
			    { name: 'Get Update', value: 'get', action: 'Get task update' },
			    { name: 'List Status Options', value: 'listarStatus', action: 'List available status' },
			    { name: 'List Reasons', value: 'listarMotivos', action: 'List reasons' },
			    { name: 'List Activities', value: 'listarAtividades', action: 'List activities' },
			    { name: 'Add Update', value: 'post', action: 'Add update to task' },
			  ], default: 'post' },
			// ── APROVACAO
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['aprovacao'] } },
			  options: [
			    { name: 'Approve / Reject Ticket', value: 'aprovaChamado', action: 'Approve or reject ticket' },
			    { name: 'Approve / Reject Task', value: 'aprovaTarefa', action: 'Approve or reject task' },
			    { name: 'Ticket Rejection Reasons', value: 'motivosChamado', action: 'List ticket rejection reasons' },
			    { name: 'Task Rejection Reasons', value: 'motivosTarefa', action: 'List task rejection reasons' },
			    { name: 'Requires Reason — Ticket', value: 'obrigaMotivoChamado', action: 'Check if reason required for ticket' },
			    { name: 'Requires Reason — Task', value: 'obrigaMotivoTarefa', action: 'Check if reason required for task' },
			    { name: 'Approval Process Data — Ticket', value: 'dadosAprovacaoChamado', action: 'Get ticket approval process data' },
			    { name: 'Approval Process Data — Task', value: 'dadosAprovacaoTarefa', action: 'Get task approval process data' },
			  ], default: 'aprovaChamado' },
			// ── ANEXO
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['anexo'] } },
			  options: [
			    { name: 'List Ticket Attachments', value: 'listaChamado', action: 'List ticket attachments' },
			    { name: 'Upload to Ticket', value: 'uploadChamado', action: 'Upload attachment to ticket' },
			    { name: 'List Task Attachments', value: 'listaTarefa', action: 'List task attachments' },
			    { name: 'Upload to Task', value: 'uploadTarefa', action: 'Upload attachment to task' },
			    { name: 'List Message Attachments', value: 'listaInstrucao', action: 'List message attachments' },
			    { name: 'Upload to Message', value: 'uploadInstrucao', action: 'Upload attachment to message' },
			    { name: 'Download Attachment', value: 'download', action: 'Download attachment' },
			    { name: 'Get Attachment Metadata', value: 'metadados', action: 'Get attachment metadata' },
			  ], default: 'listaChamado' },
			// ── INSTRUCAO
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['instrucao'] } },
			  options: [
			    { name: 'List Messages', value: 'getAll', action: 'List messages' },
			    { name: 'Unread Messages', value: 'naoLidas', action: 'List unread messages' },
			    { name: 'Get Message by ID', value: 'getById', action: 'Get message by ID' },
			    { name: 'Sent Messages', value: 'enviadas', action: 'List sent messages' },
			    { name: 'Priority Messages', value: 'prioritarias', action: 'List priority messages' },
			    { name: 'Overdue Messages', value: 'vencidas', action: 'List overdue messages' },
			    { name: 'Send Message', value: 'post', action: 'Send new message' },
			    { name: 'Total Notifications', value: 'totalNotif', action: 'Get total notification count' },
			    { name: 'Dismiss Notification', value: 'desmarcarNotif', action: 'Dismiss notification' },
			  ], default: 'getAll' },
			// ── USUARIO
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['usuario'] } },
			  options: [
			    { name: 'Get Current User', value: 'getDados', action: 'Get current user data' },
			    { name: 'Get by ID', value: 'getById', action: 'Get user by ID' },
			    { name: 'Get by Email', value: 'getByEmail', action: 'Get user by email' },
			    { name: 'Get Client by CPF', value: 'getByCpf', action: 'Get client by CPF' },
			    { name: 'Get Client by CNPJ', value: 'getByCnpj', action: 'Get client by CNPJ' },
			    { name: 'Register Client', value: 'cadastrarCliente', action: 'Register new client' },
			    { name: 'Linked Products', value: 'produtosVinculados', action: 'Get linked products' },
			    { name: 'Change Profile', value: 'alterarPerfil', action: 'Change user profile' },
			    { name: 'Get Avatar', value: 'getAvatar', action: 'Get user avatar' },
			    { name: 'Link Product/Process', value: 'vincularProduto', action: 'Link product or process to user' },
			  ], default: 'getDados' },
			// ── CONTA
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['conta'] } },
			  options: [
			    { name: 'List Accounts', value: 'getAll', action: 'List all accounts' },
			    { name: 'Get Account', value: 'get', action: 'Get account by ID' },
			    { name: 'Create Account', value: 'post', action: 'Create account' },
			    { name: 'Update Account', value: 'put', action: 'Update account' },
			    { name: 'List Prospects', value: 'getProspect', action: 'List prospects' },
			    { name: 'List Clients', value: 'getCliente', action: 'List clients' },
			  ], default: 'getAll' },
			// ── NOTIFICACAO
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['notificacao'] } },
			  options: [{ name: 'Send Push Notification', value: 'enviar', action: 'Send push notification' }],
			  default: 'enviar' },
			// ── BANCO SOLUCOES
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['bancoSolucoes'] } },
			  options: [
			    { name: 'Get Solution by ID', value: 'getSolucao', action: 'Get solution by ID' },
			    { name: 'Get All Solution IDs', value: 'getTodosIds', action: 'Get all solution IDs' },
			    { name: 'List Solutions', value: 'listar', action: 'List solutions' },
			    { name: 'Get Solution Attachments', value: 'getAnexos', action: 'Get solution attachments' },
			  ], default: 'listar' },
			// ── PROCESSOS
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['processos'] } },
			  options: [
			    { name: 'List Processes', value: 'listar', action: 'List automated processes' },
			    { name: 'Get Process', value: 'get', action: 'Get process by ID' },
			    { name: 'Create Process', value: 'inserir', action: 'Create process' },
			    { name: 'Update Process', value: 'alterar', action: 'Update process' },
			    { name: 'Delete Process', value: 'apagar', action: 'Delete process' },
			    { name: 'Process Count', value: 'quantidade', action: 'Get process count' },
			    { name: 'Last Executed', value: 'ultimosExec', action: 'Get last executed processes' },
			    { name: 'Execution Log', value: 'log', action: 'Get execution log' },
			    { name: 'List Schedules', value: 'agendas', action: 'List schedules' },
			    { name: 'Create Schedule', value: 'inserirAgenda', action: 'Create schedule' },
			    { name: 'List Families', value: 'familias', action: 'List process families' },
			    { name: 'System Parameters', value: 'parametros', action: 'Get system parameters' },
			  ], default: 'listar' },
			// ── SEGURANCA
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['seguranca'] } },
			  options: [
			    { name: 'User Info', value: 'infoUser', action: 'Get logged user info' },
			    { name: 'Attendant Info', value: 'infoAtendente', action: 'Get attendant info' },
			    { name: 'Get Avatar', value: 'avatar', action: 'Get user avatar' },
			    { name: 'Logout', value: 'logout', action: 'End session' },
			    { name: 'Telegram Token', value: 'tokenTelegram', action: 'Get Telegram integration token' },
			    { name: 'WhatsApp Token', value: 'tokenWhatsapp', action: 'Get WhatsApp integration token' },
			  ], default: 'infoUser' },
			// ── EMAIL
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['email'] } },
			  options: [{ name: 'Send Simple Email', value: 'envioSimples', action: 'Send simple email' }],
			  default: 'envioSimples' },
			// ── PRODUTOS
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['produtos'] } },
			  options: [
			    { name: 'List Products', value: 'getProdutos', action: 'List products' },
			    { name: 'Get Product Name', value: 'getNome', action: 'Get product name' },
			    { name: 'Products by User', value: 'getPorUsuario', action: 'Get products linked to user' },
			    { name: 'List Natures', value: 'getNaturezas', action: 'List natures' },
			    { name: 'Process by User', value: 'getProcesso', action: 'Get processes by user' },
			  ], default: 'getProdutos' },
			// ── GRUPO
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['grupo'] } },
			  options: [
			    { name: 'List Groups', value: 'get', action: 'List groups' },
			    { name: 'Get Child Groups', value: 'filhos', action: 'Get child groups' },
			    { name: 'List Paths', value: 'caminhos', action: 'List service paths' },
			  ], default: 'get' },
			// ── FORMULARIO
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['formulario'] } },
			  options: [
			    { name: 'Ticket Forms', value: 'getChamado', action: 'Get ticket forms' },
			    { name: 'Ticket Form Fields', value: 'camposChamado', action: 'Get ticket form fields' },
			    { name: 'Task Forms', value: 'getTarefa', action: 'Get task forms' },
			    { name: 'Task Form Fields', value: 'camposTarefa', action: 'Get task form fields' },
			    { name: 'Add Form', value: 'incluir', action: 'Add form to ticket or task' },
			  ], default: 'getChamado' },
			// ── COMPROMISSO
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['compromisso'] } },
			  options: [
			    { name: 'List Appointments', value: 'get', action: 'List appointments' },
			    { name: 'Involved Users', value: 'usuariosEnvolvidos', action: 'Get users involved in appointment' },
			  ], default: 'get' },
			// ── URA
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['ura'] } },
			  options: [
			    { name: 'Verify Client', value: 'verificaCliente', action: 'Verify client by phone' },
			    { name: 'Verify Request', value: 'verificaSolicitacao', action: 'Verify active request' },
			    { name: 'Get Responsible Data', value: 'dadosTelefone', action: 'Get responsible data by phone' },
			  ], default: 'verificaCliente' },
			// ── VISUAL STUDIO
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['visualstudio'] } },
			  options: [
			    { name: 'List Integrations', value: 'getAll', action: 'List all VSTS integrations' },
			    { name: 'Get by ID', value: 'getById', action: 'Get integration by ID' },
			    { name: 'Get by Product/Nature', value: 'getByProduto', action: 'Get by product and nature' },
			    { name: 'Create Integration', value: 'inserir', action: 'Create VSTS integration' },
			    { name: 'Update Integration', value: 'alterar', action: 'Update VSTS integration' },
			    { name: 'Delete Integration', value: 'excluir', action: 'Delete VSTS integration' },
			    { name: 'Receive WebHook', value: 'webhook', action: 'Receive VSTS webhook' },
			  ], default: 'getAll' },
			// ── CUSTOM
			{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
			  displayOptions: { show: { resource: ['custom'] } },
			  options: [
			    { name: 'GET', value: 'GET', action: 'GET request' },
			    { name: 'POST', value: 'POST', action: 'POST request' },
			    { name: 'PUT', value: 'PUT', action: 'PUT request' },
			    { name: 'DELETE', value: 'DELETE', action: 'DELETE request' },
			    { name: 'PATCH', value: 'PATCH', action: 'PATCH request' },
			  ], default: 'GET' },

			// ── COMMON PARAMETERS ──────────────────────────────────
			{ displayName: 'Ticket ID', name: 'chamadoId', type: 'string', default: '',
			  description: 'Ticket ID or number',
			  displayOptions: { show: { resource: ['chamado','tramite','anexo','aprovacao','formulario'],
			    operation: ['getById','buscar','reabrir','alterarPrioridade','alterarEstagio','marcarLido',
			      'listaChamado','uploadChamado','get','aprovaChamado','motivosChamado','obrigaMotivoChamado',
			      'dadosAprovacaoChamado','listarMotivos','listarAtividades','getChamado','camposChamado'] } } },
			{ displayName: 'Update ID (Trâmite)', name: 'tramiteId', type: 'string', default: '',
			  displayOptions: { show: { resource: ['tramite','anexo'], operation: ['get','listaChamado','uploadChamado'] } } },
			{ displayName: 'Task ID', name: 'tarefaId', type: 'string', default: '',
			  displayOptions: { show: { resource: ['tarefa','providencia','anexo','aprovacao','formulario'],
			    operation: ['getById','listaTarefa','uploadTarefa','get','aprovaTarefa','motivosTarefa',
			      'obrigaMotivoTarefa','dadosAprovacaoTarefa','listarMotivos','listarAtividades','getTarefa','camposTarefa'] } } },
			{ displayName: 'Approve? (true = approve, false = reject)', name: 'aprova', type: 'boolean', default: true,
			  displayOptions: { show: { resource: ['aprovacao'], operation: ['aprovaChamado','aprovaTarefa'] } } },
			{ displayName: 'Reason ID', name: 'motivoId', type: 'string', default: '0',
			  description: 'Rejection reason ID (0 if not applicable)',
			  displayOptions: { show: { resource: ['aprovacao'], operation: ['aprovaChamado','aprovaTarefa'] } } },
			{ displayName: 'User ID', name: 'usuarioId', type: 'string', default: '',
			  displayOptions: { show: { resource: ['usuario','seguranca'], operation: ['getById','alterarPerfil','getAvatar','avatar'] } } },
			{ displayName: 'Search Term', name: 'pesquisa', type: 'string', default: '',
			  displayOptions: { show: { resource: ['chamadoAbertura','tarefaAbertura'],
			    operation: ['buscarClientes','buscarSolicitantes','buscarCaminhos','buscarResponsaveis','buscarNaturezas'] } } },
			{ displayName: 'Client ID', name: 'clienteId', type: 'string', default: '',
			  displayOptions: { show: { resource: ['chamadoAbertura'],
			    operation: ['buscarSolicitantes','buscarCaminhos','buscarNaturezas','buscarSeveridades','buscarResponsaveis','responsavelPadrao'] } } },
			{ displayName: 'Path ID (Caminho)', name: 'caminhoId', type: 'string', default: '',
			  displayOptions: { show: { resource: ['chamadoAbertura','tarefaAbertura'],
			    operation: ['buscarNaturezas','buscarSeveridades','buscarResponsaveis','responsavelPadrao','versoesOrigem','versoesLiberacao'] } } },
			{ displayName: 'Requester ID', name: 'solicitanteId', type: 'string', default: '',
			  displayOptions: { show: { resource: ['chamadoAbertura'], operation: ['buscarNaturezas'] } } },
			{ displayName: 'Nature ID', name: 'naturezaId', type: 'string', default: '',
			  displayOptions: { show: { resource: ['chamadoAbertura'], operation: ['buscarSeveridades'] } } },
			{ displayName: 'Request Body (JSON)', name: 'body', type: 'json', default: '{}',
			  description: 'JSON payload. Required fields vary by endpoint.',
			  displayOptions: { show: { operation: ['post','put','registrar','registrarForm','inserir','alterar',
			    'envioSimples','enviar','uploadChamado','uploadTarefa','uploadInstrucao','incluir','vincularProduto',
			    'cadastrarCliente','buscar','ultimosPorCpf','inserirAgenda','webhook','authById','authByNome'] } } },
			{ displayName: 'API Path', name: 'customPath', type: 'string', default: '',
			  placeholder: '/api/chamado', required: true,
			  description: 'Full endpoint path. Example: /api/chamado/{id}/Prioridade/2',
			  displayOptions: { show: { resource: ['custom'] } } },
			{ displayName: 'Body JSON (POST/PUT/PATCH)', name: 'customBody', type: 'json', default: '{}',
			  displayOptions: { show: { resource: ['custom'], operation: ['POST','PUT','PATCH'] } } },
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('ellevoApi');
		const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
		const username = credentials.username as string;
		const password = credentials.password as string;
		const authType = (credentials.authType as string) || 'session';
		const apiKey = credentials.apiKey as string;

		const getAuthHeaders = async (): Promise<Record<string, string>> => {
			if (authType === 'apikey' && apiKey) return { Authorization: apiKey };
			const ck = `${baseUrl}::${username}`;
			const ca = sessionCache[ck];
			if (ca && ca.expiresAt > Date.now()) return { Cookie: ca.cookie };
			const resp = await this.helpers.request({
				method: 'POST', url: `${baseUrl}/api/mob/seguranca/autenticacao/ID`,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ login: username, senha: password }),
				json: false, resolveWithFullResponse: true,
			} as any);
			const cookies = (resp as any).headers?.['set-cookie'];
			const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : (cookies || '');
			sessionCache[ck] = { cookie: cookieStr, expiresAt: Date.now() + 3_600_000 };
			return { Cookie: cookieStr };
		};

		const req = async (method: IHttpRequestMethods, path: string, body?: IDataObject, qs?: IDataObject) => {
			const ah = await getAuthHeaders();
			const raw = await this.helpers.request({
				method, url: `${baseUrl}${path}`,
				headers: { 'Content-Type': 'application/json', ...ah },
				qs, body: body ? JSON.stringify(body) : undefined, json: false,
			});
			try { return JSON.parse(raw as string); } catch { return raw; }
		};

		for (let i = 0; i < items.length; i++) {
			try {
				const rs  = this.getNodeParameter('resource', i) as string;
				const op  = this.getNodeParameter('operation', i) as string;
				const p   = (n: string, d: unknown = '') => this.getNodeParameter(n, i, d);
				const bp  = () => JSON.parse(p('body', '{}') as string) as IDataObject;
				let result: IDataObject | IDataObject[];

				if (rs === 'sistema') {
					const m: Record<string,string> = { getVersao:'/api/VersaoSistema/VersaoSistema', getVersaoGeral:'/api/VersaoSistema/VersaoSistemaGeral', getSiteGuid:'/api/VersaoSistema/SiteGUID', verify:'/api/VersaoSistema/Verify', getConfig:'/api/Configuracoes/ParametrosGeraisDoSistema', getLicenca:'/api/Licenca/ModulosLicenciados' };
					result = await req('GET', m[op]||'/api/VersaoSistema/VersaoSistema');
				} else if (rs === 'autenticacao') {
					if (['authById','authByNome'].includes(op)) result = await req('POST', op==='authById'?'/api/mob/seguranca/autenticacao/ID':'/api/mob/seguranca/autenticacao/Nome', bp());
					else if (op==='checkAuth') result = await req('POST', '/api/mob/seguranca/autenticacao/Autenticado', {});
					else if (op==='getToken') result = await req('GET', '/api/Usuario/token');
					else result = await req('GET', '/api/Usuario/Sessao/Verificar');
				} else if (rs === 'chamado') {
					const cid=p('chamadoId');
					const m: Record<string,string> = { getAll:'/api/chamado', naoLidos:'/api/chamado/NaoLidos', emAprovacao:'/api/chamado/EmAprovacao', totalAprovacao:'/api/chamado/TotalEmAprovacao', porResponsavel:'/api/chamado/ChamadosPorResponsavel', semTramite:'/api/chamado/Novo', total:'/api/chamado/total', todosEmAprovacao:'/api/chamado/TodosEmAprovacao' };
					if (m[op]) result = await req('GET', m[op]);
					else if (op==='getById') result = await req('GET', `/api/chamado/${cid}`);
					else if (op==='buscar') result = await req('POST', `/api/chamado/${cid}`, bp());
					else if (op==='post') result = await req('POST', '/api/ChamadoAbertura/RegistrarChamado', bp());
					else if (op==='reabrir') result = await req('PUT', `/api/chamado/Reabrir/${cid}`);
					else if (op==='alterarPrioridade') result = await req('POST', `/api/chamado/${cid}/Prioridade/${p('prioridadeId',1)}`);
					else if (op==='alterarEstagio') result = await req('POST', `/api/chamado/${cid}/Estagio/${p('estagioId',1)}`);
					else if (op==='marcarLido') result = await req('POST', `/api/chamado/${cid}/Lido/true`);
					else result = await req('POST', '/api/chamado/UltimosChamadosPorCpfUsuario', bp());
				} else if (rs === 'chamadoAbertura') {
					const ci=p('caminhoId'),cl=p('clienteId'),pe=p('pesquisa','*') as string,so=p('solicitanteId'),na=p('naturezaId');
					const m: Record<string,string> = { proximoNumero:'/api/ChamadoAbertura/BuscarNumeroNovoChamado', buscarClientes:`/api/ChamadoAbertura/BuscarClientes/1/1/false/${pe}`, buscarSolicitantes:`/api/ChamadoAbertura/BuscarSolicitantes/1/false/${cl}/${pe}`, buscarCaminhos:`/api/ChamadoAbertura/BuscarCaminhos/${cl}/${pe}`, buscarNaturezas:`/api/ChamadoAbertura/BuscarNaturezas/${so}/${ci}/${pe}`, buscarSeveridades:`/api/ChamadoAbertura/BuscarSeveridades/${ci}/${na}/${cl}/false`, buscarResponsaveis:`/api/ChamadoAbertura/BuscarResponsaveis/${ci}/${cl}`, responsavelPadrao:`/api/ChamadoAbertura/BuscarResponsavelPadrao/${ci}/${cl}`, versoesOrigem:`/api/ChamadoAbertura/BuscarVersoesOrigem/${ci}/${cl}/${pe}`, versoesLiberacao:`/api/ChamadoAbertura/BuscarVersoesLiberacao/${ci}/${cl}/${pe}` };
					if (m[op]) result = await req('GET', m[op]);
					else if (op==='registrar') result = await req('POST', '/api/ChamadoAbertura/RegistrarChamado', bp());
					else result = await req('POST', '/api/ChamadoAbertura/RegistrarChamadoComFormulario', bp());
				} else if (rs === 'tramite') {
					const cid=p('chamadoId'),tid=p('tramiteId',0);
					if (op==='get') result = await req('GET', `/api/mob/tramite/chamado/${cid}/tramite/${tid}`);
					else if (op==='listarStatus') result = await req('GET', '/api/mob/tramite/BuscarListaStatus');
					else if (op==='listarMotivos') result = await req('GET', `/api/mob/tramite/BuscarMotivos/${cid}/*`);
					else if (op==='listarAtividades') result = await req('GET', `/api/mob/tramite/BuscarAtividades/${cid}`);
					else result = await req('POST', '/api/mob/tramite', bp());
				} else if (rs === 'tarefa') {
					const tid=p('tarefaId');
					const m: Record<string,string> = { getAll:'/api/mob/TarefaMob', naoLidas:'/api/mob/TarefaMob/NaoLidas', emAprovacao:'/api/mob/TarefaMob/EmAprovacao', totalAprovacao:'/api/mob/TarefaMob/TotalEmAprovacao', semProvidencia:'/api/mob/TarefaMob/Novo', total:'/api/mob/TarefaMob/total', todasAprovacao:'/api/tarefa/TodasEmAprovacao' };
					if (m[op]) result = await req('GET', m[op]);
					else if (op==='getById') result = await req('GET', `/api/tarefa/${tid}`);
					else if (op==='post') result = await req('POST', '/api/mob/TarefaAbertura/RegistrarTarefa', bp());
					else result = await req('PUT', '/api/mob/TarefaMob/AtualizarResponsavel', bp());
				} else if (rs === 'tarefaAbertura') {
					const ci=p('caminhoId'),cl=p('clienteId'),pe=p('pesquisa','*') as string;
					const m: Record<string,string> = { proximoNumero:'/api/mob/TarefaAbertura/BuscarNumeroNovaTarefa', buscarCaminhos:`/api/mob/TarefaAbertura/BuscarCaminhos/${pe}`, buscarClientes:`/api/mob/TarefaAbertura/BuscarClientes/0/1/${pe}`, buscarNaturezas:`/api/mob/TarefaAbertura/BuscarNaturezas/0/${ci}`, naturezaPadrao:`/api/mob/TarefaAbertura/BuscarNaturezaPadrao/0/${ci}`, buscarPrioridades:'/api/mob/TarefaAbertura/BuscarPrioridades', buscarLocalizacoes:`/api/mob/TarefaAbertura/BuscarLocalizacoes/0/${ci}`, buscarResponsaveis:`/api/mob/TarefaAbertura/BuscarResponsaveis/${ci}/${cl}`, responsavelPadrao:`/api/mob/TarefaAbertura/BuscarResponsavelPadrao/${ci}/${cl}` };
					if (m[op]) result = await req('GET', m[op]);
					else result = await req('POST', '/api/mob/TarefaAbertura/RegistrarTarefa', bp());
				} else if (rs === 'providencia') {
					const tid=p('tarefaId');
					if (op==='get') result = await req('GET', `/api/mob/providencia/tarefa/${tid}/providencia/${p('providenciaId',0)}`);
					else if (op==='listarStatus') result = await req('GET', '/api/mob/providencia/BuscarListaStatus');
					else if (op==='listarMotivos') result = await req('GET', `/api/mob/providencia/BuscarMotivos/${tid}/*`);
					else if (op==='listarAtividades') result = await req('GET', `/api/mob/providencia/BuscarAtividades/${tid}`);
					else result = await req('POST', '/api/mob/providencia', bp());
				} else if (rs === 'aprovacao') {
					const cid=p('chamadoId'),tid=p('tarefaId'),mot=p('motivoId',0),apr=p('aprova',true);
					if (op==='aprovaChamado') result = await req('POST', `/api/mob/aprovacao/Chamado/${cid}/${mot}/${apr}`);
					else if (op==='aprovaTarefa') result = await req('POST', `/api/mob/aprovacao/Tarefa/${tid}/${mot}/${apr}`);
					else if (op==='motivosChamado') result = await req('GET', `/api/mob/aprovacao/Motivos/Chamado/${cid}`);
					else if (op==='motivosTarefa') result = await req('GET', `/api/mob/aprovacao/Motivos/Tarefa/${tid}`);
					else if (op==='obrigaMotivoChamado') result = await req('GET', `/api/mob/aprovacao/VerificaSeObrigaMotivoRejeicaoChamado/${cid}`);
					else if (op==='obrigaMotivoTarefa') result = await req('GET', `/api/mob/aprovacao/VerificaSeObrigaMotivoRejeicaoTarefa/${tid}`);
					else if (op==='dadosAprovacaoChamado') result = await req('GET', `/api/AprovacaoWeb/DadosProcessoDeAprovacaoChamado/${cid}`);
					else result = await req('GET', `/api/AprovacaoWeb/DadosProcessoDeAprovacaoTarefa/${tid}`);
				} else if (rs === 'anexo') {
					const cid=p('chamadoId'),tid2=p('tramiteId',0),tar=p('tarefaId'),pid=p('providenciaId',0),eid=p('instrucaoId',0),aid=p('anexoId',0);
					if (op==='listaChamado') result = await req('GET', `/api/anexo/chamado/${cid}/${tid2}`);
					else if (op==='uploadChamado') result = await req('POST', `/api/anexo/chamado/${cid}/${tid2}`, bp());
					else if (op==='listaTarefa') result = await req('GET', `/api/anexo/tarefa/${tar}/${pid}`);
					else if (op==='uploadTarefa') result = await req('POST', `/api/anexo/tarefa/${tar}/${pid}`, bp());
					else if (op==='listaInstrucao') result = await req('GET', `/api/anexo/instrucao/${eid}`);
					else if (op==='uploadInstrucao') result = await req('POST', `/api/anexo/instrucao/${eid}`, bp());
					else if (op==='download') result = await req('GET', `/api/anexo/${aid}`);
					else result = await req('GET', '/api/anexo/metadados');
				} else if (rs === 'instrucao') {
					const eid=p('instrucaoId','');
					const m: Record<string,string> = { getAll:'/api/mob/InstrucaoMob', naoLidas:'/api/mob/InstrucaoMob/NaoLidas', getById:`/api/mob/InstrucaoMob/Instrucao/${eid}`, enviadas:'/api/Instrucao/Enviadas', prioritarias:'/api/Instrucao/Prioritarias', vencidas:'/api/Instrucao/Vencidas', naoVencidas:'/api/Instrucao/NaoVencidas', totalNotif:'/api/Instrucao/TotalInstrucoesNotificacao' };
					if (m[op]) result = await req('GET', m[op]);
					else if (op==='post') result = await req('POST', '/api/mob/InstrucaoMob', bp());
					else result = await req('PUT', `/api/Instrucao/DesmarcarNotificacaoInstrucao/${eid}`);
				} else if (rs === 'usuario') {
					const uid=p('usuarioId');
					if (op==='getDados') result = await req('GET', '/api/Usuario');
					else if (op==='getById') result = await req('GET', `/api/Usuario/${uid}`);
					else if (op==='getByEmail') result = await req('GET', `/api/Usuario/Cadastro/BuscarUsuarioPorEmail/${p('email','')}`);
					else if (op==='getByCpf') result = await req('GET', `/api/Usuario/Cadastro/Cliente/BuscarPorCpf/${p('cpf','')}`);
					else if (op==='getByCnpj') result = await req('GET', `/api/Usuario/Cadastro/Cliente/BuscarClientePorCnpj/${p('cnpj','')}`);
					else if (op==='cadastrarCliente') result = await req('POST', '/api/Usuario/Cadastro/Cliente/inserir', bp());
					else if (op==='produtosVinculados') result = await req('GET', '/api/Usuario/produtos');
					else if (op==='alterarPerfil') result = await req('GET', `/api/Usuario/AlterarPerfil/${uid}/${p('perfilId',1)}`);
					else if (op==='getAvatar') result = await req('GET', `/api/Usuario/${uid}/imagem`);
					else result = await req('POST', '/api/Usuario/Cadastro/Cliente/VincularProdutoProcessoModulo', bp());
				} else if (rs === 'conta') {
					const cid=p('contaId','');
					const m: Record<string,[string,string]> = { getAll:['GET','/api/Conta'], get:['GET',`/api/Conta/${cid}`], getProspect:['GET','/api/Conta/Prospect'], getCliente:['GET','/api/Conta/Cliente'] };
					if (m[op]) result = await req(m[op][0] as IHttpRequestMethods, m[op][1]);
					else if (op==='post') result = await req('POST', '/api/Conta', bp());
					else result = await req('PUT', '/api/Conta', bp());
				} else if (rs === 'notificacao') {
					result = await req('POST', '/api/mob/notificacao/EnviarNotificacao', bp());
				} else if (rs === 'bancoSolucoes') {
					if (op==='getSolucao') result = await req('GET', `/api/BancoSolucoes/${p('solucaoId','')}`);
					else if (op==='getTodosIds') result = await req('GET', '/api/BancoSolucoesChatbot/Solucoes/Ids');
					else if (op==='getAnexos') result = await req('GET', '/api/BancoSolucoesChatbot/Solucoes/Anexos');
					else result = await req('GET', '/api/BancoSolucoesChatbot/Solucoes');
				} else if (rs === 'processos') {
					const pid=p('processoId','');
					const m: Record<string,[string,string]> = { listar:['GET','/api/ProcessosAutomatizados/Processos'], get:['GET',`/api/ProcessosAutomatizados/Processo/${pid}`], apagar:['DELETE',`/api/ProcessosAutomatizados/Processo/${pid}`], quantidade:['GET','/api/ProcessosAutomatizados/QuantidadeProcessos'], ultimosExec:['GET','/api/ProcessosAutomatizados/UltimosProcessosExecutados'], log:['GET',`/api/ProcessosAutomatizadosLog/Log/${pid}`], agendas:['GET','/api/ProcessosAutomatizadosAgenda/Agendas'], familias:['GET','/api/ProcessosAutomatizadosFamilia/Familias'], parametros:['GET','/api/ProcessosAutomatizadosParametros/Parametros'] };
					if (m[op]) result = await req(m[op][0] as IHttpRequestMethods, m[op][1]);
					else if (op==='inserir') result = await req('POST', '/api/ProcessosAutomatizados/Processo', bp());
					else if (op==='alterar') result = await req('PUT', '/api/ProcessosAutomatizados/Processo', bp());
					else result = await req('POST', '/api/ProcessosAutomatizadosAgenda/Agenda', bp());
				} else if (rs === 'seguranca') {
					const m: Record<string,string> = { infoUser:'/api/Seguranca/InfoUser', infoAtendente:'/api/Seguranca/InfoAtendente', avatar:`/api/Seguranca/Avatar/${p('usuarioId','')}`, tokenTelegram:'/api/Seguranca/TokenTelegram', tokenWhatsapp:'/api/Seguranca/TokenWhatsapp' };
					if (m[op]) result = await req('GET', m[op]);
					else result = await req('POST', '/api/Seguranca/Logout');
				} else if (rs === 'email') {
					result = await req('POST', '/api/Email/EnvioSimples', bp());
				} else if (rs === 'produtos') {
					const m: Record<string,string> = { getProdutos:'/api/Produtos/Produtos', getNome:`/api/Produtos/${p('produtoId','')}/Nome`, getPorUsuario:'/api/Produtos/ProdutoUsuario', getNaturezas:'/api/Natureza', getProcesso:'/api/Modulo/Processo' };
					result = await req('GET', m[op]||'/api/Produtos/Produtos');
				} else if (rs === 'grupo') {
					if (op==='get') result = await req('GET', '/api/Grupo');
					else if (op==='filhos') result = await req('GET', `/api/Grupo/BuscaFilhos/${p('grupoId','')}`);
					else result = await req('GET', '/api/Caminho');
				} else if (rs === 'formulario') {
					const cid=p('chamadoId'),tid=p('tarefaId');
					const m: Record<string,string> = { getChamado:`/api/Formulario/FormulariosVinculadosChamado/${cid}`, camposChamado:`/api/Formulario/CamposPreenchidosFormulariosChamado/${cid}`, getTarefa:`/api/Formulario/FormulariosVinculadosTarefa/${tid}`, camposTarefa:`/api/Formulario/CamposPreenchidosFormulariosTarefa/${tid}` };
					if (m[op]) result = await req('GET', m[op]);
					else result = await req('POST', '/api/Formulario/IncluirFormulario', bp());
				} else if (rs === 'compromisso') {
					if (op==='get') result = await req('GET', '/api/Compromisso');
					else result = await req('GET', `/api/Compromisso/UsuariosEnvolvidos/${p('compromissoId','')}`);
				} else if (rs === 'ura') {
					if (op==='verificaCliente') result = await req('GET', `/api/URA/VerificaCliente/${p('telefone','')}`);
					else if (op==='verificaSolicitacao') result = await req('GET', `/api/URA/VerificaSolicitacao/${p('solicitacaoId','')}`);
					else result = await req('GET', `/api/URA/DadosTelefoneResponsavel/${p('responsavelId','')}`);
				} else if (rs === 'visualstudio') {
					const vid=p('integracaoId','');
					const m: Record<string,[string,string]> = { getAll:['GET','/api/Integracao/VisualStudio'], getById:['GET',`/api/Integracao/VisualStudio/${vid}`], getByProduto:['GET',`/api/Integracao/VisualStudio/ProdutoNatureza/${p('produtoId','')}/${p('naturezaId','')}`], excluir:['DELETE',`/api/Integracao/VisualStudio/${vid}`] };
					if (m[op]) result = await req(m[op][0] as IHttpRequestMethods, m[op][1]);
					else if (op==='inserir') result = await req('POST', '/api/Integracao/VisualStudio', bp());
					else if (op==='alterar') result = await req('PUT', '/api/Integracao/VisualStudio', bp());
					else result = await req('POST', '/api/Integracao/VisualStudio/WebHook', bp());
				} else if (rs === 'custom') {
					const cp = p('customPath') as string;
					const hb = ['POST','PUT','PATCH'].includes(op);
					result = await req(op as IHttpRequestMethods, cp, hb ? JSON.parse(p('customBody','{}') as string) as IDataObject : undefined);
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${rs}`);
				}

				const arr = Array.isArray(result) ? result : [result];
				arr.forEach((it) => returnData.push({ json: it as IDataObject, pairedItem: { item: i } }));

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
				} else {
					throw new NodeOperationError(this.getNode(), `Ellevo error: ${(error as Error).message}`, { itemIndex: i });
				}
			}
		}
		return [returnData];
	}
}

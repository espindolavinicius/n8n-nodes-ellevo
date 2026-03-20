<div align="center">

<img src="https://raw.githubusercontent.com/espindolavinicius/n8n-nodes-ellevo/main/nodes/Ellevo/ellevo.png" width="80" alt="Ellevo logo">

# n8n-nodes-ellevo

**Native n8n nodes for Ellevo — Help Desk, Service Desk, CSC & Ticket Management**

Connect your n8n workflows directly to Ellevo. Covers 333 API endpoints across 24 modules — tickets, tasks, approvals, attachments, notifications, automated processes, and more.

[![npm version](https://badge.fury.io/js/n8n-nodes-ellevo.svg)](https://www.npmjs.com/package/n8n-nodes-ellevo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![n8n community](https://img.shields.io/badge/n8n-community%20node-orange)](https://www.npmjs.com/package/n8n-nodes-ellevo)

</div>

---

## ✨ Features

- 🎫 **Full ticket lifecycle** — open, update, approve, reopen, close
- 🔐 **Automatic session authentication** — cookie cached for 1 hour, renewed transparently
- 🔑 **API Key support** — alternative authentication via Authorization header
- 📎 **Attachment management** — upload/download for tickets, tasks, and messages
- 🤖 **Automated processes** — CRUD for processes, schedules, families, and execution logs
- 🔧 **Custom Request module** — call any Ellevo endpoint directly
- 🌐 Bilingual interface (PT-BR / EN)

---

## 📦 Modules & Operations (333 endpoints)

| Module | Operations |
|--------|-----------|
| **Ticket (Chamado)** | List, Get, Open, Reopen, Change Priority/Stage, Approve, Mark Read |
| **Open Ticket** | Clients, Requesters, Paths, Natures, Severities, Responsible, Register |
| **Ticket Update (Trâmite)** | Get, List Status/Reasons/Activities, Add Update |
| **Task (Tarefa)** | List, Get, Open, Approve, Update Responsible |
| **Open Task** | Paths, Clients, Natures, Priorities, Locations, Register |
| **Task Update (Providência)** | Get, List Status/Reasons/Activities, Add Update |
| **Approval** | Approve/Reject Ticket & Task, Get Reasons, Process Data |
| **Attachment (Anexo)** | List & Upload for Ticket/Task/Message, Download, Metadata |
| **Message (Instrução)** | List, Unread, Sent, Priority, Overdue, Send, Notifications |
| **User (Usuário)** | Get, Search by Email/CPF/CNPJ, Register, Change Profile |
| **Account (Conta)** | List, Get, Create, Update, Prospects, Clients |
| **Notification** | Send Push Notification |
| **Knowledge Base** | Get Solution, List, Attachments |
| **Automation (Processos)** | CRUD Processes, Schedules, Families, Execution Logs |
| **Security** | User Info, Avatar, Logout, Channel Tokens (Telegram/WhatsApp) |
| **Email** | Send Simple Email |
| **Products / Natures** | List Products, Names, Natures, Processes |
| **Groups / Paths** | List Groups, Child Groups, Service Paths |
| **Forms** | Get & Fill Forms for Tickets and Tasks |
| **Appointments** | List, Involved Users |
| **IVR / URA** | Verify Client/Request by Phone |
| **Azure DevOps / VSTS** | CRUD Integrations, WebHook |
| **System** | Version, License, Settings, Connectivity |
| **Custom Request** | GET, POST, PUT, DELETE, PATCH to any endpoint |

---

## 🚀 Installation

### Option 1 — n8n self-hosted

```bash
# Go to your n8n custom nodes directory
cd ~/.n8n/nodes

# Clone the repository
git clone https://github.com/espindolavinicius/n8n-nodes-ellevo.git
cd n8n-nodes-ellevo

# Install and build
npm install
npm run build

# Restart n8n
```

### Option 2 — via npm (after publishing)

```bash
npm install n8n-nodes-ellevo
```

### Option 3 — Docker

```dockerfile
RUN cd /home/node && npm install n8n-nodes-ellevo
```

Or with `docker-compose.yml`:

```yaml
services:
  n8n:
    image: n8nio/n8n
    environment:
      - N8N_NODES_INCLUDE=n8n-nodes-ellevo
    volumes:
      - n8n_data:/home/node/.n8n
```

---

## ⚙️ Credential Setup

In n8n, go to **Settings → Credentials → New → Ellevo API** and fill in:

| Field | Example | Description |
|-------|---------|-------------|
| Ellevo Server URL | `https://helpdesk.yourcompany.com` | Your Ellevo instance URL |
| Username | `admin` | Ellevo login |
| Password | `****` | User password |
| Authentication Type | Session Cookie | Default; or API Key |

---

## 💡 Usage Examples

### Open a ticket

- **Module:** Open Ticket (Abertura de Chamado)
- **Operation:** Register Ticket
- **Body JSON:**
```json
{
  "clienteId": 1,
  "solicitanteId": 10,
  "caminhoId": 5,
  "assunto": "System not loading",
  "descricao": "The system shows a blank page after login."
}
```

### Add an update to a ticket

- **Module:** Ticket Update (Trâmite)
- **Operation:** Add Update
- **Ticket ID:** `123`
- **Body JSON:**
```json
{
  "chamadoId": 123,
  "texto": "Investigating the issue...",
  "statusId": 2,
  "atividadeId": 1
}
```

### Approve a ticket

- **Module:** Approval
- **Operation:** Approve / Reject Ticket
- **Ticket ID:** `456`
- **Reason ID:** `0`
- **Approve?:** `true`

### Send a push notification

- **Module:** Notification
- **Operation:** Send Push Notification
- **Body JSON:**
```json
{
  "usuarioId": 10,
  "titulo": "New ticket assigned",
  "mensagem": "Ticket #789 was assigned to you."
}
```

### Call a custom endpoint

- **Module:** Custom Request
- **Operation:** GET
- **API Path:** `/api/chamado/EmAprovacao`

---

## 🔐 How Authentication Works

**Session Cookie (default):**
1. On first call, sends `POST /api/mob/seguranca/autenticacao/ID` with login/password
2. Session cookie is cached in memory for 1 hour
3. All subsequent requests automatically include the cookie
4. Cache is renewed transparently after expiry

**API Key:**
- Sends the key directly in the `Authorization` header on every request

---

## 👨‍💻 Author

**Vinicius Espindola**
- GitHub: [@espindolavinicius](https://github.com/espindolavinicius)

---

## 📄 License

MIT © [Vinicius Espindola](https://github.com/espindolavinicius)

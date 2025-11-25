const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('helpdesk.db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Initialize tables
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            phone TEXT,
            issue TEXT,
            status TEXT,
            created_at TEXT
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id INTEGER,
            sender TEXT,
            content TEXT,
            timestamp TEXT
        )
    `);
});

// Helper DB functions
function createTicket(name, email, phone, issue) {
    return new Promise((resolve, reject) => {
        const createdAt = new Date().toISOString();
        db.run(
            `INSERT INTO tickets (name, email, phone, issue, status, created_at) VALUES (?, ?, ?, ?, 'Pending Review', ?)`,
            [name, email, phone, issue, createdAt],
            function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            }
        );
    });
}

function getTicket(id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM tickets WHERE id = ?`, [id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function getAllTickets() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM tickets ORDER BY created_at DESC`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function addMessage(ticketId, sender, content) {
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString();
        db.run(
            `INSERT INTO messages (ticket_id, sender, content, timestamp) VALUES (?, ?, ?, ?)`,
            [ticketId, sender, content, timestamp],
            function (err) {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

function getMessages(ticketId) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM messages WHERE ticket_id = ? ORDER BY timestamp ASC`,
            [ticketId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
}

function getLastMessage(ticketId) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT * FROM messages WHERE ticket_id = ? ORDER BY timestamp DESC LIMIT 1`,
            [ticketId],
            (err, row) => {
                if (err) reject(err);
                else resolve(row);
            }
        );
    });
}

function updateTicketStatus(id, status) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE tickets SET status = ? WHERE id = ?`, [status, id], function (err) {
            if (err) reject(err);
            else resolve();
        });
    });
}

// Routes

app.post('/api/tickets', async (req, res) => {
    const { name, email, phone, issue } = req.body;
    try {
        const ticket = await createTicket(name, email, phone, issue);
        await addMessage(ticket.id, 'admin', 'Hello! Your ticket has been received. We will respond shortly.');
        res.json({ success: true, ticketId: ticket.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/tickets/:id', async (req, res) => {
    try {
        const ticket = await getTicket(req.params.id);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        const messages = await getMessages(req.params.id);
        res.json({ ticket, messages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/tickets/:id/reply', async (req, res) => {
    const { message } = req.body;
    try {
        const ticket = await getTicket(req.params.id);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        if (ticket.status === 'Closed' || ticket.status.startsWith('Declined')) {
            return res.status(400).json({ error: 'Cannot reply to closed/declined ticket' });
        }
        const lastMessage = await getLastMessage(req.params.id);
        if (lastMessage.sender !== 'admin') {
            return res.status(400).json({ error: 'Wait for admin to reply before sending another message' });
        }
        await addMessage(ticket.id, 'guest', message);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/tickets/:id/action', async (req, res) => {
    const { action, message, declineReason } = req.body;
    try {
        const ticket = await getTicket(req.params.id);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        if (message) await addMessage(ticket.id, 'admin', message);

        if (action === 'Open') ticket.status = 'Opened';
        else if (action === 'Close') ticket.status = 'Closed';
        else if (action === 'Decline') ticket.status = `Declined: ${declineReason}`;

        await updateTicketStatus(ticket.id, ticket.status);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/tickets', async (req, res) => {
    try {
        const tickets = await getAllTickets();
        res.json({ tickets });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Create ticket
app.post('/api/tickets', async (req, res) => {
    const { name, email, phone, issue } = req.body;
    try {
        const ticket = await db.createTicket(name, email, phone, issue);
        // Create initial admin message
        await db.addMessage(ticket.id, 'admin', 'Hello! Your ticket has been received. We will respond shortly.');
        res.json({ success: true, ticketId: ticket.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get ticket and messages
app.get('/api/tickets/:id', async (req, res) => {
    try {
        const ticket = await db.getTicket(req.params.id);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        const messages = await db.getMessages(req.params.id);
        res.json({ ticket, messages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Guest reply
app.post('/api/tickets/:id/reply', async (req, res) => {
    const { message } = req.body;
    try {
        const ticket = await db.getTicket(req.params.id);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        if (ticket.status === 'Closed' || ticket.status.startsWith('Declined')) {
            return res.status(400).json({ error: 'Cannot reply to closed/declined ticket' });
        }
        // Check if admin has replied since last guest message
        const lastMessage = await db.getLastMessage(req.params.id);
        if (lastMessage.sender !== 'admin') {
            return res.status(400).json({ error: 'Wait for admin to reply before sending another message' });
        }
        await db.addMessage(ticket.id, 'guest', message);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin actions
app.post('/api/admin/tickets/:id/action', async (req, res) => {
    const { action, message, declineReason } = req.body;
    try {
        const ticket = await db.getTicket(req.params.id);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        if (message) await db.addMessage(ticket.id, 'admin', message);

        if (action === 'Open') ticket.status = 'Opened';
        else if (action === 'Close') ticket.status = 'Closed';
        else if (action === 'Decline') ticket.status = `Declined: ${declineReason}`;

        await db.updateTicketStatus(ticket.id, ticket.status);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin get all tickets
app.get('/api/admin/tickets', async (req, res) => {
    try {
        const tickets = await db.getAllTickets();
        res.json({ tickets });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

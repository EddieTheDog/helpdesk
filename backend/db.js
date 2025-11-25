const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('helpdesk.db');

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

module.exports = {
    createTicket: (name, email, phone, issue) => new Promise((resolve, reject) => {
        const createdAt = new Date().toISOString();
        db.run(`INSERT INTO tickets (name,email,phone,issue,status,created_at) VALUES (?,?,?,?,?,?)`,
            [name,email,phone,issue,'Pending Review',createdAt],
            function(err){ if(err) reject(err); else resolve({id:this.lastID}); }
        );
    }),
    getTicket: (id) => new Promise((resolve, reject) => {
        db.get(`SELECT * FROM tickets WHERE id=?`, [id], (err,row)=>err?reject(err):resolve(row));
    }),
    getAllTickets: () => new Promise((resolve,reject)=>{
        db.all(`SELECT * FROM tickets ORDER BY created_at DESC`, [], (err,rows)=>err?reject(err):resolve(rows));
    }),
    addMessage: (ticketId, sender, content) => new Promise((resolve,reject)=>{
        const timestamp = new Date().toISOString();
        db.run(`INSERT INTO messages (ticket_id,sender,content,timestamp) VALUES (?,?,?,?)`,
            [ticketId,sender,content,timestamp],
            function(err){ if(err) reject(err); else resolve(); }
        );
    }),
    getMessages: (ticketId) => new Promise((resolve,reject)=>{
        db.all(`SELECT * FROM messages WHERE ticket_id=? ORDER BY timestamp ASC`, [ticketId], (err,rows)=>err?reject(err):resolve(rows));
    }),
    getLastMessage: (ticketId) => new Promise((resolve,reject)=>{
        db.get(`SELECT * FROM messages WHERE ticket_id=? ORDER BY timestamp DESC LIMIT 1`, [ticketId], (err,row)=>err?reject(err):resolve(row));
    }),
    updateTicketStatus: (id,status) => new Promise((resolve,reject)=>{
        db.run(`UPDATE tickets SET status=? WHERE id=?`, [status,id], function(err){if(err) reject(err); else resolve();});
    })
};

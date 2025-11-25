import { useEffect, useState } from "react";

const declineReasons = ["Out of scope", "Duplicate", "Spam", "Other"];

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [action, setAction] = useState("");

  const fetchTickets = async () => {
    const res = await fetch("http://localhost:5000/api/admin/tickets");
    const data = await res.json();
    setTickets(data.tickets);
  };

  useEffect(() => { fetchTickets(); }, []);

  const fetchTicketMessages = async (id) => {
    const res = await fetch(`http://localhost:5000/api/tickets/${id}`);
    const data = await res.json();
    setSelectedTicket(data);
  };

  const handleAction = async (ticketId) => {
    let declineReason = "";
    if (action === "Decline") {
      declineReason = prompt("Select decline reason: " + declineReasons.join(", "), declineReasons[0]);
      if (!declineReason) return;
    }
    await fetch(`http://localhost:5000/api/admin/tickets/${ticketId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, message: reply, declineReason }),
    });
    setReply(""); setAction(""); fetchTickets(); fetchTicketMessages(ticketId);
  };

  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: "300px", borderRight: "1px solid #ccc", padding: "10px" }}>
        <h3>Tickets</h3>
        {tickets.map(t => (
          <div key={t.id} style={{ margin: "5px 0", cursor: "pointer" }} onClick={() => fetchTicketMessages(t.id)}>
            #{t.id} - {t.status}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: "10px" }}>
        {selectedTicket ? (
          <div>
            <h3>Ticket #{selectedTicket.ticket.id} - {selectedTicket.ticket.status}</h3>
            {selectedTicket.messages.map((msg, idx) => (
              <div key={idx} style={{
                border: "1px solid #ccc",
                padding: "10px",
                margin: "10px 0",
                backgroundColor: msg.sender === "admin" ? "#cce5ff" : "#fff"
              }}>
                <small>{new Date(msg.timestamp).toLocaleString()}</small>
                <div dangerouslySetInnerHTML={{ __html: msg.content }} />
              </div>
            ))}
            <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Admin message (HTML allowed)" />
            <br />
            <button onClick={() => { setAction("Open"); handleAction(selectedTicket.ticket.id); }}>Open</button>
            <button onClick={() => { setAction("Close"); handleAction(selectedTicket.ticket.id); }}>Close</button>
            <button onClick={() => { setAction("Decline"); handleAction(selectedTicket.ticket.id); }}>Decline</button>
          </div>
        ) : <div>Select a ticket</div>}
      </div>
    </div>
  );
}

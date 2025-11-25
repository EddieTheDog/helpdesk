import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [declineReason, setDeclineReason] = useState("");

  const fetchTickets = async () => {
    const res = await fetch("/api/admin/tickets");
    const data = await res.json();
    setTickets(data.tickets);
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (ticketId, action) => {
    await fetch(`/api/admin/tickets/${ticketId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        message: replyMessage,
        declineReason,
      }),
    });
    setReplyMessage("");
    setDeclineReason("");
    setSelected(null);
    fetchTickets();
  };

  return (
    <div style={{ maxWidth: "900px", margin: "50px auto" }}>
      <h2>Admin Dashboard</h2>
      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ flex: 1 }}>
          <h3>Tickets</h3>
          <ul>
            {tickets.map((t) => (
              <li key={t.id}>
                <button onClick={() => setSelected(t)}>Ticket #{t.id} - {t.status}</button>
              </li>
            ))}
          </ul>
        </div>
        {selected && (
          <div style={{ flex: 2, border: "1px solid #ccc", padding: "10px" }}>
            <h3>Ticket #{selected.id}</h3>
            <p><b>Name:</b> {selected.name}</p>
            <p><b>Email:</b> {selected.email}</p>
            <p><b>Phone:</b> {selected.phone}</p>
            <p><b>Issue:</b> {selected.issue}</p>

            <textarea
              placeholder="Write reply..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows={3}
              style={{ width: "100%" }}
            />

            {selected.status.startsWith("Declined") || selected.status === "Closed" ? null : (
              <div style={{ marginTop: "10px" }}>
                <button onClick={() => handleAction(selected.id, "Open")}>Open</button>
                <button onClick={() => handleAction(selected.id, "Close")}>Close</button>
                <select
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  style={{ marginLeft: "10px" }}
                >
                  <option value="">Decline Reason</option>
                  <option value="Invalid Request">Invalid Request</option>
                  <option value="Duplicate Ticket">Duplicate Ticket</option>
                  <option value="Spam">Spam</option>
                  <option value="Other">Other</option>
                </select>
                <button
                  onClick={() => handleAction(selected.id, "Decline")}
                  disabled={!declineReason}
                  style={{ marginLeft: "5px" }}
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

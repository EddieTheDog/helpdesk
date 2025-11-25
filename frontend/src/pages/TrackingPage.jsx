import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

export default function TrackingPage() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const fetchTicket = async () => {
    const res = await fetch(`/api/tickets/${ticketId}`);
    const data = await res.json();
    setTicket(data.ticket);
    setMessages(data.messages);
  };

  useEffect(() => {
    fetchTicket();
    const interval = setInterval(fetchTicket, 5000); // auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!newMessage) return;
    await fetch(`/api/tickets/${ticketId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: newMessage }),
    });
    setNewMessage("");
    fetchTicket();
  };

  if (!ticket) return <p>Loading...</p>;

  const canReply = ticket.status !== "Closed" && !ticket.status.startsWith("Declined");

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto" }}>
      <h2>Ticket Status: {ticket.status}</h2>
      <div>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              backgroundColor: msg.sender === "admin" ? "#cce5ff" : "#fff",
              color: "#000",
              padding: "10px",
              margin: "10px 0",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
          >
            <small>{new Date(msg.timestamp).toLocaleString()}</small>
            <div dangerouslySetInnerHTML={{ __html: msg.content }} />
          </div>
        ))}
      </div>
      {canReply && (
        <div style={{ marginTop: "20px" }}>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your reply..."
            rows={3}
            style={{ width: "100%" }}
          />
          <button onClick={handleSend} style={{ marginTop: "10px" }}>
            Send Reply
          </button>
        </div>
      )}
      {!canReply && <p>This ticket is closed or declined. You cannot reply.</p>}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function TrackingPage() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");

  const fetchTicket = async () => {
    const res = await fetch(`http://localhost:5000/api/tickets/${ticketId}`);
    const data = await res.json();
    setTicket(data.ticket);
    setMessages(data.messages);
  };

  useEffect(() => { fetchTicket(); }, []);

  const handleReply = async () => {
    if (!reply) return;
    const res = await fetch(`http://localhost:5000/api/tickets/${ticketId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply }),
    });
    const data = await res.json();
    if (data.success) { setReply(""); fetchTicket(); }
    else alert(data.error);
  };

  if (!ticket) return <div>Loading...</div>;

  const canReply = messages[messages.length - 1]?.sender === "admin" && !ticket.status.startsWith("Declined") && ticket.status !== "Closed";

  return (
    <div style={{ maxWidth: "700px", margin: "30px auto" }}>
      <h2>Ticket #{ticket.id} - Status: {ticket.status}</h2>
      {messages.map((msg, idx) => (
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
      {canReply && (
        <div>
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply" />
          <br />
          <button onClick={handleReply}>Send Reply</button>
        </div>
      )}
    </div>
  );
}

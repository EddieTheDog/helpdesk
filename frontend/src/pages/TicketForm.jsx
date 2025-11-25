import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TicketForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", issue: "" });
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) navigate(`/track/${data.ticketId}`);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto" }}>
      <h2>Submit a Help Request</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Name" name="name" onChange={handleChange} required /><br />
        <input placeholder="Email" name="email" type="email" onChange={handleChange} required /><br />
        <input placeholder="Phone" name="phone" onChange={handleChange} required /><br />
        <textarea placeholder="Describe your issue" name="issue" onChange={handleChange} required /><br />
        <button type="submit">Submit Ticket</button>
      </form>
    </div>
  );
}

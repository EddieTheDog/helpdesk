import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TicketForm from "./pages/TicketForm";
import TrackingPage from "./pages/TrackingPage";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TicketForm />} />
        <Route path="/track/:ticketId" element={<TrackingPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

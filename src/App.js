import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function PublicIssueReporter() {
  const [location, setLocation] = useState("");
  const [issue, setIssue] = useState("");
  const [urgency, setUrgency] = useState("Low");
  const [status, setStatus] = useState("New");
  const [file, setFile] = useState(null);
  const [reports, setReports] = useState([]); // store multiple complaints

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!location || !issue) {
      alert("Please enter location and select issue.");
      return;
    }

    // Convert "lat,lng" string → array
    let coords = null;
    if (location.includes(",")) {
      coords = location.split(",").map((v) => parseFloat(v.trim()));
    }

    const newReport = {
      id: Date.now(),
      location,
      coords,
      issue,
      urgency,
      status,
      file,
    };

    setReports((prev) => [...prev, newReport]); // add new complaint
    setLocation("");
    setIssue("");
    setUrgency("Low");
    setStatus("New");
    setFile(null);
  };

  return (
    <div className="flex h-screen">
      {/* Left Form */}
      <div className="w-1/3 bg-gray-100 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Report Public Issue</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Enter location (name or lat,lng)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border p-2 rounded"
          />

          <select
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">Select Issue</option>
            <option value="Garbage">Garbage</option>
            <option value="Water Leakage">Water Leakage</option>
            <option value="Road Damage">Road Damage</option>
            <option value="Street Light">Street Light</option>
            <option value="Public Safety">Public Safety</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full"
          />

          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded w-full"
          >
            Submit Report
          </button>
        </form>

        {/* Complaints List */}
        <div className="mt-6">
          <h3 className="font-bold mb-2">Submitted Complaints</h3>
          {reports.length === 0 && (
            <p className="text-sm text-gray-500">No complaints yet.</p>
          )}
          <ul className="space-y-2">
            {reports.map((r) => (
              <li key={r.id} className="border p-2 rounded bg-white">
                <p><strong>Issue:</strong> {r.issue}</p>
                <p><strong>Urgency:</strong> {r.urgency}</p>
                <p><strong>Status:</strong> {r.status}</p>
                <p><strong>Location:</strong> {r.location}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Map */}
      <div className="w-2/3">
        <MapContainer
          center={[11.0168, 76.9558]} // Coimbatore default
          zoom={12}
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {reports.map((r) =>
            r.coords ? (
              <Marker key={r.id} position={r.coords}>
                <Popup>
                  <b>{r.issue}</b> <br />
                  Urgency: {r.urgency} <br />
                  Status: {r.status}
                </Popup>
              </Marker>
            ) : null
          )}
        </MapContainer>
      </div>
    </div>
  );
}

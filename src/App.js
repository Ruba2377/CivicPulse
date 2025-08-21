import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const ISSUE_TYPES = ["Pothole", "Garbage", "Streetlight", "Waterlogging", "Other"];
const MOCK_AUTHORITIES = [
  { id: "muni-1", name: "City Municipal Corp" },
  { id: "roads-1", name: "Roads & Transport Dept" },
  { id: "parks-1", name: "Parks Division" },
];

function LocationPicker({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });
  return null;
}

export default function App() {
  const [reports, setReports] = useState([]);
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [authority, setAuthority] = useState(MOCK_AUTHORITIES[0].id);
  const [location, setLocation] = useState({ lat: 11.0168, lng: 76.9558 });
  const [locationName, setLocationName] = useState(""); 
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  async function setLocationFromName() {
    if (!locationName) return;
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search`,
        {
          params: { q: locationName, format: "json", limit: 1 },
        }
      );
      if (response.data.length === 0) {
        alert("Location not found!");
        return;
      }
      const { lat, lon } = response.data[0];
      setLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
    } catch (error) {
      console.error("Geocoding error:", error);
      alert("Error fetching location coordinates.");
    }
  }

  function submitReport(e) {
    e.preventDefault();
    if (!photoPreview) {
      alert("Please upload a photo for the report.");
      return;
    }
    const newReport = {
      id: Date.now(),
      type: issueType,
      authority,
      lat: location.lat,
      lng: location.lng,
      photo: photoPreview,
      locationName,
    };
    setReports([newReport, ...reports]);
    setPhoto(null);
    setPhotoPreview(null);
    setLocationName("");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 font-sans">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-md py-6 mb-6">
        <h1 className="text-4xl font-bold text-center">CivicPulse Dashboard</h1>
        <p className="text-center text-blue-100 mt-2">Report civic issues in your city with ease</p>
      </header>

      {/* Form */}
      <form
        onSubmit={submitReport}
        className="bg-white max-w-xl mx-auto p-6 rounded-xl shadow-xl space-y-6"
      >
        <div>
          <label className="block font-semibold mb-1 text-gray-700">Issue Type</label>
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {ISSUE_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1 text-gray-700">Authority</label>
          <select
            value={authority}
            onChange={(e) => setAuthority(e.target.value)}
            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {MOCK_AUTHORITIES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1 text-gray-700">Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhoto}
            className="block w-full"
          />
          {photoPreview && (
            <img
              src={photoPreview}
              alt="preview"
              className="mt-2 rounded border shadow-md"
              width="120"
            />
          )}
        </div>

        <div>
          <label className="block font-semibold mb-1 text-gray-700">Location Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Type location name or address"
              className="flex-1 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={setLocationFromName}
              className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 transition"
            >
              Set Location
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 font-semibold transition"
        >
          Submit Report
        </button>
      </form>

      {/* Map */}
      <div className="mt-8 max-w-6xl mx-auto rounded-xl overflow-hidden shadow-2xl">
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={13}
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationPicker onSelect={(latlng) => setLocation(latlng)} />
          {reports.map((r) => (
            <Marker key={r.id} position={[r.lat, r.lng]}>
              <Popup>
                <div className="space-y-2">
                  <strong className="text-blue-600">{r.type}</strong>
                  <div>Authority: {MOCK_AUTHORITIES.find((a) => a.id === r.authority)?.name}</div>
                  <div>Location: {r.locationName}</div>
                  {r.photo && (
                    <img
                      src={r.photo}
                      alt="Report"
                      width="120"
                      className="mt-2 rounded border shadow-sm"
                    />
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

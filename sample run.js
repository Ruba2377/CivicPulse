import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue
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
  const [locationInput, setLocationInput] = useState(""); 
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Initialize location input with default location
  useEffect(() => {
    setLocationInput(`${location.lat},${location.lng}`);
  }, [location]);

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  function handleLocationChange(e) {
    setLocationInput(e.target.value);
  }

  function setLocationFromInput() {
    const [lat, lng] = locationInput.split(",").map(Number);
    if (!isNaN(lat) && !isNaN(lng)) {
      setLocation({ lat, lng });
    } else {
      alert("Enter valid coordinates: lat,lng");
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
    };

    setReports([newReport, ...reports]);
    setPhoto(null);
    setPhotoPreview(null);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">CivicPulse</h1>

      <form
        onSubmit={submitReport}
        className="bg-white max-w-xl mx-auto p-6 rounded-lg shadow-lg space-y-4"
      >
        <div>
          <label className="block font-semibold mb-1">Issue Type:</label>
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
          <label className="block font-semibold mb-1">Authority:</label>
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
          <label className="block font-semibold mb-1">Photo:</label>
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
              className="mt-2 rounded border shadow-sm"
              width="120"
            />
          )}
        </div>

        <div>
          <label className="block font-semibold mb-1">Enter Location (lat,lng):</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={locationInput}
              onChange={handleLocationChange}
              placeholder="11.0168,76.9558"
              className="flex-1 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={setLocationFromInput}
              className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
            >
              Set Location
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 font-semibold"
        >
          Submit Report
        </button>
      </form>

      <div className="mt-6 max-w-4xl mx-auto relative">
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={13}
          style={{ height: "500px", borderRadius: "10px" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationPicker onSelect={(latlng) => setLocation(latlng)} />
          {reports.map((r) => (
            <Marker key={r.id} position={[r.lat, r.lng]}>
              <Popup>
                <strong>{r.type}</strong>
                <br />
                Authority: {MOCK_AUTHORITIES.find((a) => a.id === r.authority)?.name}
                <br />
                {r.photo && <img src={r.photo} alt="Report" width="100" className="mt-2 rounded border" />}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

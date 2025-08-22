// src/App.js
import React, { useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Complaint marker icons based on status
const markerIcons = {
  New: new L.Icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
    iconSize: [32, 32],
  }),
  "In Progress": new L.Icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
    iconSize: [32, 32],
  }),
  Resolved: new L.Icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
    iconSize: [32, 32],
  }),
};

// For selecting coordinates by clicking on the map
function LocationSelector({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });
  return null;
}

function App() {
  const [complaints, setComplaints] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    urgency: "Low",
    location: "",
    coords: null,
    images: [],
    audio: null,
  });

  // For audio recording
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Submit complaint
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.coords) return alert("Please select or enter a location");

    const newComplaint = {
      ...form,
      id: Date.now(),
      status: "New", // authority will update later
    };

    setComplaints([...complaints, newComplaint]);
    setForm({
      title: "",
      description: "",
      urgency: "Low",
      location: "",
      coords: null,
      images: [],
      audio: null,
    });
  };

  // Get GPS location
  const handleGetCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setForm({ ...form, location: "Current Location", coords });
      },
      () => alert("Unable to fetch current location")
    );
  };

  // Manual location search using OpenStreetMap API
  const handleManualLocation = async () => {
    if (!form.location) return alert("Enter a location");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${form.location}`
      );
      const data = await res.json();
      if (data.length > 0) {
        const coords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        setForm({ ...form, coords });
      } else {
        alert("Location not found!");
      }
    } catch (err) {
      console.error(err);
      alert("Error finding location");
    }
  };

  // Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioURL = URL.createObjectURL(audioBlob);
        setForm({ ...form, audio: audioURL });
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert("Microphone access denied or not available");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white p-4">
      <h1 className="text-4xl font-bold text-center mb-6">
        🚨 Smart Complaint Portal
      </h1>

      {/* Complaint Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-lg max-w-2xl mx-auto"
      >
        <input
          type="text"
          placeholder="Complaint Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full p-2 mb-3 rounded bg-white/20 text-white placeholder-gray-300"
          required
        />

        <textarea
          placeholder="Describe your complaint"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full p-2 mb-3 rounded bg-white/20 text-white placeholder-gray-300"
          required
        />

        <select
          value={form.urgency}
          onChange={(e) => setForm({ ...form, urgency: e.target.value })}
          className="w-full p-2 mb-3 rounded bg-white/20 text-white"
        >
          <option value="Low">Low Urgency</option>
          <option value="Medium">Medium Urgency</option>
          <option value="High">High Urgency</option>
        </select>

        {/* Location Input */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Enter location manually"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="flex-1 p-2 rounded bg-white/20 text-white placeholder-gray-300"
          />
          <button
            type="button"
            onClick={handleManualLocation}
            className="px-3 py-2 bg-green-600 rounded-lg"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            className="px-3 py-2 bg-blue-600 rounded-lg"
          >
            Use GPS
          </button>
        </div>

        {/* Image Upload */}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) =>
            setForm({ ...form, images: Array.from(e.target.files) })
          }
          className="w-full p-2 mb-3 bg-white/20 rounded"
        />

        {/* Audio Recording */}
        <div className="mb-3">
          {!recording ? (
            <button
              type="button"
              onClick={startRecording}
              className="px-3 py-2 bg-red-600 rounded-lg mr-2"
            >
              🎙 Start Recording
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="px-3 py-2 bg-yellow-600 rounded-lg"
            >
              ⏹ Stop Recording
            </button>
          )}
          {form.audio && (
            <audio controls className="mt-2 w-full">
              <source src={form.audio} type="audio/webm" />
            </audio>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 p-3 rounded-xl font-bold"
        >
          Submit Complaint
        </button>
      </form>

      {/* Map Section */}
      <div className="mt-6 h-[70vh] rounded-2xl overflow-hidden shadow-lg">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationSelector
            onSelect={(coords) =>
              setForm({ ...form, coords, location: "Pinned Location" })
            }
          />

          {complaints.map((c) => (
            <Marker key={c.id} position={c.coords} icon={markerIcons[c.status]}>
              <Popup>
                <h3 className="font-bold">{c.title}</h3>
                <p>{c.description}</p>
                <p>
                  <strong>Urgency:</strong> {c.urgency}
                </p>
                <p>
                  <strong>Status:</strong> {c.status}
                </p>
                {c.images.length > 0 && (
                  <div>
                    {c.images.map((img, i) => (
                      <img
                        key={i}
                        src={URL.createObjectURL(img)}
                        alt="complaint"
                        className="w-32 mt-2"
                      />
                    ))}
                  </div>
                )}
                {c.audio && (
                  <audio controls className="mt-2 w-full">
                    <source src={c.audio} type="audio/webm" />
                  </audio>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;
















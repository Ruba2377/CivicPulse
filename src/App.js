import React, { useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

// Red & Blue Pin Icons
const redIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const blueIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export default function CivicPulseApp() {
  const [complaints, setComplaints] = useState([]);
  const [locationText, setLocationText] = useState("");
  const [mapCenter, setMapCenter] = useState([11.0168, 76.9558]);
  const [dept, setDept] = useState("");
  const [desc, setDesc] = useState("");
  const [photo, setPhoto] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Convert place name → coordinates
  const geocodeLocation = async (place) => {
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: { q: place, format: "json", limit: 1 },
      });

      if (res.data.length > 0) {
        return {
          lat: parseFloat(res.data[0].lat),
          lon: parseFloat(res.data[0].lon),
          display_name: res.data[0].display_name,
        };
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  // Add complaint (typed address = red pin)
  const handleAddComplaint = async () => {
    if (!locationText || !dept) {
      alert("Enter location and select department!");
      return;
    }

    const geoData = await geocodeLocation(locationText);
    if (!geoData) {
      alert("Location not found. Try another name.");
      return;
    }

    const newComplaint = {
      location: geoData.display_name,
      coords: [geoData.lat, geoData.lon],
      dept,
      desc,
      photo,
      audio: audioUrl,
      isGPS: false, // typed address
    };

    setComplaints([...complaints, newComplaint]);
    setMapCenter([geoData.lat, geoData.lon]);

    // Reset
    setLocationText("");
    setDept("");
    setDesc("");
    setPhoto(null);
    setAudioUrl(null);
  };

  // GPS (blue pin)
  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/reverse`,
          {
            params: { lat: latitude, lon: longitude, format: "json" },
          }
        );
        const placeName = res.data.display_name || "My Location";
        setLocationText(placeName); // auto-fill field
        const newComplaint = {
          location: placeName,
          coords: [latitude, longitude],
          dept,
          desc,
          photo,
          audio: audioUrl,
          isGPS: true, // GPS pin
        };
        setComplaints([...complaints, newComplaint]);
        setMapCenter([latitude, longitude]);
      } catch (err) {
        console.error(err);
      }
    });
  };

  // Audio Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current.start();
    } catch (err) {
      console.error("Error recording audio", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-6">
      <h1 className="text-4xl font-extrabold text-center mb-6 text-blue-900 drop-shadow-md">
        CivicPulse – Report Public Issues
      </h1>

      {/* Complaint Form */}
      <div className="bg-gradient-to-r from-white via-blue-50 to-purple-50 p-6 rounded-2xl shadow-xl max-w-3xl mx-auto border border-blue-200">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">📝 New Complaint</h2>

        <input
          type="text"
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          placeholder="Enter location / address"
          className="w-full p-3 mb-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="w-full p-3 mb-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="">Select Department</option>
          <option value="Water Supply">💧 Water Supply</option>
          <option value="Electricity">⚡ Electricity</option>
          <option value="Sanitation">🧹 Sanitation</option>
          <option value="Roads">🛣 Roads</option>
          <option value="Waste Management">🚮 Waste Management</option>
        </select>

        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Complaint description"
          className="w-full p-3 mb-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(URL.createObjectURL(e.target.files[0]))}
          className="w-full mb-3"
        />

        {/* Audio Recording */}
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={startRecording}
            className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600"
          >
            🎙 Start Recording
          </button>
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg shadow-md hover:bg-gray-800"
          >
            ⏹ Stop
          </button>
          {audioUrl && <audio controls src={audioUrl}></audio>}
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleAddComplaint}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700"
          >
            Add Complaint
          </button>
          <button
            onClick={handleUseGPS}
            className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700"
          >
            📍 Use GPS
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="mt-6 h-[600px] rounded-xl overflow-hidden shadow-2xl border border-gray-300">
        <MapContainer center={mapCenter} zoom={13} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {complaints.map((c, i) => (
            <Marker
              key={i}
              position={c.coords}
              icon={c.isGPS ? blueIcon : redIcon}
            >
              <Popup>
                <strong>{c.dept}</strong> <br />
                {c.location} <br />
                {c.desc} <br />
                {c.photo && (
                  <img src={c.photo} alt="complaint" className="w-32 mt-2" />
                )}
                {c.audio && (
                  <audio controls src={c.audio} className="mt-2"></audio>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}


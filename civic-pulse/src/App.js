import React, { useState, useRef, useEffect } from "react";
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
  const [locationInput, setLocationInput] = useState(""); // New location input
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [commentTexts, setCommentTexts] = useState({});

  // Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn("Geolocation error:", err.message);
        }
      );
    }
  }, []);

  // Handle photo
  function handlePhoto(e) {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  // Audio recording
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      console.error("Microphone error:", error);
      alert("Microphone access is required to record audio.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    setRecording(false);
  }

  // Submit report
  function submitReport(e) {
    e.preventDefault();
    const newReport = {
      id: Date.now(),
      type: issueType,
      authority,
      lat: location.lat,
      lng: location.lng,
      photo: photoPreview,
      audio: audioBlob ? URL.createObjectURL(audioBlob) : null,
      votes: 0,
      comments: [],
    };

    setReports([newReport, ...reports]);
    setPhoto(null);
    setPhotoPreview(null);
    setAudioBlob(null);
    setCommentTexts((prev) => ({ ...prev, [newReport.id]: "" }));
  }

  function upvote(id) {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, votes: r.votes + 1 } : r))
    );
  }

  function addComment(id) {
    const text = commentTexts[id]?.trim();
    if (!text) return;
    setReports((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, comments: [...r.comments, text] } : r
      )
    );
    setCommentTexts((prev) => ({ ...prev, [id]: "" }));
  }

  // Update map location when user types coordinates manually
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

  return (
    <div className="p-6 font-sans bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">CivicPulse</h1>

      <form
        onSubmit={submitReport}
        className="bg-white p-6 rounded shadow-md max-w-xl mb-6"
      >
        <div className="mb-4">
          <label className="block font-semibold mb-1">Issue Type:</label>
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="w-full border rounded p-2"
          >
            {ISSUE_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">Authority:</label>
          <select
            value={authority}
            onChange={(e) => setAuthority(e.target.value)}
            className="w-full border rounded p-2"
          >
            {MOCK_AUTHORITIES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
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
              className="mt-2 rounded border"
              width="120"
            />
          )}
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">Voice Description:</label>
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            className={`px-4 py-2 rounded ${
              recording ? "bg-red-500 text-white" : "bg-blue-500 text-white"
            }`}
          >
            {recording ? "Stop Recording" : "Start Recording"}
          </button>
          {audioBlob && (
            <audio
              controls
              src={URL.createObjectURL(audioBlob)}
              className="mt-2 w-full"
            />
          )}
        </div>

        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Submit Report
        </button>
      </form>

      <div className="mb-4 max-w-xl mx-auto relative">
        {/* Location input box above map */}
        <div className="absolute z-10 top-2 left-1/2 transform -translate-x-1/2 w-96 bg-white rounded shadow-md p-2 flex gap-2 items-center">
          <input
            type="text"
            placeholder="Enter location (lat,lng)"
            value={locationInput}
            onChange={handleLocationChange}
            className="flex-1 border rounded px-2 py-1"
          />
          <button
            type="button"
            onClick={setLocationFromInput}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Go
          </button>
        </div>

        <MapContainer
          center={[location.lat, location.lng]}
          zoom={13}
          style={{ height: "400px", borderRadius: "10px" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationPicker onSelect={(latlng) => setLocation(latlng)} />
          {reports.map((r) => (
            <Marker key={r.id} position={[r.lat, r.lng]}>
              <Popup>
                <strong>{r.type}</strong>
                <br />
                Votes: {r.votes}
                <br />
                {r.photo && <img src={r.photo} alt="Report" width="100" />}
                {r.audio && (
                  <div>
                    <audio controls src={r.audio} />
                  </div>
                )}
                <br />
                <button onClick={() => upvote(r.id)}>Upvote</button>
                <div className="mt-2">
                  <strong>Comments:</strong>
                  {r.comments.map((c, i) => (
                    <div key={i}>- {c}</div>
                  ))}
                  <input
                    value={commentTexts[r.id] || ""}
                    onChange={(e) =>
                      setCommentTexts((prev) => ({ ...prev, [r.id]: e.target.value }))
                    }
                    placeholder="Add a comment"
                    className="border rounded px-2 py-1 mt-1 w-full"
                  />
                  <button
                    onClick={() => addComment(r.id)}
                    className="bg-gray-200 px-2 py-1 rounded mt-1 hover:bg-gray-300"
                  >
                    Add
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

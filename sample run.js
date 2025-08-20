import React, { useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const ISSUE_TYPES = ["Pothole", "Garbage", "Streetlight", "Waterlogging", "Other"];
const AUTHORITIES = [
  { id: "muni", name: "City Municipal Corp" },
  { id: "roads", name: "Roads & Transport Dept" },
  { id: "parks", name: "Parks Division" },
];

export default function App() {
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [authority, setAuthority] = useState(AUTHORITIES[0].id);
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recording, setRecording] = useState(false);
  const [reports, setReports] = useState([]);
  const [commentTexts, setCommentTexts] = useState({});
  const [mapCenter, setMapCenter] = useState([20, 77]); // India default
  const [previewCoords, setPreviewCoords] = useState(null); // <-- NEW

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Handle photo upload
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Handle voice recording
  const startRecording = async () => {
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
    } catch (err) {
      alert("Microphone access is required for recording.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // Geocode address
  const geocodeAddress = async (addr) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}`
    );
    const data = await response.json();
    if (data && data[0]) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  };

  // Live preview on blur
  const handleAddressBlur = async () => {
    if (address.trim()) {
      const coords = await geocodeAddress(address);
      if (coords) {
        setPreviewCoords(coords);
        setMapCenter([coords.lat, coords.lng]);
      }
    }
  };

  // Submit report
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!address) return alert("Please enter an address.");
    if (!photoPreview) return alert("Please upload a photo.");

    const coords = await geocodeAddress(address);
    if (!coords) return alert("Could not find location. Try a more specific address.");

    const icon = L.icon({
      iconUrl: photoPreview,
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      popupAnchor: [0, -50],
    });

    const newReport = {
      id: Date.now(),
      type: issueType,
      authority,
      address,
      lat: coords.lat,
      lng: coords.lng,
      photo: photoPreview,
      audio: audioBlob ? URL.createObjectURL(audioBlob) : null,
      votes: 0,
      comments: [],
      icon,
    };

    setReports([newReport, ...reports]);
    setMapCenter([coords.lat, coords.lng]);
    setPreviewCoords(null); // clear preview after submission

    // Reset
    setAddress("");
    setPhoto(null);
    setPhotoPreview(null);
    setAudioBlob(null);
  };

  // Upvote logic
  const upvote = (id) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, votes: r.votes + 1 } : r))
    );
  };

  // Add comment
  const addComment = (id) => {
    const text = commentTexts[id]?.trim();
    if (!text) return;

    setReports((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, comments: [...r.comments, text] } : r
      )
    );
    setCommentTexts((prev) => ({ ...prev, [id]: "" }));
  };

  return (
    <div style={{ maxWidth: 900, margin: "auto", fontFamily: "Arial" }}>
      <h1>CivicPulse</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "#f8f8f8",
          padding: 20,
          borderRadius: 10,
        }}
      >
        <label>
          Issue Type:
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            style={{ marginLeft: 10 }}
          >
            {ISSUE_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <br />
        <br />

        <label>
          Authority:
          <select
            value={authority}
            onChange={(e) => setAuthority(e.target.value)}
            style={{ marginLeft: 10 }}
          >
            {AUTHORITIES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <br />
        <br />

        {/* NEW Location field */}
        <label>
          Location:
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onBlur={handleAddressBlur}
            placeholder="Enter location e.g. Saravanampatti Keeranatham Road"
            style={{ marginLeft: 10, width: 300 }}
            required
          />
        </label>
        <br />
        <br />

        <label>
          Photo:
          <input
            type="file"
            accept="image/*"
            onChange={handlePhoto}
            style={{ marginLeft: 10 }}
            required
          />
        </label>
        <br />
        {photoPreview && (
          <img
            src={photoPreview}
            alt="preview"
            width={100}
            style={{ marginTop: 10 }}
          />
        )}
        <br />
        <br />

        <label>Voice Description:</label>
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          style={{ marginLeft: 10 }}
        >
          {recording ? "Stop Recording" : "Start Recording"}
        </button>
        {audioBlob && (
          <audio
            controls
            src={URL.createObjectURL(audioBlob)}
            style={{ display: "block", marginTop: 10 }}
          />
        )}

        <br />
        <br />
        <button type="submit">Submit Report</button>
      </form>

      <h2 style={{ marginTop: 30 }}>Public Map</h2>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: 500, borderRadius: 10 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* Preview marker (before submit) */}
        {previewCoords && (
          <Marker position={[previewCoords.lat, previewCoords.lng]}>
            <Popup>📍 Location Preview</Popup>
          </Marker>
        )}

        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.lat, report.lng]}
            icon={report.icon}
          >
            <Popup>
              <strong>{report.type}</strong> <br />
              <em>
                {AUTHORITIES.find((a) => a.id === report.authority)?.name}
              </em>
              <br />
              <small>{report.address}</small>
              <br />
              <img
                src={report.photo}
                alt="issue"
                width="100%"
                style={{ marginTop: 5 }}
              />
              {report.audio && (
                <audio
                  controls
                  src={report.audio}
                  style={{ width: "100%", marginTop: 5 }}
                />
              )}
              <div style={{ marginTop: 10 }}>
                Votes: {report.votes}
                <button
                  onClick={() => upvote(report.id)}
                  style={{ marginLeft: 10 }}
                >
                  Upvote
                </button>
              </div>
              <div style={{ marginTop: 10 }}>
                <strong>Comments:</strong>
                {report.comments.length === 0 && <div>No comments yet.</div>}
                {report.comments.map((c, i) => (
                  <div key={i}>- {c}</div>
                ))}
                <input
                  type="text"
                  value={commentTexts[report.id] || ""}
                  onChange={(e) =>
                    setCommentTexts((prev) => ({
                      ...prev,
                      [report.id]: e.target.value,
                    }))
                  }
                  placeholder="Add a comment"
                  style={{ width: "90%", marginTop: 6 }}
                />
                <button
                  onClick={() => addComment(report.id)}
                  style={{ marginLeft: 6 }}
                >
                  Add
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

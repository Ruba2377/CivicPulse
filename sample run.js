import React, { useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const ISSUE_TYPES = ["Pothole", "Garbage", "Streetlight", "Waterlogging", "Other"];
const MOCK_AUTHORITIES = [
  { id: "muni-1", name: "City Municipal Corp" },
  { id: "roads-1", name: "Roads & Transport Dept" },
  { id: "parks-1", name: "Parks Division" },
];

export default function CivicPulse() {
  // Form state
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [authority, setAuthority] = useState(MOCK_AUTHORITIES[0].id);
  const [address, setAddress] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Reports list
  const [reports, setReports] = useState([]);

  // Comments state: object keyed by report id
  const [commentTexts, setCommentTexts] = useState({});

  // Map center (default to somewhere)
  const [mapCenter, setMapCenter] = useState([20, 0]);

  // Handle photo upload and preview
  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  // Geocode address using OpenStreetMap Nominatim
  async function geocodeAddress(addr) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      addr
    )}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  }

  // Start voice recording
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
      alert("Microphone access is required to record audio.");
      console.error(error);
    }
  }

  // Stop voice recording
  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  // Submit report handler
  async function submitReport(e) {
    e.preventDefault();

    if (!address.trim()) {
      alert("Please enter an address.");
      return;
    }

    if (!photoPreview) {
      alert("Please upload a photo.");
      return;
    }

    const coords = await geocodeAddress(address);
    if (!coords) {
      alert("Address not found. Please enter a valid address.");
      return;
    }

    // Create custom icon with the complaint photo
    const customIcon = L.icon({
      iconUrl: photoPreview,
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      popupAnchor: [0, -50],
      className: "custom-marker-icon",
    });

    const newReport = {
      id: Date.now(),
      issueType,
      authority,
      address,
      lat: coords.lat,
      lng: coords.lng,
      photoPreview,
      audioUrl: audioBlob ? URL.createObjectURL(audioBlob) : null,
      votes: 0,
      comments: [],
      customIcon,
    };

    setReports((prev) => [newReport, ...prev]);
    setMapCenter([coords.lat, coords.lng]);

    // Reset form
    setAddress("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setAudioBlob(null);
    setCommentTexts((prev) => ({ ...prev, [newReport.id]: "" }));
  }

  // Upvote a report
  function upvote(id) {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, votes: r.votes + 1 } : r))
    );
  }

  // Add comment to a report
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

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", fontFamily: "Arial" }}>
      <h1>CivicPulse</h1>

      <form
        onSubmit={submitReport}
        style={{
          marginBottom: 20,
          padding: 10,
          border: "1px solid #ccc",
          borderRadius: 8,
          background: "#fafafa",
        }}
      >
        <label>
          Issue Type:
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            style={{ marginLeft: 10 }}
          >
            {ISSUE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
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
            {MOCK_AUTHORITIES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <br />
        <br />

        <label>
          Address:
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter complaint location address"
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
            onChange={handlePhotoChange}
            style={{ marginLeft: 10 }}
            required
          />
        </label>
        <br />
        {photoPreview && (
          <img
            src={photoPreview}
            alt="Preview"
            style={{ marginTop: 10, maxWidth: 100, borderRadius: 8 }}
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
          <div>
            <audio
              controls
              src={URL.createObjectURL(audioBlob)}
              style={{ marginTop: 10 }}
            />
          </div>
        )}
        <br />
        <br />

        <button type="submit" style={{ padding: "8px 16px" }}>
          Submit Report
        </button>
      </form>

      <h2>Public Map</h2>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "500px", borderRadius: 10 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {reports.map(
          ({
            id,
            lat,
            lng,
            issueType,
            authority,
            address,
            photoPreview,
            audioUrl,
            votes,
            comments,
            customIcon,
          }) => (
            <Marker key={id} position={[lat, lng]} icon={customIcon}>
              <Popup>
                <strong>{issueType}</strong> <br />
                <em>Authority: {MOCK_AUTHORITIES.find((a) => a.id === authority)?.name}</em>
                <br />
                <small>{address}</small>
                <br />
                <img
                  src={photoPreview}
                  alt="Complaint"
                  style={{ width: "100%", marginTop: 10, borderRadius: 8 }}
                />
                <br />
                {audioUrl && (
                  <audio
                    controls
                    src={audioUrl}
                    style={{ marginTop: 10, width: "100%" }}
                  />
                )}
                <br />
                Votes: {votes}{" "}
                <button onClick={() => upvote(id)} style={{ marginLeft: 10 }}>
                  Upvote
                </button>
                <div style={{ marginTop: 10 }}>
                  <strong>Comments:</strong>
                  {comments.length === 0 && <div>No comments yet.</div>}
                  {comments.map((c, i) => (
                    <div key={i} style={{ marginLeft: 10 }}>
                      - {c}
                    </div>
                  ))}
                  <input
                    type="text"
                    value={commentTexts[id] || ""}
                    onChange={(e) =>
                      setCommentTexts((prev) => ({ ...prev, [id]: e.target.value }))
                    }
                    placeholder="Add a comment"
                    style={{ width: "90%", marginTop: 6 }}
                  />
                  <button onClick={() => addComment(id)} style={{ marginLeft: 6 }}>
                    Add
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        )}
      </MapContainer>
    </div>
  );
}

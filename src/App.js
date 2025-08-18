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
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [commentTexts, setCommentTexts] = useState({}); // One comment field per report

  // Geolocation with error handling
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

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

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
      console.error("Microphone permission denied or not available:", error);
      alert("Microphone access is required to record audio.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

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

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>CivicPulse</h1>

      <form onSubmit={submitReport}>
        <label>Issue Type:</label>
        <select value={issueType} onChange={(e) => setIssueType(e.target.value)}>
          {ISSUE_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>

        <br /><br />

        <label>Authority:</label>
        <select value={authority} onChange={(e) => setAuthority(e.target.value)}>
          {MOCK_AUTHORITIES.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <br /><br />

        <label>Photo:</label>
        <input type="file" accept="image/*" onChange={handlePhoto} />
        {photoPreview && <img src={photoPreview} alt="preview" width="100" style={{ display: "block", marginTop: "10px" }} />}

        <br /><br />

        <label>Voice Description:</label>
        <button type="button" onClick={recording ? stopRecording : startRecording}>
          {recording ? "Stop Recording" : "Start Recording"}
        </button>
        {audioBlob && (
          <div>
            <audio controls src={URL.createObjectURL(audioBlob)} style={{ marginTop: "10px" }} />
          </div>
        )}

        <br /><br />

        <button type="submit">Submit Report</button>
      </form>

      <h2>Public Map</h2>
      <MapContainer center={[location.lat, location.lng]} zoom={13} style={{ height: "400px" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          errorTileUrl="https://upload.wikimedia.org/wikipedia/commons/d/d1/Image_not_available.png"
        />
        <LocationPicker onSelect={(latlng) => setLocation(latlng)} />
        {reports.map((r) => (
          <Marker key={r.id} position={[r.lat, r.lng]}>
            <Popup>
              <strong>{r.type}</strong><br />
              Votes: {r.votes}<br />
              {r.photo && <img src={r.photo} alt="Report" width="100" />}
              {r.audio && (
                <div>
                  <audio controls src={r.audio} />
                </div>
              )}
              <br />
              <button onClick={() => upvote(r.id)}>Upvote</button>
              <div style={{ marginTop: "10px" }}>
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
                />
                <button onClick={() => addComment(r.id)}>Add</button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
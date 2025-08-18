import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icon issues in some bundlers
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
  const [commentText, setCommentText] = useState("");

  // Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
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
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
      stream.getTracks().forEach((t) => t.stop());
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current.stop();
    setRecording(false);
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
    setCommentText("");
  }

  function upvote(id) {
    setReports(reports.map(r => r.id === id ? { ...r, votes: r.votes + 1 } : r));
  }

  function addComment(id) {
    if (!commentText.trim()) return;
    setReports(reports.map(r =>
      r.id === id ? { ...r, comments: [...r.comments, commentText] } : r
    ));
    setCommentText("");
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>CivicPulse</h1>
      <form onSubmit={submitReport}>
        <label>Issue Type: </label>
        <select value={issueType} onChange={(e) => setIssueType(e.target.value)}>
          {ISSUE_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <br /><br />

        <label>Authority: </label>
        <select value={authority} onChange={(e) => setAuthority(e.target.value)}>
          {MOCK_AUTHORITIES.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <br /><br />

        <label>Photo: </label>
        <input type="file" accept="image/*" onChange={handlePhoto} />
        {photoPreview && <img src={photoPreview} alt="preview" width="100" />}
        <br /><br />

        <label>Voice Description: </label>
        <button type="button" onClick={recording ? stopRecording : startRecording}>
          {recording ? "Stop" : "Record"}
        </button>
        {audioBlob && <audio controls src={URL.createObjectURL(audioBlob)} />}
        <br /><br />

        <button type="submit">Submit Report</button>
      </form>

      <h2>Public Map</h2>
      <MapContainer center={[location.lat, location.lng]} zoom={13} style={{ height: "400px" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationPicker onSelect={(latlng) => setLocation(latlng)} />
        {reports.map(r => (
          <Marker key={r.id} position={[r.lat, r.lng]}>
            <Popup>
              <strong>{r.type}</strong><br />
              Votes: {r.votes}
              {r.photo && <img src={r.photo} alt="" width="100" />}
              {r.audio && <audio controls src={r.audio} />}
              <br />
              <button onClick={() => upvote(r.id)}>Upvote</button>
              <div>
                Comments:
                {r.comments.map((c, i) => <div key={i}>- {c}</div>)}
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                <button onClick={() => addComment(r.id)}>Add</button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function CivicPulse() {
  // Form state
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [issueType, setIssueType] = useState("Pothole");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // All reports stored here
  const [reports, setReports] = useState([]);

  // Handle image upload and preview
  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  // Add new report with custom icon from uploaded image
  function addReport(e) {
    e.preventDefault();

    // Validate lat/lng numbers
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      alert("Please enter valid latitude and longitude values.");
      return;
    }

    if (!photoPreview) {
      alert("Please upload an image for the complaint.");
      return;
    }

    // Create a custom Leaflet icon using the uploaded image
    const customIcon = L.icon({
      iconUrl: photoPreview,
      iconSize: [50, 50], // size of the icon
      iconAnchor: [25, 50], // point of the icon which will correspond to marker's location
      popupAnchor: [0, -50], // point from which the popup should open relative to the iconAnchor
      className: "custom-marker-icon",
    });

    // New report object
    const newReport = {
      id: Date.now(),
      lat: latitude,
      lng: longitude,
      issueType,
      photoPreview,
      customIcon,
    };

    setReports((prev) => [newReport, ...prev]);

    // Reset form
    setLat("");
    setLng("");
    setPhotoFile(null);
    setPhotoPreview(null);
  }

  // Map center fallback
  const centerPosition = reports.length
    ? [reports[0].lat, reports[0].lng]
    : [20, 0]; // somewhere neutral if no reports yet

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", fontFamily: "Arial" }}>
      <h1>CivicPulse: Pin Complaints with Image Markers</h1>

      <form
        onSubmit={addReport}
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
            <option>Pothole</option>
            <option>Garbage</option>
            <option>Streetlight</option>
            <option>Waterlogging</option>
            <option>Other</option>
          </select>
        </label>
        <br />
        <br />

        <label>
          Latitude:
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="e.g., 11.0168"
            style={{ marginLeft: 10, width: 150 }}
            required
          />
        </label>
        <br />
        <br />

        <label>
          Longitude:
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="e.g., 76.9558"
            style={{ marginLeft: 10, width: 150 }}
            required
          />
        </label>
        <br />
        <br />

        <label>
          Upload Photo:
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

        <button type="submit" style={{ padding: "8px 16px" }}>
          Pin Complaint on Map
        </button>
      </form>

      <MapContainer
        center={centerPosition}
        zoom={5}
        style={{ height: "500px", borderRadius: 10 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {reports.map(({ id, lat, lng, issueType, photoPreview, customIcon }) => (
          <Marker key={id} position={[lat, lng]} icon={customIcon}>
            <Popup>
              <strong>{issueType}</strong>
              <br />
              <img
                src={photoPreview}
                alt="Complaint"
                style={{ width: "100%", borderRadius: 8, marginTop: 5 }}
              />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

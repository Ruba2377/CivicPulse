import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function CivicPulse() {
  const [address, setAddress] = useState("");
  const [issueType, setIssueType] = useState("Pothole");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [reports, setReports] = useState([]);
  const [mapCenter, setMapCenter] = useState([20, 0]); // default center

  // Handle photo upload + preview
  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  // Use Nominatim to convert address to lat/lng
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
    } else {
      return null;
    }
  }

  // Add report handler
  async function addReport(e) {
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
      alert("Address not found. Try a different address.");
      return;
    }

    // Create custom icon with uploaded image
    const customIcon = L.icon({
      iconUrl: photoPreview,
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      popupAnchor: [0, -50],
      className: "custom-marker-icon",
    });

    const newReport = {
      id: Date.now(),
      lat: coords.lat,
      lng: coords.lng,
      issueType,
      photoPreview,
      customIcon,
      address,
    };

    setReports((prev) => [newReport, ...prev]);
    setMapCenter([coords.lat, coords.lng]);
    // Reset form
    setAddress("");
    setPhotoFile(null);
    setPhotoPreview(null);
  }

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", fontFamily: "Arial" }}>
      <h1>CivicPulse: Pin Complaints by Address with Image Markers</h1>

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
        center={mapCenter}
        zoom={13}
        style={{ height: "500px", borderRadius: 10 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {reports.map(({ id, lat, lng, issueType, photoPreview, customIcon, address }) => (
          <Marker key={id} position={[lat, lng]} icon={customIcon}>
            <Popup>
              <strong>{issueType}</strong>
              <br />
              {address}
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


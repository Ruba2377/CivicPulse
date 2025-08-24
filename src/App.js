import React, { useState, useRef, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// Fix for default Leaflet icons not showing up in certain environments (like Webpack)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icons for complaints
const markerIcons = {
  New: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  "In Progress": new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  Resolved: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
};

// Custom modal component for displaying messages
const CustomModal = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white text-gray-900 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
        <p className="text-center font-semibold text-lg">{message}</p>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
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

// 3D Background Component with a simplified, elegant cityscape
const Background3D = () => {
  const mountRef = useRef(null);
  
  useEffect(() => {
    // Scene setup
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    // Set renderer size and append to DOM
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    // Create the simplified cityscape
    const buildings = [];
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0x221155, // Dark purple color for buildings
    });
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x8A2BE2, // Blue-violet glow
      blending: THREE.AdditiveBlending
    });

    const numBuildings = 50;
    for (let i = 0; i < numBuildings; i++) {
      const buildingHeight = Math.random() * 8 + 2;
      const building = new THREE.Mesh(geometry, material);
      
      building.scale.set(Math.random() * 1.5 + 0.5, buildingHeight, Math.random() * 1.5 + 0.5);
      
      building.position.set(
        (Math.random() - 0.5) * 40,
        buildingHeight / 2 - 2,
        (Math.random() - 0.5) * 40
      );
      
      // Add a small glowing element on top of each building
      const topLight = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        glowMaterial
      );
      topLight.position.set(
        building.position.x,
        building.position.y + buildingHeight / 2 + 0.5,
        building.position.z
      );
      
      scene.add(building);
      scene.add(topLight);
      buildings.push(building, topLight);
    }
    
    // Set a subtle ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Post-processing setup for the glowing effect
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.4, 0.85); // Reduced bloom intensity
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // Position the camera
    camera.position.set(0, 10, 20);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      if (!currentMount) return;
      requestAnimationFrame(animate);
      
      const time = clock.getElapsedTime();
      
      // Animate the camera to slowly pan across the city
      camera.position.x = Math.sin(time * 0.03) * 15;
      camera.position.z = 20 - (Math.cos(time * 0.03) * 5); // Subtle forward/backward motion
      camera.lookAt(new THREE.Vector3(0, -2, 0));
      
      composer.render();
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    animate();

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      glowMaterial.dispose();
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 z-0 pointer-events-none" />;
};


export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
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

  const [searchResults, setSearchResults] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const showMessage = (message) => {
    setModalMessage(message);
    setShowModal(true);
  };

  // For audio recording
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Login/Signup state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignup, setShowSignup] = useState(false);

  // Checks for existing login status on component mount
  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated");
    const storedUser = localStorage.getItem("userEmail");
    if (authStatus === "true" && storedUser) {
      setIsAuthenticated(true);
      setUserEmail(storedUser);
    }
  }, []);
  
  // New useEffect hook to fetch data from the backend
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        // We use the full URL to the backend server
        const response = await fetch('http://localhost:5000/api/complaints');
        const data = await response.json();
        // Update the complaints state with data from the backend
        setComplaints(data);
      } catch (error) {
        console.error("Failed to fetch complaints from the backend:", error);
        // Fallback to a message if the backend is not running
        showMessage("Failed to load complaints from the server. Is the backend running?");
      }
    };
    // Fetch data only if the user is authenticated
    if (isAuthenticated) {
      fetchComplaints();
    }
  }, [isAuthenticated]); // Rerun the effect when authentication status changes

  // Submit complaint
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.coords) return showMessage("Please select or enter a location");
    const newComplaint = {
      ...form,
      id: Date.now(),
      status: "New",
      reportedBy: userEmail,
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
    showMessage("Complaint submitted successfully!");
  };

  // Get GPS location
  const handleGetCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setForm({ ...form, location: "Current Location", coords });
        setSearchResults([]);
      },
      () => showMessage("Unable to fetch current location")
    );
  };

  // Manual location search
  const handleManualLocation = async () => {
    if (!form.location) return showMessage("Enter a location");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${form.location}`
      );
      const data = await res.json();
      if (data.length > 0) {
        setSearchResults(data);
      } else {
        showMessage("Location not found!");
        setSearchResults([]);
      }
    } catch (err) {
      console.error(err);
      showMessage("Error finding location");
      setSearchResults([]);
    }
  };

  // Handle selection from search results
  const handleSelectLocation = (result) => {
    const coords = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
    setForm({ ...form, coords, location: result.display_name });
    setSearchResults([]);
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
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioURL = URL.createObjectURL(audioBlob);
        setForm({ ...form, audio: audioURL });
      };
      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      showMessage("Microphone access denied or not available");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // Handles Login with a basic credential check
  const handleLogin = (e) => {
    e.preventDefault();
    const storedUser = localStorage.getItem("userEmail");
    const storedPass = localStorage.getItem("userPassword");

    if (loginEmail === storedUser && loginPassword === storedPass) {
      localStorage.setItem("isAuthenticated", "true");
      setIsAuthenticated(true);
      setUserEmail(loginEmail);
      setLoginEmail("");
      setLoginPassword("");
    } else {
      showMessage("Invalid credentials. Please try again or sign up.");
    }
  };

  // Handles Signup by storing new credentials
  const handleSignup = (e) => {
    e.preventDefault();
    if (signupPassword !== signupConfirmPassword) {
      showMessage("Passwords do not match!");
      return;
    }
    const storedUser = localStorage.getItem("userEmail");
    if (storedUser) {
      showMessage("An account already exists. Please log in.");
      return;
    }
    if (signupEmail && signupPassword) {
      localStorage.setItem("userEmail", signupEmail);
      localStorage.setItem("userPassword", signupPassword);
      localStorage.setItem("isAuthenticated", "true");
      setIsAuthenticated(true);
      setUserEmail(signupEmail);
      setSignupEmail("");
      setSignupPassword("");
      setSignupConfirmPassword("");
      setShowSignup(false);
      showMessage("Account created successfully!");
    } else {
      showMessage("Please fill in all fields");
    }
  };

  // Handles Logout and reloads the page to clear the state
  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPassword");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-indigo-900 text-white p-4 relative overflow-hidden">
      <Background3D />
      {showModal && <CustomModal message={modalMessage} onClose={() => setShowModal(false)} />}
      
      {isAuthenticated ? (
        <>
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold">🚨 CivicPulse</h1>
              <p className="hidden md:block text-sm text-gray-300">Logged in as: {userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 p-3 rounded-xl font-bold transition-transform transform hover:scale-105"
            >
              Logout
            </button>
          </div>
          {/* Complaint Form */}
          <form
            onSubmit={handleSubmit}
            className="relative z-10 bg-white/20 backdrop-blur-md p-6 rounded-2xl shadow-lg max-w-2xl mx-auto"
          >
            <input
              type="text"
              placeholder="Complaint Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2 mb-3 rounded bg-white/10 text-white placeholder-gray-300 border border-gray-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500"
              required
            />
            <textarea
              placeholder="Describe your complaint"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-2 mb-3 rounded bg-white/10 text-white placeholder-gray-300 border border-gray-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500"
              required
            />
            <select
              value={form.urgency}
              onChange={(e) => setForm({ ...form, urgency: e.target.value })}
              className="w-full p-2 mb-3 rounded bg-white/10 text-white border border-gray-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Low">Low Urgency</option>
              <option value="Medium">Medium Urgency</option>
              <option value="High">High Urgency</option>
            </select>
            <div className="flex gap-2 mb-3 relative">
              <input
                type="text"
                placeholder="Enter location manually"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="flex-1 p-2 rounded bg-white/10 text-white placeholder-gray-300 border border-gray-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleManualLocation}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Use GPS
              </button>
              {searchResults.length > 0 && (
                <ul className="absolute top-full left-0 right-0 z-10 bg-gray-800 border border-gray-700 mt-2 rounded-lg max-h-48 overflow-y-auto shadow-xl">
                  {searchResults.map((result) => (
                    <li
                      key={result.place_id}
                      onClick={() => handleSelectLocation(result)}
                      className="p-2 cursor-pointer hover:bg-gray-700 border-b border-gray-700 last:border-b-0"
                    >
                      {result.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                setForm({ ...form, images: Array.from(e.target.files) })
              }
              className="w-full p-2 mb-3 bg-white/10 rounded border border-gray-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500"
            />
            <div className="mb-3">
              {!recording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg mr-2"
                >
                  🎙 Start Recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg"
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
          <div className="mt-6 h-[70vh] rounded-2xl overflow-hidden shadow-lg relative z-10">
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              className="h-full w-full"
            >
              <TileLayer
                attribution="© OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationSelector
                onSelect={(coords) =>
                  setForm({ ...form, coords, location: "Pinned Location" })
                }
              />
              {complaints.map((c) => (
                <Marker
                  key={c.id}
                  position={c.coords}
                  icon={markerIcons[c.status]}
                >
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
              {form.coords && (
                <Marker
                  position={form.coords}
                  icon={L.Icon.Default.prototype}
                ></Marker>
              )}
            </MapContainer>
          </div>
        </>
      ) : (
        <div className="max-w-md mx-auto p-6 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg relative z-10">
          <h2 className="text-3xl font-bold text-center mb-6 text-indigo-200">
            {showSignup ? "Sign Up" : "Login"}
          </h2>
          <form
            onSubmit={showSignup ? handleSignup : handleLogin}
            className="flex flex-col gap-4"
          >
            <input
              type="email"
              placeholder="Email"
              value={showSignup ? signupEmail : loginEmail}
              onChange={(e) =>
                showSignup
                  ? setSignupEmail(e.target.value)
                  : setLoginEmail(e.target.value)
              }
              className="p-3 rounded-lg bg-white/10 text-white placeholder-gray-300 border border-gray-700 focus:border-indigo-400 focus:ring-2 focus:ring-ring-indigo-500"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={showSignup ? signupPassword : loginPassword}
              onChange={(e) =>
                showSignup
                  ? setSignupPassword(e.target.value)
                  : setLoginPassword(e.target.value)
              }
              className="p-3 rounded-lg bg-white/10 text-white placeholder-gray-300 border border-gray-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500"
              required
            />
            {showSignup && (
              <input
                type="password"
                placeholder="Confirm Password"
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                className="p-3 rounded-lg bg-white/10 text-white placeholder-gray-300 border border-gray-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500"
                required
              />
            )}
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 p-3 rounded-xl font-bold transition duration-300"
            >
              {showSignup ? "Sign Up" : "Login"}
            </button>
          </form>
          <p className="mt-4 text-center text-gray-300">
            {showSignup ? "Already have an account? " : "Don't have an account? "}
            <button
              onClick={() => setShowSignup(!showSignup)}
              className="text-indigo-300 hover:underline"
            >
              {showSignup ? "Login" : "Sign Up"}
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

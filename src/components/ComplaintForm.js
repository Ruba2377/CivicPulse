import { useState } from "react";
import api from "../api";

export default function ComplaintForm({ onComplaintAdded }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/complaints", { title, description });
      onComplaintAdded(res.data);
      setTitle("");
      setDescription("");
    } catch (err) {
      console.error(err);
      alert("Error submitting complaint");
    }
  };

  return (
    <div className="bg-white shadow-2xl rounded-2xl p-6 max-w-lg mx-auto mt-8">
      <h2 className="text-2xl font-bold text-indigo-600 mb-4">Submit a Complaint</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Complaint Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
        />
        <textarea
          placeholder="Describe your issue..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-xl shadow-lg hover:bg-indigo-700 transition"
        >
          Submit
        </button>
      </form>
    </div>
  );
}

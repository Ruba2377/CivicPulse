import { useEffect, useState } from "react";
import api from "../api";

export default function ComplaintList({ newComplaint }) {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await api.get("/complaints");
        setComplaints(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchComplaints();
  }, []);

  useEffect(() => {
    if (newComplaint) {
      setComplaints((prev) => [newComplaint, ...prev]);
    }
  }, [newComplaint]);

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <h2 className="text-2xl font-bold text-gray-700 mb-4">All Complaints</h2>
      {complaints.map((c) => (
        <div
          key={c._id}
          className="bg-white p-4 shadow-lg rounded-xl mb-3 border-l-4 border-indigo-500"
        >
          <h3 className="text-lg font-semibold">{c.title}</h3>
          <p className="text-gray-600">{c.description}</p>
        </div>
      ))}
    </div>
  );
}

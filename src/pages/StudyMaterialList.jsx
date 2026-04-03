import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import "../styles/studyMaterial.css";
import api from "../api/apiClient";

export default function StudyMaterialList() {

  const navigate = useNavigate();
  const { subjectId } = useParams();

  const [chaptersData, setChaptersData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {

    if (!subjectId) return;

    api.get(`/materials/subjects/${subjectId}/materials/`)
      .then((res) => {

        const materials = res.data.map((item) => {

          return {
            id: item.id,

            // ✅ FIXED MAPPING
            chapter: item.chapter_title || "No chapter",
            topic: item.title,
            date: new Date(item.created_at).toLocaleDateString(),
            filesCount: item.files?.length || 0
          };

        });

        setChaptersData(materials);

      })
      .catch((err) => {
        console.error("Failed to fetch study materials:", err);
      });

  }, [subjectId]);

  const handleView = (item) => {
    navigate(`/study-material/view/${item.id}`);
  };

  const filteredChapters = chaptersData.filter((item) =>
    item.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="studyMaterialPage">

      <button
        className="studyMaterialBack"
        onClick={() => navigate(-1)}
      >
        &lt; Back
      </button>

      <div className="studyMaterialHeaderBox">
        <PageHeader title="Study Material" onSearch={setSearchTerm} />
      </div>

      <div className="studyMaterialBodyBox">
        <div className="studyMaterialContent">

          {/* Desktop Table */}
          <div className="studyMaterialTableWrap">
            <table className="studyMaterialTable">

              <thead>
                <tr>
                  <th>Chapter</th>       {/* ✅ */}
                  <th>Topic</th>         {/* ✅ */}
                  <th>Upload Date</th>   {/* ✅ */}
                  <th>Files</th>         {/* ✅ */}
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredChapters.map((item) => (
                  <tr key={item.id}>
                    <td>{item.chapter}</td>
                    <td>{item.topic}</td>
                    <td>{item.date}</td>
                    <td>{item.filesCount}</td>

                    <td className="studyMaterialActions">

                      <button
                        className="studyMaterialViewBtn"
                        onClick={() => handleView(item)}
                      >
                        View
                      </button>

                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>

          {/* Mobile Cards */}
          <div className="studyMaterialMobile">

            <div className="studyMaterialMobileHeader">
              <span>Topic</span>
              <span>Date</span>
            </div>

            {filteredChapters.map((item) => (
              <div key={item.id} className="studyMaterialCard">

                <div className="studyMaterialCardTop">
                  <p className="studyMaterialCardTitle">
                    {item.topic}
                  </p>
                  <p className="studyMaterialCardDate">
                    {item.date}
                  </p>
                </div>

                <div className="studyMaterialCardActions">

                  <button
                    className="viewBtn"
                    onClick={() => handleView(item)}
                  >
                    View
                  </button>

                </div>

              </div>
            ))}

          </div>

        </div>
      </div>

    </div>
  );
}

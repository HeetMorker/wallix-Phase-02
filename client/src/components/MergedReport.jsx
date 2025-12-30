import axios from "axios";
import { useEffect, useState } from "react";

const MergedReport = () => {
  const [report, setReport] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await axios.get("/api/report/fetch-report");
        setReport(response.data);
      } catch (error) {
        setError("Failed to fetch report");
      }
    };

    fetchReport();
  }, []);

  return (
    <div>
      <h1>Merged Report</h1>
      {error && <p>{error}</p>}
      <table>
        <thead>
          <tr>
            <th>User Group</th>
            <th>Target Group</th>
            <th>Devices</th>
            <th>Host</th>
            <th>Protocol</th>
            <th>Users</th>
          </tr>
        </thead>
        <tbody>
          {report.map((item, index) => (
            <tr key={index}>
              <td>{item.user_group}</td>
              <td>{item.target_group}</td>
              <td>{item.devices}</td>
              <td>{item.host}</td>
              <td>{item.protocol}</td>
              <td>{item.users}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MergedReport;

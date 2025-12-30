import React, { useState } from "react";
import ScheduleReportForm from "./ScheduleReportForm";
import ScheduledReportsList from "./ScheduledReportsList";

const AdminReportScheduler = () => {
  const [editingSchedule, setEditingSchedule] = useState(null);

  return (
    <div>
      {/* <h2>Automated Report Scheduling</h2> */}
      <ScheduleReportForm
        editingData={editingSchedule}
        onSave={() => setEditingSchedule(null)}
      />
      <hr style={{ margin: "2rem 0" }} />
      <ScheduledReportsList onEdit={setEditingSchedule} />
    </div>
  );
};

export default AdminReportScheduler;

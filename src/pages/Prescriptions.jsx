import React from "react";
import "./Prescriptions.css";

const Prescriptions = () => {
  return (
    <div className="page-container">
      <div className="topbar">
        <h2>Welcome back, Emily 👋</h2>
        <div className="user">Profile</div>
      </div>

      {/* Medical Prescription */}
      <section className="prescription-section">
        <h1 className="section-title">Medical Prescription</h1>

        {/* Doctor Info */}
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">Doctor Name</div>
            <div className="info-value">Dr. Sarah Johnson</div>
          </div>
          <div className="info-item">
            <div className="info-label">License No.</div>
            <div className="info-value">MD-12345-2024</div>
          </div>
          <div className="info-item">
            <div className="info-label">Date</div>
            <div className="info-value">November 6, 2025</div>
          </div>
          <div className="info-item">
            <div className="info-label">Prescription ID</div>
            <div className="info-value">RX-2025-001234</div>
          </div>
        </div>

        <hr className="divider" />

        {/* Patient Details */}
        <h1 className="section-title">Patient Details</h1>
        <div className="patient-grid">
          <div className="info-item">
            <div className="info-label">Patient Name</div>
            <div className="info-value">John Michael Smith</div>
          </div>
          <div className="info-item">
            <div className="info-label">Age/Gender</div>
            <div className="info-value">45 Years / Male</div>
          </div>
          <div className="info-item">
            <div className="info-label">Patient ID</div>
            <div className="info-value">PT-789456</div>
          </div>
          <div className="info-item">
            <div className="info-label">Blood Group</div>
            <div className="info-value">O+ Positive</div>
          </div>
          <div className="info-item">
            <div className="info-label">Weight/Height</div>
            <div className="info-value">75 kg / 175 cm</div>
          </div>
          <div className="info-item">
            <div className="info-label">Contact</div>
            <div className="info-value">+91 98765 43210</div>
          </div>
        </div>

        <hr className="divider" />

        {/* Consultation Summary */}
        <h1 className="section-title">Consultation Summary</h1>
        <div className="content-box">
          <div className="content">
            <p>
              <strong>Chief Complaint:</strong> Patient presented with persistent headaches and
              mild fever for the past 3 days.
            </p>
            <br />
            <p>
              <strong>History:</strong> Patient reports headaches started after stressful work
              week. Experiencing mild fever (99–100°F) in evenings. No history
              of similar episodes. Patient is taking adequate rest but
              symptoms persist.
            </p>
            <br />
            <p>
              <strong>Examination Findings:</strong> Temperature 99.5°F, Blood Pressure
              128/82 mmHg, Pulse 78 bpm. Physical examination reveals mild
              tension in neck muscles. No other abnormalities detected.
            </p>
          </div>
        </div>

        <hr className="divider" />

        {/* Diagnosed Issues */}
        <h1 className="section-title">Diagnosed Issues</h1>
        <div className="diagnosis-list">
          <div className="diagnosis-item">
            <div className="diagnosis-number">1</div>
            <div className="diagnosis-text">
              Tension Headache - Related to stress and muscle tension in neck and shoulder region
            </div>
          </div>
          <div className="diagnosis-item">
            <div className="diagnosis-number">2</div>
            <div className="diagnosis-text">
              Mild Viral Fever - Low-grade fever suggesting possible viral infection
            </div>
          </div>
          <div className="diagnosis-item">
            <div className="diagnosis-number">3</div>
            <div className="diagnosis-text">
              Work-Related Stress - Contributing factor to tension headaches
            </div>
          </div>
        </div>

        <hr className="divider" />

        {/* Prescription Table */}
        <h1 className="section-title">Prescription</h1>
        <div className="table-container">
          <table className="prescription-table">
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th>Instructions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Paracetamol 500mg</td>
                <td>1 Tablet</td>
                <td>3 times daily</td>
                <td>5 days</td>
                <td>After meals</td>
              </tr>
              <tr>
                <td>Ibuprofen 400mg</td>
                <td>1 Tablet</td>
                <td>2 times daily</td>
                <td>3 days</td>
                <td>After meals (if headache persists)</td>
              </tr>
              <tr>
                <td>Vitamin B-Complex</td>
                <td>1 Tablet</td>
                <td>Once daily</td>
                <td>15 days</td>
                <td>After breakfast</td>
              </tr>
              <tr>
                <td>Muscle Relaxant (Chlorzoxazone 250mg)</td>
                <td>1 Tablet</td>
                <td>At bedtime</td>
                <td>5 days</td>
                <td>Before sleep</td>
              </tr>
            </tbody>
          </table>
        </div>

        <hr className="divider" />

        {/* Additional Notes */}
        <h1 className="section-title">Additional Notes</h1>
        <div className="content-box">
          <ul className="notes-list">
            <li>Ensure adequate hydration - drink at least 8-10 glasses of water daily</li>
            <li>Get proper rest and maintain regular sleep schedule (7-8 hours)</li>
            <li>Apply warm compress on neck and forehead for headache relief</li>
            <li>Avoid screen time and bright lights during headache episodes</li>
            <li>Practice stress management techniques - meditation or light exercise</li>
            <li>Follow up if symptoms worsen or persist beyond 5 days</li>
            <li>Return immediately if fever exceeds 101°F or severe symptoms develop</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default Prescriptions;

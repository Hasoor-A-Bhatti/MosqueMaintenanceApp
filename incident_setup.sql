USE MosqueDatabase;
CREATE TABLE IncidentReport (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    incident_date DATE NOT NULL,
    incident_time TIME NOT NULL,
    description TEXT NOT NULL,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

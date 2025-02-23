USE MosqueDatabase;

-- Create MosqueProfile Table
CREATE TABLE MosqueProfile (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    worship_capacity INT NOT NULL,
    car_park_capacity INT NOT NULL,
    accommodation_capacity INT NOT NULL,
    current_accommodation_level INT NOT NULL
);

CREATE TABLE CleaningSessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    khuddams INT NOT NULL CHECK (khuddams > 0),
    mosque_id INT NOT NULL,
    description TEXT NOT NULL,
    FOREIGN KEY (mosque_id) REFERENCES MosqueProfile(id) ON DELETE CASCADE
);

INSERT INTO CleaningSessions (date, time, khuddams, mosque_id, description)
VALUES ('2024-02-08', '10:30:00', 5, 1, 'Cleaned prayer hall and wudu area.');

CREATE TABLE MaintainanceTasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    mosque_id INT NOT NULL,
    description TEXT NOT NULL,
    urgency TINYINT(1) NOT NULL,  -- Use 1 for urgent, 0 for normal
    budget DECIMAL(10,2) NOT NULL,  -- New budget field
    FOREIGN KEY (mosque_id) REFERENCES MosqueProfile(id) ON DELETE CASCADE
);


INSERT INTO MaintainanceTasks (title, date, mosque_id, description, urgency, budget)
VALUES ('Fix Broken Fence', '2024-02-08', 1, 'Fix broken fencing near entrance.', 1, 500.00);

-- Create MeetingFacility Table

CREATE TABLE MeetingFacility (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mosque_id INT NOT NULL,
    name VARCHAR(255) NOT NULL UNIQUE,
    accommodation_capacity INT NOT NULL,
    current_accommodation_level INT NOT NULL,
    FOREIGN KEY (mosque_id) REFERENCES MosqueProfile(id) ON DELETE CASCADE
);

-- Create HallBooking Table
CREATE TABLE HallBooking (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mosque_id INT NOT NULL,
    facility_id INT NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    duration INT NOT NULL,
    attendance INT NOT NULL,  -- Fixed spelling here
    description VARCHAR(255) NOT NULL,
    booking_status ENUM('APPROVED', 'REJECTED', 'PENDING') NOT NULL,
    FOREIGN KEY (mosque_id) REFERENCES MosqueProfile(id) ON DELETE CASCADE,
    FOREIGN KEY (facility_id) REFERENCES MeetingFacility(id) ON DELETE CASCADE
);

-- Insert Mosques
INSERT INTO MosqueProfile (name, worship_capacity, car_park_capacity, accommodation_capacity, current_accommodation_level)
VALUES 
    ('Mubarak Mosque', 500, 100, 50, 30),
    ('Fazl Mosque', 700, 150, 70, 40),
    ('Aiwan-e-Mahmood', 0, 20, 50, 10),
    ('Sara-e-Masroor', 0, 2, 12, 4);

-- Check Mosque IDs
SELECT * FROM MosqueProfile;

-- Manually Insert Meeting Facilities (Retrieve Mosque IDs First)
INSERT INTO MeetingFacility (mosque_id, name, accommodation_capacity, current_accommodation_level)
VALUES 
    (1, 'Masroor Hall', 100, 50),  -- Assuming Mubarak Mosque has ID 1
    (2, 'Mahmood Hall', 150, 80),  -- Assuming Fazl Mosque has ID 2
    (2, 'Nusrat Hall', 120, 60);   -- Fazl Mosque also has this hall

-- Check MeetingFacility IDs
SELECT * FROM MeetingFacility;

-- Insert Hall Bookings (Manually Enter IDs)
INSERT INTO HallBooking (mosque_id, facility_id, booking_date, booking_time, duration, attendance, description, booking_status)
VALUES 
    (1, 1, '2024-02-10', '14:00:00',2, 50, 'Wedding', 'APPROVED'),
    (2, 2, '2024-02-12', '16:30:00',1, 80, 'Atfal Class', 'REJECTED'),
    (2, 3, '2024-02-14', '18:00:00',6, 60, 'Local Ijtema', 'PENDING');

-- Verify Everything
SELECT * FROM MosqueProfile;
SELECT * FROM MeetingFacility;
SELECT * FROM HallBooking;


CREATE TABLE IncidentReport (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    incident_date DATE NOT NULL,
    incident_time TIME NOT NULL,
    description TEXT NOT NULL,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

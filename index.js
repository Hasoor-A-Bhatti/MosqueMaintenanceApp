const express = require('express');
const ejs = require('ejs');
const util = require('util');
const bodyParser = require('body-parser');
const mysql = require('mysql');
//-------------------------------------------------------------------------------
const db = mysql.createConnection({
    host: 'siteofficebookings.cfssi26qey3l.eu-north-1.rds.amazonaws.com',
    port:"3306",
    user: 'admin',
    password: 'SiteBookings2024',
    database: 'MosqueDatabase'
});
db.query = util.promisify(db.query).bind(db);
//-------------------------------------------------------------------------------
const PORT = 8000;
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended:false }));
//-------------------------------------------------------------------------------

app.get('/', async (req, res) => {
    console.log("STARTING");
    res.render('home');
});

app.get('/mosque_profile', async (req, res) => {
    const mosques = await db.query('SELECT * FROM MosqueProfile');
    res.render('mosque_profile', {Mosques: mosques});
});

app.get('/cleaning_sessions', async (req, res) => {
    try {
        const mosques = await db.query('SELECT * FROM MosqueProfile');
        const successMessage = req.query.success || "";  // Read success message if present
        res.render('cleaning_sessions', { Mosques: mosques, successMessage });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading cleaning sessions page.");
    }
});



app.post('/submit-cleaning-session', async (req, res) => {
    const { date, time, khuddams, location, description } = req.body;

    try {
        await db.query(
            'INSERT INTO CleaningSessions (date, time, khuddams, mosque_id, description) VALUES (?, ?, ?, ?, ?)',
            [date, time, khuddams, location, description]
        );
        res.redirect('/cleaning_sessions?success=Cleaning session added successfully!');
    } catch (error) {
        console.error(error);
        res.status(500).send("Error saving cleaning session.");
    }
});



app.get('/maintenance_tasks', async (req, res) => {
    try {
        const mosques = await db.query('SELECT * FROM MosqueProfile'); // Fetch mosques
        const tasks = await db.query('SELECT * FROM MaintainanceTasks ORDER BY date ASC'); // Fetch tasks
        const successMessage = req.query.success || "";  // Read success message if present
        res.render('maintenance_tasks', { Mosques: mosques, Tasks: tasks, successMessage});
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/submit-maintenance-task', async (req, res) => {
    const { title, date, mosque_id, description, urgency, budget } = req.body;

    try {
        // Convert urgency to an integer (0 or 1)
        const urgencyValue = urgency === "1" ? 1 : 0;
        
        // Ensure budget is a valid number
        const budgetValue = parseFloat(budget);
        if (isNaN(budgetValue) || budgetValue < 0) {
            return res.status(400).send("Invalid budget amount.");
        }

        // Insert into database
        await db.query(
            'INSERT INTO MaintainanceTasks (title, date, mosque_id, description, urgency, budget) VALUES (?, ?, ?, ?, ?, ?)',
            [title, date, mosque_id, description, urgencyValue, budgetValue]
        );

        res.redirect('/maintenance_tasks?success=Maintenance Task added successfully!');
    } catch (error) {
        console.error("Error inserting maintenance task:", error);
        res.status(500).send("Error saving maintenance session.");
    }
});


app.get('/bookings', async (req, res) => {
    try {
        // Fetch mosques and halls
        const halls = await db.query(`
            SELECT mf.id AS facility_id, mf.name AS hall_name, m.id AS mosque_id, m.name AS mosque_name
            FROM MeetingFacility mf
            JOIN MosqueProfile m ON mf.mosque_id = m.id
        `);

        // Fetch existing bookings
        const bookings = await db.query(`
            SELECT hb.id, m.name AS mosque_name, mf.name AS hall_name, hb.booking_date, hb.booking_time, hb.duration, hb.attendance, hb.description, hb.booking_status
            FROM HallBooking hb
            JOIN MosqueProfile m ON hb.mosque_id = m.id
            JOIN MeetingFacility mf ON hb.facility_id = mf.id
            WHERE hb.booking_status IN ('PENDING', 'APPROVED')
            ORDER BY hb.booking_date ASC, hb.booking_time ASC
        `);

        res.render('bookings', { Halls: halls, Bookings: bookings, successMessage: "", errorMessage: "" });

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/submit-booking', async (req, res) => {
    const { facility_id, attendence, booking_date, booking_time, duration, attendance, description } = req.body;

    let spaceIndex = facility_id.split(" ");
    hall_id = facility_id.substring(0, spaceIndex);
    mosque_id = facility_id.substring(spaceIndex + 1);

    try {
        // Convert duration to integer
        const bookingDuration = parseInt(duration, 10);

        // Convert start time to JavaScript Date object
        const newBookingStart = new Date(`${booking_date}T${booking_time}`);
        const newBookingEnd = new Date(newBookingStart.getTime() + bookingDuration * 60000); // Add duration

        // Fetch existing bookings for this hall on the same date
        const [existingBookings] = await db.query(`
            SELECT booking_time, duration FROM HallBooking 
            WHERE facility_id = ? 
            AND booking_date = ? 
            AND booking_status IN ('APPROVED', 'PENDING')
        `, [facility_id, booking_date]);

        console.log("Existing bookings:", existingBookings);
        
        if (existingBookings != undefined){
            // Check for time clashes
            let conflictFound = existingBookings.some(booking => {
                const existingStart = new Date(`${booking_date}T${booking.booking_time}`);
                const existingEnd = new Date(existingStart.getTime() + booking.duration * 60000);

                // Conflict if the new booking starts inside an existing booking OR ends inside an existing booking
                return (newBookingStart < existingEnd && newBookingEnd > existingStart);
            });

            if (conflictFound) {
                console.log("Time conflict detected!");
                return res.render('Booking', { successMessage: "", errorMessage: "This time slot is already booked!" });
            }
        }
        // Proceed with inserting the new booking as PENDING
        await db.query(`
            INSERT INTO HallBooking (mosque_id, facility_id, booking_date, booking_time, duration, attendance, description, booking_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
        `, [+mosque_id, +hall_id, booking_date, booking_time, +bookingDuration, +attendence, description]);

        console.log("Booking successfully inserted.");
        res.redirect('/booking?success=Booking request submitted successfully!');

    } catch (error) {
        console.error('Error processing booking:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/incidents', async (req, res) => {
    try {
        const successMessage = req.query.success || ""; 
        // Fetch all reported incidents
        res.render('incidents', {successMessage: successMessage});

    } catch (error) {
        console.error('Error fetching incidents:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/submit-incident', async (req, res) => {
    const { title, incident_date, incident_time, description } = req.body;

    try {
        // Insert the new incident
        await db.query(`
            INSERT INTO IncidentReport (title, incident_date, incident_time, description)
            VALUES (?, ?, ?, ?)
        `, [title, incident_date, incident_time, description]);

        res.redirect('/incidents?success=Incident reported successfully!');

    } catch (error) {
        console.error('Error reporting incident:', error);
        res.status(500).send('Error processing incident report.');
    }
});

app.get('/administration', async (req, res) => {
    try {
        const mosques = await db.query("SELECT * FROM MosqueProfile");
        const cleaningSessions = await db.query("SELECT * FROM CleaningSessions");
        const maintenanceTasks = await db.query("SELECT * FROM MaintainanceTasks");
        const facilities = await db.query("SELECT * FROM MeetingFacility");
        const bookings = await db.query("SELECT * FROM HallBooking");
        const incidents= await db.query("SELECT * FROM IncidentReport");

        res.render('administration', {
            Mosques: mosques || [],
            CleaningSessions: cleaningSessions || [],
            MaintenanceTasks: maintenanceTasks || [],
            Facilities: facilities || [],
            Bookings: bookings || [],
            Incidents: incidents || []
        });

    } catch (error) {
        console.error("Error fetching administration data:", error);
        res.status(500).send("Internal Server Error");
    }
});






app.listen(PORT, () => {
    console.log(`listening on port http://localhost:${PORT}`);
});
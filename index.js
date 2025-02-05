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
    database: 'toolBookingsDB'
});
db.query = util.promisify(db.query).bind(db);
//-------------------------------------------------------------------------------
const PORT = 8000;
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended:false }));
//-------------------------------------------------------------------------------

function getToolsFromDB(){
    const results = db.query(`SELECT * FROM tools`, (err, results) => {
        console.log(results);
    });

    console.log(results);
}
//-------------------------------------------------------------------------------
//getToolsFromDB();


app.get('/', async (req, res) => {
    console.log("STARTING");
    returnAllActiveBookings();
    //getKhuddams();
    getTools();
    res.render('index');
    //console.log(tools);
});
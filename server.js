const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, "data.json");

// Read JSON
function readData() {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

// Save JSON
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Validation
function validate(record) {

    if (!record.chamber_id || record.chamber_id.trim() === "") {
        return "Chamber ID is required.";
    }

    if (
        record.temperature_c !== null &&
        (
            isNaN(record.temperature_c) ||
            record.temperature_c < -20 ||
            record.temperature_c > 50
        )
    ) {
        return "Temperature must be between -20°C and 50°C.";
    }

    const doorStates = ["Open", "Closed", "Unknown"];

    if (!doorStates.includes(record.door_state)) {
        return "Invalid door state.";
    }

    if (typeof record.alarm_flag !== "boolean") {
        return "Alarm flag must be true or false.";
    }

    return null;
}

// GET all records
app.get("/api/readings", (req, res) => {

    let data = readData();

    const chamber = req.query.chamber;
    const alarm = req.query.alarm;

    if (chamber) {
        data = data.filter(r =>
            r.chamber_id
            .toLowerCase()
            .includes(chamber.toLowerCase())
        );
    }

    if (alarm === "true") {
        data = data.filter(r => r.alarm_flag);
    }

    if (alarm === "false") {
        data = data.filter(r => !r.alarm_flag);
    }

    res.json(data);

});

// GET single record
app.get("/api/readings/:id", (req, res) => {

    const data = readData();

    const record = data.find(
        r => r.reading_id == req.params.id
    );

    if (!record) {

        return res.status(404).json({

            success: false,
            message: "Record not found."

        });

    }

    res.json(record);

});

// CREATE
app.post("/api/readings", (req, res) => {

    const error = validate(req.body);

    if (error) {

        return res.status(400).json({

            success: false,
            message: error

        });

    }

    const data = readData();

    req.body.reading_id =
        data.length > 0
            ? data[data.length - 1].reading_id + 1
            : 1;

    data.push(req.body);

    saveData(data);

    res.status(201).json({

        success: true,
        message: "Record added successfully.",

        data: req.body

    });

});

// UPDATE
app.put("/api/readings/:id", (req, res) => {

    const error = validate(req.body);

    if (error) {

        return res.status(400).json({

            success: false,
            message: error

        });

    }

    const data = readData();

    const index = data.findIndex(
        r => r.reading_id == req.params.id
    );

    if (index === -1) {

        return res.status(404).json({

            success: false,
            message: "Record not found."

        });

    }

    req.body.reading_id = Number(req.params.id);

    data[index] = req.body;

    saveData(data);

    res.json({

        success: true,
        message: "Record updated successfully.",

        data: req.body

    });

});

// DELETE
app.delete("/api/readings/:id", (req, res) => {

    let data = readData();

    const index = data.findIndex(
        r => r.reading_id == req.params.id
    );

    if (index === -1) {

        return res.status(404).json({

            success: false,
            message: "Record not found."

        });

    }

    data.splice(index, 1);

    saveData(data);

    res.json({

        success: true,
        message: "Record deleted successfully."

    });

});

app.listen(PORT, () => {

    console.log(`Server running at http://localhost:${PORT}`);

});
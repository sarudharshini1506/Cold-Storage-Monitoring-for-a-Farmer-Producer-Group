// script.js

let records = [];
let chart;

// Load data
async function loadData() {
    try {
        const response = await fetch("data.json");
        records = await response.json();

        displayRecords(records);
        updateSummary(records);
        drawChart(records);

    } catch (error) {
        console.error("Error loading data:", error);

        document.getElementById("tableBody").innerHTML =
            `<tr>
                <td colspan="6">Unable to load data.</td>
            </tr>`;
    }
}

// Display table
function displayRecords(data) {

    const tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = "";

    data.forEach(record => {

        tableBody.innerHTML += `
        <tr>
            <td>${record.reading_id}</td>
            <td>${record.chamber_id}</td>
            <td>${record.temperature_c ?? "-"}</td>
            <td>${record.door_state}</td>
            <td class="${record.alarm_flag ? "danger" : "safe"}">
                ${record.alarm_flag ? "ON" : "OFF"}
            </td>
            <td>${record.recorded_at}</td>
        </tr>
        `;

    });

    document.getElementById("recordCount").innerText = data.length;
}

// Summary Cards
function updateSummary(data) {

    document.getElementById("totalRecords").innerText = data.length;

    const safe = data.filter(r => !r.alarm_flag).length;
    const alarm = data.filter(r => r.alarm_flag).length;

    document.getElementById("safeCount").innerText = safe;
    document.getElementById("alarmCount").innerText = alarm;

    const validTemps = data.filter(r => r.temperature_c != null);

    const avg =
        validTemps.reduce((sum, r) => sum + Number(r.temperature_c), 0) /
        validTemps.length;

    document.getElementById("avgTemp").innerText =
        avg.toFixed(1) + " °C";
}

// Search
document.getElementById("search").addEventListener("input", function () {

    const value = this.value.toLowerCase();

    const filtered = records.filter(r =>
        r.chamber_id.toLowerCase().includes(value)
    );

    displayRecords(filtered);
    updateSummary(filtered);
    drawChart(filtered);

});

// Filter
document.getElementById("filter").addEventListener("change", function () {

    let filtered = [...records];

    switch (this.value) {

        case "alarm":
            filtered = records.filter(r => r.alarm_flag);
            break;

        case "safe":
            filtered = records.filter(r => !r.alarm_flag);
            break;

        case "dooropen":
            filtered = records.filter(r => r.door_state === "Open");
            break;

        case "doorclosed":
            filtered = records.filter(r => r.door_state === "Closed");
            break;

        default:
            filtered = records;
    }

    displayRecords(filtered);
    updateSummary(filtered);
    drawChart(filtered);

});

// Refresh
document.getElementById("refreshBtn").addEventListener("click", loadData);

// Chart
function drawChart(data) {

    const labels = data.map(r => r.reading_id);

    const temps = data.map(r =>
        r.temperature_c == null ? 0 : r.temperature_c
    );

    if (chart) chart.destroy();

    chart = new Chart(document.getElementById("tempChart"), {

        type: "line",

        data: {

            labels: labels,

            datasets: [{

                label: "Temperature (°C)",

                data: temps,

                borderWidth: 2,

                fill: false,

                tension: 0.3

            }]
        },

        options: {

            responsive: true,

            plugins: {

                legend: {

                    display: true

                }

            }

        }

    });

}

// Start
loadData();
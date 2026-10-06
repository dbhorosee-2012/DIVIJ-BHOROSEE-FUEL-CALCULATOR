console.log("JavaScript connected via external file!");

let currentMode = "L100km";
let savedTrips = JSON.parse(localStorage.getItem("saved_fuel_trips")) || [];

const PRESETS = {
    commute: {
        distance: 20,
        efficiency: 7.0,
        price: 66.20,
        passengers: 1,
        roundTrip: true
    },
    coastal: {
        distance: 65,
        efficiency: 8.5,
        price: 66.20,
        passengers: 2,
        roundTrip: true
    },
    island: {
        distance: 120,
        efficiency: 9.0,
        price: 66.20,
        passengers: 4,
        roundTrip: false
    },
    carpool: {
        distance: 45,
        efficiency: 6.8,
        price: 66.20,
        passengers: 4,
        roundTrip: true
    }
};

function setEfficiencyMode(mode) {
    const oldMode = currentMode;
    currentMode = mode;

    const input = document.getElementById("efficiency");
    const slider = document.getElementById("efficiency-slider");
    const label = document.getElementById("efficiency-label");
    const unitTag = document.getElementById("efficiency-unit-tag");

    document.getElementById("mode-l100km").classList.toggle("active", mode === "L100km");
    document.getElementById("mode-kml").classList.toggle("active", mode === "kmL");

    let value = parseFloat(input.value) || 7.5;

    if (oldMode !== mode) {
        if (mode === "kmL") {
            value = 100 / value;
        } else {
            value = 100 / value;
        }
    }

    if (mode === "L100km") {
        label.textContent = "Consumption";
        unitTag.textContent = "L/100km";
        input.min = "0.1";
        input.max = "100";
        slider.min = "1";
        slider.max = "25";
        slider.step = "0.1";
    } else {
        label.textContent = "Efficiency";
        unitTag.textContent = "km/L";
        input.min = "0.1";
        input.max = "100";
        slider.min = "1";
        slider.max = "30";
        slider.step = "0.1";
    }

    value = Math.max(parseFloat(input.min), Math.min(parseFloat(input.max), value));

    input.value = value.toFixed(1);
    slider.value = value;

    calculate();
}

function applyPreset(key, element) {
    const preset = PRESETS[key];

    if (!preset) return;

    document.querySelectorAll(".preset-pill").forEach(button => {
        button.classList.remove("active");
    });

    if (element) {
        element.classList.add("active");
    }

    document.getElementById("distance").value = preset.distance;
    document.getElementById("distance-slider").value = preset.distance;

    let efficiency = preset.efficiency;

    if (currentMode === "kmL") {
        efficiency = 100 / preset.efficiency;
    }

    document.getElementById("efficiency").value = efficiency.toFixed(1);
    document.getElementById("efficiency-slider").value = efficiency;

    document.getElementById("price").value = preset.price;
    document.getElementById("price-slider").value = preset.price;

    document.getElementById("passengers").value = preset.passengers;
    document.getElementById("passengers-slider").value = preset.passengers;

    document.getElementById("round-trip").checked = preset.roundTrip;

    calculate();
}

function syncFromInput(id) {
    const input = document.getElementById(id);
    const slider = document.getElementById(id + "-slider");

    if (!input || !slider) return;

    let value = parseFloat(input.value);

    if (isNaN(value)) {
        value = parseFloat(slider.min);
    }

    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);

    value = Math.max(min, Math.min(max, value));

    input.value = value;
    slider.value = value;

    calculate();
}

function syncFromSlider(id) {
    const slider = document.getElementById(id + "-slider");
    const input = document.getElementById(id);

    if (!slider || !input) return;

    input.value = slider.value;

    calculate();
}

function calculate() {
    const distanceInput =
        parseFloat(document.getElementById("distance").value) || 0;

    const efficiencyInput =
        parseFloat(document.getElementById("efficiency").value) || 0;

    const priceInput =
        parseFloat(document.getElementById("price").value) || 0;

    const passengersInput =
        parseInt(document.getElementById("passengers").value) || 1;

    const isRoundTrip =
        document.getElementById("round-trip").checked;

    const totalDistance =
        isRoundTrip ? distanceInput * 2 : distanceInput;

    let litresNeeded = 0;

    if (efficiencyInput > 0) {
        if (currentMode === "L100km") {
            litresNeeded =
                (totalDistance / 100) * efficiencyInput;
        } else {
            litresNeeded =
                totalDistance / efficiencyInput;
        }
    }

    const totalCost = litresNeeded * priceInput;

    const costPerPerson =
        passengersInput > 0
            ? totalCost / passengersInput
            : totalCost;

    document.getElementById("distance-val-display").textContent =
        distanceInput.toFixed(1) + " km";

    if (currentMode === "L100km") {
        document.getElementById("efficiency-val-display").textContent =
            efficiencyInput.toFixed(1) + " L/100km";
    } else {
        document.getElementById("efficiency-val-display").textContent =
            efficiencyInput.toFixed(1) + " km/L";
    }

    document.getElementById("price-val-display").textContent =
        "Rs " + priceInput.toFixed(2) + "/L";

    document.getElementById("passengers-val-display").textContent =
        passengersInput +
        (passengersInput === 1 ? " Person" : " People");

    document.getElementById("res-distance").textContent =
        totalDistance.toFixed(1) + " km";

    document.getElementById("res-litres").textContent =
        litresNeeded.toFixed(2) + " L";

    document.getElementById("res-total").textContent =
        "Rs " + totalCost.toFixed(2);

    document.getElementById("res-per-person").textContent =
        "Rs " + costPerPerson.toFixed(2);

    document.getElementById("res-distance-chip").textContent =
        isRoundTrip
            ? totalDistance.toFixed(1) + " km round trip"
            : totalDistance.toFixed(1) + " km one-way";

    document.getElementById("split-passengers-text").textContent =
        "Split among " +
        passengersInput +
        (passengersInput === 1 ? " passenger" : " passengers");

    document.getElementById("chart-center-amount").textContent =
        "Rs " + Math.round(totalCost);

    drawChart(passengersInput, totalCost);
}

function drawChart(passengers, totalCost) {
    const canvas = document.getElementById("splitChart");

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    const centerX = width / 2;
    const centerY = height / 2;

    const radius = 75;
    const lineWidth = 18;

    ctx.clearRect(0, 0, width, height);

    if (totalCost <= 0) return;

    const colors = [
        "#38bdf8",
        "#c084fc",
        "#34d399",
        "#fbbf24",
        "#f472b6",
        "#a7f3d0",
        "#fde047",
        "#67e8f9"
    ];

    const sliceAngle = (2 * Math.PI) / passengers;
    const gap = passengers > 1 ? 0.06 : 0;

    for (let i = 0; i < passengers; i++) {
        const startAngle =
            i * sliceAngle - Math.PI / 2 + gap / 2;

        const endAngle =
            (i + 1) * sliceAngle - Math.PI / 2 - gap / 2;

        ctx.beginPath();

        ctx.arc(
            centerX,
            centerY,
            radius,
            startAngle,
            endAngle
        );

        ctx.strokeStyle =
            colors[i % colors.length];

        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";

        ctx.stroke();
    }
}

function copyTripSummary() {
    const distance =
        document.getElementById("res-distance").textContent;

    const litres =
        document.getElementById("res-litres").textContent;

    const total =
        document.getElementById("res-total").textContent;

    const perPerson =
        document.getElementById("res-per-person").textContent;

    const passengers =
        document.getElementById("passengers").value;

    const summary =
`Fuel Cost Breakdown:
Distance: ${distance}
Fuel Required: ${litres}
Total Cost: ${total}
Per Person (${passengers} passengers): ${perPerson}`;

    navigator.clipboard.writeText(summary)
        .then(() => {
            const buttonText =
                document.getElementById("copy-btn-text");

            buttonText.textContent = "Copied!";

            setTimeout(() => {
                buttonText.textContent = "Copy Summary";
            }, 2000);
        })
        .catch(() => {
            alert("Unable to copy the summary.");
        });
}

function saveCurrentTrip() {
    const total =
        document.getElementById("res-total").textContent;

    const distance =
        document.getElementById("res-distance").textContent;

    const date =
        new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

    const trip = {
        id: Date.now(),
        title: distance + " Trip",
        cost: total,
        time: date
    };

    savedTrips.unshift(trip);

    if (savedTrips.length > 5) {
        savedTrips.pop();
    }

    localStorage.setItem(
        "saved_fuel_trips",
        JSON.stringify(savedTrips)
    );

    renderSavedTrips();
}

function renderSavedTrips() {
    const container =
        document.getElementById("saved-trips-list");

    if (!container) return;

    if (savedTrips.length === 0) {
        container.innerHTML =
            '<div class="empty-state">No saved trips yet. Click "Save Trip" to store one here.</div>';

        return;
    }

    container.innerHTML = savedTrips.map(trip => `
        <div class="saved-item">
            <span class="saved-item-title">
                ${trip.title} (${trip.time})
            </span>
            <span class="saved-item-cost">
                ${trip.cost}
            </span>
        </div>
    `).join("");
}

function clearSavedTrips() {
    savedTrips = [];

    localStorage.removeItem("saved_fuel_trips");

    renderSavedTrips();
}

function setupSettings() {
    const notificationsToggle =
        document.getElementById("notificationsToggle");

    const darkModeToggle =
        document.getElementById("darkModeToggle");

    const notificationsStatus =
        document.getElementById("status_notificationsToggle");

    const darkModeStatus =
        document.getElementById("status_darkModeToggle");

    const savedDarkMode =
        localStorage.getItem("dark_mode");

    const savedNotifications =
        localStorage.getItem("notifications");

    if (savedDarkMode === "true") {
        darkModeToggle.checked = true;
        document.body.classList.remove("light-mode");
        darkModeStatus.textContent = "ENABLED";
    } else {
        darkModeToggle.checked = false;
        document.body.classList.add("light-mode");
        darkModeStatus.textContent = "DISABLED";
    }

    if (savedNotifications === "true") {
        notificationsToggle.checked = true;
        notificationsStatus.textContent = "ENABLED";
    } else {
        notificationsToggle.checked = false;
        notificationsStatus.textContent = "DISABLED";
    }

    notificationsToggle.addEventListener("change", function () {
        const enabled = this.checked;

        notificationsStatus.textContent =
            enabled ? "ENABLED" : "DISABLED";

        localStorage.setItem(
            "notifications",
            enabled
        );
    });

    darkModeToggle.addEventListener("change", function () {
        const enabled = this.checked;

        document.body.classList.toggle(
            "light-mode",
            !enabled
        );

        darkModeStatus.textContent =
            enabled ? "ENABLED" : "DISABLED";

        localStorage.setItem(
            "dark_mode",
            enabled
        );
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderSavedTrips();
    setupSettings();
    calculate();
});

// Tombol "Klik Lanjut untuk ke Program"
document.getElementById("startBtn").addEventListener("click", function(){
    document.getElementById("welcomeScreen").style.display = "none";
    document.getElementById("programScreen").style.display = "block";
});

// Tombol untuk membuat table proses
document.getElementById("generateTable").addEventListener("click", generateProcessTable);

// Tombol untuk menjalankan perhitungan jadwal proses
document.getElementById("calculateSchedule").addEventListener("click", calculateSchedule);

function generateProcessTable(){
    const number = document.getElementById("numberProcess").value;
    const tbody = document.querySelector("#processTable tbody");

    tbody.innerHTML = '';
    for(let i = 1; i <= number; i++) {
        tbody.innerHTML += `
            <tr>
                <td>Proses ${i}</td>
                <td><input id="arrival${i}" type="number" min="0" value="0"></td>
                <td><input id="burst${i}" type="number" min="0" value="0"></td>
            </tr>`;
    }
}

function calculateSchedule(){
    const number = document.getElementById("numberProcess").value;
    let processes = [];

    for(let i = 1; i <= number; i++) {
        processes.push({ 
            id: `Proses ${i}`,
            arrival: parseInt(document.getElementById(`arrival${i}`).value),
            burst: parseInt(document.getElementById(`burst${i}`).value),
            remaining: parseInt(document.getElementById(`burst${i}`).value)
        });
    }

    let algorithm = document.getElementById("schedules").value;
    let result = [];

    if (algorithm == "FIFO") {
        result = FIFO(processes);
    } else if (algorithm == "SJF") {
        result = SJF(processes);
    } else if (algorithm == "Round Robin") {
        let quantum = parseInt(prompt("Masukkan Quantum Time:"));
        let switchTime = parseInt(prompt("Masukkan Waktu Switch Context (ms):"));
        result = RoundRobin(processes, quantum, switchTime);
    } else if (algorithm == "SRTF") {
        let switchTime = parseInt(prompt("Masukkan Waktu Switch Context (ms):"));
        result = SRTF(processes, switchTime);
    }

    renderTable(result);
}

function FIFO(procs) {
    let arr = [...procs].sort((a, b) => a.arrival - b.arrival);
    let time = 0;

    arr.forEach((p) => {
        if (time < p.arrival) time = p.arrival;

        p.start = time;
        p.finish = time + p.burst;
        p.turnaround = p.finish - p.arrival;
        p.wait = p.turnaround - p.burst;

        time = p.finish;
    });

    return arr;
}

function SJF(procs) {
    let arr = [...procs].sort((a, b) => a.arrival - b.arrival);
    let time = 0;
    let finished = 0;
    let result = [];
    let ready = [];

    while (finished < arr.length) {
        for (let p of arr) {
            if (p.arrival <= time && !p.done && !ready.find(r => r.id == p.id)) {
                ready.push(p);
            }
        }

        if (ready.length == 0) {
            time++;
            continue;
        }

        ready.sort((a, b) => a.burst - b.burst);
        let p = ready.shift();

        p.start = time;
        p.finish = time + p.burst;
        p.turnaround = p.finish - p.arrival;
        p.wait = p.turnaround - p.burst;

        p.done = true;
        finished++;
        time = p.finish;

        result.push(p);
    }

    return result;
}

function SRTF(procs, switchTime) {
    let arr = [...procs].sort((a, b) => a.arrival - b.arrival);
    let time = 0;
    let finished = 0;
    let previousProcess = null;

    while (finished < arr.length) {
        let eligible = arr.filter((p) => p.arrival <= time && p.remaining > 0);
        if (eligible.length == 0) {
            time++;
            continue;
        }

        eligible.sort((a, b) => a.remaining - b.remaining);
        let currentProcess = eligible[0];

        if (previousProcess && previousProcess.id !== currentProcess.id) {
            time += switchTime;
        }

        currentProcess.remaining -= 1;
        time++;

        if (currentProcess.remaining == 0) {
            currentProcess.finish = time;
            currentProcess.turnaround = currentProcess.finish - currentProcess.arrival;
            currentProcess.wait = currentProcess.turnaround - currentProcess.burst;
            finished++;
        }

        previousProcess = currentProcess;
    }

    return arr;
}

function RoundRobin(procs, quantum, switchTime) {
    let arr = [...procs].sort((a, b) => a.arrival - b.arrival);
    let time = 0;
    let finished = 0;
    let queue = [];

    arr.forEach((p) => {
        p.remaining = p.burst;
        p.start = -1;
        p.wait = 0;
    });

    while (finished < arr.length) {
        arr.forEach((p) => {
            if (p.arrival <= time && p.remaining > 0 &&
                !queue.find((item) => item.id == p.id)) {
                queue.push(p);
            }
        });

        if (queue.length == 0) {
            time++;
            continue;
        }

        let p = queue.shift();

        if (p.start == -1) p.start = time;

        if (p.remaining > quantum) {
            p.remaining -= quantum;
            time += quantum;
            time += switchTime;
        } else {
            time += p.remaining;
            p.remaining = 0;
            p.finish = time;
            p.turnaround = p.finish - p.arrival;
            p.wait = p.turnaround - p.burst;
            finished++;
            time += switchTime;
        }

        arr.forEach((item) => {
            if (item.arrival <= time && item.remaining > 0 &&
                !queue.find((q) => q.id == item.id)) {
                queue.push(item);
            }
        });

        if (p.remaining > 0 && !queue.includes(p)) {
            queue.push(p);
        }
    }

    return arr;
}

function renderTable(procs) {
    const tbody = document.querySelector("#scheduleTable tbody");

    tbody.innerHTML = '';
    procs.forEach((p) => {
        tbody.innerHTML += `
            <tr>
                <td>${p.id}</td>
                <td>${p.arrival}</td>
                <td>${p.burst}</td>
                <td>${p.finish}</td>
                <td>${p.turnaround}</td>
                <td>${p.wait}</td>
            </tr>`;
    });
}

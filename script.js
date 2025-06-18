// Ketika tombol "Klik Lanjut untuk ke Program" diklik
document.getElementById("startBtn").addEventListener("click", function(){
    document.getElementById("welcomeScreen").style.display = "none"; // Sembunyikan tampilan awal
    document.getElementById("programScreen").style.display = "block"; // Tampilkan bagian program utama
});

// Ketika tombol "Buat Tabel Proses" diklik
document.getElementById("generateTable").addEventListener("click", generateProcessTable);

// Ketika tombol "Hitung Jadwal" diklik
document.getElementById("calculateSchedule").addEventListener("click", calculateSchedule);

// Fungsi untuk membuat tabel input proses berdasarkan jumlah yang diinput user
function generateProcessTable(){
    const number = document.getElementById("numberProcess").value; // Ambil jumlah proses
    const tbody = document.querySelector("#processTable tbody"); // Ambil elemen tbody dari tabel

    tbody.innerHTML = ''; // Kosongkan isi tabel sebelum diisi ulang

    // Buat baris input untuk setiap proses
    for(let i = 1; i <= number; i++) {
        tbody.innerHTML += `
            <tr>
                <td>Proses ${i}</td>
                <td><input id="arrival${i}" type="number" min="0" value="0"></td>
                <td><input id="burst${i}" type="number" min="0" value="0"></td>
            </tr>`;
    }
}

// Fungsi untuk menjalankan perhitungan penjadwalan berdasarkan algoritma yang dipilih
function calculateSchedule(){
    const number = document.getElementById("numberProcess").value; // Ambil jumlah proses
    let processes = [];

    // Ambil data inputan dari user untuk setiap proses
    for(let i = 1; i <= number; i++) {
        processes.push({ 
            id: `Proses ${i}`,
            arrival: parseInt(document.getElementById(`arrival${i}`).value),
            burst: parseInt(document.getElementById(`burst${i}`).value),
            remaining: parseInt(document.getElementById(`burst${i}`).value) // Untuk algoritma preemptive
        });
    }

    let algorithm = document.getElementById("schedules").value; // Ambil algoritma yang dipilih
    let result = [];

    // Jalankan algoritma sesuai pilihan user
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

    renderTable(result); // Tampilkan hasil di tabel output
}

// Implementasi algoritma FIFO (First In First Out)
function FIFO(procs) {
    let arr = [...procs].sort((a, b) => a.arrival - b.arrival); // Urutkan berdasarkan waktu kedatangan
    let time = 0;

    arr.forEach((p) => {
        if (time < p.arrival) time = p.arrival; // Jika CPU idle

        p.start = time;
        p.finish = time + p.burst;
        p.turnaround = p.finish - p.arrival;
        p.wait = p.turnaround - p.burst;

        time = p.finish; // Update waktu saat ini
    });

    return arr;
}

// Implementasi algoritma SJF (Shortest Job First) Non-preemptive
function SJF(procs) {
    let arr = [...procs].sort((a, b) => a.arrival - b.arrival); // Urut berdasarkan waktu kedatangan
    let time = 0;
    let finished = 0;
    let result = [];
    let ready = [];

    while (finished < arr.length) {
        // Tambahkan proses yang sudah datang ke antrian ready
        for (let p of arr) {
            if (p.arrival <= time && !p.done && !ready.find(r => r.id == p.id)) {
                ready.push(p);
            }
        }

        if (ready.length == 0) {
            time++; // Jika tidak ada proses yang siap, waktu bertambah
            continue;
        }

        // Ambil proses dengan burst time terpendek
        ready.sort((a, b) => a.burst - b.burst);
        let p = ready.shift();

        p.start = time;
        p.finish = time + p.burst;
        p.turnaround = p.finish - p.arrival;
        p.wait = p.turnaround - p.burst;
        p.done = true;

        time = p.finish; // Update waktu saat ini
        finished++;
        result.push(p);
    }

    return result;
}

// Implementasi algoritma SRTF (Shortest Remaining Time First) Preemptive
function SRTF(procs, switchTime) {
    let arr = [...procs].sort((a, b) => a.arrival - b.arrival);
    let time = 0;
    let finished = 0;
    let previousProcess = null;

    while (finished < arr.length) {
        // Ambil proses yang eligible (sudah datang dan belum selesai)
        let eligible = arr.filter((p) => p.arrival <= time && p.remaining > 0);
        if (eligible.length == 0) {
            time++;
            continue;
        }

        // Proses dengan waktu remaining terkecil
        eligible.sort((a, b) => a.remaining - b.remaining);
        let currentProcess = eligible[0];

        // Tambahkan waktu switch context jika berpindah proses
        if (previousProcess && previousProcess.id !== currentProcess.id) {
            time += switchTime;
        }

        currentProcess.remaining -= 1; // Eksekusi 1 satuan waktu
        time++;

        // Jika proses selesai
        if (currentProcess.remaining == 0) {
            currentProcess.finish = time;
            currentProcess.turnaround = currentProcess.finish - currentProcess.arrival;
            currentProcess.wait = currentProcess.turnaround - currentProcess.burst;
            finished++;
        }

        previousProcess = currentProcess; // Tandai proses sebelumnya
    }

    return arr;
}

// Implementasi algoritma Round Robin
function RoundRobin(procs, quantum, switchTime) {
    let arr = [...procs].sort((a, b) => a.arrival - b.arrival);
    let time = 0;
    let finished = 0;
    let queue = [];

    // Inisialisasi properti proses
    arr.forEach((p) => {
        p.remaining = p.burst;
        p.start = -1; // -1 menandakan belum pernah dijalankan
        p.wait = 0;
    });

    while (finished < arr.length) {
        // Tambahkan proses baru ke antrian
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

        let p = queue.shift(); // Ambil proses dari antrian

        if (p.start == -1) p.start = time; // Catat waktu pertama kali jalan

        if (p.remaining > quantum) {
            p.remaining -= quantum;
            time += quantum;
            time += switchTime; // Tambah waktu karena switch context
        } else {
            time += p.remaining;
            p.remaining = 0;
            p.finish = time;
            p.turnaround = p.finish - p.arrival;
            p.wait = p.turnaround - p.burst;
            finished++;
            time += switchTime;
        }

        // Tambahkan proses baru lagi ke antrian setelah waktu berjalan
        arr.forEach((item) => {
            if (item.arrival <= time && item.remaining > 0 &&
                !queue.find((q) => q.id == item.id)) {
                queue.push(item);
            }
        });

        // Jika proses belum selesai, masukkan lagi ke antrian
        if (p.remaining > 0 && !queue.includes(p)) {
            queue.push(p);
        }
    }

    return arr;
}

// Fungsi untuk menampilkan hasil jadwal ke dalam tabel HTML
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

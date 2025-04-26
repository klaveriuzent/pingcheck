document
  .getElementById("fileInput")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const lines = e.target.result
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const sections = {};
      let currentLabel = "UNLABELED";

      lines.forEach((line) => {
        if (line.startsWith("*") && line.endsWith("*")) {
          currentLabel = line.replace(/\*/g, "");
          sections[currentLabel] = [];
        } else {
          if (!sections[currentLabel]) sections[currentLabel] = [];
          sections[currentLabel].push(line);
        }
      });

      showAndPing(sections);
    };
    reader.readAsText(file);
  });

function showAndPing(sections) {
  const container = document.getElementById("outputContainer");
  container.innerHTML = "";

  for (const [label, ips] of Object.entries(sections)) {
    const sectionDiv = document.createElement("div");
    sectionDiv.className = "ping-section";

    // Tombol Refresh
    const refreshButton = document.createElement("button");
    refreshButton.className = "refresh-btn";
    refreshButton.textContent = "Refresh";
    // Memberikan tombol refresh untuk hanya IP yang ada di bawah label ini
    refreshButton.onclick = function () {
      pingIps(ips, sectionDiv);
    };

    const title = document.createElement("h2");
    title.textContent = `📍 ${label}`;
    sectionDiv.appendChild(title);

    // Menambahkan tombol Refresh ke dalam div
    sectionDiv.appendChild(refreshButton);

    const ipList = document.createElement("pre");
    ipList.textContent =
      "List IP:\n" +
      ips.map((ip) => "  " + ip).join("\n") +
      "\n\n🚀 Ping...\n\n";
    sectionDiv.appendChild(ipList);

    container.appendChild(sectionDiv);

    // Ping awal
    pingIps(ips, sectionDiv);
  }
}

// Fungsi untuk melakukan ping pada IPs
function pingIps(ips, sectionDiv) {
  const ipList = sectionDiv.querySelector("pre");
  ipList.textContent =
    "List IP:\n" +
    ips.map((ip) => "  " + ip).join("\n") +
    "\n\n🚀 Ping...\n\n";

  ips.forEach((ip) => {
    const img = new Image();
    const start = performance.now();

    img.onload = () => {
      const end = performance.now();
      const duration = Math.round(end - start);
      ipList.textContent += `✅ Ping ${ip}: ${duration} ms (ONLINE)\n`;
    };

    img.onerror = () => {
      ipList.textContent += `❌ Ping ${ip}: No response (OFFLINE)\n`;
    };

    img.src = "http://" + ip + "/favicon.ico?" + Date.now();
  });
}
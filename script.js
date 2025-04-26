// Ambil info jaringan publik (ISP, IP, dan lokasi)
let userIp = "";
let userIsp = "";
let userLocation = "";
let gmt = "";

fetch("https://ipapi.co/json/")
  .then((res) => res.json())
  .then((data) => {
    userIp = data.ip || "-";
    userIsp = data.org || "-";
    userLocation =
      `${data.city || ""}, ${data.region || ""}, ${
        data.country_name || ""
      }`.trim() || "-";

    document.getElementById("isp").textContent = data.org || "-";
    document.getElementById("ip").textContent = data.ip || "-";
    document.getElementById("location").textContent =
      `${data.city}, ${data.region}, ${data.country_name}` || "-";
  })
  .catch(() => {
    document.getElementById("isp").textContent = "Unavailable";
    document.getElementById("ip").textContent = "Unavailable";
    document.getElementById("location").textContent = "Unavailable";
  });

function getCurrentTimeAndGMT() {
  const now = new Date();
  currentTime = now.toLocaleString();
  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const hours = Math.floor(Math.abs(offsetMinutes) / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (Math.abs(offsetMinutes) % 60).toString().padStart(2, "0");
  gmt = `GMT${sign}${hours}:${minutes}`;
}

// Mulai event handler file input
document
  .getElementById("fileInput")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".txt")) {
      alert("Hanya file .txt yang diperbolehkan!");
      event.target.value = "";
      return;
    }

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

  getCurrentTimeAndGMT();

  for (const [label, ips] of Object.entries(sections)) {
    const sectionDiv = document.createElement("div");
    sectionDiv.className = "ping-section";

    const title = document.createElement("h2");
    title.textContent = `📍 ${label}`;
    sectionDiv.appendChild(title);

    // Wrapper untuk tombol
    const buttonGroup = document.createElement("div");
    buttonGroup.className = "button-group";

    // Tombol Copy
    const copyButton = document.createElement("button");
    copyButton.className = "copy-btn";
    copyButton.textContent = "Copy";
    copyButton.onclick = function () {
      const ipList = sectionDiv.querySelector("pre");
      const labelText = title.textContent.replace("📍 ", "");
      const resultPing = ipList.textContent
        .split("\n")
        .filter((line) => line.includes("Ping") && !line.includes("🚀 Ping..."))
        .join("\n");

      // Menyusun teks untuk disalin
      const textToCopy = `${labelText} (${currentTime} ${gmt})\n\n${resultPing}\n\n${userIp} | ${userIsp} | ${userLocation}`;

      navigator.clipboard.writeText(textToCopy).then(() => {
        copyButton.textContent = "Copied!";
        setTimeout(() => (copyButton.textContent = "Copy"), 1500);
      });
    };

    // Tombol Refresh
    const refreshButton = document.createElement("button");
    refreshButton.className = "refresh-btn";
    refreshButton.textContent = "Refresh";
    refreshButton.onclick = function () {
      pingIps(ips, sectionDiv);
    };

    buttonGroup.appendChild(refreshButton);
    buttonGroup.appendChild(copyButton);
    sectionDiv.appendChild(buttonGroup);

    const ipList = document.createElement("pre");
    ipList.textContent =
      "List IP:\n" +
      ips.map((ip) => "  " + ip).join("\n") +
      "\n\n🚀 Ping...\n\n";
    sectionDiv.appendChild(ipList);

    container.appendChild(sectionDiv);

    pingIps(ips, sectionDiv);
  }
}

// Fungsi untuk melakukan ping pada IPs
function pingIps(ips, sectionDiv) {
  const ipList = sectionDiv.querySelector("pre");
  ipList.textContent =
    "List IP:\n" + ips.map((ip) => "  " + ip).join("\n") + "\n\n🚀 Ping...\n\n";

  ips.forEach((ip) => {
    const img = new Image();
    const start = performance.now();

    img.onload = () => {
      const end = performance.now();
      const duration = Math.round(end - start);
      ipList.innerHTML += `<span style="color: lime;">✅ Ping ${ip}: ${duration} ms (ONLINE)</span>\n`;
    };

    img.onerror = () => {
      // Try second URL to verify if the IP is still online
      const secondaryImg = new Image();
      const secondaryStart = performance.now();

      secondaryImg.onload = () => {
        const secondaryEnd = performance.now();
        const secondaryDuration = Math.round(secondaryEnd - secondaryStart);
        ipList.innerHTML += `<span style="color: lime;">✅ Ping ${ip}: ${secondaryDuration} ms (ONLINE)</span>\n`;
      };

      secondaryImg.onerror = () => {
        // Try third URL if second fails
        const thirdImg = new Image();
        const thirdStart = performance.now();

        thirdImg.onload = () => {
          const thirdEnd = performance.now();
          const thirdDuration = Math.round(thirdEnd - thirdStart);
          ipList.innerHTML += `<span style="color: lime;">✅ Ping ${ip}: ${thirdDuration} ms (ONLINE)</span>\n`;
        };

        thirdImg.onerror = () => {
          ipList.innerHTML += `<span style="color: red;">❌ Ping ${ip}: No response (OFFLINE)</span>\n`;
        };

        // Try the third image URL
        thirdImg.src = "http://" + ip + "/doc/favicon.ico?";
      };

      // Try the second image URL
      secondaryImg.src = "http://" + ip + "/doc/ui/images/logo.png";
    };

    // Try the initial favicon URL
    img.src = "http://" + ip + "/favicon.ico?";
  });
}
const views = {
  dashboard: ["SYSTEM OVERVIEW", "SM-OS Mini"],
  projects: ["PROJECT RUNTIME", "Dự án"],
  hardware: ["RESOURCE MANAGER", "Phần cứng"],
  usb: ["USB HOST", "USB Hub"],
  storage: ["VIRTUAL FILE SYSTEM", "Lưu trữ"],
  terminal: ["S3 SHELL", "Terminal"],
  settings: ["SYSTEM", "Cài đặt"],
};

const projects = [
  { id:"project.rf.monitor", name:"RF Monitor", icon:"i-activity", state:"running", autostart:true, cpu:"7.8%", memory:"96 KB", restarts:0, resources:["GPIO5","SPI2","ADC1"] },
  { id:"project.sensor.monitor", name:"Sensor Monitor", icon:"i-chip", state:"running", autostart:true, cpu:"2.1%", memory:"48 KB", restarts:0, resources:["I2C0","0x76","TIMER0"] },
  { id:"project.gnss.logger", name:"GNSS Logger", icon:"i-usb", state:"running", autostart:false, cpu:"1.4%", memory:"72 KB", restarts:0, resources:["/dev/gnss0","/mnt/sd"] },
  { id:"project.gpio.lab", name:"GPIO Lab", icon:"i-code", state:"stopped", autostart:false, cpu:"—", memory:"0 KB", restarts:1, resources:["GPIO4","GPIO6"] },
];

const pinDefinitions = Array.from({length:49}, (_,gpio) => {
  let state = "free", role = "Available", owner = "—", capabilities = ["GPIO"];
  if ([19,20].includes(gpio)) { state="reserved"; role=gpio===19?"USB D−":"USB D+"; owner="system.usb"; capabilities=["USB","RESERVED"]; }
  if ([8,9].includes(gpio)) { state="shared"; role=gpio===8?"I2C0 SDA":"I2C0 SCL"; owner="shared bus"; capabilities=["GPIO","I2C"]; }
  if (gpio===5) { state="used"; role="RF Monitor"; owner="project.rf.monitor"; capabilities=["GPIO","ADC","INT"]; }
  if ([10,11,12,13,14].includes(gpio)) { state="used"; role={10:"SPI2 CS",11:"SPI2 MOSI",12:"SPI2 SCLK",13:"SPI2 MISO",14:"Display CS"}[gpio]; owner=gpio===14?"ui.shell":"system.storage"; capabilities=["GPIO","SPI"]; }
  if ([43,44].includes(gpio)) { state="used"; role=gpio===43?"UART0 TX":"UART0 RX"; owner="system.console"; capabilities=["GPIO","UART"]; }
  if ([0,3,45,46].includes(gpio)) { state="reserved"; role="Board-sensitive"; owner="board profile"; capabilities=["GPIO","CHECK"]; }
  return {gpio,state,role,owner,capabilities};
});

const navButtons = [...document.querySelectorAll(".nav-item[data-view]")];
const titleEl = document.getElementById("viewTitle");
const eyebrowEl = document.getElementById("viewEyebrow");

function switchView(name) {
  if (!views[name]) return;
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(`view-${name}`)?.classList.add("active");
  navButtons.forEach(b => b.classList.toggle("active", b.dataset.view === name));
  eyebrowEl.textContent = views[name][0];
  titleEl.textContent = views[name][1];
  window.scrollTo({top:0,behavior:"smooth"});
  history.replaceState(null,"",`#${name}`);
}

navButtons.forEach(btn => btn.addEventListener("click", () => switchView(btn.dataset.view)));
document.querySelectorAll("[data-view-target]").forEach(btn => btn.addEventListener("click", () => switchView(btn.dataset.viewTarget)));

function projectStatus(project) {
  return project.state === "running"
    ? '<span class="pill green"><span class="dot green"></span> RUNNING</span>'
    : '<span class="pill">STOPPED</span>';
}

function renderDashboardProjects() {
  const host = document.getElementById("dashboardProjects");
  host.innerHTML = projects.filter(p=>p.state==="running").slice(0,3).map(p=>`
    <div class="project-row">
      <div class="project-icon"><svg><use href="#${p.icon}"/></svg></div>
      <div><strong>${p.name}</strong><span>${p.id}</span></div>
      <b>● Running</b>
    </div>
  `).join("");
}

function renderProjects() {
  const host = document.getElementById("projectGrid");
  host.innerHTML = projects.map((p,index)=>`
    <article class="project-card" data-project="${p.id}">
      <div class="project-top">
        <div class="project-badge"><svg><use href="#${p.icon}"/></svg></div>
        ${projectStatus(p)}
      </div>
      <h3>${p.name}</h3>
      <span class="project-id">${p.id}</span>
      <div class="project-meta">
        <div><span>CPU</span><strong>${p.cpu}</strong></div>
        <div><span>Memory</span><strong>${p.memory}</strong></div>
        <div><span>Restarts</span><strong>${p.restarts}</strong></div>
      </div>
      <div class="project-resources">${p.resources.map(r=>`<span class="resource-chip">${r}</span>`).join("")}</div>
      <div class="project-actions">
        <div class="left">
          <button class="btn ${p.state==="running"?"ghost":"primary"} small project-toggle" data-index="${index}">
            <svg><use href="#${p.state==="running"?"i-stop":"i-play"}"/></svg>
            ${p.state==="running"?"Stop":"Start"}
          </button>
          <button class="btn ghost small">Logs</button>
        </div>
        <button class="row-menu"><svg><use href="#i-more"/></svg></button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".project-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = projects[Number(btn.dataset.index)];
      p.state = p.state === "running" ? "stopped" : "running";
      p.cpu = p.state === "running" ? (Math.random()*5+1).toFixed(1)+"%" : "—";
      p.memory = p.state === "running" ? ["48 KB","64 KB","72 KB","96 KB"][Math.floor(Math.random()*4)] : "0 KB";
      renderProjects();
      renderDashboardProjects();
      toast(`${p.name}: ${p.state.toUpperCase()}`);
    });
  });
}

function renderPins(filter="all", query="") {
  const matched = pinDefinitions.filter(p => {
    const byFilter = filter === "all" || p.state === filter;
    const text = `gpio${p.gpio} ${p.role} ${p.owner} ${p.capabilities.join(" ")}`.toLowerCase();
    return byFilter && text.includes(query.toLowerCase().trim());
  });
  const midpoint = Math.ceil(matched.length/2);
  fillPinColumn(document.getElementById("leftPins"), matched.slice(0,midpoint));
  fillPinColumn(document.getElementById("rightPins"), matched.slice(midpoint));
}

function fillPinColumn(host, pins) {
  host.innerHTML = pins.map(p=>`
    <button class="pin ${p.state}" data-gpio="${p.gpio}">
      <strong>G${String(p.gpio).padStart(2,"0")}</strong>
      <span>${p.role}</span>
      <i></i>
    </button>
  `).join("");
  host.querySelectorAll(".pin").forEach(btn => btn.addEventListener("click", () => inspectPin(Number(btn.dataset.gpio))));
}

function inspectPin(gpio) {
  const p = pinDefinitions.find(x=>x.gpio===gpio);
  document.querySelectorAll(".pin").forEach(b=>b.classList.toggle("selected",Number(b.dataset.gpio)===gpio));
  const stateLabel = {free:"FREE",used:"CLAIMED",shared:"SHARED",reserved:"RESERVED"}[p.state];
  document.getElementById("pinInspector").innerHTML = `
    <span class="section-kicker">PIN INSPECTOR</span>
    <div class="inspector-detail">
      <h3>GPIO ${p.gpio}</h3>
      <div class="owner">${p.owner}</div>
      <div style="margin-top:12px">${p.state==="free"?'<span class="pill green">FREE</span>':p.state==="shared"?'<span class="pill" style="color:#ffc67a">SHARED</span>':p.state==="used"?'<span class="pill blue">CLAIMED</span>':'<span class="pill">RESERVED</span>'}</div>
      <div class="detail-table">
        <div><span>Role</span><strong>${p.role}</strong></div>
        <div><span>State</span><strong>${stateLabel}</strong></div>
        <div><span>Owner</span><strong>${p.owner}</strong></div>
        <div><span>Runtime change</span><strong>${p.state==="free"?"Allowed":"Guarded"}</strong></div>
      </div>
      <span class="section-kicker" style="display:block;margin-top:18px">CAPABILITIES</span>
      <div class="capabilities">${p.capabilities.map(c=>`<span class="resource-chip">${c}</span>`).join("")}</div>
      <button class="btn ${p.state==="free"?"primary":"ghost"} wide" style="margin-top:20px" ${p.state==="reserved"?"disabled":""}>
        ${p.state==="free"?"Gán cho project":"Xem resource owner"}
      </button>
      <p style="font-size:8px;line-height:1.55;color:#56647b;margin-top:13px">Prototype: board profile thật sẽ quyết định capability và pin reservation theo đúng module.</p>
    </div>
  `;
}

let currentPinFilter = "all";
document.querySelectorAll("#pinFilter button").forEach(btn => {
  btn.addEventListener("click", () => {
    currentPinFilter = btn.dataset.filter;
    document.querySelectorAll("#pinFilter button").forEach(x=>x.classList.toggle("active",x===btn));
    renderPins(currentPinFilter, document.getElementById("pinSearch").value);
  });
});
document.getElementById("pinSearch").addEventListener("input", e => renderPins(currentPinFilter,e.target.value));

const terminalOutput = document.getElementById("terminalOutput");
const terminalForm = document.getElementById("terminalForm");
const terminalInput = document.getElementById("terminalInput");

const terminalResponses = {
  "help": [
    "system info      show board/runtime summary",
    "mem              memory snapshot",
    "usb tree         USB host topology",
    "resource list    claimed hardware resources",
    "project list     project lifecycle state",
    "clear            clear terminal"
  ],
  "system info": [
    "Board     ESP32-S3-WROOM-1 N16R8",
    "CPU       Xtensa LX7 ×2 @ 240 MHz",
    "Flash     16 MB · PSRAM 8 MB",
    "Runtime   healthy · prototype UI"
  ],
  "mem": [
    "Internal SRAM   used 318 KB · free 194 KB",
    "PSRAM           used 2.1 MB · free 5.9 MB",
    "Heap policy     bounded pools preferred"
  ],
  "usb tree": [
    "Root Host",
    "└─ Hub 01",
    "   ├─ Port 1  MSC  SanDisk Ultra",
    "   ├─ Port 2  CDC  CP2102 UART",
    "   ├─ Port 3  CDC  GNSS Receiver",
    "   └─ Port 4  empty"
  ],
  "resource list": [
    "GPIO5       CLAIMED   project.rf.monitor",
    "GPIO8/9     SHARED    I2C0",
    "GPIO10-13   CLAIMED   SPI2",
    "GPIO19/20   RESERVED  system.usb"
  ],
  "project list": projects.map(p=>`${p.id.padEnd(26)} ${p.state.toUpperCase()}`)
};

function runCommand(command) {
  const cmd = command.trim();
  if (!cmd) return;
  if (cmd === "clear") {
    terminalOutput.innerHTML = "";
    return;
  }
  terminalOutput.insertAdjacentHTML("beforeend", `<p><span class="prompt">s3core $</span> ${escapeHTML(cmd)}</p>`);
  const response = terminalResponses[cmd] || [`unknown command: ${cmd}`, 'type "help" for available preview commands'];
  response.forEach(line => terminalOutput.insertAdjacentHTML("beforeend", `<p class="out">${escapeHTML(line)}</p>`));
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

terminalForm.addEventListener("submit", e => {
  e.preventDefault();
  runCommand(terminalInput.value);
  terminalInput.value = "";
});
document.querySelectorAll("[data-command]").forEach(btn => btn.addEventListener("click", () => {
  switchView("terminal");
  runCommand(btn.dataset.command);
}));
document.getElementById("clearTerminal").addEventListener("click",()=>terminalOutput.innerHTML="");

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

const modal = document.getElementById("projectModal");
document.getElementById("newProjectBtn").addEventListener("click",()=>{modal.hidden=false;});
document.getElementById("closeModal").addEventListener("click",()=>{modal.hidden=true;});
modal.addEventListener("click",e=>{if(e.target===modal)modal.hidden=true;});
document.querySelectorAll(".choice").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".choice").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
}));
document.getElementById("createProject").addEventListener("click",()=>{
  const name=document.getElementById("projectName").value.trim()||"Untitled";
  const id=document.getElementById("projectId").value.trim()||"project.untitled";
  projects.push({id,name,icon:"i-code",state:"stopped",autostart:false,cpu:"—",memory:"0 KB",restarts:0,resources:["UNASSIGNED"]});
  renderProjects(); modal.hidden=true; toast(`${name} đã được thêm vào prototype`);
});

function toast(message) {
  let el=document.querySelector(".toast");
  if(!el){el=document.createElement("div");el.className="toast";Object.assign(el.style,{position:"fixed",right:"22px",bottom:"22px",zIndex:200,background:"#17233a",border:"1px solid #334463",color:"#dce4ef",borderRadius:"12px",padding:"11px 14px",fontSize:"10px",boxShadow:"0 14px 40px rgba(0,0,0,.35)",transition:".2s"});document.body.appendChild(el);}
  el.textContent=message;el.style.opacity="1";el.style.transform="translateY(0)";
  clearTimeout(el._timer);el._timer=setTimeout(()=>{el.style.opacity="0";el.style.transform="translateY(8px)";},1800);
}

renderDashboardProjects();
renderProjects();
renderPins();

const initial = location.hash.slice(1);
if (views[initial]) switchView(initial);

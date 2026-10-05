const views = {
  dashboard: ["SYSTEM OVERVIEW", "SM-OS Mini"],
  projects: ["PROJECT RUNTIME", "Dự án"],
  hardware: ["RESOURCE MANAGER", "Phần cứng"],
  usb: ["USB HOST", "USB Hub"],
  storage: ["VIRTUAL FILE SYSTEM", "Lưu trữ"],
  terminal: ["S3 SHELL", "Terminal"],
  settings: ["SYSTEM", "Cài đặt"],
};

const defaultProjects = [
  { id:"project.rf.monitor", name:"RF Monitor", icon:"i-activity", state:"running", autostart:true, cpu:"7.8%", memory:"96 KB", restarts:0, resources:["GPIO5","SPI2","ADC1"] },
  { id:"project.sensor.monitor", name:"Sensor Monitor", icon:"i-chip", state:"running", autostart:true, cpu:"2.1%", memory:"48 KB", restarts:0, resources:["I2C0","0x76","TIMER0"] },
  { id:"project.gnss.logger", name:"GNSS Logger", icon:"i-usb", state:"running", autostart:false, cpu:"1.4%", memory:"72 KB", restarts:0, resources:["/dev/gnss0","/mnt/sd"] },
  { id:"project.gpio.lab", name:"GPIO Lab", icon:"i-code", state:"stopped", autostart:false, cpu:"—", memory:"0 KB", restarts:1, resources:["GPIO4","GPIO6"] },
];

const clone = value => JSON.parse(JSON.stringify(value));
let projects = loadProjects();
let selectedProjectIndex = null;
let selectedResourcePin = null;
let currentPinFilter = "all";

function loadProjects() {
  try {
    const stored = localStorage.getItem("smos.projects.v2");
    return stored ? JSON.parse(stored) : clone(defaultProjects);
  } catch (_) {
    return clone(defaultProjects);
  }
}

function saveProjects() {
  localStorage.setItem("smos.projects.v2", JSON.stringify(projects));
}

function buildPinDefinitions() {
  const pins = Array.from({length:49}, (_,gpio) => ({
    gpio, state:"free", safety:"safe", role:"Available", owner:"—", capabilities:["GPIO"]
  }));

  const setPin = (gpio, data) => Object.assign(pins[gpio], data);

  [19,20].forEach(gpio => setPin(gpio, {
    state:"reserved", safety:"reserved", role:gpio===19?"USB D−":"USB D+", owner:"system.usb", capabilities:["USB","RESERVED"]
  }));
  for (let gpio=22; gpio<=34; gpio++) setPin(gpio, {
    state:"reserved", safety:"reserved", role:"Not exposed on WROOM-1", owner:"system.board", capabilities:["RESERVED"]
  });
  [35,36,37].forEach(gpio => setPin(gpio, {
    state:"reserved", safety:"reserved", role:"Octal flash/PSRAM", owner:"system.board", capabilities:["SPI","RESERVED"]
  }));
  [0,3,45,46].forEach(gpio => setPin(gpio, {
    state:"free", safety:"caution", role:"Available · caution", owner:"—", capabilities:["GPIO","CHECK"]
  }));
  [8,9].forEach(gpio => setPin(gpio, {
    state:"shared", role:gpio===8?"I2C0 SDA":"I2C0 SCL", owner:"shared bus", capabilities:["GPIO","I2C"]
  }));
  [10,11,12,13].forEach(gpio => setPin(gpio, {
    state:"used", role:{10:"SPI2 CS",11:"SPI2 MOSI",12:"SPI2 SCLK",13:"SPI2 MISO"}[gpio], owner:"system.storage", capabilities:["GPIO","SPI"]
  }));
  setPin(14,{state:"used",role:"Display CS",owner:"ui.shell",capabilities:["GPIO","SPI"]});
  [43,44].forEach(gpio => setPin(gpio, {
    state:"used", role:gpio===43?"UART0 TX":"UART0 RX", owner:"system.console", capabilities:["GPIO","UART"]
  }));


  projects.forEach(project => {
    project.resources.forEach(resource => {
      const match = /^GPIO(\d+)$/.exec(resource);
      if (!match) return;
      const gpio = Number(match[1]);
      const pin = pins[gpio];
      if (!pin || pin.state === "reserved" || pin.state === "shared") return;
      setPin(gpio,{
        state:"used",
        role:project.name,
        owner:project.id,
        capabilities:[...new Set(["GPIO", ...pin.capabilities.filter(x=>x!=="GPIO")])]
      });
    });
  });

  return pins;
}

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

function memoryNumber(value) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function updateSummary() {
  document.getElementById("summaryInstalled").textContent = projects.length;
  document.getElementById("summaryRunning").textContent = projects.filter(p=>p.state==="running").length;
  document.getElementById("summaryAutostart").textContent = projects.filter(p=>p.autostart).length;
  const total = projects.reduce((sum,p)=>sum + memoryNumber(p.memory),0);
  document.getElementById("summaryMemory").textContent = `${Math.round(total)} KB`;
  const navCount = document.querySelector('.nav-item[data-view="projects"] em');
  if (navCount) navCount.textContent = projects.filter(p=>p.state==="running").length;
}

function renderDashboardProjects() {
  const host = document.getElementById("dashboardProjects");
  host.innerHTML = projects.filter(p=>p.state==="running").slice(0,3).map((p)=>`
    <div class="project-row" data-project-id="${escapeHTML(p.id)}">
      <div class="project-icon"><svg><use href="#${p.icon}"/></svg></div>
      <div><strong>${escapeHTML(p.name)}</strong><span>${escapeHTML(p.id)}</span></div>
      <b>● Running</b>
    </div>
  `).join("") || '<div class="empty-resources">Chưa có project nào đang chạy.</div>';
}

function renderProjects() {
  const host = document.getElementById("projectGrid");
  host.innerHTML = projects.map((p,index)=>`
    <article class="project-card" data-project="${escapeHTML(p.id)}">
      <div class="project-top open-project" data-open-project="${index}">
        <div class="project-badge"><svg><use href="#${p.icon}"/></svg></div>
        ${projectStatus(p)}
      </div>
      <div class="open-project" data-open-project="${index}">
        <h3>${escapeHTML(p.name)}</h3>
        <span class="project-id">${escapeHTML(p.id)}</span>
      </div>
      <div class="project-meta">
        <div><span>CPU</span><strong>${escapeHTML(p.cpu)}</strong></div>
        <div><span>Memory</span><strong>${escapeHTML(p.memory)}</strong></div>
        <div><span>Restarts</span><strong>${p.restarts}</strong></div>
      </div>
      <div class="project-resources">${p.resources.map(r=>`<span class="resource-chip">${escapeHTML(r)}</span>`).join("") || '<span class="resource-chip">UNASSIGNED</span>'}</div>
      <div class="project-actions">
        <div class="left">
          <button class="btn ${p.state==="running"?"ghost":"primary"} small project-toggle" data-index="${index}">
            <svg><use href="#${p.state==="running"?"i-stop":"i-play"}"/></svg>
            ${p.state==="running"?"Stop":"Start"}
          </button>
          <button class="btn ghost small open-project" data-open-project="${index}">Workspace</button>
        </div>
        <button class="row-menu open-project" data-open-project="${index}" aria-label="Open project"><svg><use href="#i-more"/></svg></button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".project-toggle").forEach(btn => {
    btn.addEventListener("click", event => {
      event.stopPropagation();
      toggleProject(Number(btn.dataset.index));
    });
  });
  document.querySelectorAll("[data-open-project]").forEach(el => {
    el.addEventListener("click", event => {
      event.stopPropagation();
      openProjectDrawer(Number(el.dataset.openProject));
    });
  });
  updateSummary();
}

function toggleProject(index) {
  const p = projects[index];
  if (!p) return;
  p.state = p.state === "running" ? "stopped" : "running";
  p.cpu = p.state === "running" ? (Math.random()*5+1).toFixed(1)+"%" : "—";
  p.memory = p.state === "running" ? ["48 KB","64 KB","72 KB","96 KB"][Math.floor(Math.random()*4)] : "0 KB";
  if (p.state === "running") addProjectEvent(p,"PROJECT_STARTED","Runtime entered RUNNING state");
  else addProjectEvent(p,"PROJECT_STOPPED","Supervisor released runtime task");
  saveProjects();
  refreshAll();
  if (selectedProjectIndex === index) renderProjectDrawer();
  toast(`${p.name}: ${p.state.toUpperCase()}`);
}

function renderPins(filter="all", query="") {
  const pins = buildPinDefinitions();
  const matched = pins.filter(p => {
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
      <span>${escapeHTML(p.role)}</span>
      <i></i>
    </button>
  `).join("");
  host.querySelectorAll(".pin").forEach(btn => btn.addEventListener("click", () => inspectPin(Number(btn.dataset.gpio))));
}

function inspectPin(gpio) {
  const p = buildPinDefinitions().find(x=>x.gpio===gpio);
  document.querySelectorAll(".pin").forEach(b=>b.classList.toggle("selected",Number(b.dataset.gpio)===gpio));
  const stateLabel = {free:"FREE",used:"CLAIMED",shared:"SHARED",reserved:"RESERVED"}[p.state];
  document.getElementById("pinInspector").innerHTML = `
    <span class="section-kicker">PIN INSPECTOR</span>
    <div class="inspector-detail">
      <h3>GPIO ${p.gpio}</h3>
      <div class="owner">${escapeHTML(p.owner)}</div>
      <div style="margin-top:12px">${p.state==="free"?'<span class="pill green">FREE</span>':p.state==="shared"?'<span class="pill" style="color:#ffc67a">SHARED</span>':p.state==="used"?'<span class="pill blue">CLAIMED</span>':'<span class="pill">RESERVED</span>'}</div>
      <div class="detail-table">
        <div><span>Role</span><strong>${escapeHTML(p.role)}</strong></div>
        <div><span>State</span><strong>${stateLabel}</strong></div>
        <div><span>Owner</span><strong>${escapeHTML(p.owner)}</strong></div>
        <div><span>Runtime change</span><strong>${p.state==="free"?"Allowed":"Guarded"}</strong></div>
      </div>
      <span class="section-kicker" style="display:block;margin-top:18px">CAPABILITIES</span>
      <div class="capabilities">${p.capabilities.map(c=>`<span class="resource-chip">${escapeHTML(c)}</span>`).join("")}</div>
      <button class="btn ${p.state==="free"?"primary":"ghost"} wide" id="assignPinFromInspector" style="margin-top:20px" ${p.state==="reserved"?"disabled":""}>
        ${p.state==="free"?"Gán cho project":"Xem resource owner"}
      </button>
      <p style="font-size:8px;line-height:1.55;color:#56647b;margin-top:13px">Prototype: Board Profile thật sẽ quyết định capability và pin reservation theo đúng module.</p>
    </div>
  `;
  document.getElementById("assignPinFromInspector")?.addEventListener("click",()=>{
    if (p.state === "free") {
      switchView("projects");
      toast("Mở một Project Workspace rồi chọn Assign để claim GPIO.");
    } else if (p.owner.startsWith("project.")) {
      const index = projects.findIndex(project=>project.id===p.owner);
      if (index>=0) openProjectDrawer(index);
    }
  });
}

document.querySelectorAll("#pinFilter button").forEach(btn => {
  btn.addEventListener("click", () => {
    currentPinFilter = btn.dataset.filter;
    document.querySelectorAll("#pinFilter button").forEach(x=>x.classList.toggle("active",x===btn));
    renderPins(currentPinFilter, document.getElementById("pinSearch").value);
  });
});
document.getElementById("pinSearch").addEventListener("input", e => renderPins(currentPinFilter,e.target.value));

/* Project Workspace */
const projectDrawer = document.getElementById("projectDrawer");
const drawerBackdrop = document.getElementById("projectDrawerBackdrop");

function openProjectDrawer(index) {
  if (!projects[index]) return;
  selectedProjectIndex = index;
  renderProjectDrawer();
  drawerBackdrop.hidden = false;
  requestAnimationFrame(()=>{
    drawerBackdrop.classList.add("visible");
    projectDrawer.classList.add("open");
    projectDrawer.setAttribute("aria-hidden","false");
  });
}

function closeProjectDrawer() {
  drawerBackdrop.classList.remove("visible");
  projectDrawer.classList.remove("open");
  projectDrawer.setAttribute("aria-hidden","true");
  setTimeout(()=>{drawerBackdrop.hidden=true;},220);
}

document.getElementById("closeProjectDrawer").addEventListener("click",closeProjectDrawer);
drawerBackdrop.addEventListener("click",closeProjectDrawer);

function renderProjectDrawer() {
  const p = projects[selectedProjectIndex];
  if (!p) return;
  document.getElementById("drawerProjectName").textContent = p.name;
  document.getElementById("drawerProjectId").textContent = p.id;
  document.getElementById("drawerCpu").textContent = p.cpu;
  document.getElementById("drawerMemory").textContent = p.memory;
  document.getElementById("drawerRestarts").textContent = p.restarts;
  document.getElementById("drawerAutostart").checked = p.autostart;

  const state = document.getElementById("drawerState");
  state.className = p.state==="running" ? "pill green" : "pill";
  state.innerHTML = p.state==="running" ? '<span class="dot green"></span> RUNNING' : 'STOPPED';

  const toggle = document.getElementById("drawerToggleProject");
  toggle.className = `btn ${p.state==="running"?"ghost":"primary"}`;
  toggle.innerHTML = `<svg><use href="#${p.state==="running"?"i-stop":"i-play"}"/></svg><span>${p.state==="running"?"Stop project":"Start project"}</span>`;

  renderDrawerResources();
  document.getElementById("drawerManifest").textContent = JSON.stringify({
    name:p.name,
    id:p.id,
    autostart:p.autostart,
    resources:p.resources,
    runtime:{memoryBudget:p.state==="running"?p.memory:"64 KB",watchdog:"enabled",restartPolicy:"on-failure"},
    permissions:["storage.read","events.subscribe"]
  },null,2);
  renderProjectEvents(p);
}

document.getElementById("drawerToggleProject").addEventListener("click",()=>toggleProject(selectedProjectIndex));
document.getElementById("drawerAutostart").addEventListener("change",event=>{
  const p=projects[selectedProjectIndex]; if(!p)return;
  p.autostart=event.target.checked;
  addProjectEvent(p,"AUTOSTART_CHANGED",p.autostart?"Enabled":"Disabled");
  saveProjects(); refreshAll(); renderProjectDrawer();
  toast(`Auto Start: ${p.autostart?"ON":"OFF"}`);
});

document.querySelectorAll("#drawerTabs button").forEach(btn=>btn.addEventListener("click",()=>showDrawerTab(btn.dataset.tab)));
document.querySelectorAll("[data-drawer-tab]").forEach(btn=>btn.addEventListener("click",()=>showDrawerTab(btn.dataset.drawerTab)));

function showDrawerTab(tab) {
  document.querySelectorAll("#drawerTabs button").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
  document.querySelectorAll(".drawer-tab").forEach(p=>p.classList.toggle("active",p.dataset.panel===tab));
}

function renderDrawerResources() {
  const p=projects[selectedProjectIndex];
  const host=document.getElementById("drawerResources");
  if(!p || !p.resources.length){
    host.innerHTML='<div class="empty-resources">Project chưa claim tài nguyên nào.</div>'; return;
  }
  host.innerHTML=p.resources.map((resource,index)=>{
    const removable=/^GPIO\d+$/.test(resource);
    return `<div class="assigned-resource">
      <div class="assigned-resource-icon">${resource.startsWith("GPIO")?"IO":resource.includes("/")?"FS":"BUS"}</div>
      <div><strong>${escapeHTML(resource)}</strong><span>${resourceDescription(resource)}</span></div>
      ${removable?`<button class="resource-remove" data-remove-resource="${index}" aria-label="Release ${escapeHTML(resource)}"><svg><use href="#i-x"/></svg></button>`:"<span></span>"}
    </div>`;
  }).join("");
  host.querySelectorAll("[data-remove-resource]").forEach(btn=>btn.addEventListener("click",()=>{
    const p=projects[selectedProjectIndex];
    const removed=p.resources.splice(Number(btn.dataset.removeResource),1)[0];
    addProjectEvent(p,"RESOURCE_RELEASED",removed);
    saveProjects();refreshAll();renderProjectDrawer();toast(`${removed} released`);
  }));
}

function resourceDescription(resource) {
  if(/^GPIO\d+$/.test(resource)) return "Exclusive GPIO claim";
  if(resource.startsWith("/dev/")) return "Device binding";
  if(resource.startsWith("/mnt/")) return "Storage mount";
  if(resource.startsWith("I2C")) return "Shared bus";
  if(resource.startsWith("SPI")) return "Bus capability";
  return "Runtime resource";
}

function addProjectEvent(project,type,message) {
  project.events = project.events || [];
  project.events.unshift({time:new Date().toLocaleTimeString("vi-VN",{hour12:false}),type,message});
  project.events=project.events.slice(0,16);
}

function renderProjectEvents(project) {
  const defaults=[
    {time:"13:51:08",type:"SUPERVISOR_HEALTH",message:"Watchdog heartbeat healthy"},
    {time:"13:48:32",type:"RESOURCE_CHECK",message:"Resource ownership validated"}
  ];
  const events=(project.events&&project.events.length?project.events:defaults);
  document.getElementById("drawerEvents").innerHTML=events.map(e=>`
    <div class="project-event"><time>${escapeHTML(e.time)}</time><i></i><div><strong>${escapeHTML(e.type)}</strong><span>${escapeHTML(e.message)}</span></div></div>
  `).join("");
}

/* Resource Assignment */
const resourceModal=document.getElementById("resourceModal");
const resourceSearch=document.getElementById("resourceSearch");
const onlyFreePins=document.getElementById("onlyFreePins");

document.getElementById("assignResourceBtn").addEventListener("click",()=>{
  if(selectedProjectIndex===null)return;
  selectedResourcePin=null;
  resourceSearch.value="";
  onlyFreePins.checked=true;
  document.getElementById("resourceConflict").hidden=true;
  document.getElementById("confirmResource").disabled=true;
  renderResourcePicker();
  resourceModal.hidden=false;
});
document.getElementById("closeResourceModal").addEventListener("click",()=>resourceModal.hidden=true);
resourceModal.addEventListener("click",event=>{if(event.target===resourceModal)resourceModal.hidden=true;});
resourceSearch.addEventListener("input",renderResourcePicker);
onlyFreePins.addEventListener("change",renderResourcePicker);

function renderResourcePicker(){
  const query=resourceSearch.value.trim().toLowerCase();
  const pins=buildPinDefinitions().filter(pin=>{
    const match=(`gpio${pin.gpio} ${pin.role} ${pin.owner}`).toLowerCase().includes(query);
    return match && (!onlyFreePins.checked || pin.state==="free");
  });
  const host=document.getElementById("resourcePickerList");
  host.innerHTML=pins.map(pin=>`
    <button class="resource-option ${pin.state!=="free"?"blocked":""} ${selectedResourcePin===pin.gpio?"selected":""}" data-resource-gpio="${pin.gpio}">
      <strong>GPIO ${pin.gpio}</strong>
      <span>${escapeHTML(pin.role)} · ${escapeHTML(pin.owner)}</span>
      <em>${pin.safety==="caution"?"CAUTION":pin.state.toUpperCase()}</em>
    </button>
  `).join("") || '<div class="empty-resources">Không có GPIO phù hợp.</div>';

  host.querySelectorAll("[data-resource-gpio]").forEach(btn=>btn.addEventListener("click",()=>{
    const gpio=Number(btn.dataset.resourceGpio);
    const pin=buildPinDefinitions().find(p=>p.gpio===gpio);
    if(pin.state!=="free"){
      showResourceConflict(pin); return;
    }
    selectedResourcePin=gpio;
    const banner=document.getElementById("resourceConflict");
    if(pin.safety==="caution"){
      document.getElementById("resourceConflictText").textContent="GPIO " + pin.gpio + " là chân nhạy cảm boot/board. Có thể claim nhưng cần kiểm tra phần cứng thực tế.";
      banner.hidden=false;
    } else {
      banner.hidden=true;
    }
    document.getElementById("confirmResource").disabled=false;
    renderResourcePicker();
  }));
}

function showResourceConflict(pin){
  selectedResourcePin=null;
  const banner=document.getElementById("resourceConflict");
  document.getElementById("resourceConflictText").textContent=`GPIO ${pin.gpio} đang thuộc ${pin.owner} (${pin.role}).`;
  banner.hidden=false;
  document.getElementById("confirmResource").disabled=true;
}

document.getElementById("confirmResource").addEventListener("click",()=>{
  if(selectedProjectIndex===null || selectedResourcePin===null)return;
  const p=projects[selectedProjectIndex];
  const fresh=buildPinDefinitions().find(pin=>pin.gpio===selectedResourcePin);
  if(!fresh || fresh.state!=="free"){ if(fresh)showResourceConflict(fresh); return; }
  const resource=`GPIO${selectedResourcePin}`;
  p.resources=p.resources.filter(r=>r!=="UNASSIGNED");
  p.resources.push(resource);
  addProjectEvent(p,"RESOURCE_CLAIMED",resource);
  saveProjects();resourceModal.hidden=true;refreshAll();renderProjectDrawer();showDrawerTab("resources");
  toast(`${resource} → ${p.name}`);
});

/* Terminal */
const terminalOutput = document.getElementById("terminalOutput");
const terminalForm = document.getElementById("terminalForm");
const terminalInput = document.getElementById("terminalInput");

function terminalResponse(cmd){
  if(cmd==="help") return [
    "system info      show board/runtime summary",
    "mem              memory snapshot",
    "usb tree         USB host topology",
    "resource list    current resource ownership",
    "project list     project lifecycle state",
    "project start ID start a project",
    "project stop ID  stop a project",
    "clear            clear terminal"
  ];
  if(cmd==="system info") return ["Board     ESP32-S3-WROOM-1 N16R8","CPU       Xtensa LX7 ×2 @ 240 MHz","Flash     16 MB · PSRAM 8 MB","Runtime   healthy · prototype UI"];
  if(cmd==="mem") return ["Internal SRAM   used 318 KB · free 194 KB","PSRAM           used 2.1 MB · free 5.9 MB","Heap policy     bounded pools preferred"];
  if(cmd==="usb tree") return ["Root Host","└─ Hub 01","   ├─ Port 1  MSC  SanDisk Ultra","   ├─ Port 2  CDC  CP2102 UART","   ├─ Port 3  CDC  GNSS Receiver","   └─ Port 4  empty"];
  if(cmd==="resource list"){
    const used=buildPinDefinitions().filter(p=>p.state!=="free");
    return used.map(p=>`GPIO${String(p.gpio).padEnd(3)} ${p.state.toUpperCase().padEnd(8)} ${p.owner}`);
  }
  if(cmd==="project list") return projects.map(p=>`${p.id.padEnd(28)} ${p.state.toUpperCase()}`);
  const match=/^project\s+(start|stop)\s+(.+)$/.exec(cmd);
  if(match){
    const index=projects.findIndex(p=>p.id===match[2]);
    if(index<0)return [`project not found: ${match[2]}`];
    const desired=match[1]==="start"?"running":"stopped";
    if(projects[index].state!==desired) toggleProject(index);
    return [`${projects[index].id} -> ${desired.toUpperCase()}`];
  }
  return [`unknown command: ${cmd}`,'type "help" for available preview commands'];
}

function runCommand(command) {
  const cmd = command.trim();
  if (!cmd) return;
  if (cmd === "clear") { terminalOutput.innerHTML = ""; return; }
  terminalOutput.insertAdjacentHTML("beforeend", `<p><span class="prompt">s3core $</span> ${escapeHTML(cmd)}</p>`);
  terminalResponse(cmd).forEach(line => terminalOutput.insertAdjacentHTML("beforeend", `<p class="out">${escapeHTML(line)}</p>`));
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

terminalForm.addEventListener("submit", e => {
  e.preventDefault(); runCommand(terminalInput.value); terminalInput.value = "";
});
document.querySelectorAll("[data-command]").forEach(btn => btn.addEventListener("click", () => {
  switchView("terminal"); runCommand(btn.dataset.command);
}));
document.getElementById("clearTerminal").addEventListener("click",()=>terminalOutput.innerHTML="");

/* New Project */
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
  if(projects.some(p=>p.id===id)){toast("Project ID đã tồn tại");return;}
  projects.push({id,name,icon:"i-code",state:"stopped",autostart:false,cpu:"—",memory:"0 KB",restarts:0,resources:[],events:[]});
  saveProjects();refreshAll();modal.hidden=true;toast(`${name} đã được thêm`);openProjectDrawer(projects.length-1);
});

function refreshAll(){
  renderProjects();renderDashboardProjects();renderPins(currentPinFilter,document.getElementById("pinSearch").value);updateSummary();
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function toast(message) {
  let el=document.querySelector(".toast");
  if(!el){
    el=document.createElement("div");el.className="toast";
    Object.assign(el.style,{position:"fixed",right:"22px",bottom:"22px",zIndex:200,background:"#17233a",border:"1px solid #334463",color:"#dce4ef",borderRadius:"12px",padding:"11px 14px",fontSize:"10px",boxShadow:"0 14px 40px rgba(0,0,0,.35)",transition:".2s"});
    document.body.appendChild(el);
  }
  el.textContent=message;el.style.opacity="1";el.style.transform="translateY(0)";
  clearTimeout(el._timer);el._timer=setTimeout(()=>{el.style.opacity="0";el.style.transform="translateY(8px)";},1800);
}

document.addEventListener("keydown",event=>{
  if(event.key==="Escape"){
    if(!resourceModal.hidden)resourceModal.hidden=true;
    else if(projectDrawer.classList.contains("open"))closeProjectDrawer();
    else if(!modal.hidden)modal.hidden=true;
  }
});

refreshAll();
const initial = location.hash.slice(1);
if (views[initial]) switchView(initial);

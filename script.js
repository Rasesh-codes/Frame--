/* FRAME: simple JavaScript for the cinematic studio. */
const STORAGE_KEY = "frame-studio-projects-v1";
const DEFAULT_PROJECT = {
  id: "starter-project", name: "A Slower Kind of Day",
  scene: "coast", title: "Take the long way\nhome.",
  subtitle: "NO RUSH. NO PARTICULAR PLAN.", font: "Manrope",
  fontSize: 32, align: "left",
  overlay: 45, updatedAt: Date.now()
};
const state = {
  projects: [], activeProjectId: null,
  currentView: "projects", playbackTime: 0,
  isPlaying: false, playbackInterval: null,
  toastTimeout: null, assets: []
};
function getElement(selector) {
  return document.querySelector(selector);
}
function getAllElements(selector) {
  return document.querySelectorAll(selector);
}
const elements = {
  projectGrid: getElement("#project-grid"), projectSearch: getElement("#project-search"),
  projectCount: getElement("#project-count"), projectTotal: getElement("#project-total"),
  emptyState: getElement("#empty-state"), projectDialog: getElement("#project-dialog"),
  projectForm: getElement("#project-form"), projectNameInput: getElement("#project-name-input"),
  projectStyleInput: getElement("#project-style-input"), helpDialog: getElement("#help-dialog"),
  toast: getElement("#toast"), saveStatus: getElement("#save-status"),
  breadcrumb: getElement("#breadcrumb-current"), editorProjectName: getElement("#editor-project-name"),
  previewFrame: getElement("#preview-frame"), previewImage: getElement("#preview-image"),
  previewTitle: getElement("#preview-title"), previewSubtitle: getElement("#preview-subtitle"),
  previewTimecode: getElement("#preview-timecode"), titleInput: getElement("#title-input"),
  subtitleInput: getElement("#subtitle-input"), fontSelect: getElement("#font-select"),
  fontSize: getElement("#font-size"), fontSizeValue: getElement("#font-size-value"),
  overlayIntensity: getElement("#overlay-intensity"), overlayValue: getElement("#overlay-value"),
  playbackRange: getElement("#playback-range"), playbackTime: getElement("#playback-time"),
  playbackState: getElement("#playback-state"), playButton: getElement("#play-button"),
  playhead: getElement("#playhead"), textClip: getElement("#text-clip"),
  assetGrid: getElement("#asset-grid"), assetUpload: getElement("#asset-upload"),
  previewCopy: getElement("#preview-copy"), previewVignette: getElement(".preview-vignette")
};
function loadProjects() {
  try {
    const savedText = localStorage.getItem(STORAGE_KEY);
    const savedProjects = JSON.parse(savedText);
    if (savedProjects && savedProjects.length > 0) {
      return savedProjects;
    }
  } catch (error) {
    console.log("Saved projects could not be loaded.");
  }
  return [DEFAULT_PROJECT];
}
function saveProjects() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.projects)); elements.saveStatus.textContent = "All changes saved";
  } catch (error) {
    elements.saveStatus.textContent = "Could not save"; showToast("Browser storage is unavailable or full.");
  }
}
function getActiveProject() {
  for (let i = 0; i < state.projects.length; i++) {
    if (state.projects[i].id === state.activeProjectId) {
      return state.projects[i];
    }
  }
  return null;
}
function makeId() {
  return "project-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
}
function escapeHTML(text) {
  text = String(text); text = text.replace(/&/g, "&amp;"); text = text.replace(/</g, "&lt;"); text = text.replace(/>/g, "&gt;");
  text = text.replace(/"/g, "&quot;"); text = text.replace(/'/g, "&#39;");
  return text;
}
function formatTime(seconds) {
  seconds = Math.floor(seconds);
  if (seconds < 0) seconds = 0;
  return "00:" + String(seconds).padStart(2, "0");
}
function showToast(message) {
  clearTimeout(state.toastTimeout); elements.toast.textContent = message;
  elements.toast.classList.add("show"); state.toastTimeout = setTimeout(function () {
    elements.toast.classList.remove("show");
  }, 2600);
}
function setView(viewName) {
  state.currentView = viewName;
  const views = getAllElements(".view");
  const navButtons = getAllElements(".nav-item");
  for (let i = 0; i < views.length; i++) {
    views[i].classList.remove("active");
    if (views[i].id === viewName + "-view") {
      views[i].classList.add("active");
    }
  }
  for (let i = 0; i < navButtons.length; i++) {
    navButtons[i].classList.remove("active");
    if (navButtons[i].dataset.view === viewName) {
      navButtons[i].classList.add("active");
    }
  }
  if (viewName === "projects") elements.breadcrumb.textContent = "Projects";
  else if (viewName === "editor") elements.breadcrumb.textContent = "Editor";
  else if (viewName === "assets") elements.breadcrumb.textContent = "Media library";
  if (viewName === "projects") renderProjects();
  if (viewName === "editor") renderEditor();
  if (viewName === "assets") renderAssets();
}
function renderProjects() {
  const searchText = elements.projectSearch.value.toLowerCase().trim();
  let html = "";
  let visibleCount = 0;
  // Build one card for each project that matches the search.
  for (let i = 0; i < state.projects.length; i++) {
    const project = state.projects[i];
    if (project.name.toLowerCase().indexOf(searchText) === -1) continue;
    visibleCount++;
    let sceneName = "NEW STUDY";
    if (project.scene === "coast") sceneName = "COASTAL STUDY";
    if (project.scene === "desert") sceneName = "WARM HORIZONS";
    if (project.scene === "city") sceneName = "AFTER HOURS";
    const titleLines = escapeHTML(project.title || "Untitled").split("\n");
    let titleHTML = "";
    for (let j = 0; j < titleLines.length; j++) {
      titleHTML += "<span>" + titleLines[j] + "</span>";
    }
    html += `
      <article class="project-card" data-project-id="${escapeHTML(project.id)}">
        <div class="project-art art-${escapeHTML(project.scene)}" data-action="open"
          role="button" tabindex="0" aria-label="Open ${escapeHTML(project.name)}">
          <span class="art-label">${sceneName}</span>
          <div class="art-title">${titleHTML}</div>
          <span class="art-duration">9:16 · 00:15</span>
        </div>
        <div class="card-body">
          <div class="card-topline">
            <h3 title="${escapeHTML(project.name)}">${escapeHTML(project.name)}</h3>
            <details class="card-menu">
              <summary aria-label="Project options">•••</summary>
              <div class="menu-options">
                <button data-action="rename">Rename</button>
                <button data-action="duplicate">Duplicate</button>
                <button data-action="delete">Delete</button>
              </div>
            </details>
          </div>
          <div class="card-meta">
            <span><i class="card-dot"></i> Saved locally</span>
            <span>${new Date(project.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </article>`;
  }
  elements.projectGrid.innerHTML = html; elements.projectCount.textContent = String(state.projects.length).padStart(2, "0");
  elements.projectTotal.textContent = String(state.projects.length).padStart(2, "0");
  elements.emptyState.classList.toggle("hidden", visibleCount > 0); elements.projectGrid.classList.toggle("hidden", visibleCount === 0);
}
function renderEditor() {
  const project = getActiveProject();
  if (!project) {
    setView("projects");
    return;
  }
  elements.editorProjectName.textContent = project.name; elements.titleInput.value = project.title;
  elements.subtitleInput.value = project.subtitle; elements.fontSelect.value = project.font;
  elements.fontSize.value = project.fontSize; elements.fontSizeValue.textContent = project.fontSize + "px";
  elements.overlayIntensity.value = project.overlay; elements.overlayValue.textContent = project.overlay + "%";
  elements.previewTitle.textContent = project.title;
  elements.previewTitle.style.fontFamily = project.font === "monospace" ? "monospace" : project.font;
  elements.previewTitle.style.fontSize = project.fontSize + "px";
  elements.previewSubtitle.textContent = project.subtitle;
  elements.previewCopy.style.textAlign = project.align;
  if (project.align === "left") elements.previewCopy.style.alignItems = "flex-start";
  else if (project.align === "right") elements.previewCopy.style.alignItems = "flex-end";
  else elements.previewCopy.style.alignItems = "center";
  elements.previewImage.className = "preview-image scene-" + project.scene;
  elements.previewVignette.style.background = `linear-gradient(
    0deg,
    rgba(12,21,21,${project.overlay / 100}) 0%,
    rgba(12,21,21,${project.overlay / 250}) 68%,
    transparent 100%
  )`;
  elements.textClip.style.width = project.title.length > 35 ? "62%" : "77%";
  const sceneButtons = getAllElements(".scene-option");
  for (let i = 0; i < sceneButtons.length; i++) {
    sceneButtons[i].classList.remove("active");
    if (sceneButtons[i].dataset.scene === project.scene) {
      sceneButtons[i].classList.add("active");
    }
  }
  const alignButtons = getAllElements(".align-button");
  for (let i = 0; i < alignButtons.length; i++) {
    alignButtons[i].classList.remove("active");
    if (alignButtons[i].dataset.align === project.align) {
      alignButtons[i].classList.add("active");
    }
  }
  renderPlayback();
}
function updateActiveProject(field, value) {
  const project = getActiveProject();
  if (!project) return;
  project[field] = value; project.updatedAt = Date.now(); saveProjects(); renderEditor();
  renderProjects();
}
function openProject(projectId) {
  for (let i = 0; i < state.projects.length; i++) {
    if (state.projects[i].id === projectId) {
      state.activeProjectId = projectId; stopPlayback(); setView("editor");
      return;
    }
  }
}
function openCreateDialog() {
  elements.projectForm.reset(); elements.projectDialog.showModal(); elements.projectNameInput.focus();
}
function createProject(name, scene) {
  const project = {
    id: makeId(), name: name.trim(),
    scene: scene, title: "Your next\nbig idea.",
    subtitle: "MAKE THE MOMENT YOURS.", font: "Manrope",
    fontSize: 32, align: "left",
    overlay: 45, updatedAt: Date.now()
  }; state.projects.unshift(project); state.activeProjectId = project.id; saveProjects();
  elements.projectDialog.close(); elements.projectSearch.value = ""; setView("editor"); showToast("Project created.");
}
function renameProject(projectId) {
  const project = findProject(projectId);
  if (!project) return;
  const newName = prompt("Enter a new project name:", project.name);
  if (newName === null) return;
  if (newName.trim() === "") {
    showToast("Project name cannot be empty.");
    return;
  }
  project.name = newName.trim().slice(0, 50); project.updatedAt = Date.now(); saveProjects(); renderProjects();
  if (project.id === state.activeProjectId) renderEditor();
}
function findProject(projectId) {
  for (let i = 0; i < state.projects.length; i++) {
    if (state.projects[i].id === projectId) return state.projects[i];
  }
  return null;
}
function duplicateProject(projectId) {
  const project = findProject(projectId);
  if (!project) return;
  const copy = {
    id: makeId(), name: project.name + " copy",
    scene: project.scene, title: project.title,
    subtitle: project.subtitle, font: project.font,
    fontSize: project.fontSize, align: project.align,
    overlay: project.overlay, updatedAt: Date.now()
  }; state.projects.unshift(copy); saveProjects(); renderProjects();
  showToast("Project duplicated.");
}
function deleteProject(projectId) {
  const project = findProject(projectId);
  if (!project) return;
  if (!confirm('Delete "' + project.name + '"? This cannot be undone.')) return;
  const remainingProjects = [];
  for (let i = 0; i < state.projects.length; i++) {
    if (state.projects[i].id !== projectId) remainingProjects.push(state.projects[i]);
  }
  state.projects = remainingProjects;
  if (state.projects.length === 0) {
    const starter = {
      id: makeId(), name: DEFAULT_PROJECT.name, scene: DEFAULT_PROJECT.scene,
      title: DEFAULT_PROJECT.title, subtitle: DEFAULT_PROJECT.subtitle,
      font: DEFAULT_PROJECT.font, fontSize: DEFAULT_PROJECT.fontSize,
      align: DEFAULT_PROJECT.align, overlay: DEFAULT_PROJECT.overlay, updatedAt: Date.now()
    }; state.projects.push(starter);
  }
  if (state.activeProjectId === projectId) {
    state.activeProjectId = state.projects[0].id; stopPlayback(); setView("projects");
  } else {
    renderProjects();
  }
  saveProjects(); showToast("Project deleted.");
}
function renderPlayback() {
  elements.playbackRange.value = state.playbackTime; elements.playbackTime.textContent = formatTime(state.playbackTime);
  elements.previewTimecode.textContent = formatTime(state.playbackTime) + " / 00:15";
  elements.playhead.style.left = (state.playbackTime / 15 * 100) + "%";
}
function startPlayback() {
  if (state.isPlaying) return;
  if (state.playbackTime >= 15) state.playbackTime = 0;
  state.isPlaying = true; elements.previewFrame.classList.add("is-playing");
  elements.playButton.textContent = "Ⅱ"; elements.playbackState.textContent = "Preview playing";
  state.playbackInterval = setInterval(function () {
    state.playbackTime += 0.1;
    if (state.playbackTime >= 15) {
      state.playbackTime = 15; renderPlayback(); stopPlayback();
    } else {
      renderPlayback();
    }
  }, 100);
}
function stopPlayback() {
  state.isPlaying = false; clearInterval(state.playbackInterval);
  state.playbackInterval = null; elements.previewFrame.classList.remove("is-playing");
  elements.playButton.textContent = "▶"; elements.playbackState.textContent = "Preview paused";
}
function togglePlayback() {
  if (state.isPlaying) stopPlayback();
  else startPlayback();
}
function exportPreview() {
  const project = getActiveProject();
  if (!project) return;
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1920;
  const context = canvas.getContext("2d");
  let colors = ["#d4c6a7", "#294748", "#152b2e"];
  if (project.scene === "desert") colors = ["#f2cba3", "#bb7c59", "#6c493b"];
  if (project.scene === "city") colors = ["#242b42", "#59647a", "#c18e6b"];
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, colors[0]); gradient.addColorStop(0.48, colors[1]);
  gradient.addColorStop(1, colors[2]); context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height); context.fillStyle = "rgba(235,224,196,0.35)";
  context.beginPath(); context.ellipse(500, 960, 900, 210, -0.12, 0, Math.PI * 2); context.fill();
  const vignette = context.createLinearGradient(0, 700, 0, 1920);
  vignette.addColorStop(0, "rgba(8,15,15,0)"); vignette.addColorStop(1, "rgba(8,15,15," + project.overlay / 100 + ")");
  context.fillStyle = vignette; context.fillRect(0, 0, canvas.width, canvas.height);
  let x = 100;
  if (project.align === "center") x = 540;
  if (project.align === "right") x = 980;
  context.textAlign = project.align; context.fillStyle = "#fff8e9"; context.font = "600 " + (project.fontSize * 2.5) + "px " + project.font;
  const lines = project.title.split("\n");
  let y = 890;
  for (let i = 0; i < lines.length; i++) {
    context.fillText(lines[i], x, y, 850); y += project.fontSize * 2.8;
  }
  context.font = "500 25px monospace"; context.fillStyle = "#fff8e9cc";
  context.fillText(project.subtitle, x, y + 55, 850); context.textAlign = "left";
  context.font = "22px monospace"; context.fillText("FRAME®", 70, 1830);
  context.textAlign = "right"; context.fillText("00:15 / 9:16", 1010, 1830);
  const downloadLink = document.createElement("a");
  downloadLink.download = "frame-preview.png"; downloadLink.href = canvas.toDataURL("image/png");
  downloadLink.click(); showToast("PNG image exported. This is not a video.");
}
function renderAssets() {
  if (state.assets.length === 0) {
    elements.assetGrid.innerHTML = `
      <div class="asset-empty">
        <span>▧</span>
        <h3>Your library is waiting</h3>
        <p>Import an image to add it to the media library.</p>
      </div>`;
    return;
  }
  let html = "";
  for (let i = 0; i < state.assets.length; i++) {
    const asset = state.assets[i];
    html += `
      <article class="asset-card" data-asset-id="${asset.id}">
        <img src="${asset.url}" alt="${escapeHTML(asset.name)}">
        <div><strong>${escapeHTML(asset.name)}</strong>
        <button data-action="use-asset">Use as scene</button></div>
      </article>`;
  }
  elements.assetGrid.innerHTML = html;
}
function handleAssetUpload(event) {
  const files = event.target.files;
  let added = 0;
  for (let i = 0; i < files.length; i++) {
    if (files[i].type.indexOf("image/") !== 0) continue;
    state.assets.push({
      id: makeId(), name: files[i].name,
      url: URL.createObjectURL(files[i])
    }); added++;
  }
  if (added > 0) {
    renderAssets(); showToast(added + " image(s) imported for this session.");
  }
  elements.assetUpload.value = "";
}
function useAsset(assetId) {
  let asset = null;
  for (let i = 0; i < state.assets.length; i++) {
    if (state.assets[i].id === assetId) asset = state.assets[i];
  }
  if (!asset) return;
  if (!getActiveProject()) {
    showToast("Open a project first.");
    return;
  }
  elements.previewImage.style.background = 'center / cover no-repeat url("' + asset.url + '")';
  elements.previewImage.className = "preview-image"; showToast("Image applied. It is only saved for this session.");
}
function bindEvents() {
  const navButtons = getAllElements(".nav-item");
  for (let i = 0; i < navButtons.length; i++) {
    navButtons[i].addEventListener("click", function () {
      setView(navButtons[i].dataset.view);
    });
  }
  getElement("#new-project").addEventListener("click", openCreateDialog);
  getElement("#new-project-top").addEventListener("click", openCreateDialog);
  getElement("#empty-create").addEventListener("click", openCreateDialog);
  getElement("#close-dialog").addEventListener("click", function () { elements.projectDialog.close(); });
  getElement("#cancel-dialog").addEventListener("click", function () { elements.projectDialog.close(); });
  elements.projectForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const name = elements.projectNameInput.value.trim();
    if (name !== "") createProject(name, elements.projectStyleInput.value);
  });
  getElement("#help-button").addEventListener("click", function () { elements.helpDialog.showModal(); });
  getElement("#close-help").addEventListener("click", function () { elements.helpDialog.close(); });
  getElement("#got-it").addEventListener("click", function () { elements.helpDialog.close(); });
  elements.projectSearch.addEventListener("input", renderProjects);
  elements.projectGrid.addEventListener("click", function (event) {
    const actionElement = event.target.closest("[data-action]");
    const card = event.target.closest("[data-project-id]");
    if (!card || !actionElement) return;
    const projectId = card.dataset.projectId;
    const action = actionElement.dataset.action;
    if (action === "open") openProject(projectId);
    if (action === "rename") renameProject(projectId);
    if (action === "duplicate") duplicateProject(projectId);
    if (action === "delete") deleteProject(projectId);
    const menu = actionElement.closest("details");
    if (menu) menu.open = false;
  });
  elements.projectGrid.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (!event.target.matches('[data-action="open"]')) return;
    event.preventDefault();
    const card = event.target.closest("[data-project-id]");
    if (card) openProject(card.dataset.projectId);
  });
  getElement("#back-projects").addEventListener("click", function () {
    stopPlayback(); setView("projects");
  });
  getElement("#rename-project").addEventListener("click", function () {
    const project = getActiveProject();
    if (project) renameProject(project.id);
  });
  elements.titleInput.addEventListener("input", function () {
    updateActiveProject("title", elements.titleInput.value);
  });
  elements.subtitleInput.addEventListener("input", function () {
    updateActiveProject("subtitle", elements.subtitleInput.value);
  });
  elements.fontSelect.addEventListener("change", function () {
    updateActiveProject("font", elements.fontSelect.value);
  });
  elements.fontSize.addEventListener("input", function () {
    updateActiveProject("fontSize", Number(elements.fontSize.value));
    elements.fontSizeValue.textContent = elements.fontSize.value + "px";
  });
  elements.overlayIntensity.addEventListener("input", function () {
    updateActiveProject("overlay", Number(elements.overlayIntensity.value));
    elements.overlayValue.textContent = elements.overlayIntensity.value + "%";
  });
  const alignButtons = getAllElements(".align-button");
  for (let i = 0; i < alignButtons.length; i++) {
    alignButtons[i].addEventListener("click", function () {
      updateActiveProject("align", alignButtons[i].dataset.align);
    });
  }
  const sceneButtons = getAllElements(".scene-option");
  for (let i = 0; i < sceneButtons.length; i++) {
    sceneButtons[i].addEventListener("click", function () {
      updateActiveProject("scene", sceneButtons[i].dataset.scene);
    });
  }
  elements.playButton.addEventListener("click", togglePlayback);
  getElement("#restart-button").addEventListener("click", function () {
    stopPlayback(); state.playbackTime = 0; renderPlayback();
  });
  elements.playbackRange.addEventListener("input", function () {
    state.playbackTime = Number(elements.playbackRange.value); renderPlayback();
  });
  getElement("#export-button").addEventListener("click", exportPreview);
  getElement("#add-text-track").addEventListener("click", function () {
    const project = getActiveProject();
    if (!project) return;
    const newTitle = prompt("Enter text for the headline:", project.title);
    if (newTitle !== null) updateActiveProject("title", newTitle);
  });
  getElement("#reset-timeline").addEventListener("click", function () {
    stopPlayback(); state.playbackTime = 0; renderPlayback(); showToast("Playhead reset.");
  });
  elements.assetUpload.addEventListener("change", handleAssetUpload);
  elements.assetGrid.addEventListener("click", function (event) {
    const button = event.target.closest('[data-action="use-asset"]');
    if (!button) return;
    const card = button.closest("[data-asset-id]");
    if (card) useAsset(card.dataset.assetId);
  });
}
function init() {
  state.projects = loadProjects();
  if (state.projects.length === 0) state.projects.push(DEFAULT_PROJECT);
  state.activeProjectId = state.projects[0].id; bindEvents(); renderProjects(); renderEditor();
  renderAssets(); setView("projects");
}
init();
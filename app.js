const platforms = [
  { name: "Instagram", format: "Reel + feed card", active: true },
  { name: "Facebook", format: "Page post", active: true },
  { name: "LinkedIn", format: "Company update", active: true },
  { name: "TikTok", format: "Short video", active: true },
  { name: "YouTube", format: "Shorts", active: true },
  { name: "Pinterest", format: "Idea pin", active: true },
];

const seedBrands = [
  {
    id: "luna",
    name: "Luna Brew Cafe",
    initials: "LB",
    tone: "Warm and premium",
    audience: "busy professionals and coffee lovers",
    goal: "Launch a new product",
    message: "Announce a summer cold brew flight with three new flavors and a first-week discount.",
    selectedPlatforms: ["Instagram", "Facebook", "LinkedIn", "TikTok", "YouTube", "Pinterest"],
  },
  {
    id: "nova",
    name: "NovaFit Studio",
    initials: "NF",
    tone: "Bold and playful",
    audience: "new gym members and wellness beginners",
    goal: "Drive appointments",
    message: "Promote a free movement assessment and a seven-day starter class pack.",
    selectedPlatforms: ["Instagram", "Facebook", "TikTok", "YouTube"],
  },
  {
    id: "atlas",
    name: "Atlas Legal Partners",
    initials: "AL",
    tone: "Professional",
    audience: "startup founders and small business owners",
    goal: "Grow followers",
    message: "Share a founder-friendly checklist for protecting contracts before fundraising.",
    selectedPlatforms: ["LinkedIn", "Facebook", "YouTube", "Pinterest"],
  },
];

const channelList = document.querySelector("#channelList");
const platformPicker = document.querySelector("#platformPicker");
const postGrid = document.querySelector("#postGrid");
const queueList = document.querySelector("#queueList");
const queueCount = document.querySelector("#queueCount");
const briefForm = document.querySelector("#briefForm");
const dateInput = document.querySelector("#dateInput");
const cardBrand = document.querySelector("#cardBrand");
const cardHeadline = document.querySelector("#cardHeadline");
const cardCta = document.querySelector("#cardCta");
const videoSubtitle = document.querySelector("#videoSubtitle");
const scheduleAllButton = document.querySelector("#scheduleAllButton");
const exportPlanButton = document.querySelector("#exportPlanButton");
const previewTitle = document.querySelector("#previewTitle");
const artCard = document.querySelector("#artCard");
const videoCard = document.querySelector("#videoCard");
const brandList = document.querySelector("#brandList");
const brandCount = document.querySelector("#brandCount");
const channelCount = document.querySelector("#channelCount");
const activeBrandLine = document.querySelector("#activeBrandLine");
const workspaceStats = document.querySelector("#workspaceStats");
const generateAllBrandsButton = document.querySelector("#generateAllBrandsButton");

const state = {
  activeBrandId: "luna",
  brands: seedBrands.map((brand, index) => ({
    ...brand,
    posts: [],
    queue: [],
    date: formatDate(addDays(new Date(), index + 1)),
  })),
};

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function sentenceCase(text) {
  const cleaned = text.trim().replace(/\s+/g, " ");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function slugWords(text) {
  return text
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 4)
    .map((word) => `#${word}`);
}

function activeBrand() {
  return state.brands.find((brand) => brand.id === state.activeBrandId);
}

function getBriefFromForm() {
  return {
    name: document.querySelector("#brandInput").value.trim() || "Your Brand",
    goal: document.querySelector("#goalInput").value,
    audience: document.querySelector("#audienceInput").value.trim() || "your audience",
    message: document.querySelector("#messageInput").value.trim() || "Share a timely campaign update.",
    tone: document.querySelector("#toneInput").value,
    date: dateInput.value,
    selectedPlatforms: [...document.querySelectorAll("[name='platform']:checked")].map((input) => input.value),
  };
}

function syncActiveBrandFromForm() {
  const brand = activeBrand();
  Object.assign(brand, getBriefFromForm());
}

function loadBrandIntoForm(brand) {
  document.querySelector("#brandInput").value = brand.name;
  document.querySelector("#goalInput").value = brand.goal;
  document.querySelector("#audienceInput").value = brand.audience;
  document.querySelector("#messageInput").value = brand.message;
  document.querySelector("#toneInput").value = brand.tone;
  dateInput.value = brand.date;
}

function buildCaption(platform, brand) {
  const shortMessage = sentenceCase(brand.message);
  const hooks = {
    Instagram: "Your next scroll-stopper is ready.",
    Facebook: "Here is something worth sharing with the community.",
    LinkedIn: "A polished update for the people watching your next move.",
    TikTok: "Make this the three-second hook before the reveal.",
    YouTube: "Open with motion, close with a clear invitation.",
    Pinterest: "Turn this into a save-worthy idea people can return to.",
  };
  const ctas = {
    Instagram: "Tap save and visit us this week.",
    Facebook: "Send this to someone who needs a small upgrade today.",
    LinkedIn: "Comment if this belongs in your weekly routine.",
    TikTok: "Follow for the full reveal.",
    YouTube: "Subscribe for the next drop.",
    Pinterest: "Save this idea for later.",
  };

  return `${hooks[platform]} ${shortMessage} Built for ${brand.audience}. ${ctas[platform]}`;
}

function generatePostsForBrand(brand) {
  const tags = [...new Set(["#campaign", "#socialcontent", ...slugWords(brand.name), ...slugWords(brand.message)])].slice(0, 5);

  brand.posts = brand.selectedPlatforms.map((platform, index) => ({
    id: `${brand.id}-${platform}-${Date.now()}-${index}`,
    brandId: brand.id,
    brandName: brand.name,
    platform,
    format: platforms.find((item) => item.name === platform)?.format || "Post",
    caption: buildCaption(platform, brand),
    media: platform === "TikTok" || platform === "YouTube" ? "Video" : "Art card",
    tags,
    date: brand.date,
    time: ["9:30 AM", "11:45 AM", "2:15 PM", "5:40 PM", "7:20 PM", "8:10 PM"][index % 6],
    selected: true,
  }));
}

function generatePosts() {
  syncActiveBrandFromForm();
  generatePostsForBrand(activeBrand());
  renderApp();
}

function updatePreview() {
  const brand = activeBrand();
  const headline = brand.message.split(" ").slice(0, 5).join(" ");
  cardBrand.textContent = brand.name;
  cardHeadline.textContent = headline || brand.goal;
  cardCta.textContent = brand.goal.includes("offer") ? "Limited offer" : "Schedule now";
  videoSubtitle.textContent = brand.message.split(".")[0] || "New campaign ready to publish.";
  activeBrandLine.textContent = `${brand.name} workspace`;
}

function renderBrandList() {
  brandCount.textContent = `${state.brands.length} brands`;
  brandList.innerHTML = state.brands
    .map(
      (brand) => `
        <button class="brand-switch ${brand.id === state.activeBrandId ? "is-active" : ""}" type="button" data-brand="${brand.id}">
          <span class="brand-avatar">${brand.initials}</span>
          <span>
            <strong>${brand.name}</strong>
            <span>${brand.tone}</span>
          </span>
          <span class="brand-queue-count">${brand.queue.length}</span>
        </button>
      `,
    )
    .join("");
}

function renderChannels() {
  const brand = activeBrand();
  const activeChannels = brand.selectedPlatforms.length;
  channelCount.textContent = `${activeChannels} active`;
  channelList.innerHTML = platforms
    .map((platform) => {
      const connected = brand.selectedPlatforms.includes(platform.name);
      return `
        <div class="channel">
          <div>
            <strong>${platform.name}</strong>
            <p class="eyebrow">${connected ? platform.format : "Not connected"}</p>
          </div>
          <span class="status-dot ${connected ? "" : "is-muted"}" aria-label="${connected ? "Connected" : "Disconnected"}"></span>
        </div>
      `;
    })
    .join("");
}

function renderPlatformPicker() {
  const brand = activeBrand();
  platformPicker.innerHTML = platforms
    .map(
      (platform) => `
        <label>
          <input type="checkbox" name="platform" value="${platform.name}" ${brand.selectedPlatforms.includes(platform.name) ? "checked" : ""} />
          ${platform.name}
        </label>
      `,
    )
    .join("");
}

function renderPosts() {
  const brand = activeBrand();
  postGrid.innerHTML = brand.posts
    .map(
      (post) => `
        <article class="post-card">
          <header>
            <div>
              <h4>${post.platform}</h4>
              <p>${post.brandName} · ${post.format} · ${post.media}</p>
            </div>
            <input type="checkbox" aria-label="Select ${post.platform}" data-select="${post.id}" ${post.selected ? "checked" : ""} />
          </header>
          <p>${post.caption}</p>
          <div class="hashtag-row">
            ${post.tags.map((tag) => `<span>${tag}</span>`).join("")}
          </div>
          <div class="card-actions">
            <span>${post.date} · ${post.time}</span>
            <button type="button" data-schedule="${post.id}">Schedule</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderQueue() {
  const brand = activeBrand();
  queueCount.textContent = `${brand.queue.length} scheduled`;
  queueList.innerHTML =
    brand.queue.length === 0
      ? `<div class="queue-item is-empty"><p>No posts scheduled for ${brand.name} yet. Generate a set, then schedule selected drafts.</p></div>`
      : brand.queue
          .map(
            (item) => `
              <div class="queue-item">
                <time>${item.date}<br />${item.time}</time>
                <div>
                  <strong>${item.platform}</strong>
                  <p>${item.brandName} ${item.media.toLowerCase()} queued for automatic publishing</p>
                </div>
                <span>${item.format}</span>
              </div>
            `,
          )
          .join("");
}

function renderMetrics() {
  const brand = activeBrand();
  const count = Math.max(brand.posts.length, 1);
  document.querySelector("#reachMetric").textContent = `${(count * 4.6).toFixed(1)}k`;
  document.querySelector("#engagementMetric").textContent = `${(4.2 + count * 0.35).toFixed(1)}%`;
  document.querySelector("#timeMetric").textContent = brand.posts[0]?.time || "9:30 AM";

  const totalPosts = state.brands.reduce((sum, item) => sum + item.posts.length, 0);
  const totalQueue = state.brands.reduce((sum, item) => sum + item.queue.length, 0);
  workspaceStats.innerHTML = `
    <div class="workspace-stat"><strong>${state.brands.length}</strong><span>brands</span></div>
    <div class="workspace-stat"><strong>${totalPosts}</strong><span>drafts</span></div>
    <div class="workspace-stat"><strong>${totalQueue}</strong><span>scheduled</span></div>
  `;
}

function renderApp({ reloadForm = false } = {}) {
  if (reloadForm) loadBrandIntoForm(activeBrand());
  renderBrandList();
  renderPlatformPicker();
  renderChannels();
  renderPosts();
  renderQueue();
  renderMetrics();
  updatePreview();
}

function schedulePost(post) {
  const brand = state.brands.find((item) => item.id === post.brandId);
  if (!brand.queue.some((item) => item.id === post.id)) {
    brand.queue.push(post);
  }
  renderApp();
}

briefForm.addEventListener("submit", (event) => {
  event.preventDefault();
  generatePosts();
});

briefForm.addEventListener("input", () => {
  syncActiveBrandFromForm();
  renderBrandList();
  renderChannels();
  updatePreview();
});

briefForm.addEventListener("change", () => {
  syncActiveBrandFromForm();
  renderBrandList();
  renderChannels();
  renderPlatformPicker();
  updatePreview();
});

brandList.addEventListener("click", (event) => {
  const switchButton = event.target.closest("[data-brand]");
  if (!switchButton) return;
  syncActiveBrandFromForm();
  state.activeBrandId = switchButton.dataset.brand;
  renderApp({ reloadForm: true });
});

postGrid.addEventListener("change", (event) => {
  const id = event.target.dataset.select;
  if (!id) return;
  const post = activeBrand().posts.find((item) => item.id === id);
  if (post) post.selected = event.target.checked;
});

postGrid.addEventListener("click", (event) => {
  const id = event.target.dataset.schedule;
  if (!id) return;
  const post = activeBrand().posts.find((item) => item.id === id);
  if (post) schedulePost(post);
});

scheduleAllButton.addEventListener("click", () => {
  activeBrand().posts.filter((post) => post.selected).forEach(schedulePost);
});

generateAllBrandsButton.addEventListener("click", () => {
  syncActiveBrandFromForm();
  state.brands.forEach(generatePostsForBrand);
  renderApp();
});

exportPlanButton.addEventListener("click", async () => {
  const plan = JSON.stringify({ generatedAt: new Date().toISOString(), brands: state.brands }, null, 2);
  await navigator.clipboard.writeText(plan);
  exportPlanButton.textContent = "Copied JSON";
  setTimeout(() => {
    exportPlanButton.textContent = "Export plan";
  }, 1800);
});

document.querySelectorAll("[data-preview]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-preview]").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    const isVideo = button.dataset.preview === "video";
    artCard.hidden = isVideo;
    videoCard.hidden = !isVideo;
    previewTitle.textContent = isVideo ? "Short video preview" : "Instagram art card";
  });
});

state.brands.forEach(generatePostsForBrand);
renderApp({ reloadForm: true });

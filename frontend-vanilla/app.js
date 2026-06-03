// CONFIGURATION Constants
const BACKEND_URL = 'http://127.0.0.1:8000';
const SVG_CIRCUMFERENCE = 2 * Math.PI * 50; // ~314.159

// APP STATE
let state = {
  loading: false,
  progress: 0,
  progressInterval: null,
  activeProfile: '',
  chartInstances: {}
};

// SELECT DOM ELEMENTS
const searchForm = document.getElementById('search-form');
const profileUrlInput = document.getElementById('profile-url');
const submitBtn = document.getElementById('submit-btn');
const emptyState = document.getElementById('empty-state');
const loaderState = document.getElementById('loader-state');
const dashboardState = document.getElementById('dashboard-state');
const errorPanel = document.getElementById('error-panel');
const errorMessage = document.getElementById('error-message');

const progressCircle = document.getElementById('progress-circle');
const loaderPct = document.getElementById('loader-pct');
const loaderStatus = document.getElementById('loader-status');

const historyListContainer = document.getElementById('history-list');

// INITIALIZE APP
document.addEventListener('DOMContentLoaded', () => {
  init();
});

function init() {
  // Set initial circular loader offset
  if (progressCircle) {
    progressCircle.style.strokeDashoffset = SVG_CIRCUMFERENCE;
  }
  
  // Load audit history list
  loadHistory();
  
  // Attach search form submit listener
  if (searchForm) {
    searchForm.addEventListener('submit', handleSearchSubmit);
  }
  
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ─── API HISTORY LIST FETCHER ───
async function loadHistory() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/history-list`);
    if (!res.ok) throw new Error('Failed to fetch history list');
    const list = await res.json();
    
    if (list && list.length > 0) {
      historyListContainer.innerHTML = '';
      list.forEach(item => {
        const initials = item.username.substring(0, 2).toUpperCase();
        const followersFormatted = item.total_followers >= 1000000 
          ? `${(item.total_followers / 1000000).toFixed(1)}M` 
          : item.total_followers >= 1000 
            ? `${(item.total_followers / 1000).toFixed(1)}k` 
            : item.total_followers;
            
        const div = document.createElement('div');
        div.className = 'history-item';
        div.onclick = () => handleHistoryClick(item.username);
        div.innerHTML = `
          <div class="history-item-header">
            <div class="history-avatar">${initials}</div>
            <span class="history-name">@${item.username}</span>
          </div>
          <div class="history-item-footer">
            <span class="history-stats">${followersFormatted} followers</span>
            <span class="history-er-badge">${item.engagement_rate}% ER</span>
          </div>
        `;
        historyListContainer.appendChild(div);
      });
    }
  } catch (err) {
    console.warn('Could not load history:', err);
  }
}

// ─── HISTORY CLICK HANDLER ───
async function handleHistoryClick(username) {
  if (state.loading) return;
  setLoadingState(true);
  startProgress();
  hideError();
  
  try {
    const res = await fetch(`${BACKEND_URL}/api/history-snapshot/${encodeURIComponent(username)}`);
    if (!res.ok) throw new Error(`Snapshot fetch failed with code ${res.status}`);
    const data = await res.json();
    
    await finishProgress();
    await new Promise(resolve => setTimeout(resolve, 600));
    
    displayDashboard(data);
  } catch (err) {
    console.error(err);
    showError(`Failed to load snapshot for @${username}. ${err.message}`);
  } finally {
    setLoadingState(false);
  }
}

// ─── SEARCH SUBMIT HANDLER ───
async function handleSearchSubmit(e) {
  e.preventDefault();
  const profileUrl = profileUrlInput.value.trim();
  if (!profileUrl || state.loading) return;
  
  setLoadingState(true);
  startProgress();
  hideError();
  
  try {
    const encodedUrl = encodeURIComponent(profileUrl);
    const response = await fetch(`${BACKEND_URL}/api/dashboard-audit?profile_url=${encodedUrl}`);
    if (!response.ok) {
      throw new Error(`Server error: code ${response.status}`);
    }
    
    const initData = await response.json();
    const jobId = initData.job_id;
    
    let resData = null;
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const statusRes = await fetch(`${BACKEND_URL}/api/audit-status/${jobId}`);
      if (!statusRes.ok) throw new Error("Failed to check status");
      const statusData = await statusRes.json();
      
      if (statusData.status === "completed") {
        await finishProgress();
        await new Promise(resolve => setTimeout(resolve, 600));
        resData = statusData.data;
        break;
      } else if (statusData.status === "error") {
        throw new Error(statusData.error || "Background audit process failed");
      }
    }
    
    displayDashboard(resData);
    loadHistory(); // Refresh history list
  } catch (err) {
    console.error(err);
    showError(err.message);
  } finally {
    setLoadingState(false);
  }
}

// ─── LOADING STATE CONTROLLERS ───
function setLoadingState(isLoading) {
  state.loading = isLoading;
  submitBtn.disabled = isLoading;
  profileUrlInput.disabled = isLoading;
  
  const btnIcon = submitBtn.querySelector('.btn-icon');
  const btnText = submitBtn.querySelector('span');
  
  if (isLoading) {
    if (btnIcon) {
      btnIcon.setAttribute('data-lucide', 'refresh-cw');
      btnIcon.classList.add('animate-spin');
    }
    if (btnText) btnText.textContent = 'Analyzing API...';
    
    emptyState.classList.add('hidden');
    dashboardState.classList.add('hidden');
    loaderState.classList.remove('hidden');
  } else {
    if (btnIcon) {
      btnIcon.setAttribute('data-lucide', 'sparkles');
      btnIcon.classList.remove('animate-spin');
    }
    if (btnText) btnText.textContent = 'Perform Deep Audit';
    loaderState.classList.add('hidden');
  }
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ─── PROGRESS ANIMATION MOTORS ───
function startProgress() {
  state.progress = 0;
  updateProgressCircle(0);
  
  if (state.progressInterval) {
    clearInterval(state.progressInterval);
  }
  
  state.progressInterval = setInterval(() => {
    state.progress += Math.max(1, Math.floor(Math.random() * 3));
    if (state.progress >= 98) {
      state.progress = 98;
      clearInterval(state.progressInterval);
    }
    updateProgressCircle(state.progress);
  }, 150);
}

function finishProgress() {
  return new Promise((resolve) => {
    if (state.progressInterval) {
      clearInterval(state.progressInterval);
    }
    
    const finishInterval = setInterval(() => {
      state.progress += Math.floor(Math.random() * 3) + 2;
      if (state.progress >= 100) {
        state.progress = 100;
        clearInterval(finishInterval);
        resolve();
      }
      updateProgressCircle(state.progress);
    }, 20);
  });
}

function updateProgressCircle(val) {
  // Update progress stroke ring
  const offset = SVG_CIRCUMFERENCE - (val / 100) * SVG_CIRCUMFERENCE;
  if (progressCircle) {
    progressCircle.style.strokeDashoffset = offset;
  }
  
  // Update percentage text
  if (loaderPct) {
    loaderPct.textContent = `${val}%`;
  }
  
  // Update loader stage status messages
  if (loaderStatus) {
    if (val < 25) {
      loaderStatus.textContent = "Connecting to secure Instagram API...";
    } else if (val >= 25 && val < 50) {
      loaderStatus.textContent = "Ingesting profile metadata & post statistics...";
    } else if (val >= 50 && val < 75) {
      loaderStatus.textContent = "Running hashtag classification algorithms...";
    } else if (val >= 75 && val < 95) {
      loaderStatus.textContent = "Analyzing direct competitor metrics...";
    } else {
      loaderStatus.textContent = "Compiling final diagnostic audit dashboard...";
    }
  }
}

// ─── ERROR HANDLING ───
function showError(msg) {
  if (errorMessage && errorPanel) {
    errorMessage.textContent = msg;
    errorPanel.classList.remove('hidden');
  }
}

function hideError() {
  if (errorPanel) {
    errorPanel.classList.add('hidden');
  }
}

// ─── DASHBOARD RENDERING ENGINE ───
function displayDashboard(rawData) {
  const data = rawData.client_metrics ? rawData.client_metrics : rawData;
  const competitorData = rawData.competitor_metrics || [];
  const clientStats = data.calculated_metrics || {};
  
  state.activeProfile = data.profile_url || profileUrlInput.value.trim();
  
  // Hide placeholder and show dashboard wrapper
  emptyState.classList.add('hidden');
  loaderState.classList.add('hidden');
  dashboardState.classList.remove('hidden');
  
  // 1. Ingest Hero Meta Panel
  const handle = getProfileHandle(state.activeProfile);
  document.getElementById('profile-handle').textContent = handle;
  document.getElementById('profile-initials').textContent = handle.substring(1, 3).toUpperCase();
  document.getElementById('profile-link').href = state.activeProfile;
  
  const postsCount = data.posts?.length || 0;
  document.getElementById('stat-posts-count').textContent = `${postsCount} Posts`;
  
  const totalLikes = postsCount > 0 ? data.posts.reduce((sum, p) => sum + (p.likes || 0), 0) : 0;
  document.getElementById('stat-total-likes').textContent = totalLikes.toLocaleString();
  
  const totalComments = postsCount > 0 ? data.posts.reduce((sum, p) => sum + (p.comments || 0), 0) : 0;
  document.getElementById('stat-total-comments').textContent = totalComments.toLocaleString();
  
  // 2. Ingest KPI Cards
  document.getElementById('kpi-followers').textContent = clientStats.total_followers ? clientStats.total_followers.toLocaleString() : '0';
  document.getElementById('kpi-er').textContent = `${clientStats.engagement_rate || 0}%`;
  document.getElementById('kpi-velocity').textContent = `${clientStats.posting_frequency_weekly || 0}/wk`;
  document.getElementById('kpi-inactive').textContent = `${clientStats.inactive_follower_percentage || 0}%`;
  
  // 3. Render Chart.js Graphics
  renderCharts(data);
  
  // 4. Ingest Hashtag Strategy
  const hashtagIntelligence = processHashtagIntelligence(data);
  const aiTextHtml = parseMarkdown(data.hashtag_analytics?.ai_assessment || data.ai_assessment || 'No AI assessment available.');
  document.getElementById('hashtag-ai-markdown').innerHTML = aiTextHtml;
  
  populateTagsList('high-engagement-tags-list', hashtagIntelligence.highEngagementTags, 'badge-indigo');
  populateTagsList('low-engagement-tags-list', hashtagIntelligence.lowEngagementTags, 'badge-rose');
  populateTagsList('test-candidates-list', hashtagIntelligence.tryTheseTags, 'badge-emerald');
  
  // 5. Ingest Competitor cards
  renderCompetitors(competitorData);
  
  // Update Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ─── CHARTS DRAWING ENGINE ───
function renderCharts(data) {
  // Clear any existing chart instances to prevent rendering duplicates
  Object.keys(state.chartInstances).forEach(key => {
    if (state.chartInstances[key]) {
      state.chartInstances[key].destroy();
    }
  });
  
  const posts = data.posts || [];
  const trendCtx = document.getElementById('trend-chart').getContext('2d');
  const reelsCtx = document.getElementById('reels-chart').getContext('2d');
  const reachCtx = document.getElementById('reach-chart').getContext('2d');
  
  // --- Chart 1: Engagement Trend Line ---
  const lineLabels = posts.map((_, i) => `Post ${posts.length - i}`).reverse();
  const lineValues = posts.map(p => (p.likes || 0) + (p.comments || 0)).reverse();
  
  state.chartInstances.trend = new Chart(trendCtx, {
    type: 'line',
    data: {
      labels: lineLabels,
      datasets: [{
        label: 'Engagement (Likes + Comments)',
        data: lineValues,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.05)',
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointBackgroundColor: '#4f46e5',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: '#e5e7eb' } }
      }
    }
  });

  // --- Chart 2: Reels Views Bar ---
  const reelsData = data.reels_views_distribution || [24000, 18500, 31000, 15000, 29000, 42000];
  const reelsLabels = reelsData.map((_, i) => `Reel ${i+1}`);
  
  state.chartInstances.reels = new Chart(reelsCtx, {
    type: 'bar',
    data: {
      labels: reelsLabels,
      datasets: [{
        data: reelsData,
        backgroundColor: '#db2777',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: '#e5e7eb' } }
      }
    }
  });

  // --- Chart 3: Reach Performance Line ---
  const reachData = data.reach_distribution_data || [12000, 15400, 9500, 18000, 21000, 14000];
  const reachLabels = reachData.map((_, i) => `Post ${i+1}`);
  
  state.chartInstances.reach = new Chart(reachCtx, {
    type: 'line',
    data: {
      labels: reachLabels,
      datasets: [{
        data: reachData,
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.05)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointBackgroundColor: '#059669'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: '#e5e7eb' } }
      }
    }
  });
}

// ─── COMPETITORS CARD DRAWING ───
function renderCompetitors(competitors) {
  const anchor = document.getElementById('competitor-anchor');
  if (!competitors || competitors.length === 0) {
    anchor.innerHTML = '';
    return;
  }
  
  let cardsHtml = '';
  competitors.forEach(comp => {
    const handleName = comp.competitor_name;
    const cleanHandle = handleName.replace('@', '').trim();
    const followersFormatted = comp.follower_count.toLocaleString();
    const er = comp.metrics?.engagement_rate ?? 0;
    const barWidth = Math.min(er * 10, 100);
    const velocity = comp.metrics?.posting_frequency_weekly ?? 0;
    const ghostPct = comp.metrics?.inactive_follower_percentage ?? 0;
    
    const bestPostUrl = comp.metrics?.best_post?.url || '#';
    const bestPostInteractions = ((comp.metrics?.best_post?.likes ?? 0) + (comp.metrics?.best_post?.comments ?? 0)).toLocaleString();
    
    const worstPostUrl = comp.metrics?.worst_post?.url || '#';
    const worstPostInteractions = ((comp.metrics?.worst_post?.likes ?? 0) + (comp.metrics?.worst_post?.comments ?? 0)).toLocaleString();

    cardsHtml += `
      <div class="competitor-card">
        <div class="competitor-card-header">
          <div class="comp-rank-group">
            <span class="comp-rank-badge">#${comp.rank}</span>
            <span class="comp-username">${handleName}</span>
          </div>
          <a href="https://www.instagram.com/${cleanHandle}" target="_blank" class="comp-link">
            <i data-lucide="external-link"></i>
          </a>
        </div>
        <div class="competitor-card-body">
          
          <!-- Strict ER -->
          <div class="comp-er-row">
            <div class="comp-er-header">
              <span><i data-lucide="activity"></i> Strict ER</span>
              <span class="comp-er-val">${er}%</span>
            </div>
            <div class="comp-bar-track">
              <div class="comp-bar-fill" style="width: ${barWidth}%"></div>
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="comp-stats-grid">
            <div class="comp-stat-box">
              <div class="comp-stat-box-title">
                <i data-lucide="users"></i>
                <span>Followers</span>
              </div>
              <span class="comp-stat-box-val">${followersFormatted}</span>
            </div>
            <div class="comp-stat-box">
              <div class="comp-stat-box-title">
                <i data-lucide="clock"></i>
                <span>Velocity</span>
              </div>
              <span class="comp-stat-box-val">${velocity} <span style="font-size:8px; font-weight:500;">/wk</span></span>
            </div>
          </div>

          <!-- Ghost Followers -->
          <div class="comp-ghost-box">
            <span class="comp-ghost-title">
              <i data-lucide="shield-alert"></i>
              Inactive Followers
            </span>
            <span class="comp-ghost-val">${ghostPct}%</span>
          </div>

          <!-- Post Highlights -->
          <div class="comp-highlights">
            <div>
              <span class="comp-highlight-title">Best Post</span>
              <a href="${bestPostUrl}" target="_blank" class="comp-highlight-btn best">
                <span>${bestPostInteractions}</span>
                <div style="font-size: 7px; text-transform: uppercase; font-weight:700; margin-top:2px;">Interactions</div>
              </a>
            </div>
            <div>
              <span class="comp-highlight-title">Worst Post</span>
              <a href="${worstPostUrl}" target="_blank" class="comp-highlight-btn worst">
                <span>${worstPostInteractions}</span>
                <div style="font-size: 7px; text-transform: uppercase; font-weight:700; margin-top:2px;">Interactions</div>
              </a>
            </div>
          </div>

        </div>
      </div>
    `;
  });
  
  anchor.innerHTML = `
    <div class="competitor-title-row">
      <h2 class="competitor-section-title">
        <i data-lucide="trophy"></i>
        Competitor Analysis
      </h2>
      <p class="competitor-subtitle">Live evaluation of top 5 industry rivals</p>
    </div>
    <div class="competitor-cards-grid">
      ${cardsHtml}
    </div>
  `;
}

// ─── HASHTAG INTEL SYNCHRONOUS COMPILER ───
function processHashtagIntelligence(data) {
  const posts = data.posts || [];
  if (posts.length === 0) {
    return { highEngagementTags: [], lowEngagementTags: [], tryTheseTags: [] };
  }
  
  // Calculate average engagement baseline
  const engagements = posts.map(p => (p.likes || 0) + (p.comments || 0));
  const avgEngagement = engagements.reduce((sum, val) => sum + val, 0) / posts.length;
  
  const tagStats = {};
  posts.forEach(post => {
    const tags = post.hashtags || [];
    const eng = (post.likes || 0) + (post.comments || 0);
    tags.forEach(tag => {
      const cleanTag = tag.toLowerCase().trim();
      if (!cleanTag.startsWith('#')) return;
      if (!tagStats[cleanTag]) {
        tagStats[cleanTag] = { count: 0, sum: 0 };
      }
      tagStats[cleanTag].count += 1;
      tagStats[cleanTag].sum += eng;
    });
  });
  
  const highEngagementTags = [];
  const lowEngagementTags = [];
  
  Object.keys(tagStats).forEach(tag => {
    const avg = tagStats[tag].sum / tagStats[tag].count;
    if (avg >= avgEngagement) {
      highEngagementTags.push(tag);
    } else {
      lowEngagementTags.push(tag);
    }
  });
  
  // Pull try these test candidates
  const tryTheseList = data.hashtag_analytics?.try_these || data.try_these || [];
  const tryTheseTags = tryTheseList.map(item => item.tag || item);
  
  return {
    highEngagementTags: highEngagementTags.slice(0, 8),
    lowEngagementTags: lowEngagementTags.slice(0, 8),
    tryTheseTags: tryTheseTags.slice(0, 8)
  };
}

function populateTagsList(elementId, tags, badgeClass) {
  const container = document.getElementById(elementId);
  if (!container) return;
  
  if (!tags || tags.length === 0) {
    container.innerHTML = `<span style="font-size:11px; color:#9ca3af; font-weight:600;">No tags available</span>`;
    return;
  }
  
  container.innerHTML = '';
  tags.forEach(tag => {
    const span = document.createElement('span');
    span.className = `tag-badge ${badgeClass}`;
    span.textContent = tag;
    span.onclick = () => {
      navigator.clipboard.writeText(tag);
      const originalText = span.textContent;
      span.textContent = 'Copied!';
      setTimeout(() => { span.textContent = originalText; }, 1500);
    };
    container.appendChild(span);
  });
}

// ─── UTILITY FORMATTERS ───
function getProfileHandle(url) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/\/$/, "");
    const parts = pathname.split("/");
    return "@" + parts[parts.length - 1];
  } catch {
    return url;
  }
}

// Simple Markdown-to-HTML formatting parser
function parseMarkdown(mdText) {
  if (!mdText) return '';
  let html = mdText;
  
  // Replace headers
  html = html.replace(/### (.*?)\n/g, '<h3>$1</h3>');
  html = html.replace(/## (.*?)\n/g, '<h2>$1</h2>');
  
  // Replace bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace bullet lists (supports * and -)
  html = html.replace(/\* (.*?)\n/g, '<li>$1</li>');
  html = html.replace(/- (.*?)\n/g, '<li>$1</li>');
  
  // Wrap contiguous list items in ul
  html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, ''); // merge adjacent uls
  
  // Clean up remaining newlines with line breaks
  html = html.replace(/\n/g, '<br>');
  return html;
}

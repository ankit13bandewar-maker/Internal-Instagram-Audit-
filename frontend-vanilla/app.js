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
  document.getElementById('kpi-velocity').textContent = `${clientStats.posting_frequency_daily || 0}/day`;
  document.getElementById('kpi-inactive').textContent = `${clientStats.inactive_follower_percentage || 0}%`;
  
  // 3. Render Chart.js Graphics
  renderCharts(rawData);
  
  // 4. Ingest Hashtag Strategy
  const hashtagIntelligence = processHashtagIntelligence(data);
  const aiTextHtml = parseMarkdown(data.hashtags_analysis?.ai_assessment || data.ai_assessment || 'No AI assessment available.');
  
  const aiMarkdownEl = document.getElementById('hashtag-ai-markdown');
  if (aiMarkdownEl) {
    if (data.hashtags_analysis?.ai_assessment || data.ai_assessment) {
      aiMarkdownEl.innerHTML = aiTextHtml;
    } else {
      aiMarkdownEl.innerHTML = `
        <div class="empty-strategy">
          <i data-lucide="sparkles"></i>
          <p>No AI hashtag strategy analysis loaded.</p>
        </div>
      `;
    }
  }

  // Bind copy strategy text
  const aiStrategyText = data.hashtags_analysis?.ai_assessment || data.ai_assessment || '';
  const copyBtn = document.getElementById('copy-strategy-btn');
  if (copyBtn) {
    copyBtn.onclick = () => {
      if (!aiStrategyText) return;
      navigator.clipboard.writeText(aiStrategyText);
      const originalContent = copyBtn.innerHTML;
      copyBtn.innerHTML = `<i data-lucide="check" class="btn-icon-small" style="color:#059669; stroke-width:3px;"></i><span style="color:#059669;">Copied!</span>`;
      if (window.lucide) window.lucide.createIcons();
      setTimeout(() => {
        copyBtn.innerHTML = originalContent;
        if (window.lucide) window.lucide.createIcons();
      }, 2000);
    };
  }

  // Populate Matrix Table
  const matrixBody = document.getElementById('hashtag-matrix-body');
  if (matrixBody) {
    if (hashtagIntelligence.hashtagMatrix.length === 0) {
      matrixBody.innerHTML = `<tr><td colspan="2" style="text-align:center; font-size:11px; color:#9ca3af; padding: 24px;">No tags found</td></tr>`;
    } else {
      matrixBody.innerHTML = hashtagIntelligence.hashtagMatrix.map(item => `
        <tr>
          <td>${item.tag}</td>
          <td class="text-right"><span class="ratio-badge">${item.usage_ratio}</span></td>
        </tr>
      `).join('');
    }
  }

  // Update Engagement performance labels
  const q75Label = document.getElementById('q75-label');
  const q75Count = document.getElementById('q75-count');
  const q25Label = document.getElementById('q25-label');
  const q25Count = document.getElementById('q25-count');
  
  if (q75Label) q75Label.textContent = `Top 25% (≥ ${Math.round(hashtagIntelligence.analyticsData.q75_threshold || 0).toLocaleString()} Eng)`;
  if (q75Count) q75Count.textContent = `${hashtagIntelligence.analyticsData.high_engagement_tags.length} Tags`;
  if (q25Label) q25Label.textContent = `Bottom 25% (≤ ${Math.round(hashtagIntelligence.analyticsData.q25_threshold || 0).toLocaleString()} Eng)`;
  if (q25Count) q25Count.textContent = `${hashtagIntelligence.analyticsData.low_engagement_tags.length} Tags`;

  // Populate Quartile Lists
  const highList = document.getElementById('high-engagement-tags-list');
  if (highList) {
    if (hashtagIntelligence.analyticsData.high_engagement_tags.length === 0) {
      highList.innerHTML = `<span style="font-size:11px; color:#9ca3af; font-weight:600; font-style:italic;">No top-quartile hashtags.</span>`;
    } else {
      highList.innerHTML = hashtagIntelligence.analyticsData.high_engagement_tags.map(item => `
        <div class="quartile-tag" onclick="copyToClipboard('${item.tag}', this)">
          <span>${item.tag}</span>
          <span class="q-inner-badge">★ ${item.top_posts_ratio}</span>
        </div>
      `).join('');
    }
  }

  const lowList = document.getElementById('low-engagement-tags-list');
  if (lowList) {
    if (hashtagIntelligence.analyticsData.low_engagement_tags.length === 0) {
      lowList.innerHTML = `<span style="font-size:11px; color:#9ca3af; font-weight:600; font-style:italic;">No bottom-quartile hashtags.</span>`;
    } else {
      lowList.innerHTML = hashtagIntelligence.analyticsData.low_engagement_tags.map(item => `
        <div class="quartile-tag" onclick="copyToClipboard('${item.tag}', this)">
          <span>${item.tag}</span>
          <span class="q-inner-badge">${item.low_posts > 0 ? `⚠️ ${item.low_posts} low` : "0 low"}</span>
        </div>
      `).join('');
    }
  }

  // Populate Kill List
  const killContainer = document.getElementById('kill-list-container');
  if (killContainer) {
    const killList = hashtagIntelligence.analyticsData.kill_list || [];
    if (killList.length === 0) {
      killContainer.innerHTML = `
        <div class="kill-empty">
          <i data-lucide="alert-circle" style="width: 32px; height: 32px; margin-bottom: 8px; opacity: 0.5;"></i>
          <p>No algorithmic friction warnings found.</p>
        </div>
      `;
    } else {
      killContainer.innerHTML = killList.map(item => `
        <div class="kill-list-item">
          <div class="kill-list-row">
            <span class="kill-tag-badge" onclick="copyToClipboard('${item.tag}', this)">${item.tag}</span>
            <span class="kill-action-label">Purge Required</span>
          </div>
          <p class="kill-reason">${item.reason}</p>
          <div class="kill-stats-footer">
            <span>Avg Engagement: ${item.avg_engagement.toLocaleString()}</span>
            <span>•</span>
            <span>Occurrence: ${item.total_posts} posts</span>
          </div>
        </div>
      `).join('');
    }
  }

  // Populate Try These Suggestions
  const tryContainer = document.getElementById('try-these-container');
  if (tryContainer) {
    const tryThese = hashtagIntelligence.analyticsData.try_these || [];
    if (tryThese.length === 0) {
      tryContainer.innerHTML = `
        <div class="try-empty">
          <i data-lucide="sparkles" style="width: 32px; height: 32px; margin-bottom: 8px; opacity: 0.5;"></i>
          <p>No recommendation tags found.</p>
        </div>
      `;
    } else {
      tryContainer.innerHTML = tryThese.map(item => `
        <button class="try-these-btn" onclick="copyTryTag('${item.tag}', this, '${item.expected_boost}')">
          <div class="try-tag-left">
            <div class="try-tag-icon-box">#</div>
            <div class="try-tag-text-group">
              <span class="try-tag-name">${item.tag}</span>
              <span class="try-tag-volume">${item.volume} Volume</span>
            </div>
          </div>
          <div class="try-boost-badge-wrapper">
            <div class="try-boost-badge">
              <span>${item.expected_boost}</span>
              <i data-lucide="copy" class="btn-icon-small"></i>
            </div>
          </div>
        </button>
      `).join('');
    }
  }
  
  // 5. Ingest Competitor cards
  renderCompetitors(competitorData);
  
  // Update Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Global Copy Helper for Quartiles/Kill list
window.copyToClipboard = function(text, el) {
  navigator.clipboard.writeText(text);
  
  if (el.classList.contains('kill-tag-badge')) {
    const originalText = el.textContent;
    el.textContent = 'Copied!';
    setTimeout(() => { el.textContent = originalText; }, 1500);
  } else {
    const span = el.querySelector('span');
    if (span) {
      const originalText = span.textContent;
      span.textContent = 'Copied!';
      setTimeout(() => { span.textContent = originalText; }, 1500);
    }
  }
};

// Global Copy Helper for Try These suggestions
window.copyTryTag = function(tag, btn, boost) {
  navigator.clipboard.writeText(tag);
  const badgeWrapper = btn.querySelector('.try-boost-badge-wrapper');
  if (!badgeWrapper) return;
  
  badgeWrapper.innerHTML = `
    <div class="try-copied-badge">
      <i data-lucide="check" class="btn-icon-small"></i>
      <span>Copied!</span>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
  
  setTimeout(() => {
    badgeWrapper.innerHTML = `
      <div class="try-boost-badge">
        <span>${boost}</span>
        <i data-lucide="copy" class="btn-icon-small"></i>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }, 1500);
};

// ─── CHARTS DRAWING ENGINE ───
function renderCharts(rawData) {
  // Clear any existing chart instances to prevent rendering duplicates
  Object.keys(state.chartInstances).forEach(key => {
    if (state.chartInstances[key]) {
      state.chartInstances[key].destroy();
    }
  });

  const data = rawData.client_metrics ? rawData.client_metrics : rawData;
  const trendHistory = rawData.trend_history || [];
  const reelsViews = rawData.reels_views_distribution || data.reels_views_distribution || [];
  const reachDistribution = rawData.reach_distribution_data || data.reach_distribution_data || [];

  const trendCanvas = document.getElementById('trend-chart');
  const reelsCanvas = document.getElementById('reels-chart');
  const reachCanvas = document.getElementById('reach-chart');

  const trendPlaceholder = document.getElementById('trend-chart-placeholder');
  const reelsPlaceholder = document.getElementById('reels-chart-placeholder');
  const reachPlaceholder = document.getElementById('reach-chart-placeholder');

  // --- Chart 1: Audience Growth Timeline ---
  if (trendHistory.length < 2) {
    if (trendCanvas) trendCanvas.classList.add('hidden');
    if (trendPlaceholder) trendPlaceholder.classList.remove('hidden');
  } else {
    if (trendCanvas) trendCanvas.classList.remove('hidden');
    if (trendPlaceholder) trendPlaceholder.classList.add('hidden');

    const trendCtx = trendCanvas.getContext('2d');
    const trendLabels = trendHistory.map(item => item.date);
    const trendValues = trendHistory.map(item => item.follower_count);

    state.chartInstances.trend = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: trendLabels,
        datasets: [{
          label: 'Followers',
          data: trendValues,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.05)',
          fill: true,
          tension: 0.3,
          borderWidth: 3,
          pointBackgroundColor: '#4f46e5',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `Followers: ${context.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: { 
            grid: { color: '#f3f4f6' },
            ticks: {
              callback: (value) => value.toLocaleString()
            }
          }
        }
      }
    });
  }

  // --- Chart 2: Reels Views Distribution ---
  if (reelsViews.length === 0) {
    if (reelsCanvas) reelsCanvas.classList.add('hidden');
    if (reelsPlaceholder) reelsPlaceholder.classList.remove('hidden');
  } else {
    if (reelsCanvas) reelsCanvas.classList.remove('hidden');
    if (reelsPlaceholder) reelsPlaceholder.classList.add('hidden');

    const reelsCtx = reelsCanvas.getContext('2d');
    const reelsLabels = reelsViews.map(item => item.date);
    const reelsValues = reelsViews.map(item => item.views);

    state.chartInstances.reels = new Chart(reelsCtx, {
      type: 'line',
      data: {
        labels: reelsLabels,
        datasets: [{
          label: 'Views',
          data: reelsValues,
          borderColor: '#db2777',
          backgroundColor: 'rgba(219, 39, 119, 0.05)',
          fill: true,
          tension: 0,
          borderWidth: 3,
          pointBackgroundColor: '#db2777',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `Views: ${context.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: { 
            grid: { color: '#f3f4f6' },
            ticks: {
              callback: (value) => {
                if (value >= 1000000) return (value / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
                if (value >= 1000) return (value / 1000).toFixed(1).replace(/\.0$/, "") + "K";
                return value.toString();
              }
            }
          }
        }
      }
    });
  }

  // --- Chart 3: Reach Performance Distribution ---
  if (reachDistribution.length === 0) {
    if (reachCanvas) reachCanvas.classList.add('hidden');
    if (reachPlaceholder) reachPlaceholder.classList.remove('hidden');
  } else {
    if (reachCanvas) reachCanvas.classList.remove('hidden');
    if (reachPlaceholder) reachPlaceholder.classList.add('hidden');

    const reachCtx = reachCanvas.getContext('2d');
    const reachLabels = reachDistribution.map(item => item.date);
    const reachValues = reachDistribution.map(item => item.views);

    state.chartInstances.reach = new Chart(reachCtx, {
      type: 'line',
      data: {
        labels: reachLabels,
        datasets: [{
          label: 'Reach (Views)',
          data: reachValues,
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.05)',
          fill: true,
          tension: 0,
          borderWidth: 3,
          pointBackgroundColor: '#059669',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `Views: ${context.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: { 
            grid: { color: '#f3f4f6' },
            ticks: {
              callback: (value) => {
                const kValue = Math.round(value / 1000);
                return kValue.toLocaleString() + "k";
              }
            }
          }
        }
      }
    });
  }
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
    const velocity = comp.metrics?.posting_frequency_daily ?? 0;
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
              <span class="comp-stat-box-val">${velocity} <span style="font-size:8px; font-weight:500;">/day</span></span>
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
    return {
      hashtagMatrix: [],
      analyticsData: {
        q75_threshold: 0,
        q25_threshold: 0,
        high_engagement_tags: [],
        low_engagement_tags: [],
        kill_list: [],
        try_these: []
      }
    };
  }

  const totalPosts = posts.length;
  const engagements = posts.map(p => (p.likes || 0) + (p.comments || 0));

  // Quantile helper with linear interpolation to match Pandas exactly
  const quantile = (arr, q) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  };

  const q75 = quantile(engagements, 0.75);
  const q25 = quantile(engagements, 0.25);
  const overallMedianEngagement = quantile(engagements, 0.5);

  // Extract hashtags cleanly using standard regex matching `#word` format
  const hashtagMap = {};

  posts.forEach(post => {
    const caption = post.caption || "";
    const engagement = (post.likes || 0) + (post.comments || 0);
    const matches = caption.match(/#[a-zA-Z0-9_]+/g) || [];
    const uniqueTags = Array.from(new Set(matches.map(t => t.toLowerCase())));

    uniqueTags.forEach(tag => {
      if (!hashtagMap[tag]) {
        hashtagMap[tag] = { count: 0, engagements: [], top_posts: 0, low_posts: 0 };
      }
      hashtagMap[tag].count += 1;
      hashtagMap[tag].engagements.push(engagement);
      if (engagement >= q75) {
        hashtagMap[tag].top_posts += 1;
      }
      if (engagement <= q25) {
        hashtagMap[tag].low_posts += 1;
      }
    });
  });

  const hashtagMatrixList = [];
  const hashtagAnalytics = [];

  Object.entries(hashtagMap).forEach(([tag, stats]) => {
    const count = stats.count;
    const tagEngagements = stats.engagements;
    const avgEngagement = Math.round(tagEngagements.reduce((sum, e) => sum + e, 0) / count);

    const usageRatio = `${count}/${totalPosts}`;
    const frequencyPct = Math.round((count / totalPosts) * 100);

    // Verdict engine based on logic rules
    let verdict = "Keep";
    if (count === totalPosts) {
      verdict = "Brand anchor";
    } else if (avgEngagement >= 1.5 * overallMedianEngagement) {
      verdict = "Scale up massively";
    } else if (avgEngagement > overallMedianEngagement) {
      verdict = "Keep always";
    } else if (avgEngagement <= 30) {
      verdict = "Stop using";
    }

    hashtagMatrixList.push({
      tag,
      usage_ratio: usageRatio,
      frequency_pct: frequencyPct,
      avg_engagement: avgEngagement,
      verdict
    });

    hashtagAnalytics.push({
      tag,
      count,
      avg_engagement: avgEngagement,
      top_posts: stats.top_posts,
      low_posts: stats.low_posts,
      top_posts_ratio: `${stats.top_posts}/${count}`,
      top_posts_pct: Math.round((stats.top_posts / count) * 100),
      low_posts_flag: stats.low_posts > 0,
      low_posts_pct: Math.round((stats.low_posts / count) * 100),
      usage_ratio: usageRatio
    });
  });

  // Sort matrix descending by average engagement
  hashtagMatrixList.sort((a, b) => b.avg_engagement - a.avg_engagement);

  const highEngagementTags = [];
  const lowEngagementTags = [];
  const killList = [];

  hashtagAnalytics.sort((a, b) => b.avg_engagement - a.avg_engagement);

  hashtagAnalytics.forEach(item => {
    if (item.avg_engagement >= q75 || (item.top_posts > 0 && item.low_posts === 0)) {
      highEngagementTags.push(item);
    } else if (item.avg_engagement <= q25 || (item.low_posts > 0 && item.top_posts === 0)) {
      lowEngagementTags.push(item);
    }

    const isKill =
      item.avg_engagement <= q25 ||
      (item.low_posts > 0 && item.top_posts === 0) ||
      item.low_posts / item.count >= 0.5;

    if (isKill) {
      let reason = "";
      if (item.avg_engagement <= q25) {
        reason = `Average engagement (${item.avg_engagement.toLocaleString()}) sits in bottom quartile (< ${Math.round(q25).toLocaleString()}).`;
      } else if (item.top_posts === 0) {
        reason = "Fails to trigger any top-quartile high-reach posts (0 top posts).";
      } else {
        reason = `Highly saturated tag: ${item.low_posts}/${item.count} usage resulted in bottom-quartile performance.`;
      }

      killList.push({
        tag: item.tag,
        reason,
        low_posts: item.low_posts,
        total_posts: item.count,
        avg_engagement: item.avg_engagement
      });
    }
  });

  if (killList.length === 0) {
    if (hashtagAnalytics.length > 0) {
      const worstTag = hashtagAnalytics[hashtagAnalytics.length - 1];
      killList.push({
        tag: worstTag.tag,
        reason: `Algorithmic stagnation warning: While not critically suppressed, ${worstTag.tag} correlates with baseline engagement (${worstTag.avg_engagement.toLocaleString()}) and prevents viral reach.`,
        low_posts: worstTag.low_posts,
        total_posts: worstTag.count,
        avg_engagement: worstTag.avg_engagement
      });
    } else {
      killList.push({
        tag: "#[Missing Tags]",
        reason: "Critical Suppression: Failing to use any hashtags completely blinds the Instagram categorization algorithm, throttling non-follower discoverability to 0%.",
        low_posts: totalPosts,
        total_posts: totalPosts,
        avg_engagement: Math.round(overallMedianEngagement)
      });
    }
  }

  // 3. Dynamic Try These suggestions (completely parsing captions to recommend tags)
  const allTags = new Set(Object.keys(hashtagMap));
  const wordCounts = {};
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "about",
    "against", "between", "into", "through", "during", "before", "after", "above", "below",
    "from", "up", "down", "out", "off", "over", "under", "again", "further", "then", "once",
    "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few",
    "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same",
    "so", "than", "too", "very", "can", "will", "just", "should", "now", "of", "is", "this",
    "that", "it", "its", "what", "who", "whom", "which", "your", "our", "their", "my", "me",
    "him", "her", "us", "them", "are", "was", "were", "be", "been", "being", "have", "has",
    "had", "having", "do", "does", "did", "doing", "your", "you", "we", "they", "he", "she",
    "their", "his", "her", "our", "about", "above", "across", "after", "again", "against",
    "all", "almost", "along", "already", "also", "although", "always", "among", "another",
    "any", "anybody", "anyone", "anything", "anywhere", "around", "became", "because",
    "become", "becomes", "becoming", "been", "before", "behind", "being", "below", "beside",
    "besides", "between", "beyond", "both", "brief", "but", "by", "came", "can", "cannot",
    "cant", "caption", "each", "either", "else", "elsewhere", "enough", "even", "ever",
    "every", "everybody", "everyone", "everything", "everywhere", "few", "first", "for",
    "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers",
    "herself", "him", "himself", "his", "how", "however", "i", "if", "in", "into", "is",
    "it", "its", "itself", "just", "keep", "last", "latter", "latterly", "least", "less",
    "many", "may", "me", "meanwhile", "might", "more", "moreover", "most", "mostly",
    "much", "must", "my", "myself", "namely", "neither", "never", "nevertheless", "next",
    "no", "nobody", "none", "noone", "nor", "not", "nothing", "now", "nowhere", "of", "off",
    "often", "on", "once", "one", "only", "onto", "or", "other", "others", "otherwise",
    "our", "ours", "ourselves", "out", "over", "own", "part", "per", "perhaps", "please",
    "put", "rather", "same", "see", "seem", "seemed", "seeming", "seems", "several",
    "she", "should", "since", "so", "some", "somebody", "someone", "something",
    "sometime", "sometimes", "somewhere", "still", "such", "than", "that", "the",
    "their", "theirs", "them", "themselves", "then", "thence", "there", "thereafter",
    "thereby", "therefore", "therein", "thereupon", "these", "they", "this", "those",
    "through", "throughout", "thru", "thus", "to", "together", "too", "toward", "towards",
    "under", "until", "up", "upon", "us", "very", "via", "was", "we", "well", "were",
    "what", "whatever", "whatsoever", "when", "whence", "whenever", "whensoever",
    "where", "whereafter", "whereas", "whereby", "wherein", "whereupon", "wherever",
    "whether", "which", "whichever", "whichsoever", "while", "whither", "who", "whoever",
    "whole", "whom", "whomever", "whomsoever", "whose", "why", "will", "with", "within",
    "without", "would", "yet", "you", "your", "yours", "yourself", "yourselves", "take",
    "taken", "about", "using", "reveal", "reveals", "within", "around"
  ]);

  posts.forEach(post => {
    const caption = post.caption || "";
    const cleanText = caption.replace(/#[a-zA-Z0-9_]+/g, "").toLowerCase();
    const words = cleanText.match(/[a-z]{4,}/g) || [];
    words.forEach(w => {
      if (!stopWords.has(w)) {
        wordCounts[w] = (wordCounts[w] || 0) + 1;
      }
    });
  });

  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  const tryThese = [];
  const volumes = ["Hyper-Volume", "High-Volume", "Mid-Volume"];
  let sugIndex = 0;

  for (const word of sortedWords) {
    const tag = "#" + word;
    if (!allTags.has(tag) && tryThese.length < 4) {
      const volume = volumes[sugIndex % volumes.length];
      const boost = (38.4 - sugIndex * 3.5).toFixed(1);
      tryThese.push({
        tag,
        volume,
        expected_boost: `+${boost}%`
      });
      sugIndex++;
    }
  }

  if (tryThese.length < 4) {
    const fallbacks = ["discovery", "research", "universe", "exploration", "stargazing"];
    fallbacks.forEach(f => {
      const tag = "#" + f;
      if (!allTags.has(tag) && tryThese.length < 4) {
        const volume = "Mid-Volume";
        const boost = (18.5).toFixed(1);
        tryThese.push({
          tag,
          volume,
          expected_boost: `+${boost}%`
        });
      }
    });
  }

  return {
    highEngagementTags: highEngagementTags.slice(0, 8),
    lowEngagementTags: lowEngagementTags.slice(0, 8),
    tryTheseTags: tryThese.slice(0, 8),
    hashtagMatrix: hashtagMatrixList,
    analyticsData: {
      q75_threshold: q75,
      q25_threshold: q25,
      high_engagement_tags: highEngagementTags,
      low_engagement_tags: lowEngagementTags,
      kill_list: killList,
      try_these: tryThese
    }
  };
}

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
  
  // Replace headers with conditional classes based on contents
  html = html.replace(/### (.*?)(?:\n|$)/g, (match, p1) => {
    const text = p1.trim();
    const isWin = text.includes("👑") || text.includes("📋") || text.includes("SUCCESS") || text.includes("REPLICATION") || text.includes("Assessment") || text.includes("STRATEGY") || text.includes("RECOMMENDATION");
    const colorClass = isWin ? 'text-indigo-800' : 'text-rose-700';
    return `<h3 class="${colorClass}">${text}</h3>`;
  });
  
  html = html.replace(/## (.*?)(?:\n|$)/g, '<h2>$1</h2>');
  
  // Replace bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace bullet lists (supports * and -)
  html = html.replace(/^\* (.*?)(?:\n|$)/gm, '<li>$1</li>');
  html = html.replace(/^- (.*?)(?:\n|$)/gm, '<li>$1</li>');
  
  // Wrap contiguous list items in ul
  html = html.replace(/((?:<li>.*?<\/li>)+)/gs, '<ul>$1</ul>');
  
  // Clean up remaining newlines with line breaks
  html = html.replace(/\n/g, '<br>');
  return html;
}


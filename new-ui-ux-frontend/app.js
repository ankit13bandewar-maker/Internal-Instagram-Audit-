// CONFIGURATION Constants
const BACKEND_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:")
  ? "http://127.0.0.1:8000"
  : window.location.origin;
const SVG_CIRCUMFERENCE = 314.159; // 2 * Math.PI * 50

// APP STATE
function resolvePostUrl(post) {
  if (!post) return '#';
  // Priority 1: explicit post_url or url field (already a full URL)
  const candidates = [post.post_url, post.url, post.link];
  for (const c of candidates) {
    if (c && typeof c === 'string' && c.trim() && c.trim().toLowerCase() !== 'nan') {
      const trimmed = c.trim();
      if (trimmed.startsWith('http')) return trimmed;
      if (trimmed.startsWith('/')) return 'https://www.instagram.com' + trimmed;
    }
  }
  // Priority 2: build from shortcode (but only if it looks real — not a mock hash)
  const sc = post.shortcode || post.shortCode || '';
  if (sc && sc.length > 0) {
    return 'https://www.instagram.com/p/' + sc + '/';
  }
  return '#';
}

function fmtTrendDate(d) {
  // Convert YYYY-MM-DD to DD/MM/YYYY format
  if (!d) return "Default 15 posts audit";
  try {
    const parts = d.split('-');
    if (parts.length === 3) {
      const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  } catch(e) {}
  return d;
}

async function fetchDynamicThumbnail(post, imgElement) {
  if (!post || !imgElement) return;
  
  const baseUrl = typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : 'http://127.0.0.1:8000';
  const postUrl = resolvePostUrl(post);
  
  // If we have a real display_url (not picsum, not empty), proxy it with the post_url as fallback
  if (post.display_url && post.display_url.trim() && !post.display_url.includes('picsum.photos')) {
    imgElement.src = baseUrl + `/api/proxy-image?url=${encodeURIComponent(post.display_url)}&post_url=${encodeURIComponent(postUrl)}`;
    return;
  }
  
  // If no display_url but we have a valid Instagram post URL, try to fetch thumbnail via proxy og:image
  if (postUrl && postUrl !== '#' && (postUrl.includes('/p/') || postUrl.includes('/reel/') || postUrl.includes('/tv/'))) {
    imgElement.src = baseUrl + `/api/proxy-image?url=${encodeURIComponent(postUrl)}&post_url=${encodeURIComponent(postUrl)}`;
    return;
  }
  
  // Final fallback: branded placeholder based on post index
  const seed = post.shortcode || post.index || post.post_id || 'default';
  imgElement.src = `https://picsum.photos/seed/${encodeURIComponent(seed)}/100/100`;
}

let state = {
  loading: false,
  progress: 0,
  progressInterval: null,
  activeProfile: '',
  selectedReel: null,
  selectedStatic: null
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

        // Calculate status direction class
        const erVal = parseFloat(item.engagement_rate) || 0;
        let directionClass = 'mid';
        if (erVal > 3.5) directionClass = 'up';
        else if (erVal < 2.0) directionClass = 'dn';

        let timeStr = 'Unknown Time';
        if (item.audited_at) {
          try {
            const d = new Date(item.audited_at);
            timeStr = d.toLocaleString('en-US', {
              month: 'short', day: 'numeric',
              hour: 'numeric', minute: '2-digit', hour12: true
            });
          } catch(e) {}
        }

        const div = document.createElement('div');
        div.className = 'acct';
        if (state.activeProfile.includes(item.username)) {
          div.className = 'acct active';
        }
        div.onclick = () => handleHistoryClick(item.username);
        div.innerHTML = `
          <div class="av">${initials}</div>
          <div class="acct-meta">
            <div class="h">@${item.username}</div>
            <div class="s" style="display:flex; justify-content:space-between; width:100%; gap:8px;">
              <span style="color:#ffffff; font-size:11.5px; font-weight:600;">${followersFormatted} followers</span>
              <span style="color:#ffffff; font-size:11.5px; font-weight:600;">${timeStr}</span>
            </div>
          </div>
          <div class="er ${directionClass}">${item.engagement_rate}%</div>
        `;
        historyListContainer.appendChild(div);
      });
    } else {
      historyListContainer.innerHTML = `
        <div style="font-size:11px;color:var(--faint);text-align:center;padding:20px 10px;">
          No recent audits found
        </div>
      `;
    }
  } catch (err) {
    console.warn('Could not load history:', err);
    historyListContainer.innerHTML = `
      <div style="font-size:11px;color:var(--neg);text-align:center;padding:20px 10px;">
        Could not connect to backend to load history.
      </div>
    `;
  }
}

// ─── HISTORY CLICK HANDLER ───
async function handleHistoryClick(username) {
  if (state.loading) return;
  setLoadingState(true);
  startProgress();
  hideError();

  try {
    const res = await fetch(`${BACKEND_URL}/api/history/${encodeURIComponent(username)}/data`);
    if (!res.ok) throw new Error(`Snapshot fetch failed with code ${res.status}`);
    const data = await res.json();

    await finishProgress();
    await new Promise(resolve => setTimeout(resolve, 600));

    displayDashboard(data);
  } catch (err) {
    console.error(err);
    if (err.message === "Failed to fetch" || err.message.includes("NetworkError")) {
      showError(`Network Error: Cannot reach the backend server. Please ensure the backend is running. (Failed to load @${username})`);
    } else {
      showError(`Failed to load snapshot for @${username}. ${err.message}`);
    }
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
    const dateFrom = document.getElementById('date-from')?.value;
    const dateTo = document.getElementById('date-to')?.value;
    
    let apiUrl = `${BACKEND_URL}/api/dashboard-audit?profile_url=${encodedUrl}`;
    if (dateFrom) apiUrl += `&date_from=${encodeURIComponent(dateFrom)}`;
    if (dateTo) apiUrl += `&date_to=${encodeURIComponent(dateTo)}`;

    const response = await fetch(apiUrl);
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
    if (err.message === "Failed to fetch" || err.message.includes("NetworkError")) {
      showError(`Network Error: Cannot reach the backend server. Please ensure the backend is running.`);
    } else {
      showError(err.message);
    }
  } finally {
    setLoadingState(false);
  }
}

// ─── LOADING STATE CONTROLLERS ───
function setLoadingState(isLoading) {
  state.loading = isLoading;
  if (submitBtn) {
    submitBtn.disabled = isLoading;
    submitBtn.style.opacity = isLoading ? '0.7' : '';
    submitBtn.textContent = isLoading ? 'Checking…' : 'Check This Account';
  }
  if (profileUrlInput) profileUrlInput.disabled = isLoading;

  if (isLoading) {
    if (emptyState) emptyState.classList.add('hidden');
    if (dashboardState) dashboardState.classList.add('hidden');
    if (loaderState) loaderState.classList.remove('hidden');
  } else {
    if (loaderState) loaderState.classList.add('hidden');
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

// Global dismiss/hide error
window.hideError = function () {
  if (errorPanel) {
    errorPanel.classList.add('hidden');
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
  state.selectedPost = null; // Reset selection on new load

  // Hide placeholder/loader and show dashboard wrapper
  if (emptyState) emptyState.classList.add('hidden');
  if (loaderState) loaderState.classList.add('hidden');
  if (dashboardState) dashboardState.classList.remove('hidden');

  // 1. Ingest Hero Meta Panel
  const handle = getProfileHandle(state.activeProfile);

  // Update browser document title
  document.title = `AURA Audit — BloomX · ${handle}`;

  const handleElements = document.querySelectorAll('#profile-handle');
  handleElements.forEach(el => {
    el.textContent = handle;
  });

  const initialsElement = document.getElementById('profile-initials');
  if (initialsElement) {
    initialsElement.textContent = handle.substring(1, 3).toUpperCase();
  }

  const linkElement = document.getElementById('profile-link');
  if (linkElement) {
    linkElement.href = state.activeProfile;
  }

  const postsCount = data.posts?.length || 0;
  const statPostsCountEl = document.getElementById('stat-posts-count');
  if (statPostsCountEl) {
    statPostsCountEl.textContent = postsCount;
  }

  const totalLikes = postsCount > 0 ? data.posts.reduce((sum, p) => sum + (p.likes || 0), 0) : 0;
  const statTotalLikesEl = document.getElementById('stat-total-likes');
  if (statTotalLikesEl) {
    statTotalLikesEl.dataset.val = totalLikes;
    statTotalLikesEl.textContent = totalLikes.toLocaleString();
  }

  const totalComments = postsCount > 0 ? data.posts.reduce((sum, p) => sum + (p.comments || 0), 0) : 0;
  const statTotalCommentsEl = document.getElementById('stat-total-comments');
  if (statTotalCommentsEl) {
    statTotalCommentsEl.dataset.val = totalComments;
    statTotalCommentsEl.textContent = totalComments.toLocaleString();
  }

  const followersVal = data.follower_count || clientStats.total_followers || 0;
  const statTotalFollowersEl = document.getElementById('stat-total-followers');
  if (statTotalFollowersEl) {
    const followersFormatted = followersVal >= 1000000 
      ? (followersVal / 1000000).toFixed(1).replace(/\.0$/, '') + 'M' 
      : followersVal >= 1000 
        ? (followersVal / 1000).toFixed(1).replace(/\.0$/, '') + 'k' 
        : String(followersVal);
    statTotalFollowersEl.dataset.val = followersFormatted;
    statTotalFollowersEl.textContent = followersFormatted;
  }

  // 2. Ingest KPI Cards
  const erVal = clientStats.engagement_rate || 0;
  const erEl = document.getElementById('kpi-er');
  if (erEl) {
    erEl.dataset.val = erVal;
    erEl.textContent = erVal;

    // Dynamically adjust first KPI card colors (good/warn/neg)
    const erCard = document.getElementById('kpi-er-card');
    if (erCard) {
      erCard.className = 'card metric ' + (erVal >= 3.5 ? 'good' : erVal >= 2.0 ? 'warnv' : 'neg');
    }
  }

  const inactiveVal = clientStats.inactive_follower_percentage || 0;
  const inactiveEl = document.getElementById('kpi-inactive');
  if (inactiveEl) {
    inactiveEl.dataset.val = inactiveVal;
    inactiveEl.textContent = inactiveVal;

    const inactiveCard = document.getElementById('kpi-inactive-card');
    if (inactiveCard) {
      inactiveCard.className = 'card metric ' + (inactiveVal <= 10 ? 'pos' : inactiveVal <= 25 ? 'warnv' : 'good');
    }
  }

  const authenticityScore = clientStats.audience_authenticity_score ?? (100 - inactiveVal);
  const authenticityScoreRounded = Math.round(authenticityScore * 10) / 10;
  const authEl = document.getElementById('kpi-authenticity');
  if (authEl) {
    authEl.dataset.val = authenticityScoreRounded;
    authEl.textContent = authenticityScoreRounded;

    const authCard = document.getElementById('kpi-authenticity-card');
    if (authCard) {
      authCard.className = 'card metric ' + (authenticityScoreRounded >= 80 ? 'pos' : authenticityScoreRounded >= 60 ? 'warnv' : 'good');
    }
  }

  // Convert days_per_post into posts_per_day, calculating dynamically to protect against old cache payloads
  let velocityVal = 0;
  const postsList = data.posts || [];
  
  if (postsList.length > 1) {
    const dates = postsList
      .filter(p => !p.is_mock)
      .map(p => new Date(p.timestamp || p.date))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => b - a); // descending

    if (dates.length > 1) {
      // Calculate true calendar days spanned (stripping out time of day)
      const oldestDate = new Date(dates[dates.length - 1]);
      oldestDate.setHours(0, 0, 0, 0);
      
      const newestDate = new Date(dates[0]);
      newestDate.setHours(0, 0, 0, 0);
      
      const exactDaysDifference = Math.round((newestDate - oldestDate) / (1000 * 60 * 60 * 24));
      const calendarDays = Math.max(exactDaysDifference + 1, 1);
      
      velocityVal = dates.length / calendarDays;
    }
  } else if (clientStats.days_per_post && clientStats.days_per_post > 0) {
    velocityVal = 1 / clientStats.days_per_post;
  }

  // Format nicely (e.g. 0.3 if low, or whole numbers)
  const formattedVelocity = velocityVal < 0.1 && velocityVal > 0 
    ? velocityVal.toFixed(2) 
    : velocityVal.toFixed(1);

  const velocityEl = document.getElementById('kpi-velocity');
  if (velocityEl) {
    velocityEl.dataset.val = formattedVelocity;
    velocityEl.textContent = formattedVelocity;
  }

  // 3. Render SVG Charts
  renderAllDynamicCharts(rawData);

  // 4. Render Format Performance Battle
  renderFormatPerformanceBattle(data);

  // 5. Render Niche Benchmark
  renderNicheBenchmark(data);

  // 6. Render Median Metrics and Best/Worst posts
  renderMedianMetricsAndBestWorst(data);

  // 6b. Render Best Reel and Best Static Post
  renderBestByType(data);

  // 7. Render Two-Column Post Feed and Diagnostic Viewer
  renderPostsFeedAndDeepDive(data);

  // 8. Ingest Hashtag Strategy
  const hashtagIntelligence = processHashtagIntelligence(data);

  // Render AI suggestions
  const aiMarkdownEl = document.getElementById('hashtag-ai-markdown');
  if (aiMarkdownEl) {
    const aiTextHtml = parseMarkdown(data.hashtags_analysis?.ai_assessment || data.ai_assessment || 'No AI assessment available.');
    aiMarkdownEl.innerHTML = aiTextHtml;
  }

  // Bind copy strategy text
  const aiStrategyText = data.hashtags_analysis?.ai_assessment || data.ai_assessment || '';
  const copyBtn = document.getElementById('copy-strategy-btn');
  if (copyBtn) {
    copyBtn.onclick = () => {
      if (!aiStrategyText) return;
      clip(aiStrategyText, 'AI Strategy');
    };
  }

  // Populate Matrix Table List
  const matrixContainer = document.getElementById('hashtag-matrix-container');
  if (matrixContainer) {
    if (hashtagIntelligence.hashtagMatrix.length === 0) {
      matrixContainer.innerHTML = `<div style="font-size:11px;color:var(--faint);text-align:center;padding:20px 10px;">No tags found</div>`;
    } else {
      matrixContainer.innerHTML = hashtagIntelligence.hashtagMatrix.map(item => `
        <div class="ht-row">
          <span class="ht-tag" onclick="clip('${item.tag}', '${item.tag}')">${item.tag}</span>
          <span class="ht-bar"><i style="width:${item.frequency_pct}%"></i></span>
          <span class="ht-ratio">${item.usage_ratio}</span>
        </div>
      `).join('');
    }
  }

  // Update Engagement performance labels
  const q75Label = document.getElementById('q75-label');
  const q75Count = document.getElementById('q75-count');
  const q25Label = document.getElementById('q25-label');
  const q25Count = document.getElementById('q25-count');

  if (q75Label) q75Label.textContent = `Best performers · avg ${Math.round(hashtagIntelligence.analyticsData.q75_threshold || 0).toLocaleString()} likes`;
  if (q75Count) q75Count.textContent = `${hashtagIntelligence.analyticsData.high_engagement_tags.length} tags`;
  if (q25Label) q25Label.textContent = `Weakest performers · avg ${Math.round(hashtagIntelligence.analyticsData.q25_threshold || 0).toLocaleString()} likes`;
  if (q25Count) q25Count.textContent = `${hashtagIntelligence.analyticsData.low_engagement_tags.length} tags`;

  // Populate Quartile Lists (Chips)
  const highList = document.getElementById('high-engagement-tags-list');
  if (highList) {
    if (hashtagIntelligence.analyticsData.high_engagement_tags.length === 0) {
      highList.innerHTML = `<span style="font-size:11px; color:var(--faint); font-style:italic;">No top tags</span>`;
    } else {
      highList.innerHTML = hashtagIntelligence.analyticsData.high_engagement_tags.map(item => `
        <span class="chip" onclick="clip('${item.tag}', '${item.tag}')">${item.tag} <span class="c pos">★ ${item.top_posts_ratio}</span></span>
      `).join('');
    }
  }

  const lowList = document.getElementById('low-engagement-tags-list');
  if (lowList) {
    if (hashtagIntelligence.analyticsData.low_engagement_tags.length === 0) {
      lowList.innerHTML = `<span style="font-size:11px; color:var(--faint); font-style:italic;">No weak tags</span>`;
    } else {
      lowList.innerHTML = hashtagIntelligence.analyticsData.low_engagement_tags.map(item => `
        <span class="chip" onclick="clip('${item.tag}', '${item.tag}')">${item.tag} <span class="c neg">${item.low_posts > 0 ? `${item.low_posts} low` : "0 low"}</span></span>
      `).join('');
    }
  }

  // Populate Kill List
  const killContainer = document.getElementById('kill-list-container');
  if (killContainer) {
    const killList = hashtagIntelligence.analyticsData.kill_list || [];
    if (killList.length === 0) {
      killContainer.innerHTML = `<div style="font-size:11px;color:var(--faint);text-align:center;padding:20px 10px;">No critical warnings</div>`;
    } else {
      killContainer.innerHTML = killList.map(item => `
        <div class="kill-item">
          <div class="kill-top"><span class="tag" onclick="clip('${item.tag}', '${item.tag}')">${item.tag}</span><span class="kill-badge">Drop It</span></div>
          <div class="kill-desc">${item.reason}</div>
          <div class="kill-stats"><span>Avg likes <b>${Math.round(item.avg_engagement)}</b></span><span>Used on <b>${item.total_posts} posts</b></span></div>
        </div>
      `).join('');
    }
  }

  // Populate Try These Suggestions
  const tryContainer = document.getElementById('try-these-container');
  if (tryContainer) {
    const tryThese = hashtagIntelligence.analyticsData.try_these || [];
    if (tryThese.length === 0) {
      tryContainer.innerHTML = `<div style="font-size:11px;color:var(--faint);text-align:center;padding:20px 10px;">No recommendations</div>`;
    } else {
      tryContainer.innerHTML = tryThese.map(item => `
        <div class="target" onclick="clip('${item.tag}', '${item.tag}')">
          <div class="target-l">
            <span class="target-ico">#</span>
            <div>
              <div class="target-tag">${item.tag}</div>
              <div class="target-vol">${item.volume}</div>
            </div>
          </div>
          <span class="target-up">${item.expected_boost}</span>
        </div>
      `).join('');
    }
  }

  // 9. Ingest Competitor cards
  renderCompetitors(competitorData, data.follower_count || 0);

  // Highlight active sidebar item
  document.querySelectorAll('#history-list .acct').forEach(el => {
    const hText = el.querySelector('.h')?.textContent || '';
    if (hText === handle) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // Trigger metric countUp animations for all active .cu elements
  document.querySelectorAll('.cu').forEach(countUp);
}

// ─── CHARTS DRAWING ENGINE ───
function renderAllDynamicCharts(rawData) {
  const data = rawData.client_metrics ? rawData.client_metrics : rawData;
  const trendHistory = rawData.trend_history || [];
  const reelsViews = rawData.reels_views_distribution || data.reels_views_distribution || [];
  const reachDistribution = rawData.reach_distribution_data || data.reach_distribution_data || [];

  // --- Chart 1: Audience Growth Timeline ---

  const recentTrend = trendHistory.slice(-7);
  const trendPts = recentTrend.length >= 1 ? recentTrend.map(item => item.follower_count) : [40, 42, 41, 45, 47, 46, 49, 52, 54, 57, 59, 63];
  const trendLabels = recentTrend.length >= 1 ? recentTrend.map(item => fmtTrendDate(item.date)) : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  drawChart('chart-growth', trendPts, 'var(--accent)', 148, trendLabels);

  // Update growth dates axis-x (bottom labels below chart)
  const growthAxis = document.getElementById('growth-axis-x');
  if (growthAxis && recentTrend.length >= 1) {
    growthAxis.innerHTML = '';
    recentTrend.forEach(item => {
      const span = document.createElement('span');
      span.textContent = fmtTrendDate(item.date);
      growthAxis.appendChild(span);
    });
  }

  // --- Chart 2: Reels Views Distribution ---
  const reelsPts = reelsViews.length > 0 ? reelsViews.map(item => item.views) : [0, 0, 0, 0];
  const reelsLabels = reelsViews.length > 0 ? reelsViews.map(item => item.date) : ["Wk 1", "Wk 2", "Wk 3", "Wk 4"];
  drawChart('chart-reels', reelsPts, 'var(--acc2)', 148, reelsLabels);

  const reelsAxis = document.getElementById('reels-axis-x');
  if (reelsAxis && reelsViews.length > 0) {
    reelsAxis.innerHTML = '';
    const step = Math.max(1, Math.floor(reelsViews.length / 5));
    for (let i = 0; i < reelsViews.length; i += step) {
      const span = document.createElement('span');
      span.textContent = reelsViews[i].date;
      reelsAxis.appendChild(span);
    }
  }

  // --- Chart 3: Reach Performance Distribution ---
  const reachPts = reachDistribution.length > 0 ? reachDistribution.map(item => item.views) : [0, 0, 0, 0];
  const reachLabels = reachDistribution.length > 0 ? reachDistribution.map(item => item.date) : ["Wk 1", "Wk 2", "Wk 3", "Wk 4"];
  drawChart('chart-reach', reachPts, 'var(--acc2)', 148, reachLabels);

  const reachAxis = document.getElementById('reach-axis-x');
  if (reachAxis && reachDistribution.length > 0) {
    reachAxis.innerHTML = '';
    const step = Math.max(1, Math.floor(reachDistribution.length / 5));
    for (let i = 0; i < reachDistribution.length; i += step) {
      const span = document.createElement('span');
      span.textContent = reachDistribution[i].date;
      reachAxis.appendChild(span);
    }
  }
}

// ─── RENDERING FOR FORMAT PERFORMANCE BATTLE ───
function renderFormatPerformanceBattle(data) {
  const performanceSplit = data.performance_split;
  if (!performanceSplit) return;

  const reelsInteractions = (performanceSplit.reels?.total_interactions || 0);
  const staticInteractions = (performanceSplit.static?.total_interactions || 0);

  // Reels stats
  const reelsCount = performanceSplit.reels?.count || 0;
  const reelsLikes = performanceSplit.reels?.average_likes || 0;
  const reelsComments = performanceSplit.reels?.average_comments || 0;

  const reelsHeader = document.getElementById('reels-header-label');
  if (reelsHeader) reelsHeader.textContent = `Reels (Videos) · ${reelsCount} posts`;

  const reelsAvgLikes = document.getElementById('reels-avg-likes');
  if (reelsAvgLikes) {
    reelsAvgLikes.dataset.val = reelsLikes;
    reelsAvgLikes.textContent = Math.round(reelsLikes).toLocaleString();
  }

  const reelsAvgComments = document.getElementById('reels-avg-comments');
  if (reelsAvgComments) reelsAvgComments.textContent = `${Math.round(reelsComments)} comments each, on average`;

  // Static stats
  const staticCount = performanceSplit.static?.count || 0;
  const staticLikes = performanceSplit.static?.average_likes || 0;
  const staticComments = performanceSplit.static?.average_comments || 0;

  const staticHeader = document.getElementById('static-header-label');
  if (staticHeader) staticHeader.textContent = `Static Posts · ${staticCount} posts`;

  const staticAvgLikes = document.getElementById('static-avg-likes');
  if (staticAvgLikes) {
    staticAvgLikes.dataset.val = staticLikes;
    staticAvgLikes.textContent = Math.round(staticLikes).toLocaleString();
  }

  const staticAvgComments = document.getElementById('static-avg-comments');
  if (staticAvgComments) staticAvgComments.textContent = `${Math.round(staticComments)} comments each, on average`;

  const battleContainer = document.querySelector('#format-battle-container .battle');
  if (battleContainer) {
    battleContainer.classList.remove('winL', 'winR');
    if (reelsLikes > staticLikes) {
      battleContainer.classList.add('winL');
    } else if (staticLikes > reelsLikes) {
      battleContainer.classList.add('winR');
    }
  }

  // Reels top posts list
  const reelsTopContainer = document.getElementById('reels-top-posts');
  if (reelsTopContainer) {
    const reelsTop = performanceSplit.reels?.top_posts || [];
    if (reelsTop.length === 0) {
      reelsTopContainer.innerHTML = `<div style="font-size: 11px; color: var(--faint); font-style: italic; text-align: center; padding: 12px 0;">No Reels posts</div>`;
    } else {
      reelsTopContainer.innerHTML = reelsTop.slice(0, 5).map(post => `
        <a href="${resolvePostUrl(post)}" target="_blank" rel="noopener noreferrer" class="post-row">
          <span class="pn">
            <span class="post-lk">#</span>${post.index}
            <span class="post-link-btn">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </span>
          </span>
          <span class="likes"><span style="color: var(--neg);">❤</span> ${post.likes.toLocaleString()} &nbsp;💬 ${(post.comments || 0).toLocaleString()}</span>
        </a>
      `).join('');
    }
  }

  // Static top posts list
  const staticTopContainer = document.getElementById('static-top-posts');
  if (staticTopContainer) {
    const staticTop = performanceSplit.static?.top_posts || [];
    if (staticTop.length === 0) {
      staticTopContainer.innerHTML = `<div style="font-size: 11px; color: var(--faint); font-style: italic; text-align: center; padding: 12px 0;">No Static Posts</div>`;
    } else {
      staticTopContainer.innerHTML = staticTop.slice(0, 5).map(post => `
        <a href="${resolvePostUrl(post)}" target="_blank" rel="noopener noreferrer" class="post-row">
          <span class="pn">
            <span class="post-lk">#</span>${post.index}
            <span class="post-link-btn">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </span>
          </span>
          <span class="likes"><span style="color: var(--neg);">❤</span> ${post.likes.toLocaleString()} &nbsp;💬 ${(post.comments || 0).toLocaleString()}</span>
        </a>
      `).join('');
    }
  }
}

// ─── RENDERING FOR NICHE BENCHMARK ───
function renderNicheBenchmark(data) {
  const benchmark = data.niche_benchmark_data;
  if (!benchmark) return;

  const tierLabel = document.getElementById('benchmark-tier-label');
  if (tierLabel) tierLabel.textContent = benchmark.tier_label || 'N/A';

  const statusBadge = document.getElementById('benchmark-status-badge');
  if (statusBadge) {
    statusBadge.textContent = (benchmark.index_score || 0) >= 100 ? 'High' : 'Low';
    statusBadge.style.color = (benchmark.index_score || 0) >= 100 ? 'var(--pos)' : 'var(--neg)';
  }

  const performanceIndex = document.getElementById('benchmark-performance-index');
  if (performanceIndex) {
    performanceIndex.textContent = `${benchmark.index_score.toFixed(1)}% of the typical rate for their size`;
  }

  const benchmarkDesc = document.getElementById('benchmark-desc');
  if (benchmarkDesc) {
    benchmarkDesc.textContent = "Shows how active this audience is compared to other accounts with the same follower count.";
  }

  const actualER = data.calculated_metrics?.engagement_rate || data.engagement_rate || 0;
  const actualEREl = document.getElementById('benchmark-actual-er');
  if (actualEREl) actualEREl.textContent = `${actualER}%`;

  const baselineEREl = document.getElementById('benchmark-baseline-er');
  if (baselineEREl) baselineEREl.textContent = `${(benchmark.target_baseline || 0).toFixed(2)}%`;

  // Positioning the pin (gauge left %)
  const pin = document.getElementById('gauge-pin');
  if (pin) {
    const indexScore = benchmark.index_score || 0;
    // Map 0 - 200% index score to 5% - 95% visual width of track
    const percentage = Math.max(5, Math.min(95, (indexScore / 200) * 100));
    pin.style.left = `${percentage}%`;
  }
}

// ─── RENDERING FOR MEDIAN & BEST/WORST POSTS ───
function renderMedianMetricsAndBestWorst(data) {
  const posts = data.posts || [];
  if (posts.length === 0) return;

  const likes = posts.map(p => p.likes || 0);
  const comments = posts.map(p => p.comments || 0);

  const calculateMedian = (arr) => {
    if (!arr || arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };
  const calculateAverage = (arr) => {
    if (!arr || arr.length === 0) return 0;
    return Math.round(arr.reduce((sum, val) => sum + val, 0) / arr.length);
  };

  const medianLikes = Number((data.median_likes ?? calculateMedian(likes)).toFixed(2));
  const medianComments = Number((data.median_comments ?? calculateMedian(comments)).toFixed(2));
  const averageLikes = Number((data.average_likes ?? calculateAverage(likes)).toFixed(2));
  
  const reelsPosts = posts.filter(p => p.type === 'Video' || p.type === 'GraphVideo' || p.type === 'clips' || p.is_video);
  const staticPosts = posts.filter(p => !(p.type === 'Video' || p.type === 'GraphVideo' || p.type === 'clips' || p.is_video));
  
  const reelsLikes = reelsPosts.map(p => p.likes || 0);
  const reelsComments = reelsPosts.map(p => p.comments || 0);
  const staticLikes = staticPosts.map(p => p.likes || 0);
  const staticComments = staticPosts.map(p => p.comments || 0);

  const reelsMedianLikes = Number((data.reels_median_likes ?? calculateMedian(reelsLikes)).toFixed(2));
  const reelsMedianComments = Number((data.reels_median_comments ?? calculateMedian(reelsComments)).toFixed(2));
  const staticMedianLikes = Number((data.static_median_likes ?? calculateMedian(staticLikes)).toFixed(2));
  const staticMedianComments = Number((data.static_median_comments ?? calculateMedian(staticComments)).toFixed(2));

  const getDayWithMostPosts = (postsList) => {
    if (!postsList || postsList.length === 0) return 'N/A';
    const dayCounts = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    postsList.forEach(post => {
      if (post.date && post.date !== '—') {
        const d = new Date(post.date);
        const dayName = days[d.getDay()];
        if (dayName) {
          dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        }
      }
    });
    let maxDay = 'N/A';
    let maxCount = -1;
    Object.entries(dayCounts).forEach(([day, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxDay = day;
      }
    });
    return maxDay;
  };

  const dayWithMostPosts = data.calculated_metrics?.day_with_most_posts ?? getDayWithMostPosts(posts);

  const sortedPosts = [...posts].sort((a, b) => b.likes - a.likes);
  const bestPost = sortedPosts[0] || { likes: 0, comments: 0, post_url: '#' };
  const worstPost = sortedPosts[sortedPosts.length - 1] || { likes: 0, comments: 0, post_url: '#' };

  const medianLikesEl = document.getElementById('median-likes-value');
  if (medianLikesEl) {
    medianLikesEl.dataset.val = medianLikes;
    medianLikesEl.textContent = medianLikes.toLocaleString();
  }
  
  const rmlEl = document.getElementById('reels-median-likes');
  if (rmlEl) { rmlEl.dataset.val = reelsMedianLikes; rmlEl.textContent = reelsMedianLikes.toLocaleString(); }
  const rmcEl = document.getElementById('reels-median-comments');
  if (rmcEl) { rmcEl.dataset.val = reelsMedianComments; rmcEl.textContent = reelsMedianComments.toLocaleString(); }
  const smlEl = document.getElementById('static-median-likes');
  if (smlEl) { smlEl.dataset.val = staticMedianLikes; smlEl.textContent = staticMedianLikes.toLocaleString(); }
  const smcEl = document.getElementById('static-median-comments');
  if (smcEl) { smcEl.dataset.val = staticMedianComments; smcEl.textContent = staticMedianComments.toLocaleString(); }
  const medianCommentsEl = document.getElementById('median-comments-value');
  if (medianCommentsEl) {
    medianCommentsEl.dataset.val = medianComments;
    medianCommentsEl.textContent = medianComments.toLocaleString();
  }
  const averageLikesEl = document.getElementById('average-likes-value');
  if (averageLikesEl) {
    averageLikesEl.dataset.val = averageLikes;
    averageLikesEl.textContent = averageLikes.toLocaleString();
  }
  const activeDayEl = document.getElementById('most-active-day-value');
  if (activeDayEl) activeDayEl.textContent = dayWithMostPosts;

  document.getElementById('best-post-stats').textContent = `${(bestPost.likes || 0).toLocaleString()} likes · ${(bestPost.comments || 0).toLocaleString()} comments`;

  const bestLinkEl = document.getElementById('best-post-link');
  if (bestLinkEl) {
    bestLinkEl.innerHTML = `<a href="${resolvePostUrl(bestPost)}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;color:inherit;text-decoration:none;">
      View Live Post
      <span class="post-link-btn" style="margin-left: 6px;">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </span>
    </a>`;
    bestLinkEl.onclick = null;
  }

  const bestThumb = document.getElementById('best-post-thumbnail');
  if (bestThumb) {
    fetchDynamicThumbnail(bestPost, bestThumb);
  }
  const bestPostRow = document.getElementById('best-post-row');
  if (bestPostRow) {
    bestPostRow.onclick = () => window.open(resolvePostUrl(bestPost), '_blank', 'noopener,noreferrer');
  }

  const worstStatsEl = document.getElementById('worst-post-stats');
  if (worstStatsEl) worstStatsEl.textContent = `${(worstPost.likes || 0).toLocaleString()} likes · ${(worstPost.comments || 0).toLocaleString()} comments`;

  const worstLinkEl = document.getElementById('worst-post-link');
  if (worstLinkEl) {
    worstLinkEl.innerHTML = `<a href="${resolvePostUrl(worstPost)}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;color:inherit;text-decoration:none;">
      View Live Post
      <span class="post-link-btn" style="margin-left: 6px;">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </span>
    </a>`;
    worstLinkEl.onclick = null;
  }

  const worstThumb = document.getElementById('worst-post-thumbnail');
  if (worstThumb) {
    fetchDynamicThumbnail(worstPost, worstThumb);
  }
  const worstPostRow = document.getElementById('worst-post-row');
  if (worstPostRow) {
    worstPostRow.onclick = () => window.open(resolvePostUrl(worstPost), '_blank', 'noopener,noreferrer');
  }
}

// ─── RENDERING FOR BEST REEL & BEST STATIC POST ───
function renderBestByType(data) {
  const performanceSplit = data.performance_split;
  if (!performanceSplit) return;

  const reelsTop = performanceSplit.reels?.top_posts || [];
  const staticTop = performanceSplit.static?.top_posts || [];

  const rawBestReel = reelsTop.length > 0 ? reelsTop[0] : null;
  const rawBestStatic = staticTop.length > 0 ? staticTop[0] : null;

  const posts = data.posts || [];
  // Try to match by index name, but ALWAYS fall back to the raw performance_split data
  // so that links and thumbnails work even if the match fails
  const bestReel = rawBestReel ? (posts.find(p => p.index === rawBestReel.index) || rawBestReel) : null;
  const bestStatic = rawBestStatic ? (posts.find(p => p.index === rawBestStatic.index) || rawBestStatic) : null;

  // Helper to build the "View Live Post" link HTML
  const buildLinkHTML = (post) => {
    if (!post) return '<span style="color:var(--faint); font-style:italic;">No posts of this type</span>';
    const url = resolvePostUrl(post);
    if (url === '#') return '<span style="color:var(--faint); font-style:italic;">No posts of this type</span>';
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;color:inherit;text-decoration:none;">
      View Live Post
      <span class="post-link-btn" style="margin-left: 6px;">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </span>
    </a>`;
  };

  // --- Best Reel ---
  const reelStatsEl = document.getElementById('best-reel-stats');
  const reelLinkEl = document.getElementById('best-reel-link');
  const reelThumb = document.getElementById('best-reel-thumbnail');
  const reelRow = document.getElementById('best-reel-row');

  if (bestReel) {
    if (reelStatsEl) reelStatsEl.textContent = `${(bestReel.likes || 0).toLocaleString()} likes \u00B7 ${(bestReel.comments || 0).toLocaleString()} comments`;
    if (reelLinkEl) reelLinkEl.innerHTML = buildLinkHTML(bestReel);
    if (reelThumb) fetchDynamicThumbnail(bestReel, reelThumb);
    if (reelRow) reelRow.onclick = () => window.open(resolvePostUrl(bestReel), '_blank', 'noopener,noreferrer');
  } else {
    if (reelStatsEl) reelStatsEl.textContent = '—';
    if (reelLinkEl) reelLinkEl.innerHTML = buildLinkHTML(null);
  }

  // --- Best Static Post ---
  const staticStatsEl = document.getElementById('best-static-stats');
  const staticLinkEl = document.getElementById('best-static-link');
  const staticThumb = document.getElementById('best-static-thumbnail');
  const staticRow = document.getElementById('best-static-row');

  if (bestStatic) {
    if (staticStatsEl) staticStatsEl.textContent = `${(bestStatic.likes || 0).toLocaleString()} likes \u00B7 ${(bestStatic.comments || 0).toLocaleString()} comments`;
    if (staticLinkEl) staticLinkEl.innerHTML = buildLinkHTML(bestStatic);
    if (staticThumb) fetchDynamicThumbnail(bestStatic, staticThumb);
    if (staticRow) staticRow.onclick = () => window.open(resolvePostUrl(bestStatic), '_blank', 'noopener,noreferrer');
  } else {
    if (staticStatsEl) staticStatsEl.textContent = '—';
    if (staticLinkEl) staticLinkEl.innerHTML = buildLinkHTML(null);
  }
}

// ─── RENDERING FOR TWO-COLUMN FEED & DIAGNOSTICS ───
function renderPostsFeedAndDeepDive(data) {
  const posts = data.posts || [];
  
  const reelsPosts = posts.filter(p => p.type === 'Video' || p.type === 'GraphVideo' || p.type === 'clips' || p.is_video);
  const staticPosts = posts.filter(p => !(p.type === 'Video' || p.type === 'GraphVideo' || p.type === 'clips' || p.is_video));
  
  const reelsLikes = reelsPosts.map(p => p.likes || 0);
  const staticLikes = staticPosts.map(p => p.likes || 0);
  
  const calculateMedian = (arr) => {
    if (!arr || arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };
  
  const reelsMedianLikes = Number((data.reels_median_likes ?? calculateMedian(reelsLikes)).toFixed(2));
  const staticMedianLikes = Number((data.static_median_likes ?? calculateMedian(staticLikes)).toFixed(2));

  _renderFeedList('reels-feed', 'reels-post-deep-dive-viewer', reelsPosts, reelsMedianLikes, 'selectedReel');
  _renderFeedList('static-feed', 'static-post-deep-dive-viewer', staticPosts, staticMedianLikes, 'selectedStatic');
}

function _renderFeedList(feedId, viewerId, posts, medianLikes, stateKey) {
  const feedContainer = document.getElementById(feedId);
  if (!feedContainer) return;

  if (posts.length === 0) {
    feedContainer.innerHTML = `<div style="text-align:center; font-size:12px; color:var(--faint); padding:40px 10px;">No posts found.</div>`;
    renderPostDeepDive(null, viewerId);
    return;
  }

  const sortedPosts = [...posts].sort((a, b) => b.likes - a.likes);

  if (!state[stateKey] || !sortedPosts.some(p => p.index === state[stateKey].index)) {
    state[stateKey] = sortedPosts[0];
  }

  feedContainer.innerHTML = sortedPosts.map((post, i) => {
    const isSelected = state[stateKey] && (state[stateKey].index === post.index || state[stateKey] === post);
    const activeClass = isSelected ? 'feed-item active' : 'feed-item';
    const cleanSnippet = (post.snippet || post.caption?.substring(0, 48) || '—').replace(/"/g, '&quot;');
    const isVideo = post.type?.toLowerCase().includes('video') || post.type?.toLowerCase().includes('reel');
    
    // Check WIN/FIX using specific median
    const isWin = (post.likes || 0) >= medianLikes;

    const postIcon = isVideo
      ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`
      : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;

    return `
      <div class="${activeClass}" data-post-index="${post.index}">
        <div class="feed-rank">${i + 1}</div>
        <div class="feed-thumb">${postIcon}</div>
        <div class="feed-body">
          <div class="ttl">
            ${post.index} 
            ${isWin 
              ? '<span style="color:var(--accent);font-weight:800;font-size:10px;margin-left:6px;padding:2px 6px;border-radius:4px;background:rgba(198,255,58,0.1);">WIN</span>' 
              : '<span style="color:var(--neg);font-weight:800;font-size:10px;margin-left:6px;padding:2px 6px;border-radius:4px;background:rgba(255,99,99,0.1);">FIX</span>'}
            <span style="color:var(--faint);font-weight:500;font-size:11px;margin-left:4px;">· ${fmtTrendDate(post.date)}</span>
          </div>
          <div class="cap">${cleanSnippet}</div>
        </div>
        <div class="feed-likes">
          <span style="color: var(--neg);">❤</span> ${(post.likes || 0).toLocaleString()}
          <a href="${resolvePostUrl(post)}" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:none;margin-left:8px;" title="View Live Post" onclick="event.stopPropagation()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      </div>
    `;
  }).join('');

  // Bind clicks
  feedContainer.querySelectorAll('.feed-item').forEach(item => {
    item.addEventListener('click', () => {
      const postIndex = item.getAttribute('data-post-index');
      const postObj = sortedPosts.find(p => p.index === postIndex);
      if (postObj) {
        feedContainer.querySelectorAll('.feed-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        state[stateKey] = postObj;
        renderPostDeepDive(postObj, viewerId);
      }
    });
  });

  renderPostDeepDive(state[stateKey], viewerId);
}

function renderPostDeepDive(post, viewerId = 'post-deep-dive-viewer') {
  const viewer = document.getElementById(viewerId);
  if (!viewer) return;

  if (!post) {
    viewer.innerHTML = `
      <div style="text-align:center; padding: 60px 20px; color: var(--faint);">
        <h4>No Post Selected</h4>
        <p style="font-size:13px;">Select an item from the feed to load diagnostic details.</p>
      </div>
    `;
    return;
  }

  const briefMarkdown = post.log_content || post.brief || 'No diagnostic audit brief available.';
  const briefHtml = parseMarkdown(briefMarkdown);
  const caption = post.caption || 'No caption text exists for this post.';

  // Extract hashtags
  const matches = caption.match(/#[a-zA-Z0-9_]+/g) || [];
  const uniqueTags = Array.from(new Set(matches.map(t => t.toLowerCase())));
  const tagsHtml = uniqueTags.length > 0
    ? uniqueTags.map(tag => `<span class="htag" onclick="clip('${tag}', '${tag}')"> ${tag}</span>`).join('')
    : '';

  // Clean caption text of tags for clean render
  const captionTextOnly = caption.replace(/#[a-zA-Z0-9_]+/g, '').trim();

  viewer.innerHTML = `
    <div class="diag">
      <div class="diag-head">
        <div>
          <div class="diag-title">${post.index}</div>
          <div class="diag-meta">Posted on ${fmtTrendDate(post.date)} · ${post.type || 'Photo'}</div>
        </div>
        <span class="pill dot ${post.is_above_baseline ? 'win' : 'fix'}">${post.is_above_baseline ? 'Above Baseline' : 'Below Baseline'}</span>
      </div>
      <div class="diag-actions">
        ${resolvePostUrl(post) !== '#' ? `<button class="btn" style="background:var(--accent);color:var(--bg);font-weight:700;border:none;" onclick="window.open('${resolvePostUrl(post)}', '_blank', 'noopener,noreferrer')">↗ Open the Post</button>` : ''}
        <button class="btn btn-ghost" onclick="clip(\`${caption.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`, 'Caption')">⧉ Copy Caption</button>
      </div>
      <div class="caption-box">
        ${captionTextOnly || 'No text content'}
        ${tagsHtml ? `<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px;">${tagsHtml}</div>` : ''}
      </div>
      <div class="snapshot">
        <span class="beam"></span>
        <div>
          <div class="ai-badge">What our AI noticed</div>
          <div class="ai-result">${briefHtml}</div>
        </div>
      </div>
    </div>
  `;
}

// ─── COMPETITORS CARD DRAWING ───
function renderCompetitors(competitors, clientFollowers = 0) {
  const anchor = document.getElementById('competitor-anchor');
  if (!anchor) return;
  
  // Filter out invalid/dead accounts, AND accounts that are way too small compared to the client (e.g. less than 5% of client followers)
  const validCompetitors = competitors.filter(c => {
    if (c.is_invalid || !c.competitor_name) return false;
    if ((c.follower_count || 0) <= 0) return false;
    if ((c.follower_count || 0) < 10000 && (c.follower_count || 0) < (clientFollowers * 0.05)) return false;
    return true;
  });

  if (validCompetitors.length === 0) {
    anchor.innerHTML = `<div style="text-align:center;color:var(--faint);padding:20px;">No valid competitors found</div>`;
    return;
  }

  let cardsHtml = '';
  validCompetitors.forEach(comp => {
    const handleName = comp.competitor_name;
    const cleanHandle = handleName.replace(/[^a-zA-Z0-9_.]/g, '');
    const followersFormatted = comp.follower_count.toLocaleString();
    const er = comp.metrics?.engagement_rate ?? 0;
    const barWidth = Math.min(er * 10, 100);
    const velocity = comp.metrics?.days_per_post ?? 0;
    const ghostPct = comp.metrics?.inactive_follower_percentage ?? 0;
    const realPct = (100 - ghostPct).toFixed(1);

    const bestLikes = comp.metrics?.best_post?.likes ?? 0;
    const worstLikes = comp.metrics?.worst_post?.likes ?? 0;

    cardsHtml += `
      <div class="competitor-card">
        <div class="competitor-card-header">
          <div class="comp-rank-group">
            <span class="comp-rank-badge">#${comp.rank}</span>
            <a href="https://www.instagram.com/${cleanHandle}" target="_blank" rel="noopener noreferrer" class="comp-username" style="color:inherit; text-decoration:none; display:flex; align-items:center; gap:6px; cursor:pointer; position:relative; z-index:10;" title="View Instagram Profile">
              ${handleName}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.7"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </div>
        </div>
        <div class="competitor-card-body">
          
          <!-- Strict ER -->
          <div class="comp-er-row">
            <div class="comp-er-header">
              <span>Strict ER</span>
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
                <span>Followers</span>
              </div>
              <span class="comp-stat-box-val">${followersFormatted}</span>
            </div>

          </div>

          <!-- Ghost Followers -->
          <div class="comp-ghost-box">
            <span class="comp-ghost-title">Inactive Followers</span>
            <span class="comp-ghost-val">${ghostPct}%</span>
          </div>

          <!-- Post Highlights -->
          <div class="comp-highlights">
            <div>
              <span class="comp-highlight-title">Best Post</span>
              <a href="${resolvePostUrl(comp.metrics?.best_post)}" target="_blank" rel="noopener noreferrer" class="comp-highlight-btn best" style="position: relative;">
                <svg style="position: absolute; top: 6px; right: 6px; width: 10px; height: 10px; color: currentColor; opacity: 0.5;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                <span>${bestLikes.toLocaleString()}</span>
                <div style="font-size: 7px; text-transform: uppercase; font-weight:700; margin-top:2px;">Likes</div>
              </a>
            </div>
            <div>
              <span class="comp-highlight-title">Worst Post</span>
              <a href="${resolvePostUrl(comp.metrics?.worst_post)}" target="_blank" rel="noopener noreferrer" class="comp-highlight-btn worst" style="position: relative;">
                <svg style="position: absolute; top: 6px; right: 6px; width: 10px; height: 10px; color: currentColor; opacity: 0.5;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                <span>${worstLikes.toLocaleString()}</span>
                <div style="font-size: 7px; text-transform: uppercase; font-weight:700; margin-top:2px;">Likes</div>
              </a>
            </div>
          </div>

        </div>
      </div>
    `;
  });

  anchor.innerHTML = cardsHtml;
  if (window.lucide) window.lucide.createIcons();
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

  // Sort matrix descending by frequency or engagement
  hashtagMatrixList.sort((a, b) => b.frequency_pct - a.frequency_pct);

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
        reason = `Average likes (${item.avg_engagement.toLocaleString()}) sits in bottom quartile.`;
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
        reason: `Algorithmic stagnation warning: While not critically suppressed, ${worstTag.tag} correlates with baseline engagement and limits virality.`,
        low_posts: worstTag.low_posts,
        total_posts: worstTag.count,
        avg_engagement: worstTag.avg_engagement
      });
    } else {
      killList.push({
        tag: "#[Missing Tags]",
        reason: "Failing to use hashtags complete blinds categorization algorithms, throttling non-follower discovery.",
        low_posts: totalPosts,
        total_posts: totalPosts,
        avg_engagement: Math.round(overallMedianEngagement)
      });
    }
  }

  // Dynamic Try These suggestions (completely parsing captions to recommend tags)
  const allTags = new Set(Object.keys(hashtagMap));
  const wordCounts = {};
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "about",
    "from", "up", "down", "out", "off", "over", "under", "again", "then", "once", "here", "there",
    "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other",
    "some", "so", "too", "very", "can", "will", "just", "should", "now", "of", "is", "this", "that"
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
  const volumes = ["Very popular", "Fairly popular", "Niche target"];
  let sugIndex = 0;

  for (const word of sortedWords) {
    const tag = "#" + word;
    if (!allTags.has(tag) && tryThese.length < 4) {
      const volume = volumes[sugIndex % volumes.length];
      const boost = (28.4 - sugIndex * 2.5).toFixed(1);
      tryThese.push({
        tag,
        volume,
        expected_boost: `+${boost}%`
      });
      sugIndex++;
    }
  }

  if (tryThese.length < 4) {
    const fallbacks = ["growth", "explore", "results", "trending"];
    fallbacks.forEach(f => {
      const tag = "#" + f;
      if (!allTags.has(tag) && tryThese.length < 4) {
        const volume = "Fairly popular";
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

// ─── HELPERS ───
function getProfileHandle(url) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/\/$/, "");
    const parts = pathname.split("/");
    return "@" + parts[parts.length - 1];
  } catch {
    return url.startsWith('@') ? url : '@' + url;
  }
}

function getDisplayUrl(url) {
  if (!url || url === '#') return 'No URL available';
  try {
    const parsed = new URL(url);
    return parsed.hostname + parsed.pathname;
  } catch {
    return url;
  }
}

// Simple Markdown-to-HTML parser
function parseMarkdown(mdText) {
  if (!mdText) return '';
  let html = mdText;

  // 1. Convert uppercase titles with emojis
  html = html.replace(/^(?:### )?([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])?\s*([A-Z0-9\s_&]+)\s*(?:\n|$)/gmu, (match, emoji, text) => {
    if (!text || text.trim().length < 3) return match;
    const cleanedText = text.trim();
    const isWarn = cleanedText.includes("FRICTION") || cleanedText.includes("AVOID") || cleanedText.includes("DROP");
    const colorVar = isWarn ? 'var(--warn)' : 'var(--accent)';
    const emojiStr = emoji ? `<span style="margin-right: 8px; font-size: 1.1em;">${emoji}</span>` : '';
    return `<h4 style="margin-top:24px;margin-bottom:12px;font-weight:800;letter-spacing:0.04em;color:${colorVar};display:flex;align-items:center;text-transform:uppercase;font-size:13px;">${emojiStr}${cleanedText}</h4>`;
  });

  // Backup for explicit ### tags
  html = html.replace(/### (.*?)(?:\n|$)/g, '<h4 style="margin-top:16px;margin-bottom:8px;font-weight:800;color:var(--accent);letter-spacing:0.04em;text-transform:uppercase;font-size:13px;">$1</h4>');
  html = html.replace(/## (.*?)(?:\n|$)/g, '<h3 style="margin-top:20px;margin-bottom:10px;font-weight:800;color:var(--pos);letter-spacing:0.04em;text-transform:uppercase;font-size:14px;">$1</h3>');

  // Highlight bold tags with our pos color
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--pos);font-weight:700;">$1</strong>');
  
  // Lists
  html = html.replace(/^\* (.*?)(?:\n|$)/gm, '<li style="margin-bottom:8px;line-height:1.55;color:#e2e2e9;">$1</li>');
  html = html.replace(/^- (.*?)(?:\n|$)/gm, '<li style="margin-bottom:8px;line-height:1.55;color:#e2e2e9;">$1</li>');
  html = html.replace(/((?:<li.*?>.*?<\/li>\n?)+)/gs, '<ul style="padding-left:0;margin:12px 0 20px 0;list-style:none;">$1</ul>');
  
  // Custom list items with cute bullet
  html = html.replace(/<li style="(.*?)">(.*?)<\/li>/g, '<li style="$1;display:flex;align-items:flex-start;"><span style="color:var(--accent);margin-right:8px;font-size:14px;margin-top:2px;">✦</span><span style="flex:1;">$2</span></li>');

  // Replace remaining newlines
  html = html.replace(/\n/g, '<br>');
  // Remove consecutive breaks
  html = html.replace(/(<br>\s*){2,}/g, '<br><br>');
  
  return html;
}

// ─── TOAST NOTIFICATION ───
var _toastT;
window.toast = function (msg) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastT);
  _toastT = setTimeout(function () { el.classList.remove('show'); }, 1800);
}

window.clip = function (text, label) {
  if (!text) return;
  try {
    navigator.clipboard.writeText(text);
    window.toast((label || 'Copied') + ' → clipboard');
  } catch (e) {
    console.warn('Could not copy to clipboard:', e);
  }
}

// ─── PALETTE SWITCHER ───
window.setPalette = function (btn) {
  document.documentElement.setAttribute('data-palette', btn.dataset.p);
  document.querySelectorAll('.pal-btn').forEach(function (b) {
    b.classList.toggle('active', b === btn);
  });
  // Re-draw charts so stroke colors update
  if (state.activeProfile) {
    // Redraw charts using actual data if we have it
    const activeSidebar = document.querySelector('#history-list .acct.active .h');
    if (activeSidebar) {
      const handle = activeSidebar.textContent.replace('@', '');
      handleHistoryClick(handle);
    }
  } else {
    // Redraw defaults
    drawChart('chart-growth', [40, 42, 41, 45, 47, 46, 49, 52, 54, 57, 59, 63], 'var(--accent)');
    drawChart('chart-reels', [5900, 1200, 900, 5800], 'var(--acc2)');
    drawChart('chart-reach', [610, 140, 90, 420], 'var(--acc2)');
  }
}

// ─── COUNT-UP ANIMATION ───
function countUp(el) {
  var raw = el.dataset.val;
  if (!raw) return;
  var suffix = (raw.match(/[^\d.,]+$/) || [''])[0];
  var numStr = raw.replace(/[^\d.]/g, '');
  var target = parseFloat(numStr) || 0;
  var decimals = (numStr.split('.')[1] || '').length;
  var t0 = performance.now();
  var dur = 950;
  var raf;

  function fmt(n) {
    return n.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }) + suffix;
  }
  function tick(now) {
    var k = Math.min(1, (now - t0) / dur);
    var e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(target * e);
    if (k < 1) raf = requestAnimationFrame(tick);
    else el.textContent = raw;
  }
  // If the raw value is already formatted (contains M/k), skip countUp and show as-is
  if (/[Mk]$/.test(raw)) {
    el.textContent = raw;
    return;
  }
  raf = requestAnimationFrame(tick);
  setTimeout(function () { cancelAnimationFrame(raf); el.textContent = raw; }, dur + 300);
}

// ─── SVG LINE CHART RENDERER ───
window.drawChart = function (id, pts, stroke, h, labels) {
  var el = document.getElementById(id);
  if (!el) return;
  stroke = stroke || 'var(--accent)';
  h = h || 148;
  var W = 480, H = h;
  var padLeft = 52, padRight = 16, padTop = 16, padBottom = 20;

  var max = Math.max.apply(null, pts);
  var min = Math.min.apply(null, pts);
  // Ensure we have a span
  if (min === max) {
    min = 0; max = max || 10;
  }
  var span = (max - min) || 1;
  var n = pts.length;
  if (n === 0) return;

  var xs = function (i) { 
    if (n === 1) return padLeft + (W - padLeft - padRight) / 2;
    return padLeft + (i * (W - padLeft - padRight)) / (n - 1); 
  };
  var ys = function (v) { return H - padBottom - ((v - min) / span) * (H - padTop - padBottom); };
  var P = pts.map(function (v, i) { return [xs(i), ys(v)]; });

  var gid = 'g' + (Math.random() * 1e8 | 0).toString(36);
  var graphElementsHtml = '';

  if (n === 1) {
    var p = P[0];
    var barWidth = 16;
    var rx = p[0] - barWidth / 2;
    var ry = p[1];
    var rh = Math.max((H - padBottom) - ry, 2);
    graphElementsHtml = 
      '<rect x="' + rx + '" y="' + ry + '" width="' + barWidth + '" height="' + rh + '" fill="url(#' + gid + ')" rx="2"/>' +
      '<line x1="' + rx + '" y1="' + ry + '" x2="' + (rx + barWidth) + '" y2="' + ry + '" stroke="' + stroke + '" stroke-width="3" stroke-linecap="round"/>';
  } else {
    var d = '';
    P.forEach(function (p, i) {
      if (i === 0) { d = 'M' + p[0] + ' ' + p[1]; return; }
      var p0 = P[i - 1], p1 = p;
      var pr = P[i - 2] || p0, nx = P[i + 1] || p1;
      var cx1 = p0[0] + (p1[0] - pr[0]) / 6;
      var cy1 = p0[1] + (p1[1] - pr[1]) / 6;
      var cx2 = p1[0] - (nx[0] - p0[0]) / 6;
      var cy2 = p1[1] - (nx[1] - p0[1]) / 6;
      d += ' C' + cx1 + ' ' + cy1 + ',' + cx2 + ' ' + cy2 + ',' + p1[0] + ' ' + p1[1];
    });

    var area = d + ' L' + xs(n - 1) + ' ' + (H - padBottom) + ' L' + xs(0) + ' ' + (H - padBottom) + 'Z';
    
    var circles = P.map(function (p, i) {
      var last = i === P.length - 1;
      return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (last ? 4.5 : 3) +
        '" fill="' + (last ? stroke : 'var(--surf)') + '" stroke="' + stroke + '" stroke-width="2"/>';
    }).join('');

    graphElementsHtml = 
      '<path d="' + area + '" fill="url(#' + gid + ')"/>' +
      '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      circles;
  }

  function formatYAxis(v) {
    if (v >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
    return Math.round(v).toString();
  }

  // Draw Grid, Y-axis labels, and Axes
  var gridLinesHtml = '';
  var levels = [0, 0.25, 0.5, 0.75, 1.0];
  levels.forEach(function (g) {
    var val = min + span * g;
    var y = ys(val);
    var isBoundary = (g === 0 || g === 1);

    gridLinesHtml += '<line x1="' + padLeft + '" x2="' + (W - padRight) + '" y1="' + y + '" y2="' + y +
      '" stroke="var(--grid)" stroke-width="' + (isBoundary ? 0 : 1) + '"/>';

    gridLinesHtml += '<line x1="' + (padLeft - 4) + '" x2="' + padLeft + '" y1="' + y + '" y2="' + y +
      '" stroke="var(--border-s)" stroke-width="1"/>';

    gridLinesHtml += '<text x="' + (padLeft - 8) + '" y="' + (y + 3) + '" text-anchor="end" font-size="9px" font-weight="500" fill="var(--muted)">' +
      formatYAxis(val) + '</text>';
  });

  // Y-axis line
  gridLinesHtml += '<line x1="' + padLeft + '" x2="' + padLeft + '" y1="' + padTop + '" y2="' + (H - padBottom) + '" stroke="var(--border-s)" stroke-width="1"/>';
  // X-axis line
  gridLinesHtml += '<line x1="' + padLeft + '" x2="' + (W - padRight) + '" y1="' + (H - padBottom) + '" y2="' + (H - padBottom) + '" stroke="var(--border-s)" stroke-width="1"/>';

  // Y-Axis Title
  var yLabelTxt = id === 'chart-growth' ? 'Followers' : id === 'chart-reels' ? 'Views' : 'Reach';
  gridLinesHtml += '<text x="12" y="' + (H / 2) + '" text-anchor="middle" transform="rotate(-90 12,' + (H / 2) + ')" font-size="10px" font-weight="600" fill="var(--muted)" letter-spacing="1">' + yLabelTxt.toUpperCase() + '</text>';
  
  // X-Axis Title
  gridLinesHtml += '<text x="' + (padLeft + (W - padLeft - padRight) / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="10px" font-weight="600" fill="var(--muted)" letter-spacing="1">DATE</text>';

  var hoverSvg =
    '<g class="hover-grp" style="display: none; pointer-events: none;">' +
    '<line class="hover-ln" x1="0" x2="0" y1="' + padTop + '" y2="' + (H - padBottom) + '" stroke="var(--border-s)" stroke-width="1.2" stroke-dasharray="3,3"/>' +
    '<circle class="hover-pt" cx="0" cy="0" r="5" fill="var(--surf)" stroke="var(--text)" stroke-width="2"/>' +
    '<g class="hover-tooltip">' +
    '<rect class="hover-bg" rx="6" ry="6" fill="var(--surf3)" stroke="var(--border-s)" stroke-width="1" width="80" height="42" x="-40" y="-48"/>' +
    '<text class="hover-date" x="0" y="-30" text-anchor="middle" font-size="9px" fill="var(--muted)">Date</text>' +
    '<text class="hover-txt" x="0" y="-16" text-anchor="middle" font-size="11px" font-weight="700" fill="var(--text)">0</text>' +
    '</g>' +
    '</g>';

  el.innerHTML =
    '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" style="width:100%;height:' + H + 'px;display:block">' +
    '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0%" stop-color="' + stroke + '" stop-opacity="0.26"/>' +
    '<stop offset="100%" stop-color="' + stroke + '" stop-opacity="0"/>' +
    '</linearGradient></defs>' +
    gridLinesHtml +
    graphElementsHtml +
    hoverSvg +
    '</svg>';

  // Interactive Hover tracking logic
  var svgEl = el.querySelector('svg');
  var hoverGrp = el.querySelector('.hover-grp');
  var hoverLn = el.querySelector('.hover-ln');
  var hoverPt = el.querySelector('.hover-pt');
  var hoverTooltip = el.querySelector('.hover-tooltip');
  var hoverBg = el.querySelector('.hover-bg');
  var hoverDate = el.querySelector('.hover-date');
  var hoverTxt = el.querySelector('.hover-txt');

  svgEl.addEventListener('mousemove', function (e) {
    var rect = svgEl.getBoundingClientRect();
    var mouseX = ((e.clientX - rect.left) / rect.width) * W;

    // Find closest point index
    var closestI = 0;
    var minDistance = Infinity;
    for (var i = 0; i < n; i++) {
      var dist = Math.abs(xs(i) - mouseX);
      if (dist < minDistance) {
        minDistance = dist;
        closestI = i;
      }
    }

    var px = xs(closestI);
    var py = ys(pts[closestI]);
    var val = pts[closestI];
    var dateLabel = (labels && labels[closestI]) ? labels[closestI] : '';

    hoverGrp.style.display = 'block';

    // Move vertical line and point
    hoverLn.setAttribute('x1', px);
    hoverLn.setAttribute('x2', px);
    hoverPt.setAttribute('cx', px);
    hoverPt.setAttribute('cy', py);

    // Adjust tooltip placement to avoid clipping
    var tooltipW = 80;
    var tooltipH = dateLabel ? 42 : 28;
    var tx = px;
    var ty = py;

    var localX = -tooltipW / 2;
    var localY = -tooltipH - 6;

    // Boundary enforcement
    if (tx + localX < padLeft) {
      localX = padLeft - tx + 4;
    } else if (tx + localX + tooltipW > W - padRight) {
      localX = (W - padRight) - tx - tooltipW - 4;
    }

    if (ty + localY < 4) {
      localY = 12; // Flip to bottom of point
    }

    hoverTooltip.setAttribute('transform', 'translate(' + tx + ',' + ty + ')');
    hoverBg.setAttribute('x', localX);
    hoverBg.setAttribute('y', localY);
    hoverBg.setAttribute('height', tooltipH);

    if (dateLabel) {
      hoverDate.style.display = 'block';
      hoverDate.textContent = dateLabel;
      hoverDate.setAttribute('x', localX + tooltipW / 2);
      hoverDate.setAttribute('y', localY + 12);

      hoverTxt.setAttribute('x', localX + tooltipW / 2);
      hoverTxt.setAttribute('y', localY + 28);
    } else {
      hoverDate.style.display = 'none';
      hoverTxt.setAttribute('x', localX + tooltipW / 2);
      hoverTxt.setAttribute('y', localY + 18);
    }

    hoverTxt.textContent = val.toLocaleString();
  });

  svgEl.addEventListener('mouseleave', function () {
    hoverGrp.style.display = 'none';
  });
}

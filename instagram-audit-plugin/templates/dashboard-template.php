<?php
/**
 * Template for the Instagram Audit Tool Dashboard
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>
<div class="wp-audit-tool-container">

  <!-- BACKGROUND PASTEL GLOW ORBS -->
  <div class="glow-orb orb-1"></div>
  <div class="glow-orb orb-2"></div>

  <div class="app-layout">
    
    <!-- SIDEBAR PANEL: AUDIT HISTORY -->
    <aside class="sidebar">
      <h2 class="sidebar-title">Audit History</h2>
      <div id="history-list" class="history-list">
        <!-- History items dynamically injected here -->
        <div class="history-empty">
          <p>No history found</p>
        </div>
      </div>
    </aside>

    <!-- RIGHT CONTAINER -->
    <div class="main-wrapper">
      
      <!-- HEADER ROW -->
      <header class="app-header">
        <div class="header-logo-group">
          <div class="logo-box">
            <i data-lucide="sparkles" class="logo-icon"></i>
          </div>
          <div class="header-text">
            <h1 class="header-title">AUDIT TOOL</h1>
            <p class="header-subtitle">Instagram Growth Analytics & Gemini Diagnostic Auditing</p>
          </div>
        </div>
      </header>

      <!-- MAIN CONTENT WRAPPER -->
      <main class="content-container">

        <!-- SEARCH BAR PANEL -->
        <section class="search-panel">
          <div class="search-info">
            <h2 class="search-title">Instagram Growth Analytics & Diagnostic Auditing</h2>
            <p class="search-desc">Paste any Instagram profile URL below to instantly analyze their engagement rate, tag strategy, and post performance.</p>
          </div>
          <form id="search-form" class="search-form">
            <div class="input-group">
              <label class="input-label">Target Instagram Profile URL</label>
              <div class="input-wrapper">
                <i data-lucide="search" class="search-input-icon"></i>
                <input 
                  type="url" 
                  id="profile-url" 
                  placeholder="paste the url here" 
                  required
                />
              </div>
            </div>
            <button type="submit" id="submit-btn" class="submit-btn">
              <i data-lucide="sparkles" class="btn-icon"></i>
              <span>Perform Deep Audit</span>
            </button>
          </form>
        </section>

        <!-- ERROR MESSAGE PANEL (HIDDEN BY DEFAULT) -->
        <div id="error-panel" class="error-panel hidden">
          <i data-lucide="alert-circle" class="error-icon"></i>
          <div class="error-content">
            <span class="error-title">Connection Fallback Active</span>
            <p id="error-message" class="error-text"></p>
          </div>
        </div>

        <!-- DYNAMIC CARD AREA: LOADER, EMPTY STATE, OR DASHBOARD -->
        <div id="workspace-panel">
          
          <!-- EMPTY STATE CARD -->
          <div id="empty-state" class="workspace-card empty-state">
            <i data-lucide="activity" class="pulse-icon"></i>
            <h3 class="state-title">Waiting for Data</h3>
            <p class="state-desc">Enter an Instagram profile URL to generate client metrics and engagement analytics.</p>
          </div>

          <!-- INLINE LOADER CARD (HIDDEN BY DEFAULT) -->
          <div id="loader-state" class="workspace-card loader-state hidden">
            <div class="loader-circle-wrapper">
              <svg class="loader-svg" viewBox="0 0 128 128">
                <!-- Background track -->
                <circle cx="64" cy="64" r="50" class="track-circle" stroke-width="8" />
                <!-- Animated progress circle -->
                <circle cx="64" cy="64" r="50" id="progress-circle" class="progress-circle" stroke-width="8" />
              </svg>
              <div class="loader-percentage-group">
                <span id="loader-pct" class="loader-pct">0%</span>
                <span class="loader-label">Analyzing</span>
              </div>
            </div>
            <div class="loader-text-group">
              <h3 id="loader-status" class="loader-status">Connecting to secure Instagram API...</h3>
              <p class="loader-subtext">Please wait, this may take a few seconds</p>
            </div>
          </div>

          <!-- DASHBOARD CONTENT PANEL (HIDDEN BY DEFAULT) -->
          <div id="dashboard-state" class="dashboard-state hidden">
            
            <!-- BRAND AUDIT DETAILS HERO PANEL -->
            <div class="hero-panel">
              <div class="profile-meta-group">
                <div class="profile-avatar">
                  <span id="profile-initials">--</span>
                </div>
                <div class="profile-info">
                  <div class="profile-name-row">
                    <h2 id="profile-handle" class="profile-handle">@username</h2>
                    <a id="profile-link" href="#" target="_blank" class="profile-link">
                      <i data-lucide="external-link"></i>
                    </a>
                  </div>
                  <div id="badge-container">
                    <span class="live-badge">
                      <i data-lucide="zap"></i>
                      Live Audit
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="hero-stats-group">
                <div class="hero-stat-card bg-indigo">
                  <span class="hero-stat-label">Audited</span>
                  <span id="stat-posts-count" class="hero-stat-value">0 Posts</span>
                </div>
                <div class="hero-stat-card bg-orange">
                  <span class="hero-stat-label">Total Likes (Audited)</span>
                  <span id="stat-total-likes" class="hero-stat-value">0</span>
                </div>
                <div class="hero-stat-card bg-pink">
                  <span class="hero-stat-label">Total Comments (Audited)</span>
                  <span id="stat-total-comments" class="hero-stat-value">0</span>
                </div>
                <div class="hero-stat-card bg-blue">
                  <span class="hero-stat-label">Total Followers</span>
                  <span id="stat-total-followers" class="hero-stat-value">0</span>
                </div>
              </div>
            </div>

            <!-- CORE METRICS CARDS GRID -->
            <div class="metrics-grid">
              <!-- KPI Card 1: Audience Authenticity -->
              <div id="kpi-authenticity-card" class="metric-card">
                <div class="metric-header">
                  <span class="metric-title">Audience Authenticity</span>
                  <div id="kpi-authenticity-icon-box" class="metric-icon-box">
                    <i data-lucide="shield-check"></i>
                  </div>
                </div>
                <div id="kpi-authenticity" class="metric-value">0%</div>
                <div class="metric-footer">Percentage of real, active followers</div>
              </div>

              <!-- KPI Card 2: Engagement Rate -->
              <div class="metric-card">
                <div class="metric-header">
                  <span class="metric-title">Engagement Rate</span>
                  <div class="metric-icon-box bg-purple">
                    <i data-lucide="activity"></i>
                  </div>
                </div>
                <div id="kpi-er" class="metric-value">0%</div>
                <div class="metric-footer">Likes + comments to followers ratio</div>
              </div>

              <!-- KPI Card 3: Posting Frequency -->
              <div class="metric-card">
                <div class="metric-header">
                  <span class="metric-title">Posting Velocity</span>
                  <div class="metric-icon-box bg-green">
                    <i data-lucide="clock"></i>
                  </div>
                </div>
                <div id="kpi-velocity" class="metric-value">0/day</div>
                <div class="metric-footer">Average posts published daily</div>
              </div>

              <!-- KPI Card 4: Inactive Followers -->
              <div class="metric-card">
                <div class="metric-header">
                  <span class="metric-title">Inactive Followers</span>
                  <div class="metric-icon-box bg-rose">
                    <i data-lucide="shield-alert"></i>
                  </div>
                </div>
                <div id="kpi-inactive" class="metric-value">0%</div>
                <div class="metric-footer text-rose">Estimated ghost/bot follower pool</div>
              </div>
            </div>
            
            <!-- FORMAT PERFORMANCE BATTLE (HIDDEN BY DEFAULT) -->
            <div id="format-battle-container" class="format-battle-card hidden">
              <div class="format-battle-header">
                <h3 class="format-battle-title">Reels vs Photos</h3>
              </div>
              <div class="format-battle-grid">
                <!-- REELS COLUMN -->
                <div class="format-column reels">
                  <div class="format-stats-summary">
                    <span class="format-label">Reels (<span id="reels-post-count">0</span> Posts)</span>
                    <span id="reels-avg-likes" class="format-avg-likes">0</span>
                    <span class="format-avg-label text-pink">Avg Likes</span>
                    <span id="reels-avg-comments" class="format-avg-comments">0 Avg Comments</span>
                  </div>
                  <div id="reels-top-posts" class="format-top-posts">
                    <!-- Injected top Reels list -->
                  </div>
                </div>
                <!-- STATIC COLUMN -->
                <div class="format-column static">
                  <div class="format-stats-summary">
                    <span class="format-label">Static (<span id="static-post-count">0</span> Posts)</span>
                    <span id="static-avg-likes" class="format-avg-likes">0</span>
                    <span class="format-avg-label text-blue">Avg Likes</span>
                    <span id="static-avg-comments" class="format-avg-comments">0 Avg Comments</span>
                  </div>
                  <div id="static-top-posts" class="format-top-posts">
                    <!-- Injected top Static list -->
                  </div>
                </div>
              </div>
            </div>

            <!-- CHARTS GRAPHICS WRAPPER -->
            <div class="charts-section">
              
              <!-- BENCHMARK & TIMELINE GRID -->
              <div class="benchmark-timeline-grid">
                
                <!-- BENCHMARK VS NICHE CARD (HIDDEN BY DEFAULT) -->
                <div id="niche-benchmark-card" class="benchmark-card hidden">
                  <div class="benchmark-header">
                    <h3 class="benchmark-title">
                      <i data-lucide="activity" class="benchmark-icon"></i>
                      Benchmark vs Niche
                    </h3>
                    <span id="benchmark-tier-label" class="benchmark-tier-badge">Micro</span>
                  </div>
                  
                  <div class="benchmark-body">
                    <!-- Relative Gauge Track -->
                    <div class="gauge-track-container">
                      <div class="gauge-track">
                        <!-- Center anchor line -->
                        <div class="gauge-center-anchor"></div>
                        <div class="gauge-center-label">Avg (<span id="benchmark-target-baseline">0</span>%)</div>
                        
                        <!-- Floating pin indicator -->
                        <div id="gauge-pin" class="gauge-pin bg-emerald"></div>
                      </div>
                    </div>
                    
                    <div class="benchmark-footer-metrics">
                      <span class="benchmark-score-text">
                        Performance Index: <span id="benchmark-performance-index" class="font-black">0%</span>
                      </span>
                      <span id="benchmark-status-badge" class="benchmark-status-badge">🚀 Above Average</span>
                    </div>
                    
                    <!-- Calculation Formula -->
                    <div class="benchmark-formula-box">
                      <div class="formula-title">Formula: (Actual Engagement Rate / Target Baseline) × 100</div>
                      <div class="formula-values">
                        <span><strong>Actual:</strong> <span id="benchmark-actual-er">0</span>% (Profile's real rate)</span>
                        <span class="formula-dot">•</span>
                        <span><strong>Baseline:</strong> <span id="benchmark-baseline-er">0</span>% (Expected standard for this tier)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- AUDIENCE GROWTH TIMELINE -->
                <div class="chart-card">
                  <h3 class="chart-title">
                    <i data-lucide="trending-up" class="timeline-icon"></i>
                    Audience Growth Timeline
                  </h3>
                  <div class="chart-container">
                    <canvas id="trend-chart"></canvas>
                    <div id="trend-chart-placeholder" class="chart-placeholder hidden animate-in fade-in">
                      <span class="placeholder-emoji">📈</span>
                      <p class="placeholder-title">Establishing your growth baseline...</p>
                      <p class="placeholder-desc">Search this profile again tomorrow to plot the velocity trend curve automatically!</p>
                    </div>
                  </div>
                </div>

              </div>

              <div class="chart-grid-two">
                <div class="chart-card">
                  <h3 class="chart-title">Reels Views Distribution</h3>
                  <div class="chart-container">
                    <canvas id="reels-chart"></canvas>
                    <div id="reels-chart-placeholder" class="chart-placeholder hidden animate-in fade-in">
                      <span class="placeholder-emoji">🎬</span>
                      <p class="placeholder-title">No Reels Detected</p>
                      <p class="placeholder-desc">No Reels were found in the 15 audited posts for this profile.</p>
                    </div>
                  </div>
                </div>
                <div class="chart-card">
                  <h3 class="chart-title">Reach Performance Distribution</h3>
                  <div class="chart-container">
                    <canvas id="reach-chart"></canvas>
                    <div id="reach-chart-placeholder" class="chart-placeholder hidden animate-in fade-in">
                      <span class="placeholder-emoji">🔍</span>
                      <p class="placeholder-title">No Video Content Detected</p>
                      <p class="placeholder-desc">No video or short-form Reels were found in the 15 audited posts for this profile.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- MEDIAN & AVERAGE METRICS ROW -->
            <div class="median-metrics-grid">
              <div class="median-metric-card">
                <span id="median-likes-value" class="median-metric-value">0</span>
                <span class="median-metric-label text-indigo">Median Likes</span>
                <span class="median-metric-desc">Core baseline performance metric.</span>
              </div>
              <div class="median-metric-card">
                <span id="median-comments-value" class="median-metric-value">0</span>
                <span class="median-metric-label text-rose">Median Comments</span>
                <span class="median-metric-desc">Baseline community engagement depth.</span>
              </div>
              <div class="median-metric-card">
                <span id="average-likes-value" class="median-metric-value">0</span>
                <span class="median-metric-label text-teal">Average Likes</span>
                <span class="median-metric-desc">Overall profile reach metric across sample.</span>
              </div>
              <div class="median-metric-card position-relative">
                <div class="median-metric-header">
                  <span class="median-metric-label text-amber">Day With Most Posts</span>
                  <i data-lucide="activity" class="metric-icon-small"></i>
                </div>
                <span id="most-active-day-value" class="median-metric-value mt-3">N/A</span>
              </div>
            </div>

            <!-- BEST VS WORST POSTS STACKED ROW -->
            <div class="best-worst-container">
              <div class="best-worst-row bg-emerald-light">
                <div class="best-worst-meta">
                  <span class="best-worst-badge bg-emerald">Peak Content</span>
                  <span id="best-post-stats" class="best-worst-text">0 Likes · 0 Comments</span>
                </div>
                <a id="best-post-link" href="#" target="_blank" class="best-worst-link truncate">No URL available</a>
              </div>
              <div class="best-worst-row bg-orange-light">
                <div class="best-worst-meta">
                  <span class="best-worst-badge bg-orange">Lowest Traction</span>
                  <span id="worst-post-stats" class="best-worst-text">0 Likes · 0 Comments</span>
                </div>
                <a id="worst-post-link" href="#" target="_blank" class="best-worst-link truncate">No URL available</a>
              </div>
            </div>

            <!-- TWO-COLUMN AUDITED CONTENT FEED & DIAGNOSTIC VIEWER -->
            <div class="feed-section-wrapper">
              
              <!-- LEFT FEED PANEL -->
              <div class="feed-panel-card">
                <div class="feed-header-border">
                  <h3 class="feed-panel-title">
                    <i data-lucide="award" class="feed-title-icon"></i>
                    Audited Content Feed
                  </h3>
                  <p class="feed-panel-desc">Sorted descending by Likes performance</p>
                </div>
                <!-- Scrolling List -->
                <div id="audited-posts-feed" class="feed-list-container custom-scrollbar">
                  <!-- Dynamic items -->
                </div>
              </div>

              <!-- RIGHT AUDIT DEEP-DIVE VIEWER -->
              <div class="viewer-panel-card">
                <div id="post-deep-dive-viewer" class="viewer-container">
                  <!-- Dynamic details -->
                  <div class="viewer-empty-state">
                    <i data-lucide="sparkles" class="empty-sparkles-icon"></i>
                    <h4 class="empty-viewer-title">No Post Selected</h4>
                    <p class="empty-viewer-desc">Select an item in the feed to evaluate its AI diagnostic brief.</p>
                  </div>
                </div>
              </div>

            </div>

            <!-- HASHTAG INTELLIGENCE PANEL -->
            <div class="hashtag-section">
              <div class="hashtag-header-row">
                <h2 class="hashtag-section-title">
                  <i data-lucide="hash"></i>
                  Hashtag Strategy Intelligence
                </h2>
              </div>

              <!-- ROW 1: Matrix, Quartiles, and AI Strategy -->
              <div class="hashtag-row-1">
                
                <!-- Card 1: Distribution Matrix -->
                <div class="hashtag-card flex-col">
                  <div class="hashtag-card-header">
                    <div>
                      <h3 class="panel-subtitle">🔮 Hashtag Distribution Matrix</h3>
                      <p class="panel-subdesc">Usage ratios across audited posts</p>
                    </div>
                    <span class="live-badge">LIVE</span>
                  </div>
                  <div class="table-scroll-container">
                    <table class="hashtag-matrix-table">
                      <thead>
                        <tr>
                          <th>Hashtag</th>
                          <th class="text-right">Usage Ratio</th>
                        </tr>
                      </thead>
                      <tbody id="hashtag-matrix-body">
                        <!-- Dynamically filled -->
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Card 2: Engagement Quartiles -->
                <div class="hashtag-card flex-col">
                  <div class="hashtag-card-header">
                    <div>
                      <h3 class="panel-subtitle">📈 Engagement Performance Quartiles</h3>
                      <p class="panel-subdesc">Tags classified by historical engagement thresholds.</p>
                    </div>
                  </div>
                  <div class="quartiles-body">
                    <!-- High Engagement -->
                    <div class="quartile-box bg-emerald">
                      <div class="quartile-header">
                        <span id="q75-label" class="q-badge bg-emerald-badge">Top 25% (≥ 0 Eng)</span>
                        <span id="q75-count" class="q-count text-emerald">0 Tags</span>
                      </div>
                      <div id="high-engagement-tags-list" class="tag-badge-list">
                        <!-- Injected -->
                      </div>
                    </div>
                    <!-- Low Engagement -->
                    <div class="quartile-box bg-rose">
                      <div class="quartile-header">
                        <span id="q25-label" class="q-badge bg-rose-badge">Bottom 25% (≤ 0 Eng)</span>
                        <span id="q25-count" class="q-count text-rose">0 Tags</span>
                      </div>
                      <div id="low-engagement-tags-list" class="tag-badge-list">
                        <!-- Injected -->
                      </div>
                    </div>
                    <p class="quartiles-note">* Ratio tags represent (high-performing posts) / (total posts using the tag).</p>
                  </div>
                </div>

                <!-- Card 3: AI Strategy -->
                <div class="hashtag-card flex-col border-indigo">
                  <div class="hashtag-card-header">
                    <div>
                      <h3 class="panel-subtitle text-indigo flex-center gap-1">
                        <i data-lucide="sparkles" class="text-indigo animate-pulse"></i>
                        Gemini AI Hashtag Strategy
                      </h3>
                      <p class="panel-subdesc">Key performance analysis & growth points</p>
                    </div>
                    <button id="copy-strategy-btn" class="copy-btn">
                      <i data-lucide="copy" class="btn-icon-small"></i>
                      <span>Copy Strategy</span>
                    </button>
                  </div>
                  <div class="markdown-scroll-container">
                    <div id="hashtag-ai-markdown" class="markdown-content">
                      <!-- Dynamic Markdown Injected Here -->
                    </div>
                  </div>
                </div>

              </div>

              <!-- ROW 2: Kill List and Try These Recommendations -->
              <div class="hashtag-row-2">
                
                <!-- Column 1: Kill-List -->
                <div class="hashtag-card flex-col border-rose-accent">
                  <div class="hashtag-card-header border-b">
                    <div>
                      <h3 class="panel-subtitle text-rose-accent flex-center gap-1">
                        <i data-lucide="alert-circle" class="text-rose-accent animate-pulse"></i>
                        Algorithmic Friction Warnings (Kill-List)
                      </h3>
                      <p class="panel-subdesc">High-priority reach suppression risk tags to drop immediately.</p>
                    </div>
                  </div>
                  <div id="kill-list-container" class="kill-list-scroll-container">
                    <!-- Injected -->
                  </div>
                  <div class="card-footer">
                    Purge anchors to prevent automated shadowbans or reach choking.
                  </div>
                </div>

                <!-- Column 2: Try These Suggestions -->
                <div class="hashtag-card flex-col border-indigo-accent">
                  <div class="hashtag-card-header border-b">
                    <div>
                      <h3 class="panel-subtitle text-indigo-accent flex-center gap-1">
                        <i data-lucide="sparkles" class="text-indigo-accent animate-pulse"></i>
                        Missing High-Volume Targets (Try These)
                      </h3>
                      <p class="panel-subdesc">Tap to copy niche recommendations.</p>
                    </div>
                  </div>
                  <div id="try-these-container" class="try-these-scroll-container">
                    <!-- Injected -->
                  </div>
                  <div class="card-footer">
                    Confirmations feature automated inline check animations.
                  </div>
                </div>

              </div>

            </div>

            <!-- RIVAL COMPETITOR ANALYSIS SECTION -->
            <div id="competitor-anchor">
              <!-- Competitor Analysis rendered here dynamically -->
            </div>

          </div>

        </div>

      </main>
    </div>
  </div>
</div>

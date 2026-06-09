<?php
/**
 * Template for the Instagram Audit Tool Dashboard
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>
<!-- Note: style.css and app.js are automatically enqueued by the main plugin file -->
<div class="app">

  <!-- ════════════════ SIDEBAR ════════════════ -->
  <aside class="sidebar">
    <div class="sb-head">
      <span class="eyebrow">Audit History</span>
    </div>
    <div class="sb-scroll" id="history-list">
      <!-- Historical accounts dynamically loaded here -->
    </div>
    <div class="sb-brand">
      <div class="logo">
        <div class="sb-mark">A</div>
        <div>
          <div class="sb-name">AURA Audit</div>
        </div>
      </div>
      <div class="sb-ver">Made by BloomX</div>
    </div>
  </aside>

  <!-- ════════════════ MAIN ════════════════ -->
  <div class="main">

    <!-- ── Topbar ── -->
    <header class="topbar">
      <div class="tb-inner">
        <div class="tb-title">
          <h1>See How an Instagram Account Is Really Doing</h1>
          <p>Paste any profile link — we'll show what's working, what's not, and what to try next.</p>
        </div>
        <div style="display:flex;align-items:center;gap:12px;width:100%;">
          <form id="search-form" class="auditor" style="flex:1">
            <label class="url-field">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.5 1.4"/>
                <path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.5-1.4"/>
              </svg>
              <input type="text" id="profile-url" placeholder="https://www.instagram.com/username" spellcheck="false" aria-label="Instagram URL" required />
            </label>
            <button type="submit" class="btn btn-cta" id="submit-btn">Check This Account</button>
          </form>
          <!-- refresh button -->
          <button class="btn btn-ghost" title="Refresh Page" style="padding: 10px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-left: 8px;" onclick="location.reload()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- ── Content ── -->
    <div class="content">
      
      <!-- ERROR MESSAGE PANEL (HIDDEN BY DEFAULT) -->
      <div id="error-panel" class="error-panel hidden">
        <svg class="error-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div class="error-content">
          <span class="error-title">Audit Error</span>
          <p id="error-message" class="error-text"></p>
        </div>
        <button class="btn btn-ghost" onclick="hideError()" style="margin-left: auto; padding: 2px 8px; font-size: 11px;">Dismiss</button>
      </div>

      <!-- Welcome / Empty State -->
      <div id="empty-state" class="empty-state">
        <div class="empty-state-inner">
          <div class="pulse-icon-box">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <h2 class="state-title">AURA Growth Analytics</h2>
          <p class="state-desc">Paste any Instagram profile URL or handle link in the search bar above to instantly compute strict engagement rates, bot distributions, hashtag efficiency metrics, and competitor stats.</p>
        </div>
      </div>

      <!-- Inline Progress Loader -->
      <div id="loader-state" class="loader-state hidden">
        <div class="loader-circle-wrapper">
          <svg class="loader-svg" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="50" class="track-circle" stroke-width="6" fill="none"/>
            <circle cx="64" cy="64" r="50" id="progress-circle" class="progress-circle" stroke-width="6" fill="none" transform="rotate(-90 64 64)"/>
          </svg>
          <div class="loader-percentage-group">
            <span id="loader-pct" class="loader-pct">0%</span>
          </div>
        </div>
        <div class="loader-text-group">
          <h3 id="loader-status" class="loader-status">Connecting to secure Instagram API...</h3>
          <p class="loader-subtext">Compiling profile metadata & post statistics. Please do not close this window.</p>
        </div>
      </div>

      <!-- Main Diagnostics Dashboard -->
      <div class="wrap hidden" id="dashboard-state">

        <!-- Profile strip -->
        <div class="profile-strip">
          <div class="ps-av" id="profile-initials">--</div>
          <div class="ps-handle">
            <a id="profile-link" href="#" target="_blank" style="display: inline-flex; align-items: center; gap: 8px;">
              <span id="profile-handle">@username</span>
              <span class="post-link-btn" style="margin-left: 0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </span>
            </a>
          </div>
          <div class="ps-spacer" style="flex: 1;"></div>
          <div class="ps-div"></div>
          <div class="ps-stat">
            <div class="k">Posts Looked At</div>
            <div class="v" id="stat-posts-count">0</div>
          </div>
          <div class="ps-div"></div>
          <div class="ps-stat">
            <div class="k">Total Likes</div>
            <div class="v" id="stat-total-likes">0</div>
          </div>
          <div class="ps-div"></div>
          <div class="ps-stat">
            <div class="k">Total Comments</div>
            <div class="v" id="stat-total-comments">0</div>
          </div>
          <div class="ps-div"></div>
          <div class="ps-stat">
            <div class="k">Total Followers</div>
            <div class="v" id="stat-total-followers">0</div>
          </div>
        </div>

        <!-- ── 4 metric cards ── -->
        <div class="grid g4">

          <div class="card metric good" id="kpi-er-card">
            <div class="metric-top">
              <span class="label">How Much People Interact</span>
            </div>
            <div class="big"><span class="cu" id="kpi-er" data-val="0">0</span><span class="u">%</span></div>
            <div class="desc">Engagement Rate</div>
          </div>

          <div class="card metric warnv" id="kpi-inactive-card">
            <div class="metric-top">
              <span class="label">Followers That Look Fake</span>
            </div>
            <div class="big"><span class="cu" id="kpi-inactive" data-val="0">0</span><span class="u">%</span></div>
            <div class="desc">These accounts seem to be bots or people who never log in.</div>
          </div>

          <div class="card metric pos" id="kpi-authenticity-card">
            <div class="metric-top">
              <span class="label">Followers That Look Real</span>
            </div>
            <div class="big"><span class="cu" id="kpi-authenticity" data-val="0">0</span><span class="u">%</span></div>
            <div class="desc">Real, active people who actually see and react to posts.</div>
          </div>

          <div class="card metric" id="kpi-velocity-card">
            <div class="metric-top">
              <span class="label">How Often They Post</span>
            </div>
            <div class="big"><span class="cu" id="kpi-velocity" data-val="0">0</span><span class="u">/day</span></div>
            <div class="desc">The average count of posts published to this feed per day.</div>
          </div>

        </div>

        <!-- ── Videos vs Photos ── -->
        <div class="card" id="format-battle-container">
          <div class="card-h">
            <div class="t"><span class="ico">⚔</span> Reels vs Photos</div>
          </div>
          <div class="battle">

            <div class="battle-side left">
              <div class="bs-header">
                <span class="bs-label" id="reels-header-label">Reels (Videos)</span>
              </div>
              <div class="bs-num"><span id="reels-avg-likes" class="cu" data-val="0">0</span></div>
              <div class="bs-sub">Average likes per post</div>
              <div class="bs-meta" id="reels-avg-comments">0 comments each, on average</div>
              <div class="post-list" id="reels-top-posts">
                <!-- Reels post list -->
              </div>
            </div>

            <div class="vs-col">
              <div class="vs-badge">VS</div>
            </div>

            <div class="battle-side right">
              <div class="bs-header">
                <span class="bs-label" id="static-header-label">Photos</span>
              </div>
              <div class="bs-num"><span id="static-avg-likes" class="cu" data-val="0">0</span></div>
              <div class="bs-sub">Average likes per post</div>
              <div class="bs-meta" id="static-avg-comments">0 comments each, on average</div>
              <div class="post-list" id="static-top-posts">
                <!-- Static post list -->
              </div>
            </div>

          </div>
        </div>

        <!-- ── Benchmark + Growth ── -->
        <div class="grid g2">

          <!-- Benchmark -->
          <div class="card" id="niche-benchmark-card">
            <div class="card-h">
              <div class="t"><span class="ico">◎</span> Engagement Benchmarks</div>
              <span id="benchmark-tier-label" class="pill">N/A</span>
            </div>

            <div class="bench-verdict">
              <div class="bench-verdict-row">
                <span id="benchmark-status-badge" class="bench-label">High</span>
                <span id="benchmark-performance-index" class="bench-index">0% of the typical rate for their size</span>
              </div>
              <p class="bench-desc" id="benchmark-desc">This account's posts get more engagement than most creators of a similar size.</p>
            </div>

            <div class="bands-wrap">
              <div class="bands-track">
                <div class="band-marker" id="gauge-pin" style="left:50%">
                  <span class="band-marker-tag">This account</span>
                  <span class="band-marker-stem"></span>
                  <span class="band-marker-dot"></span>
                </div>
                <div class="bands-bar">
                  <div class="band-seg" style="background:var(--neg)"></div>
                  <div class="band-seg" style="background:var(--warn)"></div>
                  <div class="band-seg" style="background:var(--accent)"></div>
                  <div class="band-seg" style="background:var(--pos)"></div>
                </div>
              </div>
              <div class="bands-labels">
                <span class="band-lbl">Low</span>
                <span class="band-lbl">Average</span>
                <span class="band-lbl active">High</span>
                <span class="band-lbl">Exceptional</span>
              </div>
            </div>

            <div class="bench-compare">
              <div class="bc-cell">
                <div class="bc-k">This account</div>
                <div class="bc-v" id="benchmark-actual-er" style="color:var(--accent)">0%</div>
              </div>
              <div class="bc-sep">vs</div>
              <div class="bc-cell">
                <div class="bc-k">Typical for their size</div>
                <div class="bc-v" id="benchmark-baseline-er">0%</div>
              </div>
            </div>
          </div>

          <!-- Growth chart -->
          <div class="card">
            <div class="card-h">
              <div class="t"><span class="ico">📈</span> Followers Over Time</div>
              <span class="pill" style="font-size:9px">TREND</span>
            </div>
            <div class="chart">
              <div id="chart-growth"></div>
              <div class="axis-x" id="growth-axis-x">
                <span></span><span></span><span></span><span></span>
              </div>
            </div>
          </div>

        </div>

        <!-- ── Reels Views + Posts Reach ── -->
        <div class="grid g2">
          <div class="card">
            <div class="card-h">
              <div class="t"><span class="ico">📈</span> How Many People Watched the Reels</div>
              <span class="pill" style="font-size:9px">VIEWS</span>
            </div>
            <div class="chart">
              <div id="chart-reels"></div>
              <div class="axis-x" id="reels-axis-x">
                <span></span><span></span><span></span><span></span>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-h">
              <div class="t"><span class="ico">📈</span> How Many People Saw the Posts</div>
              <span class="pill" style="font-size:9px">REACHED</span>
            </div>
            <div class="chart">
              <div id="chart-reach"></div>
              <div class="axis-x" id="reach-axis-x">
                <span></span><span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Stats row ── -->
        <div class="grid g4">
          <div class="card statline">
            <div class="v"><span class="cu" id="median-likes-value" data-val="0">0</span></div>
            <div class="k">Median Likes</div>
            <div class="d">A normal post lands around here.</div>
          </div>
          <div class="card statline">
            <div class="v"><span class="cu" id="median-comments-value" data-val="0">0</span></div>
            <div class="k">Median Comments</div>
            <div class="d">How many people usually comment.</div>
          </div>
          <div class="card statline">
            <div class="v"><span class="cu" id="average-likes-value" data-val="0">0</span></div>
            <div class="k">Average Likes per Post</div>
            <div class="d">A few big posts pull this number up.</div>
          </div>
          <div class="card statline">
            <div class="k">Busiest Posting Day</div>
            <div class="v" id="most-active-day-value">--</div>
            <div class="d">The day of the week they post most often.</div>
          </div>
        </div>

        <!-- ── Peak / low ── -->
        <div class="grid g2">
          <div class="linkrow peak" id="best-post-row">
            <div style="width:64px; height:64px; border-radius:6px; overflow:hidden; flex-shrink:0; margin-right:12px; background:#1f2937;">
              <img id="best-post-thumbnail" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" style="width:100%; height:100%; object-fit:cover;" alt="Best Post Thumbnail" />
            </div>
            <div class="lr-lab">
              <div class="t">Their Best Post</div>
              <div class="u" id="best-post-link">Loading...</div>
            </div>
            <div class="lr-stat" id="best-post-stats">0 likes · 0 comments</div>
          </div>
          <div class="linkrow low" id="worst-post-row">
            <div style="width:64px; height:64px; border-radius:6px; overflow:hidden; flex-shrink:0; margin-right:12px; background:#1f2937;">
              <img id="worst-post-thumbnail" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" style="width:100%; height:100%; object-fit:cover;" alt="Worst Post Thumbnail" />
            </div>
            <div class="lr-lab">
              <div class="t">Their Weakest Post</div>
              <div class="u" id="worst-post-link">Loading...</div>
            </div>
            <div class="lr-stat" id="worst-post-stats">0 likes · 0 comments</div>
          </div>
        </div>

        <!-- ── Section: posts ── -->
        <div class="sec-head">
          <span class="n"><span class="ic">◳</span> A Closer Look at Their Posts</span>
          <span class="line"></span>
          <p>Which posts did well, and why</p>
        </div>

        <!-- Feed + Diagnostic -->
        <div class="grid g2">

          <!-- Feed list -->
          <div class="card" id="feed-card">
            <div class="card-h">
              <div class="t"><span class="ico">▤</span> Their Posts, Best to Worst</div>
              <span class="pill" style="font-size:9px">By Likes</span>
            </div>
            <div class="feed" id="feed">
              <!-- Dynamically loaded post feed items -->
            </div>
          </div>

          <!-- Diagnostic Viewer -->
          <div class="card" id="post-deep-dive-viewer">
            <!-- Dynamically loaded details/empty selected states -->
          </div>

        </div>

        <!-- ── Section: hashtags ── -->
        <div class="sec-head">
          <span class="n"><span class="ic">#</span> Hashtag Tips</span>
          <span class="line"></span>
          <p>What to keep, drop, and try</p>
        </div>

        <!-- Hashtag matrix -->
        <div class="card">
          <div class="card-h">
            <div class="t"><span class="ico">#</span> Which Hashtags They Use Most</div>
            <span class="pill dot win" style="font-size:9px">Live</span>
          </div>
          <div class="card-sub">How often each tag showed up across their last 15 posts.</div>
          <div id="hashtag-matrix-container">
            <!-- Dynamic hashtag distribution matrix -->
          </div>
        </div>

        <!-- Quartiles -->
        <div class="card">
          <div class="card-h">
            <div class="t"><span class="ico">▦</span> Hashtags That Help vs. Hashtags That Don't</div>
          </div>
          <div class="card-sub">Tags grouped by how well the posts using them did.</div>
          <div class="grid g2">
            <div class="quart top">
              <div class="quart-head">
                <span class="lab" id="q75-label">Best performers · avg 0 likes</span>
                <span class="cnt" id="q75-count">0 tags</span>
              </div>
              <div class="chips" id="high-engagement-tags-list">
                <!-- High engagement hashtag chips -->
              </div>
            </div>
            <div class="quart bot">
              <div class="quart-head">
                <span class="lab" id="q25-label">Weakest performers · avg 0 likes</span>
                <span class="cnt" id="q25-count">0 tags</span>
              </div>
              <div class="chips" id="low-engagement-tags-list">
                <!-- Low engagement hashtag chips -->
              </div>
            </div>
          </div>
          <div class="foot">"Best performers" are the tags that showed up on their most-liked posts.</div>
        </div>

        <!-- Strategy -->
        <div class="card" id="hashtag-strategy-card">
          <div class="card-h">
            <div class="t"><span class="ico">✦</span> What We'd Suggest for Hashtags</div>
            <button class="btn btn-ghost" id="copy-strategy-btn">⧉ Copy Tips</button>
          </div>
          <div class="card-sub">A quick read on what's working and what to change.</div>
          <div class="markdown-content" id="hashtag-ai-markdown" style="padding: 10px 0; line-height: 1.6; font-size: 14px;">
            <!-- Dynamic AI suggestions text -->
          </div>
        </div>

        <!-- Kill list + Targets -->
        <div class="grid g2">

          <div class="card">
            <div class="card-h">
              <div class="t"><span class="ico" style="color:var(--neg)">⚠</span> Hashtags To Drop</div>
              <span class="pill" style="color:var(--neg);border-color:color-mix(in oklab,var(--neg) 35%,transparent)">Stop Using</span>
            </div>
            <div class="card-sub">These tags aren't helping posts get seen. Better to skip them.</div>
            <div class="kill-list" id="kill-list-container">
              <!-- Dynamic kill tags list -->
            </div>
            <div class="foot">Cutting these can help future posts reach more people.</div>
          </div>

          <div class="card">
            <div class="card-h">
              <div class="t"><span class="ico">▷</span> New Hashtags To Try</div>
              <span class="pill win" style="font-size:9px">Worth a Shot</span>
            </div>
            <div class="card-sub">Popular tags they're not using yet. Tap one to copy it.</div>
            <div class="kill-list" id="try-these-container">
              <!-- Dynamic try suggestions tags list -->
            </div>
            <div class="foot">The percentage is a rough estimate of the extra reach these could bring.</div>
          </div>

        </div>

        <!-- ── Section: competitors ── -->
        <div class="sec-head">
          <span class="n"><span class="ic">🏆</span> How Big Accounts Compare</span>
          <span class="line"></span>
          <p>A look at five well-known profiles</p>
        </div>

        <!-- Competitor cards anchor -->
        <div class="grid g2" id="competitor-anchor">
          <!-- Dynamic competitor items loaded here -->
        </div>

      </div><!-- /wrap -->
    </div><!-- /content -->
  </div><!-- /main -->
</div><!-- /app -->

<div class="toast" id="toast"></div>


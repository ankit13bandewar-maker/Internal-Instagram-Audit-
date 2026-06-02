import React from 'react';
import { ExternalLink, Users, Activity, Clock, ShieldAlert, Trophy } from 'lucide-react';

interface CompetitorMetrics {
  competitor_name: string;
  rank: number;
  follower_count: number;
  metrics: {
    engagement_rate: number;
    inactive_follower_percentage: number;
    posting_frequency_weekly: number;
    best_post: { likes: number; comments: number; url: string };
    worst_post: { likes: number; comments: number; url: string };
  };
}

interface CompetitorSectionProps {
  competitorData: CompetitorMetrics[];
}

export default function CompetitorSection({ competitorData }: CompetitorSectionProps) {
  if (!competitorData || competitorData.length === 0) return null;

  return (
    <section className="w-full mt-12 space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-indigo-950 flex items-center gap-2 tracking-tight">
          <Trophy className="w-6 h-6 text-indigo-500" />
          Competitor Analysis
        </h2>
        <p className="text-sm font-medium text-zinc-500">Live evaluation of top 5 industry rivals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {competitorData.map((comp) => (
          <div key={comp.competitor_name} className="flex flex-col bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="p-4 bg-zinc-50/50 border-b border-zinc-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 shrink-0 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                  #{comp.rank}
                </span>
                <span className="font-bold text-zinc-800 text-sm truncate">{comp.competitor_name}</span>
              </div>
              <a href={`https://instagram.com/${comp.competitor_name.replace('@', '')}`} target="_blank" rel="noreferrer" className="shrink-0 text-zinc-400 hover:text-indigo-500 transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Core Metrics */}
            <div className="p-4 space-y-4">
              {/* Engagement Rate */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Strict ER</span>
                  <span className="text-sm font-black text-indigo-600">{comp.metrics?.engagement_rate ?? 0}%</span>
                </div>
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min((comp.metrics?.engagement_rate ?? 0) * 10, 100)}%` }} />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase">Followers</span>
                  </div>
                  <div className="text-sm font-black text-zinc-800">{comp.follower_count.toLocaleString()}</div>
                </div>
                <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase">Velocity</span>
                  </div>
                  <div className="text-sm font-black text-zinc-800">{comp.metrics?.posting_frequency_weekly ?? 0} <span className="text-[10px] font-medium">/wk</span></div>
                </div>
              </div>

              {/* Ghost Followers */}
              <div className="flex items-center justify-between p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                <div className="flex items-center gap-1.5 text-rose-600">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase">Inactive Followers</span>
                </div>
                <span className="text-xs font-black text-rose-700">{comp.metrics?.inactive_follower_percentage ?? 0}%</span>
              </div>

              {/* Post Highlights */}
              <div className="pt-3 border-t border-zinc-100 grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Best Post</span>
                  <a href={comp.metrics?.best_post?.url || '#'} target="_blank" rel="noreferrer" className="block p-2 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100 text-center relative group">
                    <ExternalLink className="w-3 h-3 text-emerald-600/50 absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="block text-xs font-black text-emerald-700">{((comp.metrics?.best_post?.likes ?? 0) + (comp.metrics?.best_post?.comments ?? 0)).toLocaleString()}</span>
                    <span className="flex items-center justify-center gap-1 text-[9px] font-semibold text-emerald-600 uppercase mt-0.5">
                      Interactions
                    </span>
                  </a>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Worst Post</span>
                  <a href={comp.metrics?.worst_post?.url || '#'} target="_blank" rel="noreferrer" className="block p-2 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors border border-zinc-200 text-center relative group">
                    <ExternalLink className="w-3 h-3 text-zinc-400 absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="block text-xs font-black text-zinc-700">{((comp.metrics?.worst_post?.likes ?? 0) + (comp.metrics?.worst_post?.comments ?? 0)).toLocaleString()}</span>
                    <span className="flex items-center justify-center gap-1 text-[9px] font-semibold text-zinc-500 uppercase mt-0.5">
                      Interactions
                    </span>
                  </a>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

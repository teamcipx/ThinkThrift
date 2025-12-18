import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { UserAccount } from '../types';
import { Users, Activity, TrendingUp, AlertTriangle, Star, Globe } from 'lucide-react';

interface DashboardProps {
  data: UserAccount[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  
  // Memoized stats calculation
  const stats = useMemo(() => {
    const totalUsers = data.length;
    const avgEngagement = totalUsers ? (data.reduce((acc, curr) => acc + curr.engagementRate, 0) / totalUsers).toFixed(2) : '0';
    const totalFollowersRaw = data.reduce((acc, curr) => acc + curr.followers, 0);
    const totalFollowers = totalFollowersRaw > 1000000 
        ? (totalFollowersRaw / 1000000).toFixed(1) + 'M' 
        : (totalFollowersRaw / 1000).toFixed(1) + 'K';
    const suspended = data.filter(u => u.status === 'Suspended').length;
    const favorites = data.filter(u => u.isFavorite).length;

    return { totalUsers, avgEngagement, totalFollowers, suspended, favorites };
  }, [data]);

  // Chart Data Preparation
  const platformData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(d => { counts[d.platform] = (counts[d.platform] || 0) + 1; });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [data]);

  const countryData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(d => { 
        if(d.country) counts[d.country] = (counts[d.country] || 0) + 1; 
    });
    // Top 5 countries
    return Object.keys(counts)
        .map(key => ({ name: key, value: counts[key] }))
        .sort((a,b) => b.value - a.value)
        .slice(0, 5);
  }, [data]);

  const engagementTrendData = useMemo(() => {
    // Simulating trend data based on sorting by engagement rate to create a "curve"
    // In a real app, this would be historical snapshots
    return data
        .slice(0, 20) // Take sample
        .sort((a,b) => a.engagementRate - b.engagementRate)
        .map((u, i) => ({
            name: `Day ${i+1}`,
            engagement: u.engagementRate,
            followers: u.followers / 10000 // Scaled down for visualization
        }));
  }, [data]);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${color.replace('text-', 'bg-')}`}></div>
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
        <StatCard title="Total Accounts" value={stats.totalUsers} icon={Users} color="text-indigo-500" />
        <StatCard title="Avg Engagement" value={`${stats.avgEngagement}%`} icon={Activity} color="text-emerald-500" />
        <StatCard title="Total Reach" value={stats.totalFollowers} icon={TrendingUp} color="text-blue-500" />
        <StatCard title="Favorites" value={stats.favorites} icon={Star} color="text-yellow-500" />
        <StatCard title="Suspended" value={stats.suspended} icon={AlertTriangle} color="text-red-500" />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Trend (Area Chart) - Spans 2 cols */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-6">Engagement Trends (Last 30 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementTrendData}>
                <defs>
                  <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="engagement" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorEng)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Distribution (Pie Chart) - Spans 1 col */}
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-6">Platform Share</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
              {platformData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="truncate">{entry.name} ({entry.value})</span>
                  </div>
              ))}
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geographic Distribution */}
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Top Countries</h3>
                <Globe className="w-5 h-5 text-slate-500" />
            </div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={80} />
                    <Tooltip 
                        cursor={{fill: '#334155', opacity: 0.2}}
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Top Engagement Table */}
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-sm overflow-hidden">
             <h3 className="text-lg font-semibold text-white mb-4">Top Performers</h3>
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-slate-400">
                     <thead className="text-xs uppercase bg-slate-700/50 text-slate-300">
                         <tr>
                             <th className="px-4 py-3 rounded-l-lg">User</th>
                             <th className="px-4 py-3">Platform</th>
                             <th className="px-4 py-3 text-right rounded-r-lg">Engagement</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-700">
                        {data.slice(0, 5).sort((a,b) => b.engagementRate - a.engagementRate).map((user) => (
                            <tr key={user.id} className="hover:bg-slate-700/30">
                                <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                                    <img src={user.avatar} className="w-6 h-6 rounded-full" />
                                    {user.username}
                                </td>
                                <td className="px-4 py-3">{user.platform}</td>
                                <td className="px-4 py-3 text-right text-emerald-400 font-bold">{user.engagementRate}%</td>
                            </tr>
                        ))}
                     </tbody>
                 </table>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
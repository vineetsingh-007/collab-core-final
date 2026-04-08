import { useEffect, useState } from 'react';
import { FolderKanban, CheckSquare, Clock, Users, ArrowRight, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { useAnimatedCounter } from '@/hooks/use-animated-counter';
import DashboardLayout from '@/components/DashboardLayout';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ label, value, icon: Icon, gradient, delay }: { label: string; value: number; icon: any; gradient: string; delay: number }) => {
  const animatedValue = useAnimatedCounter(value);
  return (
    <div
      className="group relative p-6 rounded-2xl border border-border/50 bg-card shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04] rounded-full -translate-y-8 translate-x-8">
        <div className={`w-full h-full rounded-full ${gradient}`} />
      </div>
      <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center mb-4 shadow-soft transition-transform duration-300 group-hover:scale-110`}>
        <Icon className="w-6 h-6 text-primary-foreground" />
      </div>
      <p className="text-3xl font-bold tracking-tight">{animatedValue}</p>
      <p className="text-sm text-muted-foreground mt-1 font-medium">{label}</p>
    </div>
  );
};

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ projects: 0, done: 0, pending: 0, users: 0 });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [projects, tasks, profiles] = await Promise.all([
          api.get('/projects'),
          api.get('/tasks'),
          api.get('/profiles')
        ]);
        
        const doneTasks = tasks.filter((t: any) => t.status === 'done');
        const pendingTasks = tasks.filter((t: any) => t.status !== 'done');
        
        setStats({
          projects: projects.length,
          done: doneTasks.length,
          pending: pendingTasks.length,
          users: profiles.length
        });
        
        // Sort projects by createdAt descending and take top 4
        const sortedProjects = [...projects].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 4);
        
        setRecentProjects(sortedProjects);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      }
    };
    load();
  }, []);

  const cards = [
    { label: 'Total Projects', value: stats.projects, icon: FolderKanban, gradient: 'gradient-primary' },
    { label: 'Tasks Done', value: stats.done, icon: CheckSquare, gradient: 'gradient-accent' },
    { label: 'Pending Tasks', value: stats.pending, icon: Clock, gradient: 'bg-destructive' },
    { label: 'Team Members', value: stats.users, icon: Users, gradient: 'bg-secondary' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Welcome */}
        <div className="relative overflow-hidden rounded-2xl gradient-hero border border-border/30 p-8">
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10 rounded-full gradient-primary -translate-y-16 translate-x-16 blur-3xl" />
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting}, <span className="gradient-text">{profile?.name?.split(' ')[0] || 'User'}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-2 text-base">Here's what's happening in your workspace today.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c, i) => (
            <StatCard key={c.label} {...c} delay={i * 100} />
          ))}
        </div>

        {/* Recent projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Projects</h2>
            <button onClick={() => navigate('/projects')} className="flex items-center gap-1 text-sm text-primary font-medium hover:underline underline-offset-4 transition-all">
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {recentProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <FolderKanban className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No projects yet. Create your first to get started.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {recentProjects.map(p => (
                <div
                  key={p._id}
                  onClick={() => navigate(`/tasks?project=${p._id}`)}
                  className="group p-5 rounded-2xl border border-border/50 bg-card shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 shadow-soft">
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{p.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{p.description || 'No description'}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

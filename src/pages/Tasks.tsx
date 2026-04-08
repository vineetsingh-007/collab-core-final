import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

interface Task {
  _id: string;
  title: string;
  description: string;
  project: any;
  assignedTo: any;
  status: string;
  dueDate: string | null;
  createdBy: any;
  createdAt: string;
}

interface Project { _id: string; name: string; }
interface Profile { user: any; name: string; }

const statusConfig: Record<string, { label: string; bg: string; dot: string }> = {
  'todo': { label: 'To Do', bg: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
  'in-progress': { label: 'In Progress', bg: 'bg-accent/10 text-accent', dot: 'bg-accent' },
  'done': { label: 'Done', bg: 'bg-primary/10 text-primary', dot: 'bg-primary' },
};

const Tasks = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const projectFilter = searchParams.get('project');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchData = async () => {
    try {
      const [taskData, projectData, profileData] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects'),
        api.get('/profiles'),
      ]);
      setTasks(taskData);
      setProjects(projectData);
      setProfiles(profileData);
    } catch (err: any) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Replaced realtime with a simple interval poll for now
    const interval = setInterval(() => fetchData(), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { if (projectFilter) setProjectId(projectFilter); }, [projectFilter]);

  const filteredTasks = tasks.filter(t => {
    const tProjectId = typeof t.project === 'object' ? t.project?._id : t.project;
    if (projectFilter && tProjectId !== projectFilter) return false;
    if (filter !== 'all' && t.status !== filter) return false;
    return true;
  });

  const getProfileName = (userIdObj: any) => {
    if (!userIdObj) return 'Unassigned';
    const uid = typeof userIdObj === 'object' ? userIdObj._id : userIdObj;
    return profiles.find(p => {
      const pid = typeof p.user === 'object' ? p.user._id : p.user;
      return pid === uid;
    })?.name || (typeof userIdObj === 'object' ? userIdObj.name : 'Unknown');
  };

  const getProjectName = (pidObj: any) => {
    if (!pidObj) return 'Unknown';
    const pid = typeof pidObj === 'object' ? pidObj._id : pidObj;
    return projects.find(p => p._id === pid)?.name || (typeof pidObj === 'object' ? pidObj.name : 'Unknown');
  };

  const getUserId = (userObj: any) => {
    if (!userObj) return null;
    return typeof userObj === 'object' ? userObj._id || userObj.id : userObj;
  };

  const openCreate = () => {
    setTitle(''); setDescription(''); setAssignedTo(''); setDueDate('');
    if (projectFilter) setProjectId(projectFilter);
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!title.trim() || !projectId) { toast.error('Title and project are required'); return; }
    try {
      await api.post('/tasks', {
        title, 
        description, 
        project: projectId,
        assignedTo: assignedTo || null,
        dueDate: dueDate || null
      });
      if (assignedTo && assignedTo !== user?.id) {
        await api.post('/notifications', { user: assignedTo, message: `You were assigned to task "${title}"`, type: 'assignment' });
      }
      toast.success('Task created');
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create task');
    }
  };

  const updateStatus = async (taskId: string, newStatus: string, taskTitle: string) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      const task = tasks.find(t => t._id === taskId);
      const assigneeId = getUserId(task?.assignedTo);
      if (assigneeId && assigneeId !== user?.id) {
        await api.post('/notifications', { user: assigneeId, message: `Task "${taskTitle}" status changed to ${newStatus}`, type: 'status' });
      }
      fetchData();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Task deleted');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to delete task');
    }
  };

  const currentProjectName = projectFilter ? getProjectName(projectFilter) : null;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tasks {currentProjectName ? `— ${currentProjectName}` : ''}</h1>
            <p className="text-muted-foreground">Manage tasks{currentProjectName ? ` in ${currentProjectName}` : ' across all projects'}</p>
          </div>
          <Button onClick={openCreate} className="rounded-xl gradient-primary text-primary-foreground font-semibold shadow-soft hover:shadow-glow transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] h-11 px-5">
            <Plus className="w-4 h-4 mr-1.5" /> New Task
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'todo', 'in-progress', 'done'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                filter === s
                  ? 'gradient-primary text-primary-foreground shadow-soft'
                  : 'bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30'
              }`}>
              {s === 'all' ? 'All' : s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-card border border-border/50 animate-pulse" />)}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center">
            <p className="text-muted-foreground text-lg font-medium">No tasks found</p>
            <p className="text-muted-foreground text-sm mt-1">Create a new task to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(t => {
              const cfg = statusConfig[t.status] || statusConfig['todo'];
              return (
                <div key={t._id} className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card shadow-card hover:shadow-card-hover transition-all duration-200">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className={`font-medium text-sm ${t.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{t.title}</h4>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>
                    {t.description && <p className="text-xs text-muted-foreground truncate">{t.description}</p>}
                    <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="bg-muted/50 px-2 py-0.5 rounded-md">{getProjectName(t.project)}</span>
                      <span>→ {getProfileName(t.assignedTo)}</span>
                      {t.dueDate && <span>Due: {t.dueDate}</span>}
                    </div>
                  </div>

                  <Select value={t.status} onValueChange={(v) => updateStatus(t._id, v, t.title)}>
                    <SelectTrigger className="w-36 h-9 text-xs rounded-xl border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>

                  {getUserId(t.createdBy) === user?.id && (
                    <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => deleteTask(t._id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Title</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" className="rounded-xl h-11 bg-muted/50 border-border/50" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description</label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="rounded-xl bg-muted/50 border-border/50" rows={2} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Project</label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="rounded-xl h-11 bg-muted/50 border-border/50"><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>{projects.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Assign To</label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger className="rounded-xl h-11 bg-muted/50 border-border/50"><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>{profiles.map(p => {
                    const uid = typeof p.user === 'object' ? p.user._id : p.user;
                    return <SelectItem key={uid} value={uid}>{p.name}</SelectItem>;
                  })}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Due Date</label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="rounded-xl h-11 bg-muted/50 border-border/50" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleCreate} className="rounded-xl gradient-primary text-primary-foreground">Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Tasks;

import { useState } from 'react';
import { Shield, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';

const Profile = () => {
  const { profile, updateProfile, updatePassword, logout } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveName = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await updateProfile({ name });
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      await updatePassword(newPassword);
      toast.success('Password updated');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update password');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

        {/* Avatar card */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-card p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-glow">
              {profile?.name?.charAt(0) || '?'}
            </div>
            <div>
              <p className="font-semibold text-lg">{profile?.name}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Display Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} className="rounded-xl h-11 bg-muted/50 border-border/50" />
          </div>
          <Button onClick={handleSaveName} disabled={saving} className="rounded-xl gradient-primary text-primary-foreground font-semibold shadow-soft hover:shadow-glow transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            <Shield className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Name'}
          </Button>
        </div>

        {/* Password card */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-card p-6 space-y-5">
          <h3 className="font-semibold flex items-center gap-2"><Key className="w-4 h-4 text-primary" /> Change Password</h3>
          <div>
            <label className="text-sm font-medium mb-1.5 block">New Password</label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="rounded-xl h-11 bg-muted/50 border-border/50" />
          </div>
          <Button onClick={handleChangePassword} className="rounded-xl gradient-primary text-primary-foreground font-semibold shadow-soft hover:shadow-glow transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            Update Password
          </Button>
        </div>

        <Button variant="outline" className="w-full rounded-xl h-11 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all duration-200" onClick={logout}>
          Logout
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default Profile;

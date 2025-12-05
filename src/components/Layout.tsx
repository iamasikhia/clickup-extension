import React from 'react';
import { Clock, FileText, Settings, BarChart3, Send, User, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import logo from '../logo.jpeg';

interface FreelancerProfile {
  fullName: string;
  email: string;
  logoUrl?: string;
  businessName: string;
  businessType: 'freelancer' | 'agency' | 'consultant' | 'other';
}

interface LayoutProps {
  children: React.ReactNode;
  userProfile?: FreelancerProfile | null;
  onResetProfile?: () => void;
}

export function Layout({ children, userProfile, onResetProfile }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, path: '/' },
    { id: 'tasks', name: 'Task Manager', icon: Settings, path: '/tasks' },
    { id: 'tracker', name: 'Time Tracker', icon: Clock, path: '/tracker' },
    { id: 'invoices', name: 'Invoice Generator', icon: FileText, path: '/invoices' },
    { id: 'export', name: 'Export & Share', icon: Send, path: '/export' },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const currentPath = location.pathname;
  const activeItem = navigation.find(item => item.path === currentPath) || navigation[0];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-8">
            <img src={logo} alt="Logo" className="h-8 w-8 rounded-md object-cover" />
            <h1 className="text-primary font-bold text-xl">Smart Invoice</h1>
          </div>

          <nav className="space-y-2 flex-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeItem.id === item.id ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Button>
              );
            })}
          </nav>

          {/* User Profile Section */}
          {userProfile && (
            <div className="mt-auto pt-8">
              <div className="p-4 bg-muted rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10 border border-border">
                    {userProfile.logoUrl && <AvatarImage src={userProfile.logoUrl} className="object-cover" />}
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(userProfile.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate text-foreground">{userProfile.businessName || userProfile.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate font-medium">Profile</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs font-medium bg-background hover:bg-accent">
                        <User className="mr-2 h-3 w-3" />
                        Manage
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuItem>
                        <div className="flex flex-col">
                          <span className="font-medium">{userProfile.fullName}</span>
                          <span className="text-sm text-muted-foreground">{userProfile.email}</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Business Settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {onResetProfile && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onResetProfile}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 bg-background"
                      title="Sign Out"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-medium capitalize">
                {activeItem.name}
              </h2>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
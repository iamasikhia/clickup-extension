import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TaskManager } from './components/TaskManager';
import { TimeTracker } from './components/TimeTracker';
import { InvoiceGenerator } from './components/InvoiceGenerator';

import { ExportShare } from './components/ExportShare';
import { Onboarding } from './components/Onboarding';
import { Login } from './components/Login';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

import { Task, TimeLog, Invoice, FreelancerProfile, User } from './types';

import { supabase } from './lib/supabase';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [userProfile, setUserProfile] = useState<FreelancerProfile | null>(null);
  const [isConnected, setIsConnected] = useState(() => {
    return localStorage.getItem('isConnected') === 'true';
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('accessToken');
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Auth and Data Loading Effect
  React.useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleAuthUser(session.user);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleAuthUser(session.user);
      } else {
        // IMPORTANT: Do not call handleLogout() here as it calls signOut(),
        // which triggers this event again, causing an infinite loop.
        resetState();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthUser = async (authUser: any) => {
    // Transform Supabase user to App User
    const appUser: User = {
      email: authUser.email || '',
      name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
      authMethod: authUser.app_metadata?.provider || 'email'
    };
    setUser(appUser);

    // Fetch Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profile) {
      setUserProfile({
        fullName: profile.full_name,
        email: authUser.email || '',
        phone: profile.phone || '',
        businessName: profile.business_name,
        businessType: profile.business_type,
        website: profile.website,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zipCode: profile.zip_code,
        country: profile.country,
        profession: profile.profession,
        defaultHourlyRate: profile.default_hourly_rate,
        currency: profile.currency,
        timeZone: profile.time_zone,
        preferredPaymentTerms: profile.preferred_payment_terms
      } as FreelancerProfile);
      setIsOnboarded(true);
    } else {
      setIsOnboarded(false);
    }

    // Fetch Data
    fetchUserData();
  };

  const fetchUserData = async () => {
    const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (tasksError) console.error('Error fetching tasks:', tasksError);
    if (tasksData) setTasks(tasksData.map(t => ({ ...t, createdAt: t.created_at })));

    const { data: logsData, error: logsError } = await supabase.from('time_logs').select('*').order('created_at', { ascending: false });
    if (logsError) console.error('Error fetching time logs:', logsError);
    if (logsData) setTimeLogs(logsData.map(l => ({ ...l, taskId: l.task_id })));

    const { data: invoicesData, error: invoicesError } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (invoicesError) console.error('Error fetching invoices:', invoicesError);
    if (invoicesData) setInvoices(invoicesData.map(i => ({
      ...i,
      taskIds: i.task_ids,
      totalHours: i.total_hours,
      totalAmount: i.total_amount,
      clientName: i.client_name,
      clientEmail: i.client_email,
      approvalLink: i.approval_link,
      approvedAt: i.approved_at,
      clientSignature: i.client_signature,
      paymentMethod: i.payment_method,
      paymentInstructions: i.payment_instructions
    })));
  };

  const [isProcessingClickUp, setIsProcessingClickUp] = useState(() => {
    return new URLSearchParams(window.location.search).has('code');
  });

  const processingRef = React.useRef(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code && !processingRef.current) {
      processingRef.current = true;

      // Exchange code for access token via proxy
      const clientId = import.meta.env.VITE_CLICKUP_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_CLICKUP_CLIENT_SECRET;

      console.log('Attempting ClickUp connection with Client ID:', clientId);
      toast.info('Connecting to ClickUp...');

      fetch(`/api/clickup/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`, {
        method: 'POST',
      })
        .then(async res => {
          if (!res.ok) {
            const text = await res.text();
            console.error('ClickUp API Error Response:', text);
            throw new Error(`API Error ${res.status}: ${text}`);
          }
          return res.json();
        })
        .then(data => {
          if (data.access_token) {
            console.log('ClickUp Connection Successful');
            setAccessToken(data.access_token);
            setIsConnected(true);
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('isConnected', 'true');
            toast.success('Successfully connected to ClickUp!');
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            console.error('ClickUp Token Missing:', data);
            toast.error(`Connection Failed: ${data.err || 'No access token returned'}`);
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })
        .catch(err => {
          console.error('Fetch Error:', err);
          toast.error(`Connection Error: ${err.message}`);
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .finally(() => {
          setIsProcessingClickUp(false);
        });
    }
  }, []);

  if (isProcessingClickUp) {
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Connecting to ClickUp...</p>
        <Toaster />
      </div>
    );
  }

  const handleOnboardingComplete = async (profile: FreelancerProfile) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: profile.fullName,
        email: profile.email,
        logo_url: profile.logoUrl,
        business_name: profile.businessName,
        business_type: profile.businessType,
        website: profile.website,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zip_code: profile.zipCode,
        country: profile.country,
        profession: profile.profession,
        default_hourly_rate: profile.defaultHourlyRate,
        currency: profile.currency,
        time_zone: profile.timeZone,
        preferred_payment_terms: profile.preferredPaymentTerms
      }, { onConflict: 'id' });

      if (error) {
        console.error('Error upserting profile:', error);
        toast.error(`Error saving profile: ${error.message}`);
        throw error;
      }
    }

    toast.success('Profile setup complete!');
    setUserProfile(profile);
    setIsOnboarded(true);

    // Update sample tasks with user's default rate
    const updatedTasks = tasks.map(task => ({
      ...task,
      rate: profile.defaultHourlyRate
    }));
    setTasks(updatedTasks);
  };

  const handleLogin = (userData: User) => {
    // This is now handled by onAuthStateChange, but kept for compatibility if needed
    // The actual login (e.g., via Google) will trigger onAuthStateChange
    // which then calls handleAuthUser.
  };

  const resetState = () => {
    setUser(null);
    setUserProfile(null);
    setIsOnboarded(false);
    setIsConnected(false);
    setAccessToken(null);

    localStorage.removeItem('isConnected');
    localStorage.removeItem('accessToken');

    // Reset to empty data
    setTasks([]);
    setTimeLogs([]);
    setInvoices([]);
  };

  const handleLogout = async () => {
    resetState();
    await supabase.auth.signOut();
  };

  // Task management functions
  const handleAddTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newTask = {
      user_id: user.id,
      name: taskData.name,
      rate: taskData.rate,
      status: taskData.status,
      description: taskData.description,
    };

    const { data, error } = await supabase.from('tasks').insert(newTask).select().single();

    if (data && !error) {
      setTasks(prev => [{ ...data, createdAt: data.created_at } as Task, ...prev]);
    } else if (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    const { error } = await supabase.from('tasks').update({
      name: updates.name,
      rate: updates.rate,
      status: updates.status,
      description: updates.description
    }).eq('id', id);

    if (!error) {
      setTasks(prev => prev.map(task =>
        task.id === id ? { ...task, ...updates } : task
      ));
    } else {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (!error) {
      setTasks(prev => prev.filter(task => task.id !== id));
      // Also remove related time logs locally, assuming cascade delete on DB
      setTimeLogs(prev => prev.filter(log => log.taskId !== id));
    } else {
      console.error('Error deleting task:', error);
    }
  };

  // Time log management functions
  const handleAddTimeLog = async (logData: Omit<TimeLog, 'id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from('time_logs').insert({
      user_id: user.id,
      task_id: logData.taskId,
      hours: logData.hours,
      date: logData.date,
      description: logData.description
    }).select().single();

    if (data && !error) {
      const newLog: TimeLog = {
        id: data.id,
        taskId: data.task_id,
        hours: data.hours,
        date: data.date,
        description: data.description
      };
      setTimeLogs(prev => [newLog, ...prev]);
      toast.success('Time log saved successfully');
    } else {
      console.error('Error adding time log:', error);
      toast.error('Failed to save time log');
    }
  };

  const handleUpdateTimeLog = async (id: string, updates: Partial<TimeLog>) => {
    const updateData: any = {};
    if (updates.hours !== undefined) updateData.hours = updates.hours;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.taskId !== undefined) updateData.task_id = updates.taskId;

    const { error } = await supabase.from('time_logs').update(updateData).eq('id', id);

    if (!error) {
      setTimeLogs(prev => prev.map(log =>
        log.id === id ? { ...log, ...updates } : log
      ));
      toast.success('Time log updated');
    } else {
      console.error('Error updating time log:', error);
      toast.error('Failed to update time log');
    }
  };

  const handleDeleteTimeLog = async (id: string) => {
    const { error } = await supabase.from('time_logs').delete().eq('id', id);

    if (!error) {
      setTimeLogs(prev => prev.filter(log => log.id !== id));
      toast.success('Time log deleted');
    } else {
      console.error('Error deleting time log:', error);
      toast.error('Failed to delete time log');
    }
  };

  // Invoice management functions
  // Invoice management functions
  const handleCreateInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from('invoices').insert({
      user_id: user.id,
      task_ids: invoiceData.taskIds,
      total_hours: invoiceData.totalHours,
      total_amount: invoiceData.totalAmount,
      status: invoiceData.status,
      client_name: invoiceData.clientName,
      client_email: invoiceData.clientEmail,
      description: invoiceData.description,
      notes: invoiceData.notes,
      payment_method: invoiceData.paymentMethod,
      payment_instructions: invoiceData.paymentInstructions
    }).select().single();

    if (data && !error) {
      const newInvoice: Invoice = {
        ...invoiceData,
        id: data.id,
        createdAt: data.created_at,
        // Ensure mapping back all fields if needed, though ...invoiceData covers most
        taskIds: data.task_ids, // Confirming array comes back
        clientName: data.client_name,
        clientEmail: data.client_email,
        totalAmount: data.total_amount,
        totalHours: data.total_hours,
        approvalLink: data.approval_link,
        approvedAt: data.approved_at,
        clientSignature: data.client_signature,
        paymentMethod: data.payment_method,
        paymentInstructions: data.payment_instructions
      };
      setInvoices(prev => [newInvoice, ...prev]);
      toast.success('Invoice created successfully');
    } else {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    }
  };

  const handleUpdateInvoice = async (id: string, updates: Partial<Invoice>) => {
    const updateData: any = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.clientName !== undefined) updateData.client_name = updates.clientName;
    if (updates.clientEmail !== undefined) updateData.client_email = updates.clientEmail;
    if (updates.totalAmount !== undefined) updateData.total_amount = updates.totalAmount;
    if (updates.totalHours !== undefined) updateData.total_hours = updates.totalHours;
    if (updates.taskIds !== undefined) updateData.task_ids = updates.taskIds;
    if (updates.approvalLink !== undefined) updateData.approval_link = updates.approvalLink;
    if (updates.approvedAt !== undefined) updateData.approved_at = updates.approvedAt;
    if (updates.clientSignature !== undefined) updateData.client_signature = updates.clientSignature;
    if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod;
    if (updates.paymentInstructions !== undefined) updateData.payment_instructions = updates.paymentInstructions;

    const { error } = await supabase.from('invoices').update(updateData).eq('id', id);

    if (!error) {
      setInvoices(prev => prev.map(invoice =>
        invoice.id === id ? { ...invoice, ...updates } : invoice
      ));
      toast.success('Invoice updated');
    } else {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
    }
  };



  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
        } />

        <Route path="/onboarding" element={
          !user ? <Navigate to="/login" replace /> :
            isOnboarded ? <Navigate to="/" replace /> :
              <Onboarding
                onComplete={handleOnboardingComplete}
                initialData={{ email: user?.email || '', fullName: user?.name || '' }}
              />
        } />


        <Route path="/*" element={
          !user ? <Navigate to="/login" replace /> :
            !isOnboarded ? <Navigate to="/onboarding" replace /> :
              <Layout
                userProfile={userProfile}
                onResetProfile={handleLogout}
              >
                <Routes>
                  <Route path="/" element={<Dashboard tasks={tasks} timeLogs={timeLogs} invoices={invoices} isConnected={isConnected} onLogout={handleLogout} />} />
                  <Route path="/tasks" element={
                    <TaskManager
                      tasks={tasks}
                      onAddTask={handleAddTask}
                      onUpdateTask={handleUpdateTask}
                      onDeleteTask={handleDeleteTask}
                      defaultRate={userProfile?.defaultHourlyRate || 0}
                      isConnected={isConnected}
                      accessToken={accessToken}
                    />
                  } />
                  <Route path="/tracker" element={
                    <TimeTracker
                      tasks={tasks}
                      timeLogs={timeLogs}
                      onAddTimeLog={handleAddTimeLog}
                      onUpdateTimeLog={handleUpdateTimeLog}
                      onDeleteTimeLog={handleDeleteTimeLog}
                    />
                  } />
                  <Route path="/invoices" element={
                    <InvoiceGenerator
                      tasks={tasks}
                      timeLogs={timeLogs}
                      invoices={invoices}
                      onCreateInvoice={handleCreateInvoice}
                      userProfile={userProfile!}
                    />
                  } />
                  <Route path="/export" element={
                    <ExportShare
                      tasks={tasks}
                      invoices={invoices}
                      onUpdateInvoice={handleUpdateInvoice}
                      userProfile={userProfile!}
                    />
                  } />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
        } />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
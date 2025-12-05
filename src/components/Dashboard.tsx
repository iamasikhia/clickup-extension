import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, DollarSign, FileText, CheckCircle } from 'lucide-react';

import { Button } from './ui/button';

import { Task, TimeLog, Invoice } from '../types';

interface DashboardProps {
  tasks: Task[];
  timeLogs: TimeLog[];
  invoices: Invoice[];
  isConnected: boolean;
  onLogout: () => void;
}

export function Dashboard({ tasks, timeLogs, invoices, isConnected, onLogout }: DashboardProps) {

  const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);
  const totalEarnings = timeLogs.reduce((sum, log) => {
    const task = tasks.find(t => t.id === log.taskId);
    return sum + (task ? log.hours * task.rate : 0);
  }, 0);
  const pendingInvoices = invoices.filter(inv => inv.status === 'draft' || inv.status === 'sent');
  const activeTasks = tasks.filter(task => task.status === 'active');

  const recentTimeLogs = timeLogs
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const handleClickUpConnect = () => {
    const clientId = import.meta.env.VITE_CLICKUP_CLIENT_ID;
    const redirectUri = 'http://localhost:3000/';
    const url = `https://app.clickup.com/api?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;

    window.location.href = url;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your projects, hours, and invoices
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isConnected ? (
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle className="h-5 w-5" />
              Connected to ClickUp
            </div>
          ) : (
            <Button onClick={handleClickUpConnect}>
              Connect to ClickUp
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{activeTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Projects in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Hours tracked this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Revenue this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Pending Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{pendingInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Time Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTimeLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No time logs yet. Start tracking time to see your activity here.
                </p>
              ) : (
                recentTimeLogs.map((log) => {
                  const task = tasks.find(t => t.id === log.taskId);
                  return (
                    <div key={log.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{task?.name || 'Unknown Task'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{log.hours.toFixed(1)}h</p>
                        <p className="text-sm text-muted-foreground">
                          ${((task?.rate || 0) * log.hours).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No invoices yet. Generate your first invoice to see it here.
                </p>
              ) : (
                invoices
                  .slice()
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 5)
                  .map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Invoice #{invoice.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${invoice.totalAmount.toFixed(2)}</p>
                        <Badge
                          variant={
                            invoice.status === 'paid' ? 'default' :
                              invoice.status === 'sent' ? 'secondary' : 'outline'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
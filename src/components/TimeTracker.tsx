import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Play, Pause, Square, Clock, Plus, Edit2, Trash2 } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  rate: number;
  status: 'active' | 'completed';
}

interface TimeLog {
  id: string;
  taskId: string;
  hours: number;
  date: string;
  description?: string;
}

interface TimeTrackerProps {
  tasks: Task[];
  timeLogs: TimeLog[];
  onAddTimeLog: (log: Omit<TimeLog, 'id'>) => void;
  onUpdateTimeLog: (id: string, log: Partial<TimeLog>) => void;
  onDeleteTimeLog: (id: string) => void;
}

export function TimeTracker({ tasks, timeLogs, onAddTimeLog, onUpdateTimeLog, onDeleteTimeLog }: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null);
  const [manualEntry, setManualEntry] = useState({
    taskId: '',
    hours: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [startTime, setStartTime] = useState<number | null>(null);

  // Load active timer from local storage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      try {
        const { isRunning: savedIsRunning, startTime: savedStartTime, seconds: savedSeconds, taskId } = JSON.parse(savedState);
        if (taskId) setSelectedTaskId(taskId);

        if (savedIsRunning && savedStartTime) {
          setStartTime(savedStartTime);
          setIsRunning(true);
          // Immediate update to avoid 1-second delay
          setSeconds(Math.floor((Date.now() - savedStartTime) / 1000));
        } else if (!savedIsRunning && savedSeconds) {
          setSeconds(savedSeconds);
          setIsRunning(false);
        }
      } catch (e) {
        console.error('Error parsing timer state', e);
      }
    }
  }, []);

  const activeTasks = tasks.filter(task => task.status === 'active');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!selectedTaskId) {
      alert('Please select a task first');
      return;
    }
    const newStartTime = Date.now() - (seconds * 1000);
    setStartTime(newStartTime);
    setIsRunning(true);

    localStorage.setItem('timerState', JSON.stringify({
      isRunning: true,
      startTime: newStartTime,
      taskId: selectedTaskId
    }));
  };

  const handlePause = () => {
    setIsRunning(false);
    let currentSeconds = seconds;
    if (startTime) {
      currentSeconds = Math.floor((Date.now() - startTime) / 1000);
      setSeconds(currentSeconds);
    }

    // Save paused state
    localStorage.setItem('timerState', JSON.stringify({
      isRunning: false,
      seconds: currentSeconds,
      taskId: selectedTaskId
    }));
  };

  const handleStop = () => {
    let finalSeconds = seconds;
    if (isRunning && startTime) {
      finalSeconds = Math.floor((Date.now() - startTime) / 1000);
    }

    if (finalSeconds > 0 && selectedTaskId) {
      const hours = finalSeconds / 3600;
      onAddTimeLog({
        taskId: selectedTaskId,
        hours: parseFloat(hours.toFixed(2)),
        date: new Date().toISOString().split('T')[0],
        description: `Time tracked on ${new Date().toLocaleDateString()}`
      });
    }
    setIsRunning(false);
    setSeconds(0);
    setStartTime(null);
    localStorage.removeItem('timerState');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEntry.taskId || !manualEntry.hours) return;

    const logData = {
      taskId: manualEntry.taskId,
      hours: parseFloat(manualEntry.hours),
      date: manualEntry.date,
      description: manualEntry.description || undefined
    };

    if (editingLog) {
      onUpdateTimeLog(editingLog.id, logData);
      setEditingLog(null);
    } else {
      onAddTimeLog(logData);
      setIsManualEntryOpen(false);
    }

    setManualEntry({ taskId: '', hours: '', description: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleEdit = (log: TimeLog) => {
    setEditingLog(log);
    setManualEntry({
      taskId: log.taskId,
      hours: log.hours.toString(),
      description: log.description || '',
      date: log.date
    });
  };

  const cancelEdit = () => {
    setEditingLog(null);
    setManualEntry({ taskId: '', hours: '', description: '', date: new Date().toISOString().split('T')[0] });
  };

  const todaysLogs = timeLogs.filter(log => log.date === new Date().toISOString().split('T')[0]);
  const currentTask = tasks.find(task => task.id === selectedTaskId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Time Tracker</h1>
          <p className="text-muted-foreground">
            Track time for your projects and manage time logs
          </p>
        </div>
        <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Manual Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Time Manually</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <Label htmlFor="manual-task">Task</Label>
                <Select value={manualEntry.taskId} onValueChange={(value) => setManualEntry({ ...manualEntry, taskId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a task" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTasks.map(task => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.name} (${task.rate}/hr)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="manual-hours">Hours</Label>
                <Input
                  id="manual-hours"
                  type="number"
                  step="0.25"
                  value={manualEntry.hours}
                  onChange={(e) => setManualEntry({ ...manualEntry, hours: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="manual-date">Date</Label>
                <Input
                  id="manual-date"
                  type="date"
                  value={manualEntry.date}
                  onChange={(e) => setManualEntry({ ...manualEntry, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="manual-description">Description (Optional)</Label>
                <Input
                  id="manual-description"
                  value={manualEntry.description}
                  onChange={(e) => setManualEntry({ ...manualEntry, description: e.target.value })}
                  placeholder="What did you work on?"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit">Add Time Log</Button>
                <Button type="button" variant="outline" onClick={() => setIsManualEntryOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timer Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="task-select">Select Task</Label>
            <Select value={selectedTaskId} onValueChange={setSelectedTaskId} disabled={isRunning}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a task to track time for" />
              </SelectTrigger>
              <SelectContent>
                {activeTasks.map(task => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.name} (${task.rate}/hr)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-center">
            <div className="text-6xl font-mono font-medium mb-4 text-primary">
              {formatTime(seconds)}
            </div>
            {currentTask && (
              <p className="text-muted-foreground mb-4">
                Working on: {currentTask.name} • ${currentTask.rate}/hr
              </p>
            )}
            <div className="flex gap-2 justify-center">
              {!isRunning ? (
                <Button onClick={handleStart} disabled={!selectedTaskId}>
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </Button>
              ) : (
                <Button onClick={handlePause} variant="outline">
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              )}
              <Button onClick={handleStop} variant="destructive" disabled={seconds === 0}>
                <Square className="mr-2 h-4 w-4" />
                Stop & Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Time Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Time Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {todaysLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No time logged today. Start tracking time or add manual entries.
            </p>
          ) : (
            <div className="space-y-4">
              {todaysLogs.map(log => {
                const task = tasks.find(t => t.id === log.taskId);
                return (
                  <div key={log.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h4 className="font-medium">{task?.name || 'Unknown Task'}</h4>
                      {log.description && (
                        <p className="text-sm text-muted-foreground">{log.description}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {log.hours} hours • ${((task?.rate || 0) * log.hours).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(log)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onDeleteTimeLog(log.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingLog && (
        <Dialog open={true} onOpenChange={() => cancelEdit()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Time Log</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-task">Task</Label>
                <Select value={manualEntry.taskId} onValueChange={(value) => setManualEntry({ ...manualEntry, taskId: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTasks.map(task => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.name} (${task.rate}/hr)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-hours">Hours</Label>
                <Input
                  id="edit-hours"
                  type="number"
                  step="0.25"
                  value={manualEntry.hours}
                  onChange={(e) => setManualEntry({ ...manualEntry, hours: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={manualEntry.date}
                  onChange={(e) => setManualEntry({ ...manualEntry, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={manualEntry.description}
                  onChange={(e) => setManualEntry({ ...manualEntry, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit">Update Time Log</Button>
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
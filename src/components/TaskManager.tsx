import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Edit2, Trash2, DollarSign } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

interface Task {
  id: string;
  name: string;
  rate: number;
  status: 'active' | 'completed';
  description?: string;
  createdAt: string;
}

interface TaskManagerProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask: (id: string, task: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  defaultRate?: number;
  isConnected: boolean;
  accessToken: string | null;
}

interface ClickUpSpace {
  id: string;
  name: string;
}

interface ClickUpList {
  id: string;
  name: string;
}

interface ClickUpTask {
  id: string;
  name: string;
}

export function TaskManager({ tasks, onAddTask, onUpdateTask, onDeleteTask, defaultRate = 0, isConnected, accessToken }: TaskManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskSource, setTaskSource] = useState<'custom' | 'clickup'>('custom');

  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const [selectedListId, setSelectedListId] = useState<string>('');

  const [clickUpSpaces, setClickUpSpaces] = useState<ClickUpSpace[]>([]);
  const [clickUpLists, setClickUpLists] = useState<ClickUpList[]>([]);
  const [clickUpTasks, setClickUpTasks] = useState<ClickUpTask[]>([]);

  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    rate: defaultRate.toString(),
    description: '',
    status: 'active' as 'active' | 'completed'
  });

  // Update form data when defaultRate changes
  React.useEffect(() => {
    if (!editingTask) {
      setFormData(prev => ({
        ...prev,
        rate: defaultRate.toString()
      }));
    }
  }, [defaultRate, editingTask]);

  // Fetch ClickUp Spaces when dialog opens and we have a token
  React.useEffect(() => {
    if (isAddDialogOpen && isConnected && accessToken && clickUpSpaces.length === 0) {
      setIsLoadingSpaces(true);

      // 1. Get Teams
      fetch('/api/clickup/team', {
        headers: { 'Authorization': accessToken }
      })
        .then(res => res.json())
        .then(teamData => {
          const teams = teamData.teams || [];
          if (teams.length > 0) {
            const teamId = teams[0].id;

            // 2. Get Spaces for the first team
            return fetch(`/api/clickup/team/${teamId}/space?archived=false`, {
              headers: { 'Authorization': accessToken }
            });
          }
          throw new Error('No teams found');
        })
        .then(res => res.json())
        .then(spaceData => {
          setClickUpSpaces(spaceData.spaces || []);
          setIsLoadingSpaces(false);
        })
        .catch(err => {
          console.error('Error fetching ClickUp data:', err);
          setIsLoadingSpaces(false);
        });
    }
  }, [isAddDialogOpen, isConnected, accessToken, clickUpSpaces.length]);

  // Fetch Lists when Space is selected
  React.useEffect(() => {
    if (selectedSpaceId && accessToken) {
      setIsLoadingLists(true);
      setClickUpLists([]);
      setClickUpTasks([]);
      setSelectedListId('');

      fetch(`/api/clickup/space/${selectedSpaceId}/list?archived=false`, {
        headers: { 'Authorization': accessToken }
      })
        .then(res => res.json())
        .then(data => {
          setClickUpLists(data.lists || []);
          setIsLoadingLists(false);
        })
        .catch(err => {
          console.error('Error fetching lists:', err);
          setIsLoadingLists(false);
        });
    }
  }, [selectedSpaceId, accessToken]);

  // Fetch Tasks when List is selected
  React.useEffect(() => {
    if (selectedListId && accessToken) {
      setIsLoadingTasks(true);
      fetch(`/api/clickup/list/${selectedListId}/task?archived=false`, {
        headers: { 'Authorization': accessToken }
      })
        .then(res => res.json())
        .then(data => {
          setClickUpTasks(data.tasks || []);
          setIsLoadingTasks(false);
        })
        .catch(err => {
          console.error('Error fetching tasks:', err);
          setIsLoadingTasks(false);
        });
    }
  }, [selectedListId, accessToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.rate) return;

    const taskData = {
      name: formData.name,
      rate: parseFloat(formData.rate),
      description: formData.description,
      status: formData.status
    };

    if (editingTask) {
      onUpdateTask(editingTask.id, taskData);
      setEditingTask(null);
    } else {
      onAddTask(taskData);
      setIsAddDialogOpen(false);
    }

    setFormData({ name: '', rate: defaultRate.toString(), description: '', status: 'active' });
    setTaskSource('custom');
    setSelectedSpaceId('');
    setSelectedListId('');
    setClickUpTasks([]);
  };

  const handleClickUpSpaceSelect = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    setSelectedListId('');
    setClickUpTasks([]);
    setFormData(prev => ({ ...prev, name: '' }));
  };

  const handleClickUpListSelect = (listId: string) => {
    setSelectedListId(listId);
    // Reset task selection when list changes
    setFormData(prev => ({ ...prev, name: '' }));
  };

  const handleClickUpTaskSelect = (taskName: string) => {
    const list = clickUpLists.find(l => l.id === selectedListId);
    setFormData(prev => ({
      ...prev,
      name: taskName,
      description: `Imported from ClickUp List: ${list?.name || 'Unknown'}`
    }));
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      rate: task.rate.toString(),
      description: task.description || '',
      status: task.status
    });
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setFormData({ name: '', rate: defaultRate.toString(), description: '', status: 'active' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Task Manager</h1>
          <p className="text-muted-foreground">
            Create and manage your projects and hourly rates
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>

            {isConnected && (
              <Tabs defaultValue="custom" value={taskSource} onValueChange={(v) => setTaskSource(v as 'custom' | 'clickup')} className="w-full mb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="custom"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                  >
                    Custom Task
                  </TabsTrigger>
                  <TabsTrigger
                    value="clickup"
                    className="data-[state=active]:bg-[#7b68ee] data-[state=active]:text-white transition-all"
                  >
                    Import from ClickUp
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {taskSource === 'clickup' && isConnected ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select ClickUp Space {isLoadingSpaces && '(Loading...)'}</Label>
                    <Select onValueChange={handleClickUpSpaceSelect} value={selectedSpaceId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a space..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clickUpSpaces.map(space => (
                          <SelectItem key={space.id} value={space.id}>
                            {space.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Select ClickUp List {isLoadingLists && '(Loading...)'}</Label>
                    <Select onValueChange={handleClickUpListSelect} value={selectedListId} disabled={!selectedSpaceId}>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedSpaceId ? "Select a list..." : "Select a space first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {clickUpLists.map(list => (
                          <SelectItem key={list.id} value={list.id}>
                            {list.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Task {isLoadingTasks && '(Loading...)'}</Label>
                    <Select onValueChange={handleClickUpTaskSelect} disabled={!selectedListId}>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedListId ? "Select a task..." : "Select a list first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {clickUpTasks.map(task => (
                          <SelectItem key={task.id} value={task.name}>
                            {task.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="name">Task Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter task name"
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="rate">Hourly Rate ($)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Project description"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit">Create Task</Button>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{task.name}</CardTitle>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.description}
                    </p>
                  )}
                </div>
                <Badge variant={task.status === 'active' ? 'default' : 'secondary'}>
                  {task.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">${task.rate.toFixed(2)}/hour</span>
                </div>

                <div className="text-sm text-muted-foreground">
                  Created: {new Date(task.createdAt).toLocaleDateString()}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(task)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeleteTask(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tasks.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first task to start tracking time and generating invoices.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Task
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editingTask && (
        <Dialog open={true} onOpenChange={() => cancelEdit()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Task Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-rate">Hourly Rate ($)</Label>
                <Input
                  id="edit-rate"
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'completed' })}
                  className="w-full p-2 border border-border rounded-md bg-background"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit">Update Task</Button>
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
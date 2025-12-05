import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { FileText, Eye, Plus, Wand2 } from 'lucide-react';

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

interface Invoice {
  id: string;
  taskIds: string[];
  totalHours: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'pending_approval' | 'approved' | 'paid' | 'rejected';
  createdAt: string;
  clientName?: string;
  clientEmail?: string;
  description?: string;
  notes?: string;
  approvalLink?: string;
  approvedAt?: string;
  clientSignature?: string;
  clientComments?: string;
  paymentMethod?: 'bank_transfer' | 'paypal' | 'stripe' | 'check';
  paymentInstructions?: string;
}

interface FreelancerProfile {
  fullName: string;
  email: string;
  logoUrl?: string; // Added logoUrl
  phone?: string;
  businessName: string;
  businessType: 'freelancer' | 'agency' | 'consultant' | 'other';
  website?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  profession: string;
  defaultHourlyRate: number;
  currency: string;
  timeZone: string;
  preferredPaymentTerms: string;
}

interface InvoiceGeneratorProps {
  tasks: Task[];
  timeLogs: TimeLog[];
  invoices: Invoice[];
  onCreateInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
  userProfile?: FreelancerProfile | null;
}

export function InvoiceGenerator({ tasks, timeLogs, invoices, onCreateInvoice, userProfile }: InvoiceGeneratorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    selectedTasks: [] as string[],
    clientName: '',
    clientEmail: '',
    description: '',
    notes: ''
  });

  // Get unbilled time logs
  const billedTaskIds = new Set(
    invoices.flatMap(invoice => invoice.taskIds)
  );

  const availableTimeLogs = timeLogs.filter(log => {
    return !billedTaskIds.has(log.taskId);
  });

  const generateAIDescription = (selectedTasks: string[]) => {
    const taskNames = selectedTasks.map(taskId => {
      const task = tasks.find(t => t.id === taskId);
      return task?.name || 'Unknown Task';
    });

    if (taskNames.length === 1) {
      return `Professional services rendered for ${taskNames[0]} project. This invoice covers all completed work and time tracked for the specified period.`;
    } else if (taskNames.length > 1) {
      return `Professional services rendered for multiple projects including ${taskNames.slice(0, -1).join(', ')} and ${taskNames[taskNames.length - 1]}. This invoice covers all completed work and time tracked for the specified period.`;
    }
    return 'Professional services rendered for completed work during the specified period.';
  };

  const generateAINotes = () => {
    const notes = [
      'Payment is due within 30 days of invoice date.',
      'Late payments may incur additional fees.',
      'Please retain this invoice for your records.',
      'Thank you for your business and prompt payment.'
    ];
    return notes.join('\n');
  };

  const calculateInvoiceData = (selectedTasks: string[]) => {
    const relevantLogs = availableTimeLogs.filter(log => selectedTasks.includes(log.taskId));

    let totalHours = 0;
    let totalAmount = 0;

    relevantLogs.forEach(log => {
      const task = tasks.find(t => t.id === log.taskId);
      if (task) {
        totalHours += log.hours;
        totalAmount += log.hours * task.rate;
      }
    });

    return { totalHours, totalAmount, relevantLogs };
  };

  const handleTaskToggle = (taskId: string) => {
    const newSelected = formData.selectedTasks.includes(taskId)
      ? formData.selectedTasks.filter(id => id !== taskId)
      : [...formData.selectedTasks, taskId];

    setFormData({ ...formData, selectedTasks: newSelected });
  };

  const handleAIGenerate = () => {
    const aiDescription = generateAIDescription(formData.selectedTasks);
    const aiNotes = generateAINotes();

    setFormData({
      ...formData,
      description: aiDescription,
      notes: aiNotes
    });
  };

  const handlePreview = () => {
    const { totalHours, totalAmount } = calculateInvoiceData(formData.selectedTasks);

    const invoice: Invoice = {
      id: 'preview',
      taskIds: formData.selectedTasks,
      totalHours,
      totalAmount,
      status: 'draft',
      createdAt: new Date().toISOString(),
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      description: formData.description,
      notes: formData.notes
    };

    setPreviewInvoice(invoice);
  };

  const handleCreateInvoice = () => {
    const { totalHours, totalAmount } = calculateInvoiceData(formData.selectedTasks);

    onCreateInvoice({
      taskIds: formData.selectedTasks,
      totalHours,
      totalAmount,
      status: 'draft',
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      description: formData.description,
      notes: formData.notes
    });

    setFormData({
      selectedTasks: [],
      clientName: '',
      clientEmail: '',
      description: '',
      notes: ''
    });
    setIsCreateDialogOpen(false);
  };

  const tasksWithUnbilledTime = tasks.filter(task =>
    availableTimeLogs.some(log => log.taskId === task.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Invoice Generator</h1>
          <p className="text-muted-foreground">
            Create AI-powered professional invoices from your time logs
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={tasksWithUnbilledTime.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Task Selection */}
              <div>
                <Label>Select Tasks to Invoice</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {tasksWithUnbilledTime.map(task => {
                    const taskLogs = availableTimeLogs.filter(log => log.taskId === task.id);
                    const totalHours = taskLogs.reduce((sum, log) => sum + log.hours, 0);
                    const totalAmount = totalHours * task.rate;

                    return (
                      <div
                        key={task.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.selectedTasks.includes(task.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                          }`}
                        onClick={() => handleTaskToggle(task.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{task.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {totalHours.toFixed(1)} hours @ ${task.rate}/hr
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${totalAmount.toFixed(2)}</p>
                            <Badge variant="outline">{taskLogs.length} logs</Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Client Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client-name">Client Name</Label>
                  <Input
                    id="client-name"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Client or company name"
                  />
                </div>
                <div>
                  <Label htmlFor="client-email">Client Email</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    placeholder="client@example.com"
                  />
                </div>
              </div>

              {/* AI-Generated Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="description">Invoice Description</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAIGenerate}
                    disabled={formData.selectedTasks.length === 0}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    AI Generate
                  </Button>
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description of services provided..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes & Terms</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Payment terms, additional notes..."
                  rows={3}
                />
              </div>

              {/* Summary */}
              {formData.selectedTasks.length > 0 && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Invoice Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Hours:</span>
                      <span>{calculateInvoiceData(formData.selectedTasks).totalHours.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total Amount:</span>
                      <span>${calculateInvoiceData(formData.selectedTasks).totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                  disabled={formData.selectedTasks.length === 0}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button
                  onClick={handleCreateInvoice}
                  disabled={formData.selectedTasks.length === 0}
                >
                  Create Invoice
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* No unbilled time message */}
      {tasksWithUnbilledTime.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No unbilled time available</h3>
            <p className="text-muted-foreground">
              Track some time or create tasks to generate invoices.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Existing Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No invoices created yet. Create your first invoice to see it here.
            </p>
          ) : (
            <div className="space-y-4">
              {invoices
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(invoice => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h4 className="font-medium">Invoice #{invoice.id.slice(0, 8)}</h4>
                      <p className="text-sm text-muted-foreground">
                        {invoice.clientName || 'No client name'} • {invoice.totalHours.toFixed(1)} hours
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(invoice.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${invoice.totalAmount.toFixed(2)}</p>
                      <Badge
                        variant={
                          invoice.status === 'paid' ? 'default' :
                            invoice.status === 'approved' ? 'default' :
                              invoice.status === 'pending_approval' ? 'secondary' :
                                invoice.status === 'rejected' ? 'destructive' :
                                  invoice.status === 'sent' ? 'secondary' : 'outline'
                        }
                      >
                        {invoice.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      {previewInvoice && (
        <Dialog open={true} onOpenChange={() => setPreviewInvoice(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Preview</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-6 bg-white text-black rounded-lg">
              <div className="text-center border-b pb-4 relative">
                {userProfile?.logoUrl && (
                  <img
                    src={userProfile.logoUrl}
                    alt="Logo"
                    className="h-16 w-auto object-contain absolute left-0 top-0"
                  />
                )}
                <h2 className="text-2xl font-bold">INVOICE</h2>
                <p className="text-gray-600">Invoice #INV-{Date.now().toString().slice(-6)}</p>
                <p className="text-gray-600">Date: {new Date().toLocaleDateString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold mb-2">From:</h3>
                  <p>{userProfile?.businessName || 'Your Business Name'}</p>
                  <p>{userProfile?.fullName || 'Your Name'}</p>
                  <p>{userProfile?.address || 'Your Address'}</p>
                  <p>{userProfile ? `${userProfile.city}, ${userProfile.state} ${userProfile.zipCode}` : 'City, State ZIP'}</p>
                  <p>{userProfile?.email || 'your-email@example.com'}</p>
                  <p>{userProfile?.phone || 'Your Phone'}</p>
                </div>
                <div>
                  <h3 className="font-bold mb-2">To:</h3>
                  <p>{previewInvoice.clientName || 'Client Name'}</p>
                  <p>{previewInvoice.clientEmail || 'Client Email'}</p>
                </div>
              </div>

              {previewInvoice.description && (
                <div>
                  <h3 className="font-bold mb-2">Description of Services:</h3>
                  <p className="text-gray-700">{previewInvoice.description}</p>
                </div>
              )}

              <div>
                <h3 className="font-bold mb-4">Time Breakdown:</h3>
                <div className="space-y-2">
                  {previewInvoice.taskIds.map(taskId => {
                    const task = tasks.find(t => t.id === taskId);
                    const taskLogs = availableTimeLogs.filter(log => log.taskId === taskId);
                    const totalHours = taskLogs.reduce((sum, log) => sum + log.hours, 0);
                    const amount = totalHours * (task?.rate || 0);

                    return (
                      <div key={taskId} className="flex justify-between border-b pb-2">
                        <span>{task?.name || 'Unknown Task'}</span>
                        <span>{totalHours.toFixed(1)} hrs @ ${task?.rate || 0}/hr</span>
                        <span>${amount.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total Amount Due:</span>
                  <span>${previewInvoice.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {previewInvoice.notes && (
                <div>
                  <h3 className="font-bold mb-2">Terms & Notes:</h3>
                  <p className="text-gray-700 whitespace-pre-line">{previewInvoice.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
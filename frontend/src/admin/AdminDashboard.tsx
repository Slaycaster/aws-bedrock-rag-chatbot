import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import ChatWidget from '../widget/ChatWidget';
import SetupGuideModal from '../wizard/SetupGuideModal';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('config');
  const [config, setConfig] = useState<any>({});
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [syncStatus, setSyncStatus] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await api.get('/admin/config');
      setConfig(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfigUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/config', config);
      alert('Config updated!');
    } catch (err) {
      alert('Error updating config');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploadStatus('Uploading...');
    try {
      const formData = new FormData();
      formData.append('files', file);
      await api.post('/admin/upload', formData);
      setUploadStatus('Upload successful!');
      setFile(null);
    } catch (err) {
      setUploadStatus('Upload failed.');
    }
  };

  const handleSync = async () => {
    setSyncStatus('Starting sync...');
    try {
      await api.post('/admin/sync');
      setSyncStatus('Sync job started!');
    } catch (err) {
      setSyncStatus('Sync failed.');
    }
  };

  const handleReset = async () => {
    try {
      await api.post('/admin/reset');
      localStorage.removeItem('token');
      window.location.href = '/';
    } catch (err) {
      alert('Error resetting application');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r shadow-sm">
        <div className="p-6 border-b">
          <h3 className="font-bold text-lg">Admin Panel</h3>
        </div>
        <nav className="p-4 space-y-2">
          <Button variant={activeTab === 'config' ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('config')}>Configuration</Button>
          <Button variant={activeTab === 'embed' ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('embed')}>Embed Code</Button>
          <Button variant={activeTab === 'files' ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('files')}>Files & Sync</Button>
          <Button variant={activeTab === 'preview' ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('preview')}>Chat Preview</Button>
        </nav>
        <div className="p-4 mt-auto border-t">
           <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => {
             localStorage.removeItem('token');
             navigate('/login');
           }}>Logout</Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'config' && (
          <div className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col space-y-1.5">
                  <CardTitle>Configuration</CardTitle>
                  <CardDescription>Manage your chatbot settings and AWS credentials.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowGuide(true)}>Guide me on setting up AWS details</Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleConfigUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Bot Name</Label>
                    <Input value={config.bot_name || ''} onChange={e => setConfig({...config, bot_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Greeting Message</Label>
                    <Textarea value={config.greeting_message || ''} onChange={e => setConfig({...config, greeting_message: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Response Model</Label>
                    <select 
                      value={config.model_arn || 'arn:aws:bedrock:us-east-1::inference-profile/global.anthropic.claude-haiku-4-5-20251001-v1:0'} 
                      onChange={e => setConfig({...config, model_arn: e.target.value})}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="arn:aws:bedrock:us-east-1::inference-profile/global.anthropic.claude-haiku-4-5-20251001-v1:0">Claude 4.5 Haiku (Fast & Cost-effective)</option>
                      <option value="arn:aws:bedrock:us-east-1::inference-profile/global.anthropic.claude-sonnet-4-20250514-v1:0">Claude 4 Sonnet (Balanced)</option>
                      <option value="arn:aws:bedrock:us-east-1::inference-profile/global.anthropic.claude-sonnet-4-5-20250929-v1:0">Claude 4.5 Sonnet (Most Capable)</option>
                    </select>
                    <p className="text-xs text-muted-foreground">Choose the model for generating responses</p>
                  </div>
                  <div className="border-t pt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>AWS Access Key ID</Label>
                      <Input value={config.aws_access_key_id || ''} onChange={e => setConfig({...config, aws_access_key_id: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>AWS Account ID</Label>
                      <Input value={config.aws_account_id || ''} onChange={e => setConfig({...config, aws_account_id: e.target.value})} />
                      <p className="text-xs text-muted-foreground">Find this in AWS Console → Click your name (top right) → Account ID</p>
                    </div>
                    <div className="space-y-2">
                      <Label>AWS Region</Label>
                      <Input value={config.aws_region || 'us-east-1'} readOnly className="bg-muted" />
                      <p className="text-xs text-muted-foreground">Fixed to us-east-1 for best model availability</p>
                    </div>
                    <div className="space-y-2">
                      <Label>S3 Bucket Name</Label>
                      <Input value={config.s3_bucket_name || ''} onChange={e => setConfig({...config, s3_bucket_name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>KB ID</Label>
                      <Input value={config.kb_id || ''} onChange={e => setConfig({...config, kb_id: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Source ID</Label>
                      <Input value={config.data_source_id || ''} onChange={e => setConfig({...config, data_source_id: e.target.value})} />
                    </div>
                  </div>
                  <Button>Save Config</Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-500">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={() => setShowResetConfirm(true)}>Reset Application</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'embed' && (
          <div className="space-y-6 max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle>Embed Chat Widget</CardTitle>
                <CardDescription>Copy and paste this code into your website to embed the chatbot.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Embed Code</Label>
                  <div className="relative">
                    <Textarea 
                      readOnly 
                      value={`<!-- RAG Chatbot Widget -->
<div id="rag-chatbot-widget"></div>
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/widget.js';
    script.async = true;
    document.body.appendChild(script);
  })();
</script>`}
                      className="font-mono text-sm h-48"
                    />
                    <Button 
                      size="sm" 
                      className="absolute top-2 right-2"
                      onClick={() => {
                        navigator.clipboard.writeText(`<!-- RAG Chatbot Widget -->
<div id="rag-chatbot-widget"></div>
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/widget.js';
    script.async = true;
    document.body.appendChild(script);
  })();
</script>`);
                        alert('Copied to clipboard!');
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Copy the embed code above</li>
                    <li>Paste it into your website's HTML, just before the closing <code>&lt;/body&gt;</code> tag</li>
                    <li>The chat widget will appear in the bottom-right corner of your page</li>
                  </ol>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm mb-2">Direct Widget URL:</h4>
                  <div className="flex gap-2">
                    <Input 
                      readOnly 
                      value={`${window.location.origin}/widget`}
                      className="font-mono text-sm"
                    />
                    <Button 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/widget`);
                        alert('URL copied to clipboard!');
                      }}
                    >
                      Copy URL
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    You can also access the chat widget directly at this URL or embed it in an iframe.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Upload File</CardTitle>
                <CardDescription>Upload a new document to your Knowledge Base.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-4">
                  <Input type="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} />
                  <Button disabled={!file}>Upload</Button>
                  {uploadStatus && <p className="text-sm text-muted-foreground">{uploadStatus}</p>}
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sync Knowledge Base</CardTitle>
                <CardDescription>Trigger a sync to update the chatbot with the latest files from S3.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleSync}>Start Sync</Button>
                {syncStatus && <p className="text-sm text-muted-foreground">{syncStatus}</p>}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="flex justify-center items-start h-full">
            <ChatWidget />
          </div>
        )}
      </div>

      <SetupGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your configuration and admin account. You will need to run the setup wizard again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReset}>Yes, Reset Everything</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminDashboard;

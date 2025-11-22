import { useState } from 'react';
import api from '../api';
import SetupGuideModal from './SetupGuideModal';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface WizardProps {
  onComplete: () => void;
}

function Wizard({ onComplete }: WizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    aws_access_key_id: '',
    aws_secret_access_key: '',
    aws_account_id: '',
    aws_region: 'us-east-1',
    kb_id: '',
    data_source_id: '',
    s3_bucket_name: '',
    model_arn: 'arn:aws:bedrock:us-east-1::inference-profile/global.anthropic.claude-haiku-4-5-20251001-v1:0'
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/setup-admin', {
        username: formData.username,
        password: formData.password
      });
      // Auto login
      const loginData = new FormData();
      loginData.append('username', formData.username);
      loginData.append('password', formData.password);
      const res = await api.post('/auth/token', loginData);
      localStorage.setItem('token', res.data.access_token);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error creating admin');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/config', {
        aws_access_key_id: formData.aws_access_key_id,
        aws_secret_access_key: formData.aws_secret_access_key,
        aws_account_id: formData.aws_account_id,
        aws_region: formData.aws_region,
        kb_id: formData.kb_id,
        data_source_id: formData.data_source_id,
        s3_bucket_name: formData.s3_bucket_name,
        model_arn: formData.model_arn
      });
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error saving config');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (files && files.length > 0) {
        const uploadData = new FormData();
        for (let i = 0; i < files.length; i++) {
          uploadData.append('files', files[i]);
        }
        await api.post('/admin/upload', uploadData);
        await api.post('/admin/sync');
      }
      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error uploading/syncing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Setup Wizard - Step {step} of 3</CardTitle>
          <CardDescription>
            {step === 1 && "Create your admin account."}
            {step === 2 && "Configure your AWS resources."}
            {step === 3 && "Upload your knowledge base documents."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" value={formData.username} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" name="password" value={formData.password} onChange={handleInputChange} required />
              </div>
              <div className="flex justify-end">
                <Button disabled={loading}>Next</Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Enter your AWS credentials.</p>
                <Button type="button" variant="link" onClick={() => setShowGuide(true)}>Guide me on setting up AWS details</Button>
              </div>
              <SetupGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>AWS Access Key ID</Label>
                  <Input name="aws_access_key_id" value={formData.aws_access_key_id} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label>AWS Secret Access Key</Label>
                  <Input type="password" name="aws_secret_access_key" value={formData.aws_secret_access_key} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label>AWS Account ID</Label>
                  <Input name="aws_account_id" value={formData.aws_account_id} onChange={handleInputChange} required />
                  <p className="text-xs text-muted-foreground">Find this in AWS Console → Click your name (top right) → Account ID</p>
                </div>
                <div className="space-y-2">
                  <Label>AWS Region</Label>
                  <Input name="aws_region" value={formData.aws_region} readOnly className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Fixed to us-east-1 for best model availability</p>
                </div>
                <div className="space-y-2">
                  <Label>S3 Bucket Name</Label>
                  <Input name="s3_bucket_name" value={formData.s3_bucket_name} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Knowledge Base ID</Label>
                  <Input name="kb_id" value={formData.kb_id} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Data Source ID</Label>
                  <Input name="data_source_id" value={formData.data_source_id} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Response Model</Label>
                  <select 
                    name="model_arn"
                    value={formData.model_arn} 
                    onChange={(e) => setFormData({...formData, model_arn: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="arn:aws:bedrock:us-east-1::inference-profile/global.anthropic.claude-haiku-4-5-20251001-v1:0">Claude 4.5 Haiku (Fast & Cost-effective)</option>
                    <option value="arn:aws:bedrock:us-east-1::inference-profile/global.anthropic.claude-sonnet-4-20250514-v1:0">Claude 4 Sonnet (Balanced)</option>
                    <option value="arn:aws:bedrock:us-east-1::inference-profile/global.anthropic.claude-sonnet-4-5-20250929-v1:0">Claude 4.5 Sonnet (Most Capable)</option>
                  </select>
                  <p className="text-xs text-muted-foreground">Choose the model for generating responses</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button disabled={loading}>Next</Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleStep3} className="space-y-4">
              <div className="space-y-2">
                <Label>Upload Files (Optional)</Label>
                <Input type="file" multiple onChange={(e) => setFiles(e.target.files)} />
              </div>
              <div className="flex justify-end">
                <Button disabled={loading}>{loading ? 'Syncing...' : 'Finish Setup'}</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Wizard;

import { useState, useEffect } from 'react';
import api from '../api';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface FileItem {
  key: string;
  size: number;
  last_modified: string;
}

function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [syncStatus, setSyncStatus] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; fileKey: string | null }>({ open: false, fileKey: null });

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/files');
      setFiles(res.data.files || []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = '/login';
      } else {
        console.error('Error loading files:', err);
      }
    } finally {
      setLoading(false);
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
      await loadFiles();
    } catch (err) {
      setUploadStatus('Upload failed.');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.fileKey) return;
    try {
      await api.delete(`/admin/files/${encodeURIComponent(deleteConfirm.fileKey)}`);
      setDeleteConfirm({ open: false, fileKey: null });
      await loadFiles();
    } catch (err) {
      alert('Error deleting file');
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6 max-w-4xl">
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-col space-y-1.5">
            <CardTitle>Files in S3 Bucket</CardTitle>
            <CardDescription>Manage files in your S3 bucket.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadFiles} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent>
          {loading && files.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading files...</p>
          ) : files.length === 0 ? (
            <p className="text-sm text-muted-foreground">No files found in bucket.</p>
          ) : (
            <div className="space-y-2">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold">File Name</th>
                      <th className="text-left p-3 text-sm font-semibold">Size</th>
                      <th className="text-left p-3 text-sm font-semibold">Last Modified</th>
                      <th className="text-right p-3 text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((fileItem, index) => (
                      <tr key={fileItem.key} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                        <td className="p-3 text-sm">{fileItem.key}</td>
                        <td className="p-3 text-sm text-muted-foreground">{formatFileSize(fileItem.size)}</td>
                        <td className="p-3 text-sm text-muted-foreground">{formatDate(fileItem.last_modified)}</td>
                        <td className="p-3 text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteConfirm({ open: true, fileKey: fileItem.key })}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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

      <Dialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ open, fileKey: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteConfirm.fileKey}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, fileKey: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FileManager;


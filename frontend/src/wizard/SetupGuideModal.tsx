import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AWS Setup Guide</DialogTitle>
          <DialogDescription>
            Follow these steps to configure your AWS resources.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Prerequisites</h3>
            <p className="text-sm text-muted-foreground">
              You will need an active AWS Account. This guide recommends using <strong>Claude 4.5 Haiku</strong> and <strong>Titan Embeddings v2</strong> for the best balance of cost and performance.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg text-primary">Step 1: Create an S3 Bucket</h3>
            <p className="text-sm text-muted-foreground mb-2">This is where your documents (PDFs, TXTs) will be stored.</p>
            <ol className="list-decimal list-inside space-y-2 ml-2 text-sm">
              <li>Log in to the <a href="https://s3.console.aws.amazon.com/s3/home" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Amazon S3 Console</a>.</li>
              <li>Click the orange <strong>Create bucket</strong> button.</li>
              <li><strong>Bucket name</strong>: Enter a unique name (e.g., <code>my-rag-chatbot-docs-2024</code>).</li>
              <li><strong>AWS Region</strong>: Choose <code>US East (N. Virginia) us-east-1</code> (Recommended for best model availability).</li>
              <li>Leave all other settings as default and click <strong>Create bucket</strong> at the bottom.</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-lg text-primary">Step 2: Create Knowledge Base</h3>
            <p className="text-sm text-muted-foreground mb-2">This connects your data to the AI model.</p>
            <ol className="list-decimal list-inside space-y-2 ml-2 text-sm">
              <li>Go to the <a href="https://console.aws.amazon.com/bedrock/home?region=us-east-1#/knowledge-bases" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Amazon Bedrock Knowledge Bases</a> console.</li>
              <li>Click <strong>Create knowledge base</strong>.</li>
              <li><strong>Knowledge base details</strong>:
                <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                  <li>Name: <code>my-rag-kb</code></li>
                  <li>IAM Permissions: Select <strong>Create and use a new service role</strong>.</li>
                  <li>Click <strong>Next</strong>.</li>
                </ul>
              </li>
              <li><strong>Configure data source</strong>:
                <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                  <li>Name: <code>my-data-source</code></li>
                  <li>Data source location: Select <strong>Browse S3</strong> and choose the bucket you created in Step 1.</li>
                  <li>Click <strong>Next</strong>.</li>
                </ul>
              </li>
              <li><strong>Configure data storage (The Important Part)</strong>:
                <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                  <li><strong>Embeddings model</strong>: Select <strong>Titan Embeddings v2</strong> (or the latest available Titan model in your region).</li>
                  <li><strong>Vector store</strong>: Select <strong>Quick create a new vector store</strong> (Recommended - uses OpenSearch Serverless).</li>
                  <li>Click <strong>Next</strong>.</li>
                </ul>
              </li>
              <li><strong>Review and create</strong>:
                <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                  <li>Review your settings.</li>
                  <li>Click <strong>Create knowledge base</strong>.</li>
                  <li><em>Note: This may take a few minutes to initialize.</em></li>
                </ul>
              </li>
              <li><strong>Save your IDs</strong>:
                <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                  <li>Once created, look for the <strong>Knowledge base ID</strong> (e.g., <code>ABC123XYZ</code>) on the top right.</li>
                  <li>Scroll down to the <strong>Data source</strong> section and copy the <strong>Data source ID</strong>.</li>
                </ul>
              </li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-lg text-primary">Step 3: Get Access Keys</h3>
            <p className="text-sm text-muted-foreground mb-2">To allow this app to talk to your AWS account.</p>
            <ol className="list-decimal list-inside space-y-2 ml-2 text-sm">
              <li>Go to the <a href="https://us-east-1.console.aws.amazon.com/iam/home" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">IAM Console</a>.</li>
              <li>Click <strong>Users</strong> in the sidebar &rarr; <strong>Create user</strong>.</li>
              <li>Name: <code>rag-chatbot-user</code> &rarr; Next.</li>
              <li><strong>Permissions</strong>: Select <strong>Attach policies directly</strong>.</li>
              <li>Search for and check:
                <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                  <li><code>AmazonBedrockFullAccess</code></li>
                  <li><code>AmazonS3FullAccess</code></li>
                </ul>
              </li>
              <li>Click <strong>Next</strong> &rarr; <strong>Create user</strong>.</li>
              <li>Click on the newly created user name.</li>
              <li>Go to the <strong>Security credentials</strong> tab.</li>
              <li>Scroll to <strong>Access keys</strong> &rarr; <strong>Create access key</strong>.</li>
              <li>Select <strong>Application running outside AWS</strong> &rarr; Next &rarr; Create access key.</li>
              <li><strong>Copy the Access Key ID and Secret Access Key immediately.</strong> You won't be able to see the secret key again!</li>
            </ol>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SetupGuideModal;

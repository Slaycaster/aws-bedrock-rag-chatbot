import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import ChatWidget from "../widget/ChatWidget";
import SetupGuideModal from "../wizard/SetupGuideModal";
import FileManager from "./FileManager";
import ExamManager from "./ExamManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("config");
  const [config, setConfig] = useState<any>({});
  const [showGuide, setShowGuide] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    loadConfig();
  }, [navigate]);

  const loadConfig = async () => {
    try {
      const res = await api.get("/admin/config");
      setConfig(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  };

  const handleConfigUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/admin/config", config);
      alert("Config updated!");
      loadConfig();
    } catch (err) {
      alert("Error updating config");
    }
  };

  const handleReset = async () => {
    try {
      await api.post("/admin/reset");
      localStorage.removeItem("token");
      window.location.href = "/";
    } catch (err) {
      alert("Error resetting application");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-64 bg-white border-r shadow-sm">
        <div className="p-6 border-b">
          <h3 className="font-bold text-lg">Admin Panel</h3>
        </div>
        <nav className="p-4 space-y-2">
          <Button
            variant={activeTab === "config" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("config")}
          >
            Configuration
          </Button>
          <Button
            variant={activeTab === "embed" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("embed")}
          >
            Embed Code
          </Button>
          <Button
            variant={activeTab === "files" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("files")}
          >
            Files & Sync
          </Button>
          <Button
            variant={activeTab === "preview" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("preview")}
          >
            Chat Preview
          </Button>
          <Button
            variant={activeTab === "exam" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("exam")}
          >
            Exam Mode
          </Button>
          <Button
            variant={activeTab === "appearance" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("appearance")}
          >
            Appearance
          </Button>
        </nav>
        <div className="p-4 mt-auto border-t">
          <Button
            variant="outline"
            className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === "config" && (
          <div className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col space-y-1.5">
                  <CardTitle>Configuration</CardTitle>
                  <CardDescription>
                    Manage your chatbot settings and AWS credentials.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGuide(true)}
                >
                  Guide me on setting up AWS details
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleConfigUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Bot Name</Label>
                    <Input
                      value={config.bot_name || ""}
                      onChange={(e) =>
                        setConfig({ ...config, bot_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Greeting Message</Label>
                    <Textarea
                      value={config.greeting_message || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          greeting_message: e.target.value,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {"{{name}}"} to insert the user's name from URL
                      parameters
                    </p>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Exam Mode</Label>
                        <p className="text-xs text-muted-foreground">
                          When enabled, users can take exams after chatting with
                          the knowledge base
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={config.enable_exam_mode || false}
                        onClick={() =>
                          setConfig({
                            ...config,
                            enable_exam_mode: !config.enable_exam_mode,
                          })
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                          config.enable_exam_mode ? "bg-primary" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.enable_exam_mode
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                    {config.enable_exam_mode && (
                      <div className="space-y-2 mt-4 pl-4 border-l-2 border-muted">
                        <Label>Webhook URL</Label>
                        <Input
                          value={config.webhook_url || ""}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              webhook_url: e.target.value,
                            })
                          }
                          placeholder="https://your-server.com/webhook"
                        />
                        <p className="text-xs text-muted-foreground">
                          Exam results will be POST-ed to this URL. Can be
                          overridden via URL parameter.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Response Model</Label>
                    <select
                      value={
                        config.model_arn ||
                        "arn:aws:bedrock:us-east-1::inference-profile/global.anthropic.claude-haiku-4-5-20251001-v1:0"
                      }
                      onChange={(e) =>
                        setConfig({ ...config, model_arn: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="arn:aws:bedrock:us-east-1::inference-profile/global.anthropic.claude-haiku-4-5-20251001-v1:0">
                        Claude 4.5 Haiku (Fast & Cost-effective)
                      </option>
                      <option value="arn:aws:bedrock:us-east-1::inference-profile/global.anthropic.claude-sonnet-4-20250514-v1:0">
                        Claude 4 Sonnet (Balanced)
                      </option>
                      <option value="arn:aws:bedrock:us-east-1::inference-profile/global.anthropic.claude-sonnet-4-5-20250929-v1:0">
                        Claude 4.5 Sonnet (Most Capable)
                      </option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Choose the model for generating responses
                    </p>
                  </div>
                  <div className="border-t pt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>AWS Access Key ID</Label>
                      <Input
                        value={config.aws_access_key_id || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            aws_access_key_id: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>AWS Account ID</Label>
                      <Input
                        value={config.aws_account_id || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            aws_account_id: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Find this in AWS Console → Click your name (top right) →
                        Account ID
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>AWS Region</Label>
                      <Input
                        value={config.aws_region || "us-east-1"}
                        readOnly
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Fixed to us-east-1 for best model availability
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>S3 Bucket Name</Label>
                      <Input
                        value={config.s3_bucket_name || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            s3_bucket_name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>KB ID</Label>
                      <Input
                        value={config.kb_id || ""}
                        onChange={(e) =>
                          setConfig({ ...config, kb_id: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Source ID</Label>
                      <Input
                        value={config.data_source_id || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            data_source_id: e.target.value,
                          })
                        }
                      />
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
                <Button
                  variant="destructive"
                  onClick={() => setShowResetConfirm(true)}
                >
                  Reset Application
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "embed" && (
          <div className="space-y-6 max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle>Embed Chat Widget</CardTitle>
                <CardDescription>
                  Copy and paste this code into your website to embed the
                  chatbot.
                </CardDescription>
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
                        navigator.clipboard
                          .writeText(`<!-- RAG Chatbot Widget -->
<div id="rag-chatbot-widget"></div>
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/widget.js';
    script.async = true;
    document.body.appendChild(script);
  })();
</script>`);
                        alert("Copied to clipboard!");
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
                    <li>
                      Paste it into your website's HTML, just before the closing{" "}
                      <code>&lt;/body&gt;</code> tag
                    </li>
                    <li>
                      The chat widget will appear in the bottom-right corner of
                      your page
                    </li>
                  </ol>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm mb-2">
                    Direct Widget URL:
                  </h4>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={`${window.location.origin}/widget`}
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}/widget`
                        );
                        alert("URL copied to clipboard!");
                      }}
                    >
                      Copy URL
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    You can also access the chat widget directly at this URL or
                    embed it in an iframe.
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm mb-2">
                    Widget URL Parameters:
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    You can customize the widget by adding GET parameters to the
                    URL:
                  </p>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm break-all">
                    {`${
                      window.location.origin
                    }/widget?name=John&id=12345&webhook=https://your-server.com/webhook&data=${encodeURIComponent(
                      '{"course_id":"101"}'
                    )}`}
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex gap-2">
                      <code className="bg-muted px-2 py-1 rounded">name</code>
                      <span className="text-muted-foreground">
                        User's display name (use {"{{name}}"} in greeting
                        message)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <code className="bg-muted px-2 py-1 rounded">id</code>
                      <span className="text-muted-foreground">
                        External user ID for tracking
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <code className="bg-muted px-2 py-1 rounded">
                        webhook
                      </code>
                      <span className="text-muted-foreground">
                        Override webhook URL (falls back to Configuration
                        setting)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <code className="bg-muted px-2 py-1 rounded">data</code>
                      <span className="text-muted-foreground">
                        URL-encoded JSON object with custom data (passed to
                        webhook)
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-sm text-blue-800 mb-2">
                      Webhook Payload Example:
                    </h5>
                    <pre className="text-xs text-blue-700 overflow-x-auto">
                      {JSON.stringify(
                        {
                          event: "exam_completed",
                          external_user_id: "12345",
                          external_user_name: "John",
                          session_id: "uuid-here",
                          total_questions: 10,
                          correct_answers: 8,
                          score_percentage: 80,
                          passed: true,
                          passing_score: 70,
                          custom_data: { course_id: "101" },
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "files" && <FileManager />}

        {activeTab === "preview" && (
          <div className="flex justify-center items-start h-full">
            <ChatWidget />
          </div>
        )}

        {activeTab === "exam" && <ExamManager />}

        {activeTab === "appearance" && (
          <div className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Chat Widget Appearance</CardTitle>
                <CardDescription>
                  Customize the colors of your chatbot widget.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleConfigUpdate} className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Primary Colors</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Primary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={config.primary_color || "#18181b"}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                primary_color: e.target.value,
                              })
                            }
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={config.primary_color || "#18181b"}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                primary_color: e.target.value,
                              })
                            }
                            placeholder="#18181b"
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Header background, buttons
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Primary Foreground</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={config.primary_foreground || "#fafafa"}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                primary_foreground: e.target.value,
                              })
                            }
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={config.primary_foreground || "#fafafa"}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                primary_foreground: e.target.value,
                              })
                            }
                            placeholder="#fafafa"
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Header text, button text
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <h4 className="font-medium text-sm">User Message Bubble</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Background</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={config.chat_bubble_user || "#18181b"}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                chat_bubble_user: e.target.value,
                              })
                            }
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={config.chat_bubble_user || "#18181b"}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                chat_bubble_user: e.target.value,
                              })
                            }
                            placeholder="#18181b"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Text</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={
                              config.chat_bubble_user_foreground || "#fafafa"
                            }
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                chat_bubble_user_foreground: e.target.value,
                              })
                            }
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={
                              config.chat_bubble_user_foreground || "#fafafa"
                            }
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                chat_bubble_user_foreground: e.target.value,
                              })
                            }
                            placeholder="#fafafa"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <h4 className="font-medium text-sm">Bot Message Bubble</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Background</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={config.chat_bubble_bot || "#f4f4f5"}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                chat_bubble_bot: e.target.value,
                              })
                            }
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={config.chat_bubble_bot || "#f4f4f5"}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                chat_bubble_bot: e.target.value,
                              })
                            }
                            placeholder="#f4f4f5"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Text</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={
                              config.chat_bubble_bot_foreground || "#18181b"
                            }
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                chat_bubble_bot_foreground: e.target.value,
                              })
                            }
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={
                              config.chat_bubble_bot_foreground || "#18181b"
                            }
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                chat_bubble_bot_foreground: e.target.value,
                              })
                            }
                            placeholder="#18181b"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-sm mb-4">Preview</h4>
                    <div className="border rounded-lg p-4 bg-white">
                      <div
                        className="rounded-t-lg p-3 mb-4"
                        style={{
                          backgroundColor: config.primary_color || "#18181b",
                          color: config.primary_foreground || "#fafafa",
                        }}
                      >
                        <span className="font-medium">
                          {config.bot_name || "Chat Support"}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-start">
                          <div
                            className="rounded-lg px-4 py-2 max-w-[80%]"
                            style={{
                              backgroundColor:
                                config.chat_bubble_bot || "#f4f4f5",
                              color:
                                config.chat_bubble_bot_foreground || "#18181b",
                            }}
                          >
                            Hello! How can I help you today?
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div
                            className="rounded-lg px-4 py-2 max-w-[80%]"
                            style={{
                              backgroundColor:
                                config.chat_bubble_user || "#18181b",
                              color:
                                config.chat_bubble_user_foreground || "#fafafa",
                            }}
                          >
                            I have a question about the product.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button type="submit">Save Appearance</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <SetupGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              configuration and admin account. You will need to run the setup
              wizard again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              Yes, Reset Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminDashboard;

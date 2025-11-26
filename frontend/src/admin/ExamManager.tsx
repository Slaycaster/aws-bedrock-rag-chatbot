import { useState, useEffect, useRef } from "react";
import api from "../api";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, GripVertical, Check, X, Image } from "lucide-react";

interface ExamQuestion {
  id?: number;
  question_text: string;
  question_image_url?: string | null;
  option_a: string;
  option_b: string;
  option_c?: string | null;
  option_d?: string | null;
  correct_answer: string;
  explanation?: string | null;
  order_index: number;
  is_active: boolean;
}

interface ExamConfig {
  passing_score: number;
  exam_title: string;
  exam_description?: string | null;
  show_correct_answers: boolean;
  shuffle_questions: boolean;
}

interface ExamResult {
  id: number;
  external_user_id?: string;
  external_user_name?: string;
  session_id: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  passed: boolean;
  webhook_sent: boolean;
  completed_at: string;
}

function ExamManager() {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [config, setConfig] = useState<ExamConfig>({
    passing_score: 70,
    exam_title: "Knowledge Assessment",
    exam_description: "",
    show_correct_answers: true,
    shuffle_questions: false,
  });
  const [results, setResults] = useState<ExamResult[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(
    null
  );
  const [formData, setFormData] = useState<ExamQuestion>({
    question_text: "",
    question_image_url: null,
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "A",
    explanation: "",
    order_index: 0,
    is_active: true,
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadQuestions();
    loadConfig();
    loadResults();
  }, []);

  const loadQuestions = async () => {
    try {
      const response = await api.get("/exam/questions");
      setQuestions(response.data);
    } catch (error) {
      console.error("Failed to load questions:", error);
    }
  };

  const loadConfig = async () => {
    try {
      const response = await api.get("/exam/config");
      setConfig(response.data);
    } catch (error) {
      console.error("Failed to load exam config:", error);
    }
  };

  const loadResults = async () => {
    try {
      const response = await api.get("/exam/results");
      setResults(response.data);
    } catch (error) {
      console.error("Failed to load results:", error);
    }
  };

  const handleOpenDialog = (question?: ExamQuestion) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({ ...question });
    } else {
      setEditingQuestion(null);
      setFormData({
        question_text: "",
        question_image_url: null,
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_answer: "A",
        explanation: "",
        order_index: questions.length,
        is_active: true,
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingQuestion?.id) {
        await api.put(`/exam/questions/${editingQuestion.id}`, formData);
      } else {
        await api.post("/exam/questions", formData);
      }
      setShowDialog(false);
      loadQuestions();
    } catch (error) {
      console.error("Failed to save question:", error);
      alert("Error saving question");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this question?")) {
      return;
    }
    try {
      await api.delete(`/exam/questions/${id}`);
      loadQuestions();
    } catch (error) {
      console.error("Failed to delete question:", error);
      alert("Error deleting question");
    }
  };

  const handleConfigSave = async () => {
    try {
      await api.post("/exam/config", config);
      alert("Exam settings saved!");
    } catch (error) {
      console.error("Failed to save config:", error);
      alert("Error saving settings");
    }
  };

  const handleImageUpload = async (questionId: number, file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post(
        `/exam/questions/${questionId}/upload-image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      loadQuestions();
      return response.data.image_url;
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Error uploading image");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleNewQuestionImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (editingQuestion?.id) {
      const imageUrl = await handleImageUpload(editingQuestion.id, file);
      if (imageUrl) {
        setFormData({ ...formData, question_image_url: imageUrl });
      }
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          question_image_url: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Exam Questions</CardTitle>
                <CardDescription>
                  Configure the questions that will be asked during the exam.
                </CardDescription>
              </div>
              <Button onClick={() => handleOpenDialog()}>+ New Question</Button>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No questions configured. Create one to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((question, idx) => (
                    <Card
                      key={question.id}
                      className={`${!question.is_active ? "opacity-50" : ""}`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex gap-4">
                          <div className="flex items-center text-muted-foreground">
                            <GripVertical className="h-5 w-5" />
                            <span className="ml-1 text-sm font-medium">
                              #{idx + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              {question.question_image_url && (
                                <img
                                  src={
                                    question.question_image_url.startsWith(
                                      "data:"
                                    )
                                      ? question.question_image_url
                                      : `/api${question.question_image_url}`
                                  }
                                  alt="Question"
                                  className="w-20 h-20 object-cover rounded border"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium mb-2">
                                  {question.question_text}
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div
                                    className={`px-2 py-1 rounded ${
                                      question.correct_answer === "A"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-muted"
                                    }`}
                                  >
                                    A: {question.option_a}
                                  </div>
                                  <div
                                    className={`px-2 py-1 rounded ${
                                      question.correct_answer === "B"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-muted"
                                    }`}
                                  >
                                    B: {question.option_b}
                                  </div>
                                  {question.option_c && (
                                    <div
                                      className={`px-2 py-1 rounded ${
                                        question.correct_answer === "C"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-muted"
                                      }`}
                                    >
                                      C: {question.option_c}
                                    </div>
                                  )}
                                  {question.option_d && (
                                    <div
                                      className={`px-2 py-1 rounded ${
                                        question.correct_answer === "D"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-muted"
                                      }`}
                                    >
                                      D: {question.option_d}
                                    </div>
                                  )}
                                </div>
                                {!question.is_active && (
                                  <span className="text-xs text-muted-foreground mt-2 block">
                                    (Inactive)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(question)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(question.id!)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exam Settings</CardTitle>
              <CardDescription>Configure how the exam behaves.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Exam Title</Label>
                <Input
                  value={config.exam_title}
                  onChange={(e) =>
                    setConfig({ ...config, exam_title: e.target.value })
                  }
                  placeholder="Knowledge Assessment"
                />
              </div>
              <div className="space-y-2">
                <Label>Exam Description</Label>
                <Textarea
                  value={config.exam_description || ""}
                  onChange={(e) =>
                    setConfig({ ...config, exam_description: e.target.value })
                  }
                  placeholder="Test your knowledge..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Passing Score (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={config.passing_score}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      passing_score: parseFloat(e.target.value) || 70,
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="show_correct_answers"
                  checked={config.show_correct_answers}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      show_correct_answers: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label
                  htmlFor="show_correct_answers"
                  className="cursor-pointer"
                >
                  Show correct answers after submission
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="shuffle_questions"
                  checked={config.shuffle_questions}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      shuffle_questions: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="shuffle_questions" className="cursor-pointer">
                  Shuffle question order
                </Label>
              </div>
              <Button onClick={handleConfigSave}>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exam Results</CardTitle>
              <CardDescription>
                View recent exam submissions and scores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No exam results yet.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-7 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                    <div>User</div>
                    <div>Score</div>
                    <div>Result</div>
                    <div>Questions</div>
                    <div>Correct</div>
                    <div>Webhook</div>
                    <div>Date</div>
                  </div>
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="grid grid-cols-7 gap-4 text-sm py-2 border-b"
                    >
                      <div className="truncate">
                        {result.external_user_name ||
                          result.external_user_id ||
                          "-"}
                      </div>
                      <div className="font-medium">
                        {result.score_percentage.toFixed(1)}%
                      </div>
                      <div>
                        {result.passed ? (
                          <span className="inline-flex items-center text-green-600">
                            <Check className="h-4 w-4 mr-1" /> Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-red-600">
                            <X className="h-4 w-4 mr-1" /> Failed
                          </span>
                        )}
                      </div>
                      <div>{result.total_questions}</div>
                      <div>{result.correct_answers}</div>
                      <div>
                        {result.webhook_sent ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(result.completed_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Edit Question" : "New Question"}
            </DialogTitle>
            <DialogDescription>
              Create a multiple choice question for the exam.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Question Text *</Label>
              <Textarea
                value={formData.question_text}
                onChange={(e) =>
                  setFormData({ ...formData, question_text: e.target.value })
                }
                placeholder="Enter your question..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Question Image (Optional)</Label>
              <div className="flex items-center gap-4">
                {formData.question_image_url && (
                  <img
                    src={
                      formData.question_image_url.startsWith("data:")
                        ? formData.question_image_url
                        : `/api${formData.question_image_url}`
                    }
                    alt="Question preview"
                    className="w-24 h-24 object-cover rounded border"
                  />
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleNewQuestionImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Image className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload Image"}
                  </Button>
                  {formData.question_image_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-2 text-red-500"
                      onClick={() =>
                        setFormData({ ...formData, question_image_url: null })
                      }
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Option A *</Label>
                <Input
                  value={formData.option_a}
                  onChange={(e) =>
                    setFormData({ ...formData, option_a: e.target.value })
                  }
                  placeholder="First option"
                />
              </div>
              <div className="space-y-2">
                <Label>Option B *</Label>
                <Input
                  value={formData.option_b}
                  onChange={(e) =>
                    setFormData({ ...formData, option_b: e.target.value })
                  }
                  placeholder="Second option"
                />
              </div>
              <div className="space-y-2">
                <Label>Option C (Optional)</Label>
                <Input
                  value={formData.option_c || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      option_c: e.target.value || null,
                    })
                  }
                  placeholder="Third option"
                />
              </div>
              <div className="space-y-2">
                <Label>Option D (Optional)</Label>
                <Input
                  value={formData.option_d || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      option_d: e.target.value || null,
                    })
                  }
                  placeholder="Fourth option"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Correct Answer *</Label>
              <select
                value={formData.correct_answer}
                onChange={(e) =>
                  setFormData({ ...formData, correct_answer: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                {formData.option_c && <option value="C">C</option>}
                {formData.option_d && <option value="D">D</option>}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Explanation (Optional)</Label>
              <Textarea
                value={formData.explanation || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    explanation: e.target.value || null,
                  })
                }
                placeholder="Explain why this is the correct answer..."
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ExamManager;

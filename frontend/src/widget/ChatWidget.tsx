import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Send,
  BookOpen,
  X,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "bot";
  text: string;
  citations?: any[];
  isTyping?: boolean;
  displayedText?: string;
}

interface ExamQuestion {
  id: number;
  question_text: string;
  question_image_url?: string | null;
  option_a: string;
  option_b: string;
  option_c?: string | null;
  option_d?: string | null;
}

interface AnswerSubmission {
  question_id: number;
  selected_answer: string;
}

interface ExamResult {
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  passed: boolean;
  results: {
    question_id: number;
    selected_answer: string;
    is_correct: boolean;
    correct_answer?: string;
    explanation?: string;
  }[];
}

interface ThemeColors {
  primary_color: string;
  primary_foreground: string;
  chat_bubble_user: string;
  chat_bubble_user_foreground: string;
  chat_bubble_bot: string;
  chat_bubble_bot_foreground: string;
}

const defaultTheme: ThemeColors = {
  primary_color: "#18181b",
  primary_foreground: "#fafafa",
  chat_bubble_user: "#18181b",
  chat_bubble_user_foreground: "#fafafa",
  chat_bubble_bot: "#f4f4f5",
  chat_bubble_bot_foreground: "#18181b",
};

function ChatWidget() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [botName, setBotName] = useState<string>("Chat Support");
  const [examModeEnabled, setExamModeEnabled] = useState(false);
  const [theme, setTheme] = useState<ThemeColors>(defaultTheme);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [examMode, setExamMode] = useState(false);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerSubmission[]>([]);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [examConfig, setExamConfig] = useState<{
    exam_title: string;
    exam_description?: string;
  } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<{
    is_correct: boolean;
    correct_answer?: string;
    explanation?: string;
  } | null>(null);

  const externalUserId = searchParams.get("id") || undefined;
  const externalUserName = searchParams.get("name") || undefined;
  const webhookUrlParam = searchParams.get("webhook") || undefined;
  const customData = searchParams.get("data") || undefined;
  const [configWebhookUrl, setConfigWebhookUrl] = useState<string | undefined>(
    undefined
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, currentQuestionIndex, answerFeedback]);

  useEffect(() => {
    const typingMessage = messages.find((msg) => msg.isTyping);
    if (!typingMessage) return;

    const fullText = typingMessage.text;
    const currentLength = typingMessage.displayedText?.length || 0;

    if (currentLength < fullText.length) {
      const timer = setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg === typingMessage
              ? {
                  ...msg,
                  displayedText: fullText.slice(0, currentLength + 2),
                }
              : msg
          )
        );
      }, 20);
      return () => clearTimeout(timer);
    } else {
      setMessages((prev) =>
        prev.map((msg) =>
          msg === typingMessage
            ? { ...msg, isTyping: false, displayedText: fullText }
            : msg
        )
      );
    }
  }, [messages]);

  useEffect(() => {
    const fetchBotConfig = async () => {
      try {
        const response = await api.get("/admin/public-config");
        if (response.data.bot_name) {
          setBotName(response.data.bot_name);
        }
        if (response.data.enable_exam_mode !== undefined) {
          setExamModeEnabled(response.data.enable_exam_mode);
        }
        setTheme({
          primary_color:
            response.data.primary_color || defaultTheme.primary_color,
          primary_foreground:
            response.data.primary_foreground || defaultTheme.primary_foreground,
          chat_bubble_user:
            response.data.chat_bubble_user || defaultTheme.chat_bubble_user,
          chat_bubble_user_foreground:
            response.data.chat_bubble_user_foreground ||
            defaultTheme.chat_bubble_user_foreground,
          chat_bubble_bot:
            response.data.chat_bubble_bot || defaultTheme.chat_bubble_bot,
          chat_bubble_bot_foreground:
            response.data.chat_bubble_bot_foreground ||
            defaultTheme.chat_bubble_bot_foreground,
        });
        if (response.data.webhook_url) {
          setConfigWebhookUrl(response.data.webhook_url);
        }
      } catch (error) {
        console.error("Failed to fetch bot config:", error);
      }
    };
    fetchBotConfig();
  }, []);

  useEffect(() => {
    const parseGreetingTemplate = (template: string): string => {
      let result = template;

      if (externalUserName) {
        result = result.replace(/\{\{name\}\}/gi, externalUserName);
      } else {
        result = result.replace(/,?\s*\{\{name\}\}/gi, "");
        result = result.replace(/\{\{name\}\},?\s*/gi, "");
      }

      if (externalUserId) {
        result = result.replace(/\{\{id\}\}/gi, externalUserId);
      } else {
        result = result.replace(/,?\s*\{\{id\}\}/gi, "");
        result = result.replace(/\{\{id\}\},?\s*/gi, "");
      }

      return result.trim();
    };

    const fetchGreeting = async () => {
      try {
        const response = await api.get("/chat/greeting");
        if (response.data.template) {
          const greeting = parseGreetingTemplate(response.data.template);
          const greetingMsg: Message = {
            role: "bot",
            text: greeting,
            isTyping: true,
            displayedText: "",
          };
          setMessages([greetingMsg]);
        }
      } catch (error) {
        console.error("Failed to fetch greeting:", error);
      }
    };
    fetchGreeting();
  }, [externalUserName, externalUserId]);

  useEffect(() => {
    const loadExamConfig = async () => {
      try {
        const response = await api.get("/exam/public/config");
        setExamConfig(response.data);
      } catch (error) {
        console.error("Failed to load exam config:", error);
      }
    };
    loadExamConfig();
  }, []);

  const sendMessage = async (messageText: string) => {
    if (!messageText || !messageText.trim()) return;

    const userMsg: Message = { role: "user", text: messageText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/chat/", {
        message: messageText,
        session_id: sessionId,
      });

      const botMsg: Message = {
        role: "bot",
        text: response.data.response,
        citations: response.data.citations,
        isTyping: true,
        displayedText: "",
      };

      setSessionId(response.data.session_id);
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Error: Could not get response.",
          isTyping: false,
          displayedText: "Error: Could not get response.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage(input.trim());
  };

  const startExam = async () => {
    try {
      const response = await api.get("/exam/public/questions");
      if (response.data.length === 0) {
        alert("No exam questions available.");
        return;
      }
      setExamQuestions(response.data);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setExamResult(null);
      setSelectedAnswer(null);
      setAnswerFeedback(null);
      setExamMode(true);
    } catch (error) {
      console.error("Failed to load exam questions:", error);
      alert("Failed to start exam. Please try again.");
    }
  };

  const exitExam = () => {
    setExamMode(false);
    setExamQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setExamResult(null);
    setSelectedAnswer(null);
    setAnswerFeedback(null);
  };

  const handleAnswerSelect = async (answer: string) => {
    if (answerFeedback) return;
    setSelectedAnswer(answer);

    try {
      const response = await api.post("/exam/public/check-answer", {
        question_id: examQuestions[currentQuestionIndex].id,
        selected_answer: answer,
      });
      setAnswerFeedback(response.data);
      setAnswers((prev) => [
        ...prev,
        {
          question_id: examQuestions[currentQuestionIndex].id,
          selected_answer: answer,
        },
      ]);
    } catch (error) {
      console.error("Failed to check answer:", error);
    }
  };

  const nextQuestion = async () => {
    if (currentQuestionIndex < examQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setAnswerFeedback(null);
    } else {
      try {
        let parsedCustomData = undefined;
        if (customData) {
          try {
            parsedCustomData = JSON.parse(decodeURIComponent(customData));
          } catch {
            parsedCustomData = customData;
          }
        }

        const response = await api.post("/exam/public/submit", {
          session_id: sessionId || crypto.randomUUID(),
          external_user_id: externalUserId,
          external_user_name: externalUserName,
          webhook_url: webhookUrlParam || configWebhookUrl,
          custom_data: parsedCustomData,
          answers: answers,
        });
        setExamResult(response.data);
      } catch (error) {
        console.error("Failed to submit exam:", error);
        alert("Failed to submit exam. Please try again.");
      }
    }
  };

  const renderExamMode = () => {
    if (examResult) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 space-y-6">
          <div
            className={`text-6xl ${
              examResult.passed ? "text-green-500" : "text-red-500"
            }`}
          >
            {examResult.passed ? (
              <CheckCircle2 className="w-24 h-24" />
            ) : (
              <XCircle className="w-24 h-24" />
            )}
          </div>
          <h2 className="text-2xl font-bold">
            {examResult.passed ? "Congratulations!" : "Keep Learning!"}
          </h2>
          <div className="text-center space-y-2">
            <p className="text-4xl font-bold">
              {examResult.score_percentage.toFixed(0)}%
            </p>
            <p className="text-muted-foreground">
              {examResult.correct_answers} of {examResult.total_questions}{" "}
              correct
            </p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={exitExam}>
              Back to Chat
            </Button>
            <Button onClick={startExam}>Retry Exam</Button>
          </div>
        </div>
      );
    }

    const question = examQuestions[currentQuestionIndex];
    if (!question) return null;

    const options = [
      { key: "A", value: question.option_a },
      { key: "B", value: question.option_b },
      ...(question.option_c ? [{ key: "C", value: question.option_c }] : []),
      ...(question.option_d ? [{ key: "D", value: question.option_d }] : []),
    ];

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <span className="font-medium">
              {examConfig?.exam_title || "Exam"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {examQuestions.length}
            </span>
            <Button variant="ghost" size="sm" onClick={exitExam}>
              <X className="h-4 w-4 mr-1" /> Exit
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {question.question_image_url && (
              <img
                src={
                  question.question_image_url.startsWith("data:")
                    ? question.question_image_url
                    : `/api${question.question_image_url}`
                }
                alt="Question"
                className="w-full max-h-64 object-contain rounded-lg border"
              />
            )}
            <h3 className="text-lg font-medium">{question.question_text}</h3>

            <div className="space-y-3">
              {options.map((option) => {
                let buttonClass =
                  "w-full justify-start text-left h-auto py-3 px-4";
                if (answerFeedback) {
                  if (option.key === answerFeedback.correct_answer) {
                    buttonClass +=
                      " bg-green-100 border-green-500 text-green-800 hover:bg-green-100";
                  } else if (
                    option.key === selectedAnswer &&
                    !answerFeedback.is_correct
                  ) {
                    buttonClass +=
                      " bg-red-100 border-red-500 text-red-800 hover:bg-red-100";
                  }
                } else if (selectedAnswer === option.key) {
                  buttonClass += " border-primary";
                }

                return (
                  <Button
                    key={option.key}
                    variant="outline"
                    className={buttonClass}
                    onClick={() => handleAnswerSelect(option.key)}
                    disabled={!!answerFeedback}
                  >
                    <span className="font-medium mr-3">{option.key}.</span>
                    {option.value}
                  </Button>
                );
              })}
            </div>

            {answerFeedback && (
              <div
                className={`p-4 rounded-lg ${
                  answerFeedback.is_correct
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {answerFeedback.is_correct ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">
                    {answerFeedback.is_correct ? "Correct!" : "Incorrect"}
                  </span>
                </div>
                {answerFeedback.explanation && (
                  <p className="text-sm text-muted-foreground">
                    {answerFeedback.explanation}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {answerFeedback && (
          <div className="p-4 border-t">
            <Button className="w-full" onClick={nextQuestion}>
              {currentQuestionIndex < examQuestions.length - 1 ? (
                <>
                  Next Question <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                "Finish Exam"
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  if (examMode) {
    return (
      <Card className="w-full h-full flex flex-col shadow-xl overflow-hidden">
        {renderExamMode()}
      </Card>
    );
  }

  return (
    <Card className="w-full h-full flex flex-col shadow-xl">
      <CardHeader
        className="p-4 border-b"
        style={{
          backgroundColor: theme.primary_color,
          color: theme.primary_foreground,
        }}
      >
        <CardTitle
          className="text-lg"
          style={{ color: theme.primary_foreground }}
        >
          {botName}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className="space-y-2">
            <div
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className="max-w-[80%] rounded-lg px-4 py-2"
                style={
                  msg.role === "user"
                    ? {
                        backgroundColor: theme.chat_bubble_user,
                        color: theme.chat_bubble_user_foreground,
                      }
                    : {
                        backgroundColor: theme.chat_bubble_bot,
                        color: theme.chat_bubble_bot_foreground,
                      }
                }
              >
                {msg.role === "bot" ? (
                  <div
                    className="prose prose-sm max-w-none"
                    style={{ color: theme.chat_bubble_bot_foreground }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.displayedText || msg.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div>{msg.text}</div>
                )}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="text-xs opacity-70 mt-1 border-t border-current/20 pt-1">
                    Sources: {msg.citations.length}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2 text-sm text-muted-foreground">
              Typing...
            </div>
          </div>
        )}

        {examModeEnabled &&
          !loading &&
          messages.length > 0 &&
          !messages[messages.length - 1]?.isTyping && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={startExam} className="gap-2">
                <BookOpen className="h-4 w-4" />
                Start Exam
              </Button>
            </div>
          )}

        <div ref={messagesEndRef} />
      </CardContent>

      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSend} className="flex w-full space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={loading}
            style={{
              backgroundColor: theme.primary_color,
              color: theme.primary_foreground,
            }}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

export default ChatWidget;

import { useState, useRef, useEffect } from "react";
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
import { Send } from "lucide-react";

interface Message {
  role: "user" | "bot";
  text: string;
  citations?: any[];
}

function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [botName, setBotName] = useState<string>("Chat Support");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const fetchBotName = async () => {
      try {
        const response = await api.get("/admin/public-config");
        if (response.data.bot_name) {
          setBotName(response.data.bot_name);
        }
      } catch (error) {
        console.error("Failed to fetch bot name:", error);
      }
    };
    fetchBotName();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/chat/", {
        message: userMsg.text,
        session_id: sessionId,
      });

      const botMsg: Message = {
        role: "bot",
        text: response.data.response,
        citations: response.data.citations,
      };

      setSessionId(response.data.session_id);
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Error: Could not get response." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col shadow-xl">
      <CardHeader className="p-4 border-b bg-muted/50">
        <CardTitle className="text-lg">{botName}</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {msg.text}
              {msg.citations && msg.citations.length > 0 && (
                <div className="text-xs opacity-70 mt-1 border-t border-white/20 pt-1">
                  Sources: {msg.citations.length}
                </div>
              )}
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
          <Button type="submit" size="icon" disabled={loading}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

export default ChatWidget;

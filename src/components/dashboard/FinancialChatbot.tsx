import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const FinancialChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const welcomeMessage: Message = {
      role: 'assistant',
      content: "Here's your financial snapshot:\nI'm your AI financial assistant, ready to analyze your data and provide personalized advice. Let's take action!\n\nStep 1: Get Started\n- What to do: Share your financial concerns or ask about specific aspects of your finances\n- Why: To receive tailored guidance based on your situation\n- How: Type your question below or ask about spending, savings, or budgeting\n\nWould you like to explore your finances together?"
    };
    setMessages([welcomeMessage]);
  }, []);

  const formatMessageContent = (content: string) => {
    // Split content into sections
    const sections = content.split('\n');
    
    return sections.map((section, index) => {
      if (section.startsWith('Step')) {
        // Style step headers
        return (
          <div key={index} className="mt-4 mb-2">
            <h3 className="font-semibold text-purple-900">{section}</h3>
          </div>
        );
      } else if (section.startsWith('-')) {
        // Style bullet points
        return (
          <div key={index} className="ml-4 my-1 flex items-start">
            <span className="mr-2 text-purple-600">•</span>
            <span>{section.substring(2)}</span>
          </div>
        );
      } else if (section.startsWith("Here's your financial snapshot:")) {
        // Style the snapshot header
        return (
          <div key={index} className="font-semibold text-lg text-purple-900 mb-2">
            {section}
          </div>
        );
      } else if (section.startsWith("Let's take action:")) {
        // Style the action header
        return (
          <div key={index} className="font-semibold text-lg text-purple-900 my-2">
            {section}
          </div>
        );
      } else if (section.startsWith("Would you like")) {
        // Style the closing question
        return (
          <div key={index} className="mt-4 text-purple-900 font-medium">
            {section}
          </div>
        );
      } else if (section.trim() !== '') {
        // Style regular text
        return <p key={index} className="my-2">{section}</p>;
      }
      return null;
    });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to use the chatbot",
          variant: "destructive",
        });
        return;
      }

      const userMessage: Message = { role: 'user', content: input };
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      const response = await fetch(
        `https://dfwiszjyvkfmpejsqvbf.functions.supabase.co/ai-insights`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            prompt: input,
            userId: user.id,
          }),
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const aiMessage: Message = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white h-full p-6 rounded-xl shadow-md">
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-purple-100 text-purple-900 ml-4'
                    : 'bg-gray-100 text-gray-900 mr-4'
                }`}
              >
                {message.role === 'assistant' 
                  ? formatMessageContent(message.content)
                  : message.content}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your finances..."
            className="resize-none bg-gray-50 text-gray-900 placeholder:text-gray-500 rounded-xl border-gray-200"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 bg-purple-600 hover:bg-purple-700 rounded-xl"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default FinancialChatbot;
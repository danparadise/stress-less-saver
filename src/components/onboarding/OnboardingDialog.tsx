import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const questions = [
  {
    title: "What are your PayGuard AI intentions?",
    options: [
      "Save Money",
      "Audit Bank Statements",
      "Track Expenses",
      "Receive Insights",
      "Other...",
    ],
  },
  {
    title: "How did you hear about us?",
    options: ["YouTube", "Social Media", "Friends/Family", "Podcasts", "Other..."],
  },
  {
    title: "Please tell us how frequently you get paid",
    options: [
      "Weekly",
      "Bi-Weekly",
      "Monthly",
      "Freelancer/ By Job",
      "Other",
    ],
  },
];

export function OnboardingDialog({ open, onOpenChange }: OnboardingDialogProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const navigate = useNavigate();

  const currentQuestion = questions[step];

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Final step - proceed to signup
      navigate("/login");
    }
  };

  const handleSelect = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[step] = value;
    setAnswers(newAnswers);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-purple-900 text-center mb-4">
            {currentQuestion.title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <RadioGroup
            onValueChange={handleSelect}
            value={answers[step]}
            className="flex flex-col space-y-3"
          >
            {currentQuestion.options.map((option) => (
              <div
                key={option}
                className="flex items-center space-x-3 rounded-lg border border-purple-100 p-4 cursor-pointer hover:bg-purple-50 transition-colors"
              >
                <RadioGroupItem value={option} id={option} className="text-purple-600" />
                <Label 
                  htmlFor={option} 
                  className="flex-grow cursor-pointer text-purple-900 font-medium"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!answers[step]}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {step === questions.length - 1 ? "Complete" : "Next"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
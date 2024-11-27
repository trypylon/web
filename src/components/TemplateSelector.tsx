import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { templates, FlowTemplate } from "@/templates";
import { useFlowStore } from "@/store/flowStore";
import { Bot, BookOpen, FileCode } from "lucide-react";

export function TemplateSelector() {
  const { loadTemplate } = useFlowStore();
  const [isOpen, setIsOpen] = React.useState(false);

  const renderTemplate = (template: FlowTemplate) => {
    const Icon = template.category === "Basic" ? Bot : BookOpen;

    return (
      <button
        key={template.id}
        onClick={() => {
          loadTemplate(template);
          setIsOpen(false);
        }}
        className="flex items-start space-x-4 p-4 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <div className="p-2 rounded-lg bg-blue-500 dark:bg-blue-600">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            {template.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {template.description}
          </p>
        </div>
      </button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="space-x-2"
          onClick={() => setIsOpen(true)}
        >
          <FileCode className="w-4 h-4" />
          <span>Load Template</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
          <DialogDescription>
            Start with a pre-built workflow template or create your own from
            scratch.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 mt-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              Basic Examples
            </h4>
            <div className="space-y-2">
              {templates
                .filter((t) => t.category === "Basic")
                .map(renderTemplate)}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              Advanced Examples
            </h4>
            <div className="space-y-2">
              {templates
                .filter((t) => t.category === "Advanced")
                .map(renderTemplate)}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

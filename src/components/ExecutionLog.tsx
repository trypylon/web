import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  MinimizeIcon,
  MaximizeIcon,
  Bug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResizablePanel } from "@/components/ui/resizable";
import { ExecutionStep } from "@/types/nodes";
import Editor from "@monaco-editor/react";

interface ExecutionLogProps {
  steps: ExecutionStep[];
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}

function isJson(str: any): boolean {
  if (typeof str !== "string" && typeof str !== "object") return false;
  if (typeof str === "object") return true;
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

function formatValue(value: any): string {
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return value?.toString() || "";
}

function TimingDisplay({
  startTime,
  endTime,
}: {
  startTime?: number;
  endTime?: number;
}) {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    if (!startTime) return;

    if (endTime) {
      setElapsed(endTime - startTime);
      return;
    }

    setElapsed(Date.now() - startTime);

    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, endTime]);

  if (!startTime) return null;

  if (!endTime && elapsed === 0) {
    setElapsed(Date.now() - startTime);
  }

  return (
    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
      <Clock className="w-3 h-3" />
      <span>{formatDuration(elapsed)}</span>
    </div>
  );
}

export function ExecutionLog({ steps }: ExecutionLogProps) {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [debugMode, setDebugMode] = useState(false);

  const sortedSteps = [...steps].sort((a, b) => {
    if (a.nodeName.includes("API Input") && !b.nodeName.includes("API Input"))
      return -1;
    if (!a.nodeName.includes("API Input") && b.nodeName.includes("API Input"))
      return 1;

    const aHasStarted = a.status === "running" || a.status === "completed";
    const bHasStarted = b.status === "running" || b.status === "completed";

    if (aHasStarted && !bHasStarted) return -1;
    if (!aHasStarted && bHasStarted) return 1;

    if (aHasStarted && bHasStarted) {
      if (a.startTime && b.startTime) {
        return a.startTime - b.startTime;
      }
    }

    return steps.indexOf(a) - steps.indexOf(b);
  });

  useEffect(() => {
    const calculateTotalTime = () => {
      const time = sortedSteps.reduce((total, step) => {
        if (step.startTime && step.endTime) {
          return total + (step.endTime - step.startTime);
        }
        return total;
      }, 0);

      if (time > 0 && time !== totalTime) {
        setTotalTime(time);
      }
    };

    calculateTotalTime();

    const hasRunningSteps = sortedSteps.some(
      (step) => step.status === "running"
    );
    if (hasRunningSteps) {
      const interval = setInterval(calculateTotalTime, 100);
      return () => clearInterval(interval);
    }
  }, [sortedSteps, totalTime]);

  useEffect(() => {
    sortedSteps.forEach((step) => {
      if (step.status === "running" && !openItems.includes(step.id)) {
        setOpenItems((prev) => [...prev, step.id]);
      }
    });
  }, [sortedSteps]);

  const renderContent = (value: any) => {
    const isJsonOutput = isJson(value);

    if (isJsonOutput) {
      return (
        <div className="border rounded-md overflow-hidden">
          <Editor
            height="200px"
            defaultLanguage="json"
            value={formatValue(value)}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 12,
              scrollBeyondLastLine: false,
              wordWrap: "on",
              domReadOnly: true,
              contextmenu: false,
              lineNumbers: "off",
            }}
          />
        </div>
      );
    }

    return (
      <pre className="whitespace-pre-wrap break-words overflow-x-auto max-w-full">
        {value}
      </pre>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Execution Log
            </h3>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {isMinimized ? (
                <MaximizeIcon className="w-4 h-4" />
              ) : (
                <MinimizeIcon className="w-4 h-4" />
              )}
            </button>
          </div>
          {totalTime > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total execution time: {formatDuration(totalTime)}
            </p>
          )}
          <label className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-700"
            />
            <Bug className="w-3 h-3" />
            <span>Debug Mode</span>
          </label>
        </div>
      </div>

      {!isMinimized && (
        <ResizablePanel
          className="overflow-y-auto"
          defaultHeight={500}
          minHeight={200}
          maxHeight={800}
        >
          <Accordion
            type="multiple"
            className="space-y-2 p-4"
            value={openItems}
            onValueChange={setOpenItems}
          >
            {sortedSteps.map((step) => (
              <AccordionItem
                key={step.id}
                value={step.id}
                className={cn(
                  "border rounded-lg overflow-hidden transition-colors",
                  {
                    "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20":
                      step.status === "error",
                    "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20":
                      step.status === "completed",
                    "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20":
                      step.status === "running",
                    "border-gray-200 dark:border-gray-700":
                      step.status === "pending",
                  }
                )}
              >
                <AccordionTrigger className="px-4 py-2 hover:no-underline">
                  <div className="flex items-center space-x-3 w-full">
                    <StatusIcon status={step.status} />
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between space-x-2">
                        <p className="font-medium truncate">{step.nodeName}</p>
                        <TimingDisplay
                          startTime={step.startTime}
                          endTime={step.endTime}
                        />
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 py-3 bg-white/50 dark:bg-gray-900/50">
                  {debugMode && step.debugLogs && (
                    <div className="mb-4 space-y-2">
                      {step.debugLogs.map((log, index) => (
                        <div
                          key={index}
                          className={cn(
                            "p-3 rounded-md text-sm font-mono max-w-full",
                            {
                              "bg-blue-50 dark:bg-blue-900/20":
                                log.type === "input",
                              "bg-green-50 dark:bg-green-900/20":
                                log.type === "output",
                              "bg-gray-50 dark:bg-gray-900/20":
                                log.type === "intermediate",
                            }
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-xs text-gray-500 dark:text-gray-400">
                              {log.label}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          {renderContent(log.value)}
                        </div>
                      ))}
                    </div>
                  )}
                  {step.status === "error" && (
                    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded overflow-x-auto">
                      <pre className="whitespace-pre-wrap break-words">
                        {step.error}
                      </pre>
                    </div>
                  )}
                  {step.status === "completed" && step.result && (
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {renderContent(step.result)}
                    </div>
                  )}
                  {step.status === "running" && (
                    <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Executing...</span>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ResizablePanel>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: ExecutionStep["status"] }) {
  switch (status) {
    case "error":
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case "completed":
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case "running":
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    default:
      return <Clock className="w-5 h-5 text-gray-400" />;
  }
}

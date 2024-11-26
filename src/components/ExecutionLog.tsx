import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertCircle, CheckCircle2, Clock, Loader2, MinimizeIcon, MaximizeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExecutionStep {
  id: string;
  nodeId: string;
  nodeName: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: number;
  endTime?: number;
  result?: string;
  error?: string;
  order?: number;
}

interface ExecutionLogProps {
  steps: ExecutionStep[];
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}

function TimingDisplay({ startTime, endTime }: { startTime?: number; endTime?: number }) {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    if (!startTime) return;

    // For completed steps, show final duration
    if (endTime) {
      setElapsed(endTime - startTime);
      return;
    }

    // For running steps, update elapsed time every 100ms
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, endTime]);

  if (!startTime) return null;

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

  // Sort steps to ensure top-level nodes appear first
  const sortedSteps = [...steps].sort((a, b) => {
    // First, prioritize running or completed steps
    const aHasStarted = a.status === 'running' || a.status === 'completed';
    const bHasStarted = b.status === 'running' || b.status === 'completed';
    
    if (aHasStarted && !bHasStarted) return -1;
    if (!aHasStarted && bHasStarted) return 1;
    
    // If both have started, sort by startTime
    if (aHasStarted && bHasStarted) {
      if (a.startTime && b.startTime) {
        return a.startTime - b.startTime;
      }
    }
    
    // If neither has started or no startTime, maintain original order
    return steps.indexOf(a) - steps.indexOf(b);
  });

  // Calculate and update total execution time
  useEffect(() => {
    const calculateTotalTime = () => {
      const time = sortedSteps.reduce((total, step) => {
        if (step.startTime && step.endTime) {
          return total + (step.endTime - step.startTime);
        }
        return total;
      }, 0);
      
      // Only update if there's a completed step and the time is different
      if (time > 0 && time !== totalTime) {
        setTotalTime(time);
      }
    };

    calculateTotalTime();

    // If any step is still running, update periodically
    const hasRunningSteps = sortedSteps.some(step => step.status === 'running');
    if (hasRunningSteps) {
      const interval = setInterval(calculateTotalTime, 100);
      return () => clearInterval(interval);
    }
  }, [sortedSteps, totalTime]);

  // Auto-expand items with errors or that are running
  useEffect(() => {
    sortedSteps.forEach(step => {
      if ((step.status === 'error' || step.status === 'running') && !openItems.includes(step.id)) {
        setOpenItems(prev => [...prev, step.id]);
      }
    });
  }, [sortedSteps, openItems]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Execution Log</h3>
          {totalTime > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total execution time: {formatDuration(totalTime)}
            </p>
          )}
        </div>
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
      
      <div className={cn(
        "transition-all duration-200 overflow-y-auto",
        isMinimized ? "max-h-0" : "max-h-[500px]"
      )}>
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
                  'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20': step.status === 'error',
                  'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20': step.status === 'completed',
                  'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20': step.status === 'running',
                  'border-gray-200 dark:border-gray-700': step.status === 'pending'
                }
              )}
            >
              <AccordionTrigger className="px-4 py-2 hover:no-underline">
                <div className="flex items-center space-x-3 w-full">
                  <StatusIcon status={step.status} />
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{step.nodeName}</p>
                      <TimingDisplay startTime={step.startTime} endTime={step.endTime} />
                    </div>
                    {step.error && (
                      <p className="text-xs text-red-600 dark:text-red-400">{step.error}</p>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-3 bg-white/50 dark:bg-gray-900/50">
                {step.status === 'error' && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                    {step.error}
                  </div>
                )}
                {step.status === 'completed' && step.result && (
                  <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {step.result}
                  </div>
                )}
                {step.status === 'running' && (
                  <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing...</span>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: ExecutionStep['status'] }) {
  switch (status) {
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'running':
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    default:
      return <Clock className="w-5 h-5 text-gray-400" />;
  }
}
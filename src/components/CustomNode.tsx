import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, useEdges } from 'reactflow';
import { Component } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFlowStore } from '@/store/flowStore';
import { registeredNodes } from '@/nodes';
import { InputType } from '@/types/nodes';

interface CustomNodeProps {
  id: string;
  data: { 
    type: string;
    label: string;
    parameters: {
      model?: string;
      prompt?: string;
    };
    isStartNode?: boolean;
  };
  selected?: boolean;
  isConnectable?: boolean;
}

export function CustomNode({ id, data, selected, isConnectable }: CustomNodeProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const edges = useEdges();

  // Find the node schema
  const nodeSchema = registeredNodes.find(node => node.type === data.type);
  if (!nodeSchema) return null;

  const Icon = nodeSchema.icon || Component;

  // Check if this node has incoming connections for specific input types
  const hasPromptInput = edges.some(edge => 
    edge.target === id && edge.targetHandle === InputType.PROMPT
  );
  const hasContextInput = edges.some(edge => 
    edge.target === id && edge.targetHandle === InputType.CONTEXT
  );

  useEffect(() => {
    if (isEditing && labelInputRef.current) {
      labelInputRef.current.focus();
    }
  }, [isEditing]);

  const handleLabelClick = () => {
    setIsEditing(true);
  };

  const handleLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(event.target.value);
  };

  const handleLabelBlur = () => {
    setIsEditing(false);
    if (label !== data.label) {
      updateNodeData(id, { label });
    }
  };

  const handleLabelKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      setIsEditing(false);
      if (label !== data.label) {
        updateNodeData(id, { label });
      }
    }
  };

  const handleModelChange = (value: string) => {
    updateNodeData(id, { 
      parameters: {
        ...data.parameters,
        model: value
      }
    });
  };

  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(id, { 
      parameters: {
        ...data.parameters,
        prompt: event.target.value
      }
    });
  };

  // Get model options from schema
  const modelParam = nodeSchema.parameters.find(p => p.name === 'model');
  const modelOptions = modelParam?.options || [];

  return (
    <div className="relative">
      {/* Input Labels */}
      <div className="absolute -left-24 top-0 h-full flex flex-col justify-between py-8 pointer-events-none">
        {nodeSchema.inputs.prompt && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Prompt
            </span>
            <Handle 
              type="target"
              position={Position.Left}
              id={InputType.PROMPT}
              className="!w-3 !h-3 !relative !left-0 !bg-blue-500 hover:!bg-blue-600 transition-colors pointer-events-auto"
              isConnectable={isConnectable}
            />
          </div>
        )}
        
        {nodeSchema.inputs.context && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              Context
            </span>
            <Handle 
              type="target"
              position={Position.Left}
              id={InputType.CONTEXT}
              className="!w-3 !h-3 !relative !left-0 !bg-green-500 hover:!bg-green-600 transition-colors pointer-events-auto"
              isConnectable={isConnectable}
            />
          </div>
        )}
      </div>

      {/* Main Node Content */}
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 ${
        selected ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
      } w-80 transition-all duration-200`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1">
              <div className="p-2 rounded-lg bg-blue-500">
                <Icon className="w-5 h-5 text-white" />
              </div>
              {isEditing ? (
                <input
                  ref={labelInputRef}
                  type="text"
                  value={label}
                  onChange={handleLabelChange}
                  onBlur={handleLabelBlur}
                  onKeyDown={handleLabelKeyDown}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              ) : (
                <span 
                  onClick={handleLabelClick}
                  className="font-medium text-gray-800 dark:text-gray-200 cursor-pointer hover:text-blue-500 dark:hover:text-blue-400"
                >
                  {label}
                </span>
              )}
            </div>
            {data.isStartNode && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Start</span>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {modelOptions.length > 0 && (
              <Select 
                defaultValue={data.parameters?.model || modelOptions[0].value}
                onValueChange={handleModelChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {modelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {!hasPromptInput && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  System Prompt
                </label>
                <textarea
                  placeholder="Enter your prompt..."
                  value={data.parameters?.prompt || ''}
                  onChange={handlePromptChange}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-40"
                  style={{ minHeight: '10rem' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Output Handle */}
        <div className="absolute -right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Handle 
            type="source" 
            position={Position.Right} 
            className="!w-3 !h-3 !bg-gray-400 hover:!bg-blue-500 transition-colors"
            isConnectable={isConnectable}
          />
          <span className="absolute left-full pl-2 text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
            Output
          </span>
        </div>
      </div>
    </div>
  );
}
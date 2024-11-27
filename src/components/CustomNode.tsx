import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, useEdges } from 'reactflow';
import { Component, ChevronDown } from 'lucide-react';
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
    parameters: Record<string, any>;
    isStartNode?: boolean;
  };
  selected?: boolean;
  isConnectable?: boolean;
}

export function CustomNode({ id, data, selected, isConnectable }: CustomNodeProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const edges = useEdges();

  // Find the node schema
  const nodeSchema = registeredNodes.find(node => node.type === data.type);
  if (!nodeSchema) return null;

  const Icon = nodeSchema.icon || Component;

  // Check if this node has incoming connections for specific input types
  const getInputConnection = (inputType: InputType) => {
    return edges.find(edge => edge.target === id && edge.targetHandle === inputType);
  };

  // Check if any advanced inputs are connected
  const hasConnectedAdvancedInputs = () => {
    return getInputConnection(InputType.MEMORY) || getInputConnection(InputType.VECTORSTORE);
  };

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

  const handleParameterChange = (name: string, value: any) => {
    updateNodeData(id, { 
      parameters: {
        ...data.parameters,
        [name]: value
      }
    });
  };

  // Get input handle color based on type
  const getHandleColor = (inputType: InputType) => {
    switch (inputType) {
      case InputType.PROMPT:
        return '!bg-blue-500';
      case InputType.CONTEXT:
        return '!bg-green-500';
      case InputType.MEMORY:
        return '!bg-purple-500';
      case InputType.VECTORSTORE:
        return '!bg-orange-500';
      default:
        return '!bg-gray-400';
    }
  };

  // Render an input field with its handle
  const renderInput = (inputType: InputType, label: string) => {
    const isConnected = getInputConnection(inputType);
    
    return (
      <div className="relative flex items-start group">
        <Handle
          type="target"
          position={Position.Left}
          id={inputType}
          className={`!w-3 !h-3 !-left-5 transition-colors ${getHandleColor(inputType)}`}
          isConnectable={isConnectable}
        />
        <div className="flex-1 ml-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</div>
          {inputType === InputType.PROMPT && !isConnected ? (
            <textarea
              value={data.parameters?.prompt || ''}
              onChange={(e) => handleParameterChange('prompt', e.target.value)}
              placeholder="Enter prompt..."
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          ) : (
            <div className={`px-3 py-2 text-sm ${isConnected ? 'text-gray-500 border border-gray-200' : 'text-gray-400 border border-dashed border-gray-300'} bg-gray-50 dark:bg-gray-900 dark:border-gray-700 rounded-md`}>
              {isConnected ? 'Connected' : `No ${label.toLowerCase()} connected`}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 ${
      selected ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
    } w-80 transition-all duration-200`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
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
            <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Start</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Model Selection (if applicable) */}
        {nodeSchema.parameters.find(p => p.name === 'model') && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Model</h3>
            <Select 
              value={data.parameters?.model}
              onValueChange={(value) => handleParameterChange('model', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {nodeSchema.parameters
                  .find(p => p.name === 'model')
                  ?.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Basic Inputs */}
        <div className="space-y-4">
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Inputs</h3>
          
          {/* Prompt Input */}
          {nodeSchema.inputs.prompt && renderInput(InputType.PROMPT, 'Prompt')}
          
          {/* Context Input */}
          {nodeSchema.inputs.context && renderInput(InputType.CONTEXT, 'Context')}
        </div>

        {/* Advanced Inputs */}
        {(nodeSchema.inputs.memory || nodeSchema.inputs.vectorstore) && (
          <div className="space-y-4">
            {/* Show advanced inputs if they're connected or if advanced section is expanded */}
            {(hasConnectedAdvancedInputs() || showAdvanced) && (
              <>
                {nodeSchema.inputs.memory && renderInput(InputType.MEMORY, 'Memory')}
                {nodeSchema.inputs.vectorstore && renderInput(InputType.VECTORSTORE, 'Vector Store')}
              </>
            )}
            
            {/* Advanced toggle button */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'transform rotate-180' : ''}`} />
              <span>{showAdvanced ? 'Hide Advanced' : 'Show Advanced'}</span>
            </button>
          </div>
        )}

        {/* Additional Parameters */}
        {nodeSchema.parameters.some(p => !['model', 'prompt'].includes(p.name)) && (
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Additional Parameters</h3>
            {nodeSchema.parameters
              .filter(p => !['model', 'prompt'].includes(p.name))
              .map(param => (
                <div key={param.name} className="space-y-1">
                  <label className="text-sm text-gray-700 dark:text-gray-300">{param.label}</label>
                  {param.type === 'number' ? (
                    <input
                      type="number"
                      value={data.parameters?.[param.name] || ''}
                      onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={data.parameters?.[param.name] || ''}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Output */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Output</h3>
          <div className="flex items-center justify-end">
            <Handle
              type="source"
              position={Position.Right}
              className="!w-3 !h-3 !-right-5 !bg-gray-400 hover:!bg-blue-500 transition-colors"
              isConnectable={isConnectable}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
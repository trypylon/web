import React, { useState, useEffect, useRef } from "react";
import { Handle, Position, useEdges } from "reactflow";
import { Component, ChevronDown, GripHorizontal } from "lucide-react";
import { useFlowStore } from "@/store/flowStore";
import { registeredNodes } from "@/nodes";
import { InputType, OutputType } from "@/types/nodes";
import { Input } from "@/components/ui/input";
import { UnifiedInput } from "@/components/node/UnifiedInput";

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

export function CustomNode({
  id,
  data,
  selected,
  isConnectable,
}: CustomNodeProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const edges = useEdges();

  // Find the node schema
  const nodeSchema = registeredNodes.find((node) => node.type === data.type);
  if (!nodeSchema) return null;

  const Icon = nodeSchema.icon || Component;

  // Check if this node has incoming connections for specific input types
  const getInputConnection = (inputType: InputType) => {
    return edges.find(
      (edge) => edge.target === id && edge.targetHandle === inputType
    );
  };

  // Separate inputs into basic and advanced
  const basicInputs = Object.entries(nodeSchema.inputs).filter(
    ([_, config]) => !config.isAdvanced
  );
  const advancedInputs = Object.entries(nodeSchema.inputs).filter(
    ([_, config]) => config.isAdvanced
  );

  // Check if any advanced inputs are connected
  const hasConnectedAdvancedInputs = () => {
    return advancedInputs.some(([inputType]) =>
      getInputConnection(inputType as InputType)
    );
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
    event.preventDefault();
    event.stopPropagation();
    setLabel(event.target.value);
  };

  const handleLabelBlur = () => {
    setIsEditing(false);
    if (label !== data.label) {
      updateNodeData(id, { label });
    }
  };

  const handleLabelKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
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
        [name]: value,
      },
    });
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 ${
        selected ? "border-blue-500" : "border-gray-200 dark:border-gray-700"
      } w-80 transition-all duration-200 cursor-default`}
      draggable={false}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 dragHandle cursor-grab active:cursor-grabbing flex items-center">
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-500">
              <Icon className="w-5 h-5 text-white" />
            </div>
            {isEditing ? (
              <Input
                ref={labelInputRef}
                value={label}
                onChange={handleLabelChange}
                onBlur={handleLabelBlur}
                onKeyDown={handleLabelKeyDown}
                className="nodrag"
              />
            ) : (
              <h3
                className="text-lg font-semibold text-gray-900 dark:text-gray-100 cursor-text"
                onClick={handleLabelClick}
              >
                {label}
              </h3>
            )}
          </div>
          <GripHorizontal className="w-5 h-5 text-gray-500" />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-6">
        {/* Parameters */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Parameters
          </h3>
          {nodeSchema.parameters
            .filter(
              (param) =>
                param.name !== "useJsonOutput" && param.name !== "jsonSchema"
            )
            .map((param) => (
              <UnifiedInput
                key={param.name}
                parameter={param}
                label={param.label}
                value={data.parameters?.[param.name]}
                onChange={(value) => handleParameterChange(param.name, value)}
                description={param.description}
              />
            ))}
        </div>

        {/* Basic Inputs */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Inputs
          </h3>
          {basicInputs.map(([inputType, config]) => (
            <UnifiedInput
              key={inputType}
              inputType={inputType as InputType}
              label={config.label || inputType}
              value={data.parameters?.[inputType]}
              onChange={(value) => handleParameterChange(inputType, value)}
              description={config.description}
              isConnectable={isConnectable}
              isConnected={!!getInputConnection(inputType as InputType)}
            />
          ))}
        </div>

        {/* Advanced Inputs */}
        {advancedInputs.length > 0 && (
          <div className="space-y-4">
            {(hasConnectedAdvancedInputs() || showAdvanced) && (
              <>
                {advancedInputs.map(([inputType, config]) => (
                  <UnifiedInput
                    key={inputType}
                    inputType={inputType as InputType}
                    label={config.label || inputType}
                    value={data.parameters?.[inputType]}
                    onChange={(value) =>
                      handleParameterChange(inputType, value)
                    }
                    description={config.description}
                    isConnectable={isConnectable}
                    isConnected={!!getInputConnection(inputType as InputType)}
                  />
                ))}
              </>
            )}

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ChevronDown
                className={`w-4 h-4 transform transition-transform ${
                  showAdvanced ? "rotate-180" : ""
                }`}
              />
              <span>Advanced</span>
            </button>
          </div>
        )}

        {/* Outputs Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Outputs
          </h3>

          {/* Output Handles */}
          {Object.entries(nodeSchema.outputs).map(([outputType, config]) => {
            // Only show JSON output if useJsonOutput is true
            if (
              outputType === OutputType.JSON &&
              !data.parameters?.useJsonOutput
            ) {
              return null;
            }
            // Only show TEXT output if useJsonOutput is false
            if (
              outputType === OutputType.TEXT &&
              data.parameters?.useJsonOutput
            ) {
              return null;
            }

            return (
              <div
                key={outputType}
                className="relative flex items-center justify-between group"
              >
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {outputType === OutputType.JSON
                      ? "JSON Output"
                      : "Text Output"}
                  </div>
                  {config.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {config.description}
                    </div>
                  )}
                </div>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={outputType}
                  className={`!w-3 !h-3 !-right-5 !bg-gray-400 hover:!bg-blue-500 transition-colors`}
                  isConnectable={isConnectable}
                />
              </div>
            );
          })}
        </div>

        {/* JSON Format Section */}
        {nodeSchema.parameters.find((p) => p.name === "useJsonOutput") && (
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <UnifiedInput
              parameter={
                nodeSchema.parameters.find((p) => p.name === "useJsonOutput")!
              }
              label="Format as JSON"
              value={data.parameters?.useJsonOutput}
              onChange={(value) =>
                handleParameterChange("useJsonOutput", value)
              }
            />

            {/* JSON Schema Editor (only shown when useJsonOutput is true) */}
            {data.parameters?.useJsonOutput && (
              <div className="mt-4 space-y-2 border-l-2 border-blue-500 pl-3">
                <UnifiedInput
                  parameter={
                    nodeSchema.parameters.find((p) => p.name === "jsonSchema")!
                  }
                  label="JSON Schema"
                  value={data.parameters?.jsonSchema}
                  onChange={(value) =>
                    handleParameterChange("jsonSchema", value)
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

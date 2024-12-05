import React, { useRef } from "react";
import { Handle, Position } from "reactflow";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InputType, NodeParameter } from "@/types/nodes";

interface UnifiedInputProps {
  // Common props
  label: string;
  value: any;
  onChange: (value: any) => void;
  description?: string;
  isConnectable?: boolean;

  // For node inputs
  inputType?: InputType;
  isConnected?: boolean;

  // For parameter inputs
  parameter?: NodeParameter;
}

export function UnifiedInput({
  label,
  value,
  onChange,
  description,
  isConnectable,
  inputType,
  isConnected,
  parameter,
}: UnifiedInputProps) {
  const shouldUpdate = useRef(true);

  // Common event handlers to stop propagation
  const commonProps = {
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    onMouseUp: (e: React.MouseEvent) => e.stopPropagation(),
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
  };

  // Handle numeric input changes
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.target.value === "" || !isNaN(parseFloat(e.target.value))) {
      shouldUpdate.current = true;
      const val = e.target.value === "" ? "" : parseFloat(e.target.value);
      onChange(val);
    } else {
      shouldUpdate.current = false;
    }
  };

  // Handle numeric input blur
  const handleNumericBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (parameter && shouldUpdate.current) {
      const val = parseFloat(
        e.target.value || parameter.default?.toString() || "0"
      );
      if (!isNaN(val)) {
        const clampedVal =
          parameter.min !== undefined && parameter.max !== undefined
            ? Math.min(Math.max(val, parameter.min), parameter.max)
            : val;
        onChange(clampedVal);
      }
    }
  };

  // Handle textarea auto-resize
  const handleTextAreaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // Get handle color for node inputs
  const getHandleColor = (type: InputType) => {
    switch (type) {
      case InputType.PROMPT:
        return "!bg-blue-500";
      case InputType.CONTEXT:
        return "!bg-green-500";
      case InputType.MEMORY:
        return "!bg-purple-500";
      case InputType.VECTORSTORE:
        return "!bg-orange-500";
      default:
        return "!bg-gray-400";
    }
  };

  // Wrapper component for consistent styling
  const InputWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {children}
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {description}
        </p>
      )}
    </div>
  );

  // If this is a node input with a handle
  if (inputType) {
    return (
      <div className="relative flex items-start group">
        <Handle
          type="target"
          position={Position.Left}
          id={inputType}
          className={`!w-3 !h-3 !-left-5 transition-colors ${getHandleColor(
            inputType
          )}`}
          isConnectable={isConnectable}
        />
        <div className="flex-1 ml-2">
          <InputWrapper>
            {inputType === InputType.PROMPT && !isConnected ? (
              <Textarea
                value={value || ""}
                onChange={(e) => {
                  e.stopPropagation();
                  onChange(e.target.value);
                  handleTextAreaResize(e);
                }}
                placeholder="Enter prompt..."
                className={`w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none nodrag`}
                {...commonProps}
              />
            ) : (
              <div
                className={`w-full px-3 py-2 text-sm ${
                  isConnected
                    ? "text-gray-500 border border-gray-200"
                    : "text-gray-400 border border-dashed border-gray-300"
                } bg-gray-50 dark:bg-gray-900 dark:border-gray-700 rounded-md nodrag`}
                {...commonProps}
              >
                {isConnected
                  ? "Connected"
                  : `No ${label.toLowerCase()} connected`}
              </div>
            )}
          </InputWrapper>
        </div>
      </div>
    );
  }

  // For parameter inputs
  if (parameter) {
    switch (parameter.type) {
      case "number":
      case "float":
        return (
          <InputWrapper>
            <Input
              type="number"
              min={parameter.min}
              max={parameter.max}
              step={
                parameter.type === "float"
                  ? parameter.step ?? 0.1
                  : parameter.step ?? 1
              }
              value={value ?? parameter.default ?? ""}
              onChange={handleNumericChange}
              onBlur={handleNumericBlur}
              className="w-full nodrag"
              {...commonProps}
            />
          </InputWrapper>
        );

      case "select":
        return (
          <InputWrapper>
            <Select
              value={value ?? parameter.default ?? ""}
              onValueChange={onChange}
              onOpenChange={(open) => {
                if (open) {
                  event?.stopPropagation();
                }
              }}
            >
              <SelectTrigger className="w-full nodrag" {...commonProps}>
                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {parameter.options?.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </InputWrapper>
        );

      case "json":
        return (
          <InputWrapper>
            <Textarea
              value={
                typeof value === "string"
                  ? value
                  : JSON.stringify(value, null, 2)
              }
              onChange={(e) => {
                e.stopPropagation();
                try {
                  const parsed = JSON.parse(e.target.value);
                  onChange(parsed);
                } catch {
                  // If not valid JSON, store as string
                  onChange(e.target.value);
                }
                handleTextAreaResize(e);
              }}
              placeholder="Enter JSON..."
              className={`w-full font-mono text-sm min-h-[120px] nodrag`}
              {...commonProps}
            />
          </InputWrapper>
        );

      case "textarea":
        return (
          <InputWrapper>
            <Textarea
              value={value ?? parameter.default ?? ""}
              onChange={(e) => {
                e.stopPropagation();
                onChange(e.target.value);
                handleTextAreaResize(e);
              }}
              placeholder={`Enter ${label.toLowerCase()}`}
              className={`w-full min-h-[80px] nodrag`}
              {...commonProps}
            />
          </InputWrapper>
        );

      default:
        return (
          <InputWrapper>
            <Input
              type="text"
              value={value ?? parameter.default ?? ""}
              onChange={(e) => {
                e.stopPropagation();
                onChange(e.target.value);
              }}
              placeholder={`Enter ${label.toLowerCase()}`}
              className="w-full nodrag"
              {...commonProps}
            />
          </InputWrapper>
        );
    }
  }

  // Default text input
  return (
    <InputWrapper>
      <Input
        type="text"
        value={value ?? ""}
        onChange={(e) => {
          e.stopPropagation();
          onChange(e.target.value);
        }}
        placeholder={`Enter ${label.toLowerCase()}`}
        className="w-full nodrag"
        {...commonProps}
      />
    </InputWrapper>
  );
}

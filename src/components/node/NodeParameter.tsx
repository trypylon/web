import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NodeParameter } from "@/types/nodes";

interface NodeParameterProps {
  parameter: NodeParameter;
  value: any;
  onChange: (value: any) => void;
}

export function NodeParameterInput({
  parameter,
  value,
  onChange,
}: NodeParameterProps) {
  // Common wrapper for all inputs with label and description
  const InputWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {parameter.label}
      </label>
      {children}
      {parameter.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {parameter.description}
        </p>
      )}
    </div>
  );

  switch (parameter.type) {
    case "float":
      return (
        <InputWrapper>
          <Input
            type="number"
            min={parameter.min}
            max={parameter.max}
            step={parameter.step ?? 0.1}
            value={value ?? parameter.default}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) {
                onChange(val);
              }
            }}
            onBlur={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) {
                const clampedVal =
                  parameter.min !== undefined && parameter.max !== undefined
                    ? Math.min(Math.max(val, parameter.min), parameter.max)
                    : val;
                onChange(clampedVal);
              }
            }}
            className="w-full"
          />
        </InputWrapper>
      );

    case "select":
      return (
        <InputWrapper>
          <Select value={value ?? parameter.default} onValueChange={onChange}>
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={`Select ${parameter.label.toLowerCase()}`}
              />
            </SelectTrigger>
            <SelectContent>
              {parameter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </InputWrapper>
      );

    case "number":
      return (
        <InputWrapper>
          <Input
            type="number"
            value={value ?? parameter.default ?? ""}
            min={parameter.min}
            max={parameter.max}
            step={parameter.step ?? 1}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) {
                onChange(val);
              }
            }}
            className="w-full"
          />
        </InputWrapper>
      );

    case "string":
      return (
        <InputWrapper>
          <Input
            type="text"
            value={value ?? parameter.default ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full"
            placeholder={`Enter ${parameter.label.toLowerCase()}`}
          />
        </InputWrapper>
      );

    default:
      return (
        <InputWrapper>
          <Input
            type="text"
            value={value ?? parameter.default ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full"
            placeholder={`Enter ${parameter.label.toLowerCase()}`}
          />
        </InputWrapper>
      );
  }
}

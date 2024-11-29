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
  switch (parameter.type) {
    case "float":
      return (
        <div className="space-y-1">
          <label className="text-sm text-gray-700 dark:text-gray-300">
            {parameter.label}
          </label>
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
                // Clamp the value between min and max if they exist
                const clampedVal =
                  parameter.min !== undefined && parameter.max !== undefined
                    ? Math.min(Math.max(val, parameter.min), parameter.max)
                    : val;
                onChange(clampedVal);
              }
            }}
            className="w-full"
          />
          {parameter.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {parameter.description}
            </p>
          )}
        </div>
      );

    case "select":
      return (
        <Select value={value ?? parameter.default} onValueChange={onChange}>
          <SelectTrigger>
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
      );

    case "number":
      return (
        <Input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onBlur={(e) => onChange(parseFloat(e.target.value))}
        />
      );

    case "string":
      return (
        <Input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    default:
      return (
        <Input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

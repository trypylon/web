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
  // Add a ref to track if we should update
  const shouldUpdate = React.useRef(true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();

    if (parameter.type === "number" || parameter.type === "float") {
      // Allow empty string or valid numbers
      if (e.target.value === "" || !isNaN(parseFloat(e.target.value))) {
        shouldUpdate.current = true;
        const val = e.target.value === "" ? "" : parseFloat(e.target.value);
        onChange(val);
      } else {
        shouldUpdate.current = false;
      }
    } else {
      onChange(e.target.value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.stopPropagation();

    if (
      (parameter.type === "number" || parameter.type === "float") &&
      shouldUpdate.current
    ) {
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

  // Add common event handlers
  const commonInputProps = {
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    onMouseUp: (e: React.MouseEvent) => e.stopPropagation(),
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
    className: "w-full nodrag",
  };

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
            onChange={handleChange}
            onBlur={handleBlur}
            {...commonInputProps}
          />
        </InputWrapper>
      );

    case "select":
      return (
        <InputWrapper>
          <Select
            value={value ?? parameter.default ?? ""}
            onValueChange={(newValue) => onChange(newValue)}
            onOpenChange={(open) => {
              if (open) {
                event?.stopPropagation();
              }
            }}
          >
            <SelectTrigger {...commonInputProps}>
              <SelectValue
                placeholder={`Select ${parameter.label.toLowerCase()}`}
              />
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

    case "string":
    default:
      return (
        <InputWrapper>
          <Input
            type="text"
            value={value ?? parameter.default ?? ""}
            onChange={handleChange}
            placeholder={`Enter ${parameter.label.toLowerCase()}`}
            {...commonInputProps}
          />
        </InputWrapper>
      );
  }
}

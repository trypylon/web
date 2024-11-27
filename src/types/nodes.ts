import { BaseCache } from "@langchain/core/caches";
import { z } from "zod";
import { LucideIcon } from "lucide-react";

export enum NodeCategory {
  LLM = "Language Models",
  MEMORY = "Memory",
  VECTORSTORE = "Vector Stores",
  TOOLS = "Tools",
  OUTPUT = "Output",
}

export enum InputType {
  PROMPT = "prompt",
  CONTEXT = "context",
  MEMORY = "memory",
  VECTORSTORE = "vectorstore",
}

export interface NodePort {
  id: string;
  type: InputType;
  label: string;
  schema?: z.ZodType<any>;
}

export interface NodeParameter {
  label: string;
  name: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "select"
    | "json"
    | "credential"
    | "asyncSelect";
  description?: string;
  default?: any;
  optional?: boolean;
  options?: { label: string; value: any }[];
  loadOptions?: () => Promise<{ label: string; value: any }[]>;
  validation?: z.ZodType<any>;
  category?: "basic" | "advanced";
  conditions?: {
    field: string;
    value: any;
  }[];
}

export interface NodeCredential {
  name: string;
  required: boolean;
  description?: string;
}

export interface NodeInput {
  type: InputType;
  value?: string;
}

export interface BaseNode {
  id: string;
  type: string;
  category: NodeCategory;
  name: string;
  description: string;
  icon: LucideIcon;
  version: string;
  parameters: NodeParameter[];
  credentials?: NodeCredential[];

  inputs: {
    [key in InputType]?: {
      required: boolean;
      description: string;
    };
  };
  outputs: {
    type: string;
    schema: z.ZodType<any>;
  }[];

  preserveState?: boolean;

  initialize: (nodeData: NodeData, options: NodeInitOptions) => Promise<any>;
  execute?: (
    nodeInstance: any,
    nodeData?: NodeData,
    inputs?: Record<InputType, string>
  ) => Promise<any>;
  cleanup?: (nodeInstance: any) => Promise<void>;
}

export interface NodeData {
  id: string;
  type: string;
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
  inputs?: Record<InputType, NodeInput>;
}

export interface NodeInitOptions {
  cache?: BaseCache;
  credentials?: Record<string, any>;
}

export interface DebugLog {
  type: "input" | "output" | "intermediate";
  label: string;
  value: any;
  timestamp: number;
}

export interface ExecutionStep {
  id: string;
  nodeId: string;
  nodeName: string;
  status: "pending" | "running" | "completed" | "error";
  startTime?: number;
  endTime?: number;
  result?: string;
  error?: string;
  order?: number;
  debugLogs?: DebugLog[];
}

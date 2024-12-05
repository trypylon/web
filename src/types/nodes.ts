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

export enum OutputType {
  TEXT = "text",
  JSON = "json",
  EMBEDDING = "embedding",
  VECTORSTORE_CONFIG = "vectorstore_config",
  MEMORY_CONFIG = "memory_config",
}

export enum NodeRole {
  EXECUTOR = "executor",
  CONFIG = "config",
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
    | "float"
    | "boolean"
    | "select"
    | "json"
    | "textarea"
    | "credential";
  description?: string;
  default?: any;
  optional?: boolean;
  options?: { label: string; value: any }[];
  loadOptions?: () => Promise<{ label: string; value: any }[]>;
  validation?: z.ZodType<any>;
  conditions?: {
    field: string;
    value: any;
  }[];
  min?: number;
  max?: number;
  step?: number;
}

export interface NodeCredential {
  name: string;
  required: boolean;
  description?: string;
}

export interface NodeInput {
  required: boolean;
  description: string;
  isAdvanced?: boolean;
  label?: string;
}

interface BaseNodeCommon {
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
    [key in InputType]?: NodeInput;
  };
  outputs: {
    [key in OutputType]?: {
      description: string;
      schema: z.ZodType<any>;
    };
  };
  preserveState?: boolean;
  initialize: (nodeData: NodeData, options: NodeInitOptions) => Promise<any>;
  cleanup?: (nodeInstance: any) => Promise<void>;
}

interface ExecutorNode extends BaseNodeCommon {
  role: NodeRole.EXECUTOR;
  execute: (
    nodeInstance: any,
    nodeData?: NodeData,
    inputs?: Record<InputType, string>
  ) => Promise<any>;
}

interface ConfigNode extends BaseNodeCommon {
  role: NodeRole.CONFIG;
  // Note: no execute method allowed here
}

export type BaseNode = ExecutorNode | ConfigNode;

export function isExecutorNode(node: BaseNode): node is ExecutorNode {
  return node.role === NodeRole.EXECUTOR;
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

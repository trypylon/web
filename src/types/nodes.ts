import { BaseCache } from '@langchain/core/caches';
import { z } from 'zod';
import { LucideIcon } from 'lucide-react';

export enum NodeCategory {
  LLM = 'Language Models',
  MEMORY = 'Memory',
  VECTORSTORE = 'Vector Stores',
  TOOLS = 'Tools',
  OUTPUT = 'Output'
}

export interface NodePort {
  id: string;
  type: string;
  label: string;
  schema?: z.ZodType<any>;
}

export interface NodeParameter {
  label: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'json' | 'credential' | 'asyncSelect';
  description?: string;
  default?: any;
  optional?: boolean;
  options?: { label: string; value: any }[];
  loadOptions?: () => Promise<{ label: string; value: any }[]>;
  validation?: z.ZodType<any>;
  category?: 'basic' | 'advanced';
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
    min?: number;
    max?: number;
    types: string[];
  };
  outputs: {
    type: string;
    schema: z.ZodType<any>;
  }[];
  
  preserveState?: boolean;
  
  initialize: (nodeData: NodeData, options: NodeInitOptions) => Promise<any>;
  execute: (nodeInstance: any, nodeData?: NodeData) => Promise<any>;
  cleanup?: (nodeInstance: any) => Promise<void>;
}

export interface NodeData {
  id: string;
  type: string;
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
}

export interface NodeInitOptions {
  cache?: BaseCache;
  credentials?: Record<string, any>;
}
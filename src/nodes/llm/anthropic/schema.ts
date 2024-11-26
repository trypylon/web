import { z } from 'zod';
import { MessageSquare } from 'lucide-react';
import { BaseNode, NodeCategory, NodeData, NodeInitOptions } from '@/types/nodes';
import { ChatAnthropic } from "@langchain/anthropic";

export const AnthropicNode: BaseNode = {
  id: 'anthropic',
  type: 'Anthropic',
  category: NodeCategory.LLM,
  name: 'Anthropic',
  description: 'Anthropic language models like Claude',
  icon: MessageSquare,
  version: '1.0.0',
  parameters: [
    {
      name: 'model',
      label: 'Model',
      type: 'select',
      options: [
        { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-latest' },
        { label: 'Claude 3 Opus', value: 'claude-3-opus' },
        { label: 'Claude 2.1', value: 'claude-2.1' }
      ],
      default: 'claude-3-5-sonnet-latest',
      description: 'The Anthropic model to use'
    },
    {
      name: 'temperature',
      label: 'Temperature',
      type: 'number',
      default: 0.7,
      optional: true,
      description: 'Controls randomness (0-1)',
      validation: z.number().min(0).max(1)
    },
    {
      name: 'prompt',
      label: 'System Prompt',
      type: 'string',
      description: 'The system prompt that guides the model behavior',
      validation: z.string().min(1)
    }
  ],
  credentials: [
    {
      name: 'anthropicApiKey',
      required: true,
      description: 'Your Anthropic API key'
    }
  ],
  inputs: {
    min: 0,
    max: 1,
    types: ['text']
  },
  outputs: [
    {
      type: 'text',
      schema: z.string()
    }
  ],

  async initialize(nodeData: NodeData, options: NodeInitOptions) {
    const model = nodeData.parameters.model || 'claude-3-5-sonnet-latest';
    const temperature = nodeData.parameters.temperature || 0.7;

    return new ChatAnthropic({
      modelName: model,
      temperature,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      maxRetries: 3,
      maxConcurrency: 1,
      clientOptions: {
        defaultHeaders: {
          "anthropic-dangerous-direct-browser-access": "true",
        },
      },
    });
  },

  async execute(instance: ChatAnthropic, nodeData?: NodeData) {
    const prompt  = nodeData?.parameters?.prompt || ''
    const response = await instance.invoke(prompt);
    return response.content as string;
  }
};
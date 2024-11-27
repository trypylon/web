import { create } from "zustand";
import {
  Connection,
  Edge,
  Node,
  addEdge,
  OnConnect,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  XYPosition,
} from "reactflow";
import { v4 as uuidv4 } from "uuid";
import { getBaseUrl } from "@/lib/utils";
import { ExecutionStep } from "@/components/ExecutionLog";
import { FlowTemplate } from "@/templates";
import { getNodeByType } from "@/nodes";
import { BaseNode } from "@/types/nodes";

function findNodeSchema(type: string): BaseNode | null {
  return getNodeByType(type) || null;
}

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  isExecuting: boolean;
  executionSteps: ExecutionStep[];
  error: string | null;
  abortController: AbortController | null;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: OnConnect;
  addNode: (type: string, position: XYPosition) => void;
  updateNodeData: (nodeId: string, data: any) => void;
  executeFlow: () => Promise<void>;
  stopExecution: () => void;
  clearExecutionLog: () => void;
  clearError: () => void;
  loadTemplate: (template: FlowTemplate) => void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  isExecuting: false,
  executionSteps: [],
  error: null,
  abortController: null,

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (params: Connection) => {
    set({
      edges: addEdge(params, get().edges),
    });
  },

  addNode: (type: string, position: XYPosition) => {
    const nodeSchema = findNodeSchema(type);
    console.log("adding node");

    if (!nodeSchema) {
      console.error(`No schema found for node type: ${type}`);
      return;
    }

    const defaultParameters: Record<string, any> = {};
    nodeSchema.parameters.forEach((param) => {
      defaultParameters[param.name] = param.default;
    });

    const newNode: Node = {
      id: `node-${uuidv4()}`,
      type: "custom",
      position,
      data: {
        type,
        label: nodeSchema.name,
        parameters: defaultParameters,
        isStartNode: false,
        description: nodeSchema.description,
        icon: nodeSchema.icon,
        inputs: nodeSchema.inputs,
        outputs: nodeSchema.outputs,
      },
    };

    console.log({ newNode });
    set({
      nodes: [...get().nodes, newNode],
    });
  },

  updateNodeData: (nodeId: string, data: any) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...data,
                parameters: {
                  ...node.data.parameters,
                  ...data.parameters,
                },
              },
            }
          : node
      ),
    });
  },

  clearError: () => {
    set({ error: null });
  },

  clearExecutionLog: () => {
    set({ executionSteps: [] });
  },

  stopExecution: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({
        isExecuting: false,
        abortController: null,
        executionSteps: get().executionSteps.map((step) =>
          step.status === "running" || step.status === "pending"
            ? { ...step, status: "error", error: "Execution stopped by user" }
            : step
        ),
      });
    }
  },

  loadTemplate: (template: FlowTemplate) => {
    set({
      nodes: template.nodes,
      edges: template.edges,
      executionSteps: [],
      error: null,
    });
  },

  executeFlow: async () => {
    const abortController = new AbortController();

    set({
      isExecuting: true,
      error: null,
      executionSteps: get().nodes.map((node) => ({
        id: uuidv4(),
        nodeId: node.id,
        nodeName: node.data.label,
        status: "pending",
      })),
      abortController,
    });

    try {
      const response = await fetch(`${getBaseUrl()}/api/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nodes: get().nodes,
          edges: get().edges,
          executionSteps: get().executionSteps,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Flow execution failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Failed to read response stream");
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(5));

              if (data.type === "step") {
                const updatedSteps = get().executionSteps.map((step) =>
                  step.id === data.step.id ? data.step : step
                );
                set({ executionSteps: updatedSteps });
              } else if (data.type === "error") {
                set({ error: data.error });
                break;
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        return;
      }
      set({ error: error.message || "An unexpected error occurred" });
    } finally {
      set({
        isExecuting: false,
        abortController: null,
      });
    }
  },
}));

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
import { FlowTemplate } from "@/templates";
import { getNodeByType } from "@/nodes";
import { BaseNode, ExecutionStep } from "@/types/nodes";
import { NodeRole } from "@/types/nodes";

export function findNodeSchema(type: string): BaseNode | null {
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
  currentCanvasId: string | null;
  currentCanvasName: string;
  saveCanvas: (
    name: string,
    description?: string,
    saveAsNew?: boolean
  ) => Promise<void>;
  loadCanvas: (canvasId: string) => Promise<void>;
  clearCanvasState: () => void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  isExecuting: false,
  executionSteps: [],
  error: null,
  abortController: null,
  currentCanvasId: null,
  currentCanvasName: "",

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
      currentCanvasId: null,
      currentCanvasName: "",
    });
  },

  executeFlow: async () => {
    const abortController = new AbortController();

    const executableSteps = get()
      .nodes.map((node) => {
        const nodeSchema = findNodeSchema(node.data.type);
        if (nodeSchema?.role === NodeRole.EXECUTOR) {
          return {
            id: uuidv4(),
            nodeId: node.id,
            nodeName: node.data.label,
            status: "pending",
          };
        }
        return null;
      })
      .filter((step): step is ExecutionStep => step !== null);

    set({
      isExecuting: true,
      error: null,
      executionSteps: executableSteps,
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
          executionSteps: executableSteps,
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

  saveCanvas: async (
    name: string,
    description?: string,
    saveAsNew: boolean = false
  ) => {
    const { nodes, edges, currentCanvasId } = get();

    const response = await fetch("/api/canvases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: saveAsNew ? undefined : currentCanvasId,
        name,
        description,
        data: { nodes, edges },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to save canvas");
    }

    const { id } = await response.json();
    set({ currentCanvasId: id, currentCanvasName: name });
  },

  loadCanvas: async (canvasId: string) => {
    const response = await fetch(`/api/canvases/${canvasId}`);

    if (!response.ok) {
      throw new Error("Failed to load canvas");
    }

    const { canvas } = await response.json();
    set({
      nodes: canvas.data.nodes,
      edges: canvas.data.edges,
      currentCanvasId: canvas.id,
      currentCanvasName: canvas.name,
    });
  },

  clearCanvasState: () => {
    set({
      currentCanvasId: null,
      currentCanvasName: "",
    });
  },
}));

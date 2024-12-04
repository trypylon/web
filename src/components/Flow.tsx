"use client";

import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Panel,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

import { Sidebar } from "./Sidebar/index";
import { CustomNode } from "./CustomNode";
import { useFlowStore } from "@/store/flowStore";
import { Button } from "./ui/button";
import {
  AlertCircle,
  PlayCircle,
  StopCircle,
  Trash2,
  XCircle,
  Save,
  FolderOpen,
} from "lucide-react";
import { ExecutionLog } from "./ExecutionLog";
import { TemplateSelector } from "./TemplateSelector";
import { isExecutorNode } from "@/types/nodes";
import { findNodeSchema } from "@/store/flowStore";
import { SaveCanvasDialog } from "./SaveCanvasDialog";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createNewBrowserClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

const nodeTypes = {
  custom: CustomNode,
};

// Custom edge style with animation
const edgeOptions = {
  style: { strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
  },
  animated: true,
  className: "animated-edge",
};

function FlowEditor() {
  const [saveAsDialogOpen, setSaveAsDialogOpen] = useState(false);
  const [user, setUser] = useState<null | User>(null);
  const supabase = createNewBrowserClient();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setUser(data?.user);
      }
    };
    void checkUser();
  }, [supabase.auth]);

  const { currentCanvasId, currentCanvasName, saveCanvas, nodes, edges } =
    useFlowStore();

  // Function to handle quick save of existing canvas
  const handleQuickSave = async () => {
    if (!currentCanvasId || !currentCanvasName) return;
    try {
      await saveCanvas(currentCanvasName, undefined, false);
      toast({
        title: "Canvas Updated",
        description: "Your changes have been saved",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const {
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateNodeData,
    executeFlow,
    stopExecution,
    clearExecutionLog,
    isExecuting,
    executionSteps,
    error,
    clearError,
  } = useFlowStore();

  const { getNodes, getEdges } = useReactFlow();

  // Update start nodes whenever the graph changes
  useEffect(() => {
    const currentNodes = getNodes();
    const currentEdges = getEdges();

    // Find start nodes (nodes with no incoming edges)
    const startNodeIds = new Set(
      currentNodes
        .filter((node) => {
          const nodeSchema = findNodeSchema(node.data.type);
          const hasNoIncomingEdges = !currentEdges.some(
            (edge) => edge.target === node.id
          );
          return nodeSchema && isExecutorNode(nodeSchema) && hasNoIncomingEdges;
        })
        .map((node) => node.id)
    );

    // Update isStartNode flag for all nodes
    currentNodes.forEach((node) => {
      const isStartNode = startNodeIds.has(node.id);
      if (isStartNode !== node.data.isStartNode) {
        updateNodeData(node.id, { isStartNode });
      }
    });
  }, [edges, nodes, getNodes, getEdges, updateNodeData]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = (event.target as Element)
        .closest(".react-flow")
        ?.getBoundingClientRect();

      const type = event.dataTransfer.getData("application/reactflow");

      if (!type || !reactFlowBounds) {
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left - 240,
        y: event.clientY - reactFlowBounds.top,
      };

      addNode(type, position);
    },
    [addNode]
  );

  // Add this function back
  const handleSaveClick = () => {
    // Store current flow state in localStorage before redirecting
    localStorage.setItem("tempFlow", JSON.stringify({ nodes, edges }));
    router.push("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={edgeOptions}
          fitView
          className="bg-dot-pattern"
        >
          <Background />
          <Controls />

          {/* Top panel with controls and execution log */}
          <Panel
            position="top-right"
            className="flex flex-col items-end space-y-4"
          >
            <div className="flex space-x-2">
              <TemplateSelector />

              {user ? (
                // User is logged in
                currentCanvasId ? (
                  // Editing an existing canvas
                  <>
                    <Button
                      onClick={handleQuickSave}
                      variant="outline"
                      className="space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </Button>
                    <Button
                      onClick={() => setSaveAsDialogOpen(true)}
                      variant="outline"
                      className="space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save as New</span>
                    </Button>
                  </>
                ) : (
                  // Creating a new canvas
                  <Button
                    onClick={() => setSaveAsDialogOpen(true)}
                    variant="outline"
                    className="space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save as New</span>
                  </Button>
                )
              ) : (
                // User is not logged in
                <Button
                  onClick={handleSaveClick}
                  variant="outline"
                  className="space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Login to Save</span>
                </Button>
              )}

              {/* Only show My Canvases if user is logged in */}
              {user && (
                <Button
                  onClick={() => router.push("/canvases")}
                  variant="outline"
                  className="space-x-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>My Canvases</span>
                </Button>
              )}

              {executionSteps.length > 0 && (
                <Button
                  onClick={clearExecutionLog}
                  variant="outline"
                  className="space-x-2"
                  disabled={isExecuting}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Log</span>
                </Button>
              )}

              <Button
                onClick={isExecuting ? stopExecution : executeFlow}
                disabled={nodes.length === 0}
                variant={isExecuting ? "destructive" : "default"}
                className="space-x-2"
              >
                {isExecuting ? (
                  <>
                    <StopCircle className="w-4 h-4" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    <span>Run Flow</span>
                  </>
                )}
              </Button>
            </div>

            {/* Execution log appears directly under the buttons */}
            {executionSteps.length > 0 && (
              <div className="w-96">
                <ExecutionLog steps={executionSteps} />
              </div>
            )}
          </Panel>

          {error && (
            <Panel
              position="top-center"
              className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-center space-x-2"
            >
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
              <span className="text-red-600 dark:text-red-300 text-sm">
                {error}
              </span>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </Panel>
          )}
        </ReactFlow>
      </div>
      <SaveCanvasDialog
        open={saveAsDialogOpen}
        onOpenChange={setSaveAsDialogOpen}
        mode="saveAs"
      />
    </div>
  );
}

// Wrap the FlowEditor with ReactFlowProvider
export default function Flow() {
  return (
    <ReactFlowProvider>
      <FlowEditor />
    </ReactFlowProvider>
  );
}

import { useCallback } from "react";
import { Background, BackgroundVariant, Controls, MiniMap, ReactFlow, useReactFlow } from "@xyflow/react";
import ServiceNode from "./nodes/ServiceNode.jsx";

const nodeTypes = { service: ServiceNode };

export default function FlowCanvas({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onAddService }) {
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("application/cloudpilot");
      if (!raw) return;
      const service = JSON.parse(raw);
      onAddService(service, screenToFlowPosition({ x: e.clientX, y: e.clientY }));
    },
    [onAddService, screenToFlowPosition]
  );

  return (
    <div className="panel flex-1 min-h-0 relative overflow-hidden" data-testid="canvas">
      {/* shared gradient for edges */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="gem-edge-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#4285F4" />
            <stop offset=".5" stopColor="#9B72CB" />
            <stop offset="1" stopColor="#D96570" />
          </linearGradient>
        </defs>
      </svg>

      {nodes.length === 0 && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none z-10" data-testid="canvas-empty">
          <div className="text-center">
            <div className="text-5xl mb-3 opacity-40">⌬</div>
            <p className="text-slate-400 text-sm">Drag services from the catalog — or</p>
            <p className="text-slate-500 text-xs font-mono mt-1">import a whiteboard photo and let Gemini draw it for you</p>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ animated: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={26} size={1.4} color="rgba(120,140,255,0.18)" />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          position="top-right"
          pannable
          maskColor="rgba(6,9,19,0.82)"
          nodeColor={() => "#4285F4"}
          style={{ background: "rgba(13,18,36,0.9)", width: 160, height: 110 }}
        />
      </ReactFlow>
    </div>
  );
}

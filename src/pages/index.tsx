"use client";
import FlowPanel from '@/components/panel';
import { Edge, Edges } from '@/edges';
import { useGlobalState } from '@/hooks/useGlobalStore';
import { Node, Nodes } from '@/nodes';
import { addEdge, Background, BackgroundVariant, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { MouseEvent, useCallback, useEffect } from 'react';


export default function Home() {
  const globals = useGlobalState()
  const [nodes, setNodes, onNodesChange] = useNodesState([
    { id: "start", position: { x: 50, y: 50 }, data: {}, type: "start" },
    { id: "add", position: { x: 200, y: 100 }, data: {}, type: "add" },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([
    { id: "start-add", source: "start", target: "add", type: "dashed" },
  ]);

  useEffect(() => {
    function onAddNodeEvent(e: CustomEvent) {
      const type = e.detail.type;
      let newId = "";
      setEdges(edges => {
        setNodes(nodes => {
          newId = `node-${nodes.length + 1}`;
          const lastNode = nodes.pop();
          nodes.push({ id: newId, position: { x: lastNode?.position.x! + 100, y: lastNode?.position.y! + 100 }, type: type, data: {} })
          nodes.push({ id: "add", position: { x: lastNode?.position.x! + 200, y: lastNode?.position.y! + 100 }, data: {}, type: "add" });
          console.log("nodes", nodes);
          return [...nodes];
        })
        const lastEdge = edges.pop(); // edge from the add node
        const edge1Id = `${lastEdge?.source}-${newId}`;
        const edge2Id = `${newId}-add`;
        edges.push({ id: edge1Id, source: lastEdge?.source as string, target: newId, type: "default" });
        edges.push({ id: edge2Id, source: newId, target: "add", type: "dashed" });
        console.log("edges", edges);
        return [...edges];
      })
      globals.toggleNodebar()
      console.log("add node event", e.detail);
    }

    window.addEventListener("add-node", onAddNodeEvent as EventListener);
    return () => window.removeEventListener("add-node", onAddNodeEvent as EventListener);
  }, [])

  function onNodeClick(e: any, node: Node) {
    switch (node.type) {
      case "add":
        globals.toggleNodebar()
        console.log("add node clicked");
        break;
      case "start":
        console.log("start node clicked");
        break;
    }
  }

  return (
    <div className="h-screen w-full bg-gray-200">
      <ReactFlow
        nodeTypes={Nodes as any}
        edgeTypes={Edges}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick as any}
      >
        {/* <FlowPanel /> */}
        <Background variant={BackgroundVariant.Dots} bgColor="#fef9f2" />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
}

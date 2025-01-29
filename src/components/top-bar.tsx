import { ConnectButton } from "arweave-wallet-kit";
import { Button } from "./ui/button";
import { AppWindowMac } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Node } from "@xyflow/react";
import { Edge } from "@xyflow/react";
import { useState } from "react";
import { PingTemplate } from "@/templates";
import { useGlobalState } from "@/hooks/useGlobalStore";
import { toast } from "sonner";

interface Template {
    name: string,
    description: string,
    nodes: Node[],
    edges: Edge[]
}

const t: Template = {
    name: "Test",
    description: "Sample template",
    nodes: PingTemplate.nodes,
    edges: PingTemplate.edges
}


export default function TopBar() {
    const [templates, setTemplates] = useState<Template[]>([t])
    const [dialogOpen, setDialogOpen] = useState(false)
    const globalState = useGlobalState()

    async function importTemplate(template: Template) {
        if (!globalState.activeProcess) return toast.error("No active process")
        // Ask for confirmation before importing
        const confirmed = window.confirm(
            "Importing this template will overwrite your current flow. Are you sure you want to continue?"
        );

        if (!confirmed) return;

        // Create and dispatch custom event with template data
        const event = new CustomEvent("import-template", {
            detail: {
                nodes: template.nodes,
                edges: template.edges
            }
        });
        window.dispatchEvent(event);

        // Close the dialog after importing
        // if (globalState.activeProcess) {
        //     // Save to localStorage
        //     localStorage.setItem(
        //         `${globalState.activeProcess}-flow`,
        //         JSON.stringify({ nodes: template.nodes, edges: template.edges })
        //     );
        // } else {
        //     console.warn("No active process selected");
        // }

        // Close the dialog
        setDialogOpen(false);
    }

    return <div className="border-b bg-white flex justify-between items-center p-2">
        <div className="px-2 text-lg">Visual AO</div>
        <div className="flex items-center gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger disabled={!globalState.activeProcess}>
                    <Button disabled={!globalState.activeProcess} variant="ghost" className="h-12 rounded-xl"><AppWindowMac />Templates</Button>
                </DialogTrigger>
                <DialogContent className="!bg-white">
                    <DialogHeader>
                        <DialogTitle>Templates</DialogTitle>
                        <DialogDescription>
                            Find pre-built templates which you can import to get started quickly
                        </DialogDescription>
                    </DialogHeader>

                    {
                        templates.map((template, _) => {
                            return <Button key={_} onClick={() => importTemplate(template)}>
                                {template.name} - {template.nodes.length} Nodes
                            </Button>
                        })
                    }

                    <DialogFooter>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ConnectButton id="connect-button" />
        </div>
    </div>
}
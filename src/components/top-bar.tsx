import { ConnectButton } from "arweave-wallet-kit";
import { Button } from "./ui/button";
import { AppWindowMac, HelpCircle, PencilRuler, Workflow } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Node } from "@xyflow/react";
import { useState } from "react";
import { useGlobalState } from "@/hooks/useGlobalStore";
import { toast } from "sonner";
import Image from "next/image";
import vaoLogo from "@/assets/logo.svg"
import { Template, templates } from "@/templates";
import Link from "next/link";
import { useRouter } from "next/router";
import { ThemeToggle } from "./ui/theme-toggle";


export default function TopBar() {
    const [dialogOpen, setDialogOpen] = useState(false)
    const globalState = useGlobalState()
    const router = useRouter()

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
                nodes: template.nodes
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

    return <div className="border-b bg-muted flex justify-between items-center p-2">
        <Link href="/" className="px-2 text-lg flex items-center">
            <Image src={vaoLogo} alt="Visual AO" width={150} height={32} className="dark:invert dark:opacity-80" />
        </Link>
        <div className="grow" />
        <div className="flex items-center gap-2 mr-4">
            <ThemeToggle />

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                {/* will add this back when new nodes flow is defined */}
                {/* <DialogTrigger disabled={!globalState.activeProcess}>
                    <Button disabled={!globalState.activeProcess} variant="ghost" className="h-12 rounded-xl"><AppWindowMac />Templates</Button>
                </DialogTrigger> */}
                <DialogContent className="!bg-muted">
                    <DialogHeader>
                        <DialogTitle>Templates</DialogTitle>
                        <DialogDescription>
                            Find pre-built templates which you can import to get started quickly
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4">
                        {
                            templates.map((template, _) => {
                                return <div key={_} className="flex justify-between items-center hover:bg-muted/50 px-1 rounded-md">
                                    <div>
                                        <div className="font-semibold">{template.name}</div>
                                        <div className="text-muted-foreground text-sm">{template.description}</div>
                                    </div>
                                    <Button key={_} variant="ghost" onClick={() => importTemplate(template)}>
                                        import {template.nodes.length - 2} nodes
                                    </Button>
                                </div>
                            })
                        }
                    </div>

                    <DialogFooter>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        <ConnectButton id="connect-button" />
    </div>
}
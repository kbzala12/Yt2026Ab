
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const deployCommand = "firebase deploy --only apphosting";

export default function DeployPage() {
    const { toast } = useToast();

    const copyCommandToClipboard = () => {
        navigator.clipboard.writeText(deployCommand);
        toast({
            title: "Copied!",
            description: "Command has been copied to your clipboard.",
        });
    };

    return (
        <div className="w-full py-8 px-4">
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Rocket />
                        How to Deploy the App
                    </CardTitle>
                    <CardDescription>
                        Follow these steps to make your app live on the internet.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Step 1: Open the Terminal</h3>
                        <p className="text-muted-foreground mb-2">
                           In your Firebase Studio interface, click on the "Terminal" tab located at the bottom of the screen. Make sure you are in the main folder of your project.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Step 2: Run the Deploy Command</h3>
                        <p className="text-muted-foreground mb-2">
                           In the terminal, copy and paste the command below and press `Enter`.
                        </p>
                        <div className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                            <code className="font-mono text-sm p-2 flex-grow">{deployCommand}</code>
                            <Button variant="ghost" size="icon" onClick={copyCommandToClipboard}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                         <p className="text-sm text-muted-foreground mt-2">
                            This process might take a few minutes.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Step 3: Find Your Public URL</h3>
                        <p className="text-muted-foreground mb-2">
                            After the command completes, the terminal will show you some information. Look for the <strong>Hosting URL</strong>. That is your public URL.
                        </p>
                         <div className="bg-muted p-4 rounded-lg">
                            <img src="https://storage.googleapis.com/studiopiper-project-assets/62a8cb9b-3642-4912-88d4-53995859367e/assets/f2066d8e-9538-4e83-9b64-a693b3f2b450.png" data-ai-hint="terminal output" alt="Successful deployment output showing the Hosting URL" className="rounded-md border"/>
                             <p className="text-sm text-center mt-2 text-muted-foreground">A successful deployment will look something like this.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

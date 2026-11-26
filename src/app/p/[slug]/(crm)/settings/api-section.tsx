"use client";

import { EyeIcon, EyeOffIcon, RefreshCwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useAction } from "@/components/crm/use-action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { rotateApiKey } from "./actions";
import { CopyButton } from "./copy-button";

export function ApiSection({ slug, apiKey, isAdmin }: { slug: string; apiKey: string | null; isAdmin: boolean }) {
  const [reveal, setReveal] = useState(false);
  const [origin, setOrigin] = useState("https://your-crm.example.com");
  const { pending, run } = useAction();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  if (!isAdmin || !apiKey) {
    return <p className="text-sm text-muted-foreground">Only project admins can view the API key and integration settings.</p>;
  }

  const endpoint = `${origin}/api/v1/leads`;
  const masked = `${apiKey.slice(0, 6)}${"•".repeat(24)}${apiKey.slice(-4)}`;
  const curl = `curl -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${reveal ? apiKey : "YOUR_API_KEY"}" \\
  -d '{
    "name": "Raksha",
    "phone": "+91 97439 17025",
    "email": "raksha@example.com",
    "source": "Meta Ads",
    "service": "General Consultation",
    "branch": "Main Branch",
    "notes": "Wants a callback after 6pm"
  }'`;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Send leads from your website forms, chatbot, Meta / Google lead ads (via Zapier, Make, Pabbly…) straight into this
        project&apos;s pipeline.
      </p>

      <div className="space-y-2">
        <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Project API key</div>
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg border bg-muted/40 px-3 py-2 font-mono text-sm">{reveal ? apiKey : masked}</code>
          <Button variant="outline" size="sm" onClick={() => setReveal((r) => !r)}>
            {reveal ? <EyeOffIcon /> : <EyeIcon />}
            {reveal ? "Hide" : "Reveal"}
          </Button>
          <CopyButton value={apiKey} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={pending}>
                <RefreshCwIcon /> Rotate
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Rotate the API key?</AlertDialogTitle>
                <AlertDialogDescription>The current key stops working immediately. Update every integration with the new one.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => run(() => rotateApiKey(slug))}>Rotate key</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <p className="text-xs text-muted-foreground">Keep it secret — anyone with this key can add leads to this project.</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Endpoint</div>
          <CopyButton value={endpoint} />
        </div>
        <code className="block truncate rounded-lg border bg-muted/40 px-3 py-2 font-mono text-sm">POST {endpoint}</code>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Example</div>
          <CopyButton value={curl} />
        </div>
        <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed">{curl}</pre>
      </div>

      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Accepts JSON or form-encoded bodies. Only <code>name</code> or <code>phone</code> is required.</li>
        <li>
          Common field names work too: <code>full_name</code>, <code>phone_number</code>/<code>mobile</code>, <code>utm_source</code>,{" "}
          <code>campaign</code>, <code>message</code>.
        </li>
        <li>
          Leads are de-duplicated by phone number — a repeat is logged as a <span className="font-medium text-foreground">repeat enquiry</span> on the
          existing lead instead of creating a duplicate.
        </li>
        <li>Unknown sources and services are created automatically. <code>branch</code> is matched by name.</li>
        <li>
          The key can also be passed as <code>?key=</code> for tools that can&apos;t set headers. Responds <code>201 {"{ id, repeat }"}</code>.
        </li>
      </ul>
    </div>
  );
}

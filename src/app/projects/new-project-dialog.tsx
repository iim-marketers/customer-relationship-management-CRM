"use client";

import { PlusIcon } from "lucide-react";
import { useActionState, useState } from "react";
import { createProject, type CreateProjectState } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDUSTRIES } from "@/lib/industries";

export function NewProjectDialog({ triggerVariant = "default" }: { triggerVariant?: "default" | "outline" }) {
  const [state, action] = useActionState<CreateProjectState, FormData>(createProject, undefined);
  const [industry, setIndustry] = useState("");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={triggerVariant}>
          <PlusIcon /> New project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>A separate CRM with its own leads, team and settings.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="np-name">Project name</Label>
            <Input id="np-name" name="name" required minLength={2} maxLength={80} placeholder="e.g. Sunrise Dental" />
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <input type="hidden" name="industry" value={industry} />
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose one (optional)" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((i) => (
                  <SelectItem key={i.value} value={i.value}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <SubmitButton className="w-full">Create project</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

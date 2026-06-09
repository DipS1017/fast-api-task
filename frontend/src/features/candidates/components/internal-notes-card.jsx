import { useState } from "react";
import { Loader2, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateNotesMutation } from "../mutations";

export function InternalNotesCard({ candidate }) {
  const mutation = useUpdateNotesMutation(candidate.id);
  const [notes, setNotes] = useState(candidate.internal_notes || "");

  return (
    <Card className="border-amber-200 bg-amber-50/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="size-4" /> Internal notes
        </CardTitle>
        <Badge variant="secondary">admin only</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes visible to admins only…"
        />
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => mutation.mutate(notes)}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Save notes
          </Button>
          {mutation.isSuccess && !mutation.isPending && (
            <span className="text-sm text-muted-foreground">Saved ✓</span>
          )}
          {mutation.isError && (
            <span className="text-sm text-destructive">
              {mutation.error.message}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

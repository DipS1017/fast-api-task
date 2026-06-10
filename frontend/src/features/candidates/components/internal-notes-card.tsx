import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { CandidateDetail } from "@/lib/types";
import { notesSchema, type NotesValues } from "../schema";
import { useUpdateNotesMutation } from "../mutations";

export function InternalNotesCard({ candidate }: { candidate: CandidateDetail }) {
  const mutation = useUpdateNotesMutation(String(candidate.id));
  const form = useForm<NotesValues>({
    resolver: zodResolver(notesSchema),
    defaultValues: { internal_notes: candidate.internal_notes || "" },
  });

  function onSubmit(values: NotesValues) {
    mutation.mutate(values.internal_notes);
  }

  return (
    <Card className="border-amber-200 bg-amber-50/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="size-4" /> Internal notes
        </CardTitle>
        <Badge variant="secondary">admin only</Badge>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3" noValidate>
            <FormField
              control={form.control}
              name="internal_notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Notes visible to admins only…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-3">
              <Button size="sm" type="submit" disabled={mutation.isPending}>
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

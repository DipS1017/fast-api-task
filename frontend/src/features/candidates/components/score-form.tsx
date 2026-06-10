import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SCORE_CATEGORIES, SCORE_VALUES } from "@/lib/constants";
import { scoreSchema, type ScoreFormValues, type ScoreValues } from "../schema";
import { useSubmitScoreMutation } from "../mutations";

export function ScoreForm({ candidateId }: { candidateId: string }) {
  const mutation = useSubmitScoreMutation(candidateId);
  // the form is driven by the schema's input shape (`score` as a string from
  // the Select); the resolver coerces it to the output shape on submit.
  const form = useForm<ScoreFormValues, unknown, ScoreValues>({
    resolver: zodResolver(scoreSchema),
    defaultValues: { category: SCORE_CATEGORIES[0], score: 3, note: "" },
  });

  function onSubmit(values: ScoreValues) {
    mutation.mutate(
      { category: values.category, score: values.score, note: values.note || null },
      { onSuccess: () => form.resetField("note") }
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <div className="flex flex-col gap-2 sm:flex-row">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="sm:w-48">
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SCORE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="score"
            render={({ field }) => (
              <FormItem className="sm:w-24">
                <Select onValueChange={field.onChange} value={String(field.value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SCORE_VALUES.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} / 5
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="Optional note" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Add score
          </Button>
        </div>

        {mutation.isError && (
          <p className="text-sm text-destructive">{mutation.error.message}</p>
        )}
      </form>
    </Form>
  );
}

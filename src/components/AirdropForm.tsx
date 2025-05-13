import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formSchema, submitSchema } from "@/lib/schemas/airdrop";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ComponentPropsWithoutRef } from "react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type AirdropFormProps = ComponentPropsWithoutRef<"form">;

export const AirdropForm = ({ className, ...props }: AirdropFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      tokenAddress: "",
      recipients: "",
      amounts: "",
    },
  });

  const recipients = useWatch({ control: form.control, name: "recipients" });
  const amounts = useWatch({ control: form.control, name: "amounts" });

  useEffect(() => {
    form.trigger("amounts");
  }, [recipients, amounts, form]);

  function submit(data: z.infer<typeof formSchema>) {
    const result = submitSchema.safeParse(data);
    if (!result.success) {
      toast.error("Error", {
        description: (
          <div>
            {result.error.errors.map((e, i) => (
              <div className="text-muted-foreground" key={i}>
                {e.message}
              </div>
            ))}
          </div>
        ),
      });
      return;
    }

    toast("Airdrop ready to be sent!", {
      description: <div className="text-muted-foreground">pending...</div>,
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className={cn("space-y-6", className)}
        autoComplete="off"
        {...props}
      >
        <FormField
          control={form.control}
          name="tokenAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token Address</FormLabel>
              <FormControl>
                <Input placeholder="0x..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="recipients"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipients</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="one address per line or comma-separated"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amounts"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amounts</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="amounts in wei, one per line or comma-separated"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-center">
          <Button type="submit" className="w-fit">
            Send Airdrop
          </Button>
        </div>
      </form>
    </Form>
  );
};

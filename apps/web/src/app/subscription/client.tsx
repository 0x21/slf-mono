"use client";

import { useEffect, useState } from "react";
import { Route } from "next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Check, Star } from "lucide-react";
import toast from "react-hot-toast";

import { buttonVariants } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";

const plans = [
  {
    name: "STARTER",
    price: "50",
    yearlyPrice: "40",
    period: "per month",
    features: [
      "Up to 10 projects",
      "Basic analytics",
      "48-hour support response time",
      "Limited API access",
      "Community support",
    ],
    description: "Perfect for individuals and small projects",
    buttonText: "Start Free Trial",
    href: "/sign-up",
    isPopular: false,
  },
  {
    name: "PROFESSIONAL",
    price: "99",
    yearlyPrice: "79",
    period: "per month",
    features: [
      "Unlimited projects",
      "Advanced analytics",
      "24-hour support response time",
      "Full API access",
      "Priority support",
      "Team collaboration",
      "Custom integrations",
    ],
    description: "Ideal for growing teams and businesses",
    buttonText: "Get Started",
    href: "/sign-up",
    isPopular: true,
  },
  {
    name: "ENTERPRISE",
    price: "299",
    yearlyPrice: "239",
    period: "per month",
    features: [
      "Everything in Professional",
      "Custom solutions",
      "Dedicated account manager",
      "1-hour support response time",
      "SSO Authentication",
      "Advanced security",
      "Custom contracts",
      "SLA agreement",
    ],
    description: "For large organizations with specific needs",
    buttonText: "Contact Sales",
    href: "/contact",
    isPopular: false,
  },
];

export default function Client() {
  const api = useTRPC();
  const [isMonthly, setIsMonthly] = useState(true);
  const searchParams = useSearchParams();
  const checkout = searchParams.get("checkout");

  const mutation = useMutation(
    api.authPayment.createCheckoutSession.mutationOptions(),
  );

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
  };

  useEffect(() => {
    if (checkout === "success") {
      toast.success("Checkout session created successfully");
    } else if (checkout === "cancel") {
      toast.error("Checkout session cancelled");
    }
  }, [checkout]);

  return (
    <div className="container mx-auto py-20">
      <div className="mb-12 space-y-4 text-center">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Simple, Transparent Pricing
        </h2>
        <p className="text-muted-foreground text-lg whitespace-pre-line">
          Choose the plan that works for you\nAll plans include access to our
          platform, lead generation tools, and dedicated support.
        </p>
      </div>

      <div className="mb-10 flex justify-center">
        <label className="relative inline-flex cursor-pointer items-center">
          <Label>
            <Switch
              checked={!isMonthly}
              onCheckedChange={handleToggle}
              className="relative"
            />
          </Label>
        </label>
        <span className="ml-2 font-semibold">
          Annual billing <span className="text-primary">(Save 20%)</span>
        </span>
      </div>

      <div className="sm:2 grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan, index) => (
          <div
            key={index}
            onClick={async () => {
              try {
                const result = await mutation.mutateAsync({
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-expect-error
                  planName: plan.name,
                  isMonthly: isMonthly,
                });

                if (!result.success) {
                  toast.error(`Error: ${result.msg}`);
                  return;
                }
                toast.success("Checkout session created successfully");
                window.location.href = result.url ?? "/";
              } catch (error) {
                console.error("Error creating checkout session:", error);
              }
            }}
            className={cn(
              `bg-background relative rounded-2xl border-[1px] p-6 text-center lg:flex lg:flex-col lg:justify-center`,
              plan.isPopular ? "border-primary border-2" : "border-border",
              "flex flex-col",
              !plan.isPopular && "mt-5",
              index === 0 || index === 2
                ? "z-0 translate-x-0 translate-y-0 -translate-z-[50px] rotate-y-[10deg] transform"
                : "z-10",
              index === 0 && "origin-right",
              index === 2 && "origin-left",
            )}
          >
            {plan.isPopular && (
              <div className="bg-primary absolute top-0 right-0 flex items-center rounded-tr-xl rounded-bl-xl px-2 py-0.5">
                <Star className="text-primary-foreground h-4 w-4 fill-current" />
                <span className="text-primary-foreground ml-1 font-sans font-semibold">
                  Popular
                </span>
              </div>
            )}
            <div className="flex flex-1 flex-col">
              <p className="text-muted-foreground text-base font-semibold">
                {plan.name}
              </p>
              <div className="mt-6 flex items-center justify-center gap-x-2">
                <span className="text-foreground text-5xl font-bold tracking-tight">
                  {isMonthly
                    ? `$${plan.price}`
                    : `$${Number(plan.yearlyPrice)}`}
                </span>
                {plan.period !== "Next 3 months" && (
                  <span className="text-muted-foreground text-sm leading-6 font-semibold tracking-wide">
                    / {plan.period}
                  </span>
                )}
              </div>

              <p className="text-muted-foreground text-xs leading-5">
                {isMonthly ? "billed monthly" : "billed annually"}
              </p>

              <ul className="mt-5 flex flex-col gap-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="text-primary mt-1 h-4 w-4 flex-shrink-0" />
                    <span className="text-left">{feature}</span>
                  </li>
                ))}
              </ul>

              <hr className="my-4 w-full" />

              <Link
                href={plan.href as Route}
                className={cn(
                  buttonVariants({
                    variant: "outline",
                  }),
                  "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter",
                  "hover:ring-primary hover:bg-primary hover:text-primary-foreground transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-offset-1",
                  plan.isPopular
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-foreground",
                )}
              >
                {plan.buttonText}
              </Link>
              <p className="text-muted-foreground mt-6 text-xs leading-5">
                {plan.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

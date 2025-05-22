// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/ban-ts-comment */
// "use client";

// import { cn } from "~/lib/utils";
// import { RadioGroup } from "@headlessui/react";
// import { CheckIcon } from "@heroicons/react/20/solid";
// import { Text, Title } from "@tremor/react";
// import { Loader2 } from "lucide-react";
// import Link from "next/link";
// import Script from "next/script";
// import { useState } from "react";
// import { toast } from "sonner";
// import {
// 	CancelLink,
// 	// PauseLink,
// 	ResumeButton,
// 	// UnpauseButton,
// 	UpdateBillingLink,
// } from "~/components/payment/manage";
// import { api } from "~/trpc/react";
// import { type RouterOutputs } from "~/trpc/shared";

// type Plan = RouterOutputs["authPayment"]["getPlans"][number];
// type Subscription = RouterOutputs["authPayment"]["getSubscription"];

// interface Tier {
// 	id: string;
// 	name: string;
// 	price: {
// 		month: string;
// 		year: string;
// 	};
// 	description: string;
// 	features: string[];
// 	mostPopular: boolean;
// 	button: string;
// }

// const frequencies = [
// 	{ value: "month", label: "Monthly", priceSuffix: "/month" },
// 	{ value: "year", label: "Annually", priceSuffix: "/year" },
// ];
// const tiers: Tier[] = [
// 	{
// 		id: "free",
// 		name: "Free",
// 		price: { month: "$0", year: "$0" },
// 		description:
// 			"Start monitoring your competitors, at no cost. No credit card required.",
// 		features: [
// 			"Single user",
// 			"2 competitors",
// 			"3 AI messages",
// 			"Limited website monitoring",
// 			"Limited news monitoring",
// 			"Email, Slack, Teams integrations",
// 		],
// 		mostPopular: false,
// 		button: "Get started for free",
// 	},
// 	{
// 		id: "premium",
// 		name: "Premium",
// 		price: { month: "$18", year: "$199" },
// 		description:
// 			"Competitive intelligence and analysis. All in one. Best price.",
// 		features: [
// 			"5 users",
// 			"Unlimited competitors",
// 			"50 AI messages",
// 			"Unlimited website monitoring",
// 			"Unlimited news monitoring",
// 			"Email, Slack, Teams integrations",
// 			"Advanced alerts",
// 			"Advanced graphs",
// 		],
// 		mostPopular: true,
// 		button: "Buy now",
// 	},
// ];

export default function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // 	const { data: planData } = api.authPayment.getPlans.useQuery();
  // 	const { data: teamData } = api.authPayment.getTeamTier.useQuery({
  // 		teamId: params.slug,
  // 	});
  // 	const { data: subscriptionData } = api.authPayment.getSubscription.useQuery({
  // 		teamId: params.slug,
  // 	});

  // 	const [frequency, setFrequency] = useState(frequencies[0]!);

  return (
    <div className="mt-6">
      {/* <Title>Billing</Title> */}

      {/* {subscriptionData !== undefined &&
				planData !== undefined &&
				teamData !== undefined && (
					<>
						{subscriptionData ? (
							<>
								{subscriptionData.status === "active" && (
									<ActiveSubscription
										teamId={params.slug}
										subscription={subscriptionData}
									/>
								)}
								{subscriptionData.status === "on_trial" && (
									<TrialSubscription
										teamId={params.slug}
										subscription={subscriptionData}
									/>
								)}
								{subscriptionData.status === "past_due" && (
									<PastDueSubscription
										teamId={params.slug}
										subscription={subscriptionData}
									/>
								)}
								{subscriptionData.status === "cancelled" && (
									<CancelledSubscription
										teamId={params.slug}
										subscription={subscriptionData}
									/>
								)}
								{subscriptionData.status === "paused" && (
									<PausedSubscription subscription={subscriptionData} />
								)}
								{subscriptionData.status === "unpaid" && (
									<UnpaidSubscription
										teamId={params.slug}
										subscription={subscriptionData}
									/>
								)}
								{subscriptionData.status === "expired" && (
									<ExpiredSubscription subscription={subscriptionData} />
								)}
							</>
						) : (
							<Text>Track more competitors with Premium</Text>
						)}

						<div className="mt-4 flex justify-center">
							<RadioGroup
								value={frequency}
								onChange={setFrequency}
								className="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-xs font-semibold leading-5 ring-1 ring-inset ring-gray-200"
							>
								<RadioGroup.Label className="sr-only">
									Payment frequency
								</RadioGroup.Label>
								{frequencies.map((option) => (
									<RadioGroup.Option
										key={option.value}
										value={option}
										className={({ checked }) =>
											cn(
												checked ? "bg-indigo-600 text-white" : "text-gray-500",
												"cursor-pointer rounded-full px-2.5 py-1",
											)
										}
									>
										<span>{option.label}</span>
									</RadioGroup.Option>
								))}
							</RadioGroup>
						</div>
						<div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 md:max-w-2xl md:grid-cols-2 lg:max-w-4xl lg:grid-cols-2 xl:mx-0 xl:max-w-4xl xl:grid-cols-2">
							{tiers.map((tier) => {
								const plan = planData.find(
									(p) => p.slug === tier.id && p.interval === frequency.value,
								);
								return (
									<div
										key={tier.id}
										className={cn(
											tier.mostPopular
												? "ring-2 ring-indigo-600"
												: "ring-1 ring-gray-200",
											"rounded-3xl bg-white p-8",
										)}
									>
										<h3
											id={tier.id}
											className={cn(
												tier.mostPopular ? "text-indigo-600" : "text-gray-900",
												"text-lg font-semibold leading-8",
											)}
										>
											{tier.name}
										</h3>
										<p className="mt-4 text-sm leading-6 text-gray-600">
											{tier.description}
										</p>
										<p className="mt-6 flex items-baseline gap-x-1">
											<span className="text-4xl font-bold tracking-tight text-gray-900">
												{tier.price[frequency.value]}
											</span>
											<span className="text-sm font-semibold leading-6 text-gray-600">
												{frequency.priceSuffix}
											</span>
										</p>
										<PlanButton
											teamId={params.slug}
											plan={plan ?? null}
											tier={tier}
											subscription={subscriptionData}
											currentTier={teamData}
										/>
										<ul
											role="list"
											className="mt-8 space-y-3 text-sm leading-6 text-gray-600"
										>
											{tier.features.map((feature) => (
												<li key={feature} className="flex gap-x-3">
													<CheckIcon
														className="h-6 w-5 flex-none text-indigo-600"
														aria-hidden="true"
													/>
													{feature}
												</li>
											))}
										</ul>
									</div>
								);
							})}
						</div>

						<p className="mt-8 text-center text-sm text-gray-400">
							Payments are processed securely by Lemon Squeezy.
						</p>
					</>
				)} */}

      {/* <Script
				src="https://app.lemonsqueezy.com/js/lemon.js"
				onLoad={() => {
					window.createLemonSqueezy();
				}}
			/> */}
    </div>
  );
}

// const ActiveSubscription = ({
// 	teamId,
// 	subscription,
// }: {
// 	teamId: string;
// 	subscription: NonNullable<Subscription>;
// }) => {
// 	return (
// 		<>
// 			<p className="mb-2">
// 				You are on the{" "}
// 				<b>
// 					{subscription.plan.name} {subscription.plan.interval}ly
// 				</b>{" "}
// 				plan.
// 			</p>

// 			<p className="mb-2">
// 				Your next renewal will be on{" "}
// 				{formatDate(subscription.renewsAt ?? new Date())}.
// 			</p>

// 			<hr className="my-8" />

// 			<p>
// 				<UpdateBillingLink subscription={subscription} />
// 			</p>

// 			{/* <p>
// 				<PauseLink subscription={subscription} />
// 			</p> */}

// 			<p>
// 				<CancelLink teamId={teamId} subscription={subscription} />
// 			</p>
// 		</>
// 	);
// };

// const CancelledSubscription = ({
// 	teamId,
// 	subscription,
// }: {
// 	teamId: string;
// 	subscription: NonNullable<Subscription>;
// }) => {
// 	return (
// 		<>
// 			<p className="mb-2">
// 				You are currently on the{" "}
// 				<b>
// 					{subscription.name} {subscription.plan.interval}ly
// 				</b>{" "}
// 				plan, paying ${subscription.price / 100}/{subscription.plan.interval}.
// 			</p>

// 			<p className="mb-8">
// 				Your subscription has been cancelled and{" "}
// 				<b>will end on {formatDate(subscription.endsAt ?? new Date())}</b>.
// 				After this date you will no longer have access to the app.
// 			</p>

// 			<p>
// 				<ResumeButton teamId={teamId} subscription={subscription} />
// 			</p>
// 		</>
// 	);
// };

// // const PausedSubscription = ({
// // 	subscription,
// // }: {
// // 	subscription: NonNullable<Subscription>;
// // }) => {
// // 	return (
// // 		<>
// // 			<p className="mb-2">
// // 				You are currently on the{" "}
// // 				<b>
// // 					{subscription.name} {subscription.plan.interval}ly
// // 				</b>{" "}
// // 				plan, paying ${subscription.price / 100}/{subscription.plan.interval}.
// // 			</p>

// // 			{subscription.unpauseDate ? (
// // 				<p className="mb-8">
// // 					Your subscription payments are currently paused. Your subscription
// // 					will automatically resume on {formatDate(subscription.unpauseDate)}.
// // 				</p>
// // 			) : (
// // 				<p className="mb-8">Your subscription payments are currently paused.</p>
// // 			)}

// // 			<p>
// // 				<UnpauseButton subscription={subscription} />
// // 			</p>
// // 		</>
// // 	);
// // };

// const TrialSubscription = ({
// 	teamId,
// 	subscription,
// }: {
// 	teamId: string;
// 	subscription: NonNullable<Subscription>;
// }) => {
// 	return (
// 		<>
// 			<p className="mb-2">
// 				You are currently on a free trial of the{" "}
// 				<b>
// 					{subscription.name} {subscription.plan.interval}ly
// 				</b>{" "}
// 				plan, paying ${subscription.price}/{subscription.plan.interval}.
// 			</p>

// 			<p className="mb-6">
// 				Your trial ends on {formatDate(subscription.trialEndsAt ?? new Date())}.
// 				You can cancel your subscription before this date and you won&apos;t be
// 				charged.
// 			</p>

// 			<hr className="my-8" />

// 			<p className="mb-4">
// 				<Link
// 					href="/billing/change-plan"
// 					className="inline-block rounded-full bg-amber-200 px-6 py-2 font-bold text-amber-800"
// 				>
// 					Change plan &rarr;
// 				</Link>
// 			</p>

// 			<p>
// 				<UpdateBillingLink subscription={subscription} />
// 			</p>

// 			<p>
// 				<CancelLink teamId={teamId} subscription={subscription} />
// 			</p>
// 		</>
// 	);
// };

// const PastDueSubscription = ({
// 	teamId,
// 	subscription,
// }: {
// 	teamId: string;
// 	subscription: NonNullable<Subscription>;
// }) => {
// 	return (
// 		<>
// 			<div className="my-8 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
// 				Your latest payment failed. We will re-try this payment up to four
// 				times, after which your subscription will be cancelled.
// 				<br />
// 				If you need to update your billing details, you can do so below.
// 			</div>

// 			<p className="mb-2">
// 				You are currently on the{" "}
// 				<b>
// 					{subscription.name} {subscription.plan.interval}ly
// 				</b>{" "}
// 				plan, paying ${subscription.price}/{subscription.plan.interval}.
// 			</p>

// 			<p className="mb-2">
// 				We will attempt a payment on{" "}
// 				{formatDate(subscription.renewsAt ?? new Date())}.
// 			</p>

// 			<hr className="my-8" />

// 			<p>
// 				<UpdateBillingLink subscription={subscription} />
// 			</p>

// 			<p>
// 				<CancelLink teamId={teamId} subscription={subscription} />
// 			</p>
// 		</>
// 	);
// };

// const UnpaidSubscription = ({
// 	teamId,
// 	subscription,
// }: {
// 	teamId: string;
// 	subscription: NonNullable<Subscription>;
// }) => {
// 	/*
//     Unpaid subscriptions have had four failed recovery payments.
//     If you have dunning enabled in your store settings, customers will be sent emails trying to reactivate their subscription.
//     If you don't have dunning enabled the subscription will remain "unpaid".
//     */
// 	return (
// 		<>
// 			<p className="mb-2">
// 				We haven&apos;t been able to make a successful payment and your
// 				subscription is currently marked as unpaid.
// 			</p>

// 			<p className="mb-6">
// 				Please update your billing information to regain access.
// 			</p>

// 			<p>
// 				<UpdateBillingLink subscription={subscription} elementType="button" />
// 			</p>

// 			<hr className="my-8" />

// 			<p>
// 				<CancelLink teamId={teamId} subscription={subscription} />
// 			</p>
// 		</>
// 	);
// };

// const ExpiredSubscription = ({
// 	subscription,
// }: {
// 	subscription: NonNullable<Subscription>;
// }) => {
// 	return (
// 		<>
// 			<p className="mb-2">
// 				Your subscription expired on {formatDate(new Date())}.
// 				{/* Your subscription expired on {formatDate(subscription.expiryDate ?? new Date())}. */}
// 			</p>

// 			<p className="mb-2">Please create a new subscription to regain access.</p>

// 			<hr className="my-8" />

// 			{/* <Plans
// 				sub={subscription}
// 				plans={plans}
// 				setSubscription={setSubscription}
// 			/> */}
// 		</>
// 	);
// };

// function formatDate(date: Date) {
// 	if (!date) {
// 		return "";
// 	}
// 	return new Date(date).toLocaleString("en-US", {
// 		month: "short",
// 		day: "2-digit",
// 		year: "numeric",
// 	});
// }

// interface IProps {
// 	teamId: string;
// 	plan: Plan | null;
// 	tier: Tier;
// 	subscription: Subscription | null;
// 	currentTier: string;
// 	// setSubscription
// }

// function PlanButton({ teamId, plan, tier, subscription, currentTier }: IProps) {
// 	const mutation = api.authPayment.createCheckout.useMutation();
// 	// const mutation2 = api.authPayment.changePlan.useMutation();

// 	const isSameTier = tier.id === currentTier;
// 	const isExpired = subscription?.status === "expired";

// 	const createCheckout = async () => {
// 		if (!plan) {
// 			toast.error("No plan! Please contact us support@comppint.co");
// 			return;
// 		}
// 		const toastId = toast.loading("Adding payment...");
// 		try {
// 			const result = await mutation.mutateAsync({
// 				teamId: teamId,
// 				variantId: plan.variantId,
// 			});
// 			if (result.success) {
// 				toast.success("Payment added! Redirecting...", { id: toastId });
// 				LemonSqueezy.Url.Open(result.data!);
// 				return;
// 			}
// 			toast.error(`Error: ${result.msg}`, { id: toastId });
// 		} catch (error) {
// 			toast.error("An unexpected error happened! Please try again later", {
// 				id: toastId,
// 			});
// 		}
// 	};

// 	// 	const changePlan = async () => {
// 	// 		if (!plan) {
// 	// 			return
// 	// 		}

// 	// 		if (
// 	// 			confirm(`Please confirm you want to change to the ${plan.name} ${plan.interval}ly plan. \
// 	// For upgrades you will be charged a prorated amount.`)
// 	// 		) {

// 	// 			const toastId = toast.loading("Creating payment...");
// 	// 		try {
// 	// 			const result = await mutation2.mutateAsync({
// 	// 				teamId: teamId,
// 	// 				subscriptionId: subscription.id,
// 	// 				variantId: plan.variantId,
// 	// 				productId: plan.productId,
// 	// 			});
// 	// 			if (result.success) {
// 	// 				toast.success("Payment created! Redirecting...", { id: toastId });
// 	// 			LemonSqueezy.Url.Open(checkout["url"]);
// 	// 				return;
// 	// 			}
// 	// 			toast.error(`Error: ${result.msg}`, { id: toastId });
// 	// 		} catch (error) {
// 	// 			toast.error("An unexpected error happened! Please try again later", {
// 	// 				id: toastId,
// 	// 			});
// 	// 		}

// 	// 			setIsMutating(true);

// 	// 			// Send request
// 	// 			const res = await fetch(`/api/subscription/${subscription.id}`, {
// 	// 				method: "POST",
// 	// 				body: JSON.stringify({
// 	// 					variantId: plan.variantId,
// 	// 					productId: plan.productId,
// 	// 				}),
// 	// 			});
// 	// 			const result = await res.json();
// 	// 			if (result.error) {
// 	// 				toast.error(result.message);
// 	// 			} else {
// 	// 				// setSubscription({
// 	// 				// 	...subscription,
// 	// 				// 	productId: result["subscription"]["product_id"],
// 	// 				// 	variantId: result["subscription"]["variant_id"],
// 	// 				// 	planName: result["subscription"]["plan"]["name"],
// 	// 				// 	planInterval: result["subscription"]["plan"]["interval"],
// 	// 				// 	status: result["subscription"]["status"],
// 	// 				// 	renewalDate: result["subscription"]["renews_at"],
// 	// 				// 	price: result["subscription"]["price"],
// 	// 				// });

// 	// 				toast.success("Your subscription plan has changed!");

// 	// 				// Webhooks will update the DB in the background
// 	// 			}
// 	// 		}
// 	// 	};

// 	return (
// 		<>
// 			<button
// 				aria-describedby={tier.id}
// 				className={cn(
// 					tier.mostPopular
// 						? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500"
// 						: "text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300",
// 					"mt-6 flex w-full items-center justify-center rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-500",
// 				)}
// 				disabled={mutation.isPending}
// 				onClick={async () => {
// 					if (isSameTier && !isExpired) {
// 						return;
// 					}
// 					if (isSameTier && isExpired) {
// 						if (plan) {
// 							await createCheckout();
// 						}
// 						return;
// 					}
// 					if (!isSameTier && !subscription) {
// 						await createCheckout();
// 						return;
// 					}
// 					if (!isSameTier && subscription) {
// 						// await changePlan();
// 						return;
// 					}
// 					// TODO interval check for montly/yearly change
// 					// TODO trigger cancel when there is a subscription and free is clicked
// 				}}
// 			>
// 				{mutation.isPending ? (
// 					<>
// 						<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
// 					</>
// 				) : (
// 					<>
// 						{isSameTier && !isExpired && "Your current plan"}
// 						{isSameTier && isExpired && "Sign up"}
// 						{!isSameTier && "Change to this plan"}
// 					</>
// 				)}
// 			</button>
// 		</>
// 	);
// }

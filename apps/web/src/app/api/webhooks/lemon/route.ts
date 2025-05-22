// /* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// import { prisma } from "@fulltemplate/db";
// import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";
// import { NextResponse } from "next/server";
// import { env } from "~/env";

// lemonSqueezySetup({
// 	apiKey: env.LEMONSQUEEZY_API_KEY,
// });

// type WebhookEvent =
// 	| "order_created"
// 	| "order_refunded"
// 	| "subscription_created"
// 	| "subscription_updated"
// 	| "subscription_cancelled"
// 	| "subscription_resumed"
// 	| "subscription_expired"
// 	| "subscription_paused"
// 	| "subscription_unpaused"
// 	| "subscription_payment_success"
// 	| "subscription_payment_failed"
// 	| "subscription_payment_recovered"
// 	| "license_key_created"
// 	| "license_key_updated";

// interface WebhookBody {
// 	meta: {
// 		event_name: WebhookEvent;
// 		custom_data: any;
// 	};
// 	data: {
// 		type: string;
// 		id: string;
// 		attributes: {
// 			store_id: number;
// 			customer_id: number;
// 			order_id: number;
// 			order_item_id: number;
// 			product_id: number;
// 			variant_id: number;
// 			product_name: string;
// 			variant_name: string;
// 			user_name: string;
// 			user_email: string;
// 			status: string;
// 			status_formatted: string;
// 			card_brand: string;
// 			card_last_four: string;
// 			pause?: any;
// 			cancelled: boolean;
// 			trial_ends_at: string;
// 			billing_anchor: number;
// 			first_subscription_item: {
// 				id: number;
// 				subscription_id: number;
// 				price_id: number;
// 				quantity: number;
// 				created_at: string;
// 				updated_at: string;
// 			};
// 			urls: {
// 				update_payment_method: string;
// 				customer_portal: string;
// 			};
// 			renews_at: string;
// 			ends_at?: any;
// 			created_at: string;
// 			updated_at: string;
// 			test_mode: boolean;
// 		};
// 		relationships: {
// 			store: Store;
// 			customer: Store;
// 			order: Store;
// 			"order-item": Store;
// 			product: Store;
// 			variant: Store;
// 			"subscription-items": Store;
// 			"subscription-invoices": Store;
// 		};
// 		links: {
// 			self: string;
// 		};
// 	};
// }

// interface Store {
// 	links: {
// 		related: string;
// 		self: string;
// 	};
// }

// export async function POST(req: Request) {
// 	const rawBody = await req.text();

// 	console.log(JSON.parse(rawBody));

// 	// TODO
// 	// const hmac = crypto.createHmac("sha256", env.LEMONSQUEEZY_WEBHOOK_SECRET);
// 	// const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");

// 	// const header =
// 	// 	req.headers.get("X-Signature") ?? req.headers.get("x-signature");
// 	// if (!header) {
// 	// 	return NextResponse.json(null, { status: 400 });
// 	// }

// 	// const signature = Buffer.from(header, "utf8");
// 	// if (!crypto.timingSafeEqual(digest, signature)) {
// 	// 	throw new Error("Invalid signature.");
// 	// }

// 	const body = JSON.parse(rawBody) as WebhookBody;

// 	const eventName = body.meta.event_name;
// 	const customData = body.meta.custom_data || null;
// 	const data = body.data;
// 	const attributes = body.data.attributes;

// 	const event = await prisma.webhookEvent.create({
// 		data: {
// 			eventName: eventName,
// 			body: JSON.parse(rawBody),
// 		},
// 	});

// 	if (!customData?.team_id) {
// 		return NextResponse.json(null, { status: 400 });
// 	}

// 	const teamId = customData.team_id as string;
// 	const userId = customData.user_id as string;

// 	if (eventName.startsWith("subscription_payment_")) {
// 		// TODO
// 	} else if (eventName.startsWith("subscription_")) {
// 		const plan = await prisma.plan.findUnique({
// 			where: {
// 				variantId: attributes.variant_id,
// 			},
// 		});

// 		if (!plan) {
// 			return NextResponse.json(null, { status: 400 });
// 		}

// 		const lemonSqueezyId = parseInt(data.id);

// 		const subscription = await prisma.subscription.upsert({
// 			where: {
// 				lemonSqueezyId: lemonSqueezyId,
// 			},
// 			update: {
// 				orderId: attributes.order_id,
// 				planId: plan.id,
// 				teamId: teamId,
// 				name: attributes.user_name,
// 				email: attributes.user_email,
// 				status: attributes.status,
// 				renewsAt: attributes.renews_at,
// 				endsAt: attributes.ends_at,
// 				trialEndsAt: attributes.trial_ends_at,
// 				price: plan.price,
// 				subscriptionItemId: attributes.first_subscription_item.id,
// 			},
// 			create: {
// 				orderId: attributes.order_id,
// 				planId: plan.id,
// 				teamId: teamId,
// 				name: attributes.user_name,
// 				email: attributes.user_email,
// 				status: attributes.status,
// 				renewsAt: attributes.renews_at,
// 				endsAt: attributes.ends_at,
// 				trialEndsAt: attributes.trial_ends_at,
// 				subscriptionItemId: attributes.first_subscription_item.id,
// 				lemonSqueezyId: lemonSqueezyId,
// 				price: plan.price,
// 			},
// 		});

// 		if (subscription.status === "active") {
// 			await prisma.team.update({
// 				where: {
// 					id: teamId,
// 				},
// 				data: {
// 					tier: plan.slug ?? "premium",
// 				},
// 			});
// 		}
// 	} else if (eventName.startsWith("order_")) {
// 		// TODO
// 	} else if (eventName.startsWith("license_")) {
// 		// TODO
// 	}

// 	await prisma.webhookEvent.update({
// 		where: {
// 			id: event.id,
// 		},
// 		data: {
// 			processed: true,
// 		},
// 	});

// 	return NextResponse.json({ success: true }, { status: 200 });
// }

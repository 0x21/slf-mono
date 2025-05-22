/* eslint-disable no-console */
import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { stripe } from "@fulltemplate/payment";

const stripeWebhookEvents = new Set([
  "product.created",
  "product.updated",
  "product.deleted",
  "price.created",
  "price.updated",
  "checkout.session.completed",
  "checkout.session.expired",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
]);

export async function POST(req: NextRequest) {
  const stripeEvent = await stripeWebHook(req);
  return stripeEvent;
}

const stripeWebHook = async (req: NextRequest) => {
  let stripeEvent: Stripe.Event;

  const body = await req.text();
  const heads = await headers();
  const sig = heads.get("Stripe-Signature");
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    if (!sig || !webhookSecret) {
      console.log(
        "Error Stripe webhook secret or the signature does not exist.",
      );
      return;
    }

    stripeEvent = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (error) {
    console.log(
      `Error ${
        error instanceof Error
          ? error.message
          : "error occurred while receiving webhook"
      }`,
      error,
    );
    return new NextResponse(
      `Webhook Error: ${
        error instanceof Error ? error.message : "something went wrong"
      }`,
      { status: 400 },
    );
  }

  try {
    if (stripeWebhookEvents.has(stripeEvent.type)) {
      const subscription = stripeEvent.data.object as Stripe.Subscription;
      if (
        !subscription.metadata.connectAccountPayments &&
        !subscription.metadata.connectAccountSubscriptions
      ) {
        // switch (stripeEvent.type) {
        //   case "product.created":
        //     console.log("Product created:", stripeEvent.data.object);
        //     break;
        //   case "product.updated":
        //     console.log("Product updated:", stripeEvent.data.object);
        //     break;
        //   case "product.deleted":
        //     console.log("Product deleted:", stripeEvent.data.object);
        //     break;
        //   case "price.created":
        //     console.log("Price created:", stripeEvent.data.object);
        //     break;
        //   case "price.updated":
        //     console.log("Price updated:", stripeEvent.data.object);
        //     break;
        //   case "checkout.session.completed":
        //     console.log("Checkout session completed:", stripeEvent.data.object);
        //     break;
        //   case "checkout.session.expired":
        //     console.log(
        //       "⏳ Checkout session expired:",
        //       stripeEvent.data.object,
        //     );
        //     break;
        //   case "customer.subscription.created":
        //     console.log("Customer subscription created:", subscription);
        //     break;
        //   case "customer.subscription.updated":
        //     console.log("Customer subscription updated:", subscription);
        //     break;
        //   case "customer.subscription.deleted":
        //     console.log("Customer subscription deleted:", subscription);
        //     break;
        //   case "customer.subscription.paused":
        //     console.log("Customer subscription paused:", subscription);
        //     break;
        //   case "customer.subscription.resumed":
        //     console.log("Customer subscription resumed:", subscription);
        //     break;
        //   default:
        //     console.log("Unhandled event type:", stripeEvent.type);
        // }
      } else {
        console.log(
          "SKIPPED FROM WEBHOOK 💳 because subscription was from a connected account, not for the application",
          subscription,
        );
      }
    }
  } catch (error) {
    console.log(error);
    return new NextResponse("🔴 Webhook Error", { status: 400 });
  }

  return NextResponse.json(
    {
      webhookActionReceived: true,
    },
    {
      status: 200,
    },
  );
};

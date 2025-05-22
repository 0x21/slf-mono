import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const config = {
  matcher:
    "/((?!_next/static|_next/image|public/|favicon.ico|robots.txt|sitemap.xml|manifest.json|monitoring-tunnel).*)",
};

const middleware = (req: NextRequest) => {
  const { nextUrl } = req;

  // Posthog ingest
  // if (nextUrl.pathname.startsWith("/ingest")) {
  //   const url = req.nextUrl.clone();
  //   const hostname = url.pathname.startsWith("/ingest/static/")
  //     ? "eu-assets.i.posthog.com"
  //     : "eu.i.posthog.com";
  //
  //   const requestHeaders = new Headers(req.headers);
  //   requestHeaders.set("host", hostname);
  //
  //   url.protocol = "https";
  //   url.hostname = hostname;
  //   url.port = "443";
  //   url.pathname = url.pathname.replace(/^\/ingest/, "");
  //
  //   return NextResponse.rewrite(url, {
  //     headers: requestHeaders,
  //   });
  // }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", nextUrl.pathname);
  requestHeaders.set("x-search", nextUrl.search);

  return NextResponse.rewrite(nextUrl, {
    request: {
      headers: requestHeaders,
    },
  });
};

export default middleware;

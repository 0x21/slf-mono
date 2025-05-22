import { userAgent } from "next/server";

import { env } from "./env";

function fixEncoding(
  input: string | undefined | null,
): string | undefined | null {
  if (!input) {
    return input;
  }
  const buffer = Buffer.from(input, "latin1");
  return buffer.toString("utf8");
}

export interface GetRequestDetailsResult {
  continent: string | undefined | null;
  country: string | undefined | null;
  city: string | undefined | null;
  region: string | undefined | null;
  regionCode: string | undefined | null;
  latitude: string | undefined | null;
  longitude: string | undefined | null;
  postalCode: string | undefined | null;
  ip: string | undefined | null;
  timezone: string | undefined | null;
  userAgent: UserAgent;
  environment: string;
}

const getHeaderData = (heads: Headers): GetRequestDetailsResult | undefined => {
  try {
    // CloudFlare, cf-ipcontinent, cf-ipcountry, cf-connecting-ip, cf-ipcity, cf-iplatitude, cf-iplongitude, cf-postal-code, cf-region, cf-region-code, cf-ray, cf-timezone
    // TODO Vercel,
    const continent = heads.get("CF-IPContinent");
    const country = heads.get("CF-IPCountry");
    const city = fixEncoding(heads.get("CF-IPCity"));
    const region = heads.get("CF-Region");
    const regionCode = heads.get("CF-Region-Code");
    const latitude = heads.get("CF-IPLatitude");
    const longitude = heads.get("CF-IPLongitude");
    const postalCode = heads.get("CF-Postal-Code");
    const ip = heads.get("CF-Connecting-IP");
    const timezone = heads.get("CF-Timezone");
    const agent = userAgent({
      headers: heads,
    });

    // const host = heads.get("host");
    // const environment = host === "localhost:3000";
    const environment = env.NODE_ENV;
    return {
      continent: continent,
      country: country,
      city: city,
      region: region,
      regionCode: regionCode,
      latitude: latitude,
      longitude: longitude,
      postalCode: postalCode,
      ip: ip,
      timezone: timezone,
      userAgent: agent,
      environment: environment,
    };
  } catch (error) {
    console.log(error);
    return;
  }
};

export const getRequestDetails = async (
  headers?: Headers,
): Promise<GetRequestDetailsResult | undefined> => {
  try {
    if (!headers) {
      return;
    }
    const headerData = getHeaderData(headers);
    return headerData;
  } catch (error) {
    console.log(error);
    return;
  }
};

export const getRequestDetailsSync = (
  headers?: Headers,
): GetRequestDetailsResult | undefined => {
  try {
    if (!headers) {
      return;
    }
    const headerData = getHeaderData(headers);
    return headerData;
  } catch (error) {
    console.log(error);
    return;
  }
};

export type UserAgent = ReturnType<typeof userAgent>;

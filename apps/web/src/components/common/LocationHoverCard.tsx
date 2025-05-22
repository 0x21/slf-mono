/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
"use client";

import Link from "next/link";
import {
  Bot,
  CircleCheck,
  CircleX,
  Compass,
  Cpu,
  Earth,
  Globe,
  Mail,
  Map,
  MapPin,
  Monitor,
  Smartphone,
  VenetianMask,
} from "lucide-react";

import type { UserAgent } from "@fulltemplate/helpers/src/request-details";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";

const isMobile = (userAgent: string | null) => {
  if (!userAgent) {
    return false;
  }
  const ua = userAgent.toLowerCase();
  return /mobile|android|iphone|ipad/i.test(ua);
};

interface IProps {
  ip: string | null;
  city: string | null;
  country: string | null;
  region: string | null;
  continent: string | null;
  latitude: string | null;
  longitude: string | null;
  postalCode: string | null;
  regionCode: string | null;
  userAgent: string | null;
  environment: string | null;
  impersonate?: boolean | null;
}

const LocationHoverCard = ({
  ip,
  city,
  country,
  region,
  continent,
  latitude,
  longitude,
  postalCode,
  regionCode,
  userAgent,
  environment,
  impersonate,
}: IProps) => {
  const parsedUserAgent: UserAgent = (() => {
    if (!userAgent) {
      return {};
    }
    try {
      return JSON.parse(userAgent);
    } catch (e) {
      return {};
    }
  })();

  if (!parsedUserAgent) {
    return null;
  }

  const { browser, os, device, cpu, engine, isBot } = parsedUserAgent;
  const DeviceIcon = isMobile(userAgent) ? Smartphone : Monitor;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="flex cursor-pointer items-center">
          {environment === "development" && (
            <div className="bg-muted flex items-center rounded-md px-3 py-1">
              <span className="text-accent-foreground text-xs font-medium">
                Development
              </span>
            </div>
          )}
          {environment === "production" && (
            <div className="flex flex-col justify-center">
              {ip && (
                <div className="text-muted-foreground flex items-center truncate text-xs font-medium">
                  <DeviceIcon className="text-muted-foreground mr-2 size-4" />
                  IP:
                  <div className="bg-secondary ml-2 flex h-5 items-center rounded-md px-1.5">
                    <span className="text-primary text-[10px]">{ip}</span>
                  </div>
                </div>
              )}
              {city && country && regionCode && (
                <p className="text-muted-foreground flex items-center truncate text-xs font-medium">
                  <MapPin className="text-muted-foreground mr-2 size-4" />
                  {city} {regionCode}, {country}
                </p>
              )}
            </div>
          )}
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="max-w-[300px] rounded-lg p-4 shadow-lg">
        <div className="flex items-center">
          <div className="ml-2 flex flex-col justify-center space-y-2">
            {ip && (
              <p className="text-muted-foreground flex items-center truncate font-medium">
                <DeviceIcon className="text-muted-foreground mr-2 size-4" />
                IP:
                <span className="bg-secondary text-primary ml-2 rounded-md px-2 py-1 text-xs">
                  {ip}
                </span>
              </p>
            )}

            {city && country && regionCode && (
              <p className="text-muted-foreground flex items-center truncate font-medium">
                <MapPin className="text-muted-foreground mr-2 size-4" />
                {city} {regionCode}, {country}
              </p>
            )}

            {region && (
              <p className="text-muted-foreground flex items-center truncate font-medium">
                <Earth className="text-muted-foreground mr-2 size-4" />
                {region}
              </p>
            )}

            {continent && (
              <p className="text-muted-foreground flex items-center truncate font-medium">
                <Map className="text-muted-foreground mr-2 size-4" />
                Continent: {continent}
              </p>
            )}

            {latitude && longitude && (
              <p className="text-muted-foreground hover:text-primary flex items-center truncate font-medium underline decoration-dashed hover:decoration-solid">
                <Compass className="text-muted-foreground mr-2 size-4" />
                <Link
                  href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                  target="_blank"
                >
                  {latitude}, {longitude}
                </Link>
              </p>
            )}

            {postalCode && (
              <p className="text-muted-foreground flex items-center truncate font-medium">
                <Mail className="text-muted-foreground mr-2 size-4" />
                {postalCode}
              </p>
            )}

            {browser && (
              <p className="text-muted-foreground flex items-center truncate font-medium">
                <Globe className="text-muted-foreground mr-2 size-4" />
                Browser: {browser.name}{" "}
                {browser.version && `v${browser.version}`}
              </p>
            )}

            {os && (
              <p className="text-muted-foreground flex items-center truncate font-medium">
                <Cpu className="text-muted-foreground mr-2 size-4" />
                OS: {os.name} {os.version && `v${os.version}`}
              </p>
            )}

            {device && (
              <p className="text-muted-foreground flex items-center truncate font-medium">
                <DeviceIcon className="text-muted-foreground mr-2 size-4" />
                Device: {device.vendor || "Unknown"} {device.model || ""}
              </p>
            )}

            {cpu && (
              <p className="text-muted-foreground flex truncate font-medium">
                <Cpu className="text-muted-foreground mr-2 size-4" />
                <div className="flex flex-col">
                  <span className="text-sm">
                    CPU: {cpu?.architecture || "Unknown Architecture"}
                  </span>
                </div>
              </p>
            )}
            {engine && (
              <p className="text-muted-foreground flex items-center truncate font-medium">
                <Cpu className="text-muted-foreground mr-2 size-4" />
                Engine: {engine.name} {engine.version && `v${engine.version}`}
              </p>
            )}
            {isBot !== undefined && (
              <p className="text-muted-foreground flex items-center gap-x-2 truncate font-medium">
                <Bot className="text-muted-foreground size-4" />
                Bot:{" "}
                {isBot ? (
                  <CircleCheck className="size-4 text-green-500" />
                ) : (
                  <CircleX className="size-4 text-red-500" />
                )}
              </p>
            )}
            {impersonate && (
              <p className="text-muted-foreground flex items-center gap-x-2 truncate font-medium">
                <VenetianMask className="text-muted-foreground size-4" />
                Impersonated:{" "}
                {impersonate ? (
                  <CircleCheck className="size-4 text-green-500" />
                ) : (
                  <CircleX className="size-4 text-red-500" />
                )}
              </p>
            )}
          </div>
        </div>{" "}
      </HoverCardContent>
    </HoverCard>
  );
};

export default LocationHoverCard;

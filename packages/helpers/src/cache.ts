import { cache } from "react";

import { getAppConfig, getUserAccountProviders } from "./config";
import {
  getOrganizationDetail,
  getOrganizationMemberRole,
} from "./organization";

export const cacheGetAppConfig = cache(getAppConfig);

export const cacheGetUserAccountProviders = cache(getUserAccountProviders);

export const cacheGetOrganizationMemberRole = cache(getOrganizationMemberRole);

export const cacheGetOrganizationDetail = cache(getOrganizationDetail);

import { cache } from "react";

import {
  getAppConfig,
  getUserAccountProviders,
} from "@fulltemplate/helpers/src/config";
import {
  getOrganizationDetail,
  getOrganizationMemberRole,
} from "@fulltemplate/helpers/src/organization";

export const cacheGetAppConfig = cache(getAppConfig);

export const cacheGetUserAccountProviders = cache(getUserAccountProviders);

export const cacheGetOrganizationMemberRole = cache(getOrganizationMemberRole);

export const cacheGetOrganizationDetail = cache(getOrganizationDetail);

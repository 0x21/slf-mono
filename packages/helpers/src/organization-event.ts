/* eslint-disable @typescript-eslint/no-unused-vars */
import { db } from "@fulltemplate/db";

interface CreateOrganizationInviteEventParams {
  category: "organization";
  organizationId: string;
  type: "invite";
  action: "created" | "updated" | "deleted" | "expired" | "accepted";
  status: "success" | "failed";
}

interface CreateOrganizationMemberEventParams {
  category: "organization";
  organizationId: string;
  type: "member";
  action: "joined" | "left" | "kicked" | "role-changed" | "added";
  status: "success" | "failed";
}

interface CreateOrganizationIntegrationEventParams {
  category: "organization";
  organizationId: string;
  type: "integration";
  action: "created" | "updated" | "deleted";
  status: "success" | "failed";
}

interface CreateOrganizationModalEventParams {
  category: "modal";
  organizationId: string;
  type: "organization" | "group" | "module" | "report";
  action: "created" | "updated" | "deleted";
  status: "success" | "failed";
}

interface CreateOrganizationRulesetEventParams {
  category: "modal";
  organizationId: string;
  type: "ruleset";
  action: "created" | "updated" | "deleted" | "removed-group" | "added-group";
  status: "success" | "failed";
}

interface CreateOrganizationDeviceEventParams {
  category: "modal";
  organizationId: string;
  type: "device";
  action:
    | "created"
    | "updated"
    | "deleted"
    | "received-data"
    | "duplicate"
    | "transferred"
    | "download-file"
    | "upload-file"
    | "export-jwt";
  status: "success" | "failed";
}

interface CreateOrganizationNotificationEventParams {
  category: "modal";
  organizationId: string;
  type: "notification";
  action: "pushed" | "seen" | "updated";
  status: "success" | "failed";
}
interface CreateOrganizationSupportTicketEventParams {
  category: "modal";
  organizationId: string;
  type: "support-ticket";
  action: "created" | "updated" | "deleted";
  status: "success" | "failed";
}

type CreateOrganizationEventParams = {
  organizationId: string;
  memberId?: string;
  severity?: string;
  metadata?: object | string;
  error?: string | undefined;
} & (
  | CreateOrganizationModalEventParams
  | CreateOrganizationDeviceEventParams
  | CreateOrganizationRulesetEventParams
  | CreateOrganizationInviteEventParams
  | CreateOrganizationMemberEventParams
  | CreateOrganizationNotificationEventParams
  | CreateOrganizationSupportTicketEventParams
  | CreateOrganizationIntegrationEventParams
);

export const createOrganizationEvent = async (
  params: CreateOrganizationEventParams,
) => {
  try {
    await db.organizationEvent.create({
      data: {
        organizationId: params.organizationId,
        memberId: params.memberId,
        severity: params.severity,
        category: params.category,
        type: params.type,
        action: params.action,
        status: params.status,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        error: params.error,
      },
    });
  } catch (error) {
    // empty
  }
};

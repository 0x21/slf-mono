import { kafka } from "./index";

export interface CreateGroupCreated {
  workerType: "group-created";
  organizationId: string;
  group: {
    id: string;
    name: string;
  };
  member?: {
    fullName: string;
    email: string;
  };
}

export interface CreateGroupUpdated {
  workerType: "group-updated";
  organizationId: string;
  group: {
    id: string;
    name: string;
  };
  member?: {
    fullName: string;
    email: string;
  };
}

export interface CreateGroupDeleted {
  workerType: "group-deleted";
  organizationId: string;
  group: {
    name: string;
  };
  member?: {
    fullName: string;
    email: string;
  };
}
export interface CreateGroupsDeleted {
  workerType: "groups-deleted";
  organizationId: string;
  groups: {
    name: string;
  }[];
  member?: {
    fullName: string;
    email: string;
  };
}

export interface CreateKafkaWorkNotificationParams {
  payload:
    | CreateGroupCreated
    | CreateGroupUpdated
    | CreateGroupDeleted
    | CreateGroupsDeleted;
}

export const createKafkaWorkNotification = async (
  params: CreateKafkaWorkNotificationParams,
) => {
  const producer = kafka.producer();
  await producer.connect();
  const res = await producer.send({
    topic: "work.notification",
    messages: [
      {
        value: JSON.stringify(params.payload),
      },
    ],
  });
  await producer.disconnect();
  return res;
};

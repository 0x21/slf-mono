import type { Producer } from "kafkajs";
import { Kafka, logLevel } from "kafkajs";

import { env } from "./env";

const createKafkaClient = () => {
  return new Kafka({
    clientId: "my-app",
    brokers: [env.KAFKA_URL],
    logLevel: logLevel.ERROR,
  });
};

const globalForKafka = globalThis as unknown as {
  kafka: Kafka | undefined;
  kafkaProducer: Producer | undefined;
};

export const kafka = globalForKafka.kafka ?? createKafkaClient();

if (process.env.NODE_ENV !== "production") {
  globalForKafka.kafka = kafka;
}

export const kafkaProducer = globalForKafka.kafkaProducer ?? kafka.producer();

if (process.env.NODE_ENV !== "production") {
  globalForKafka.kafkaProducer = kafkaProducer;
}

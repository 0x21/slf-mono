// import {
// 	sendInviteNode,
// 	sendVerifyNode,
// 	sendWelcomeNode,
// } from "@fulltemplate/node-request";

export const subscribeKafkaPolls = () => {
  // const c1 = subscribeKafkaEmail("work.email", "group_1", 1);
  // const signalTraps = ["SIGTERM", "SIGINT", "SIGUSR2"];
  // signalTraps.forEach((type) => {
  // 	process.once(type, async () => {
  // 		for await (const c of [c1]) {
  // 			try {
  // 				await c.disconnect();
  // 			} catch (error) {
  // 				console.log(error);
  // 			}
  // 		}
  // 		process.kill(process.pid, type);
  // 	});
  // });

  // const c1Promise = subscribeKafkaNotifications(
  //   "work.notification",
  //   "notification_group",
  //   1,
  // );

  const signalTraps = ["SIGTERM", "SIGINT", "SIGUSR2"];
  signalTraps.forEach((type) => {
    process.once(type, () => {
      void (() => {
        try {
          // const c1 = await c1Promise;
          // await c1.disconnect();
        } catch (error) {
          console.error("Error while disconnecting Kafka consumer:", error);
        }
        process.kill(process.pid, type);
      })();
    });
  });
};

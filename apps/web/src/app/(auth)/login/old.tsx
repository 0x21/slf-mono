// const onSubmit: SubmitHandler<LoginValues | NodemailerLoginValues> = async (
//   data,
// ) => {
//   const payload: Record<string, string> = {
//     ...data,
//   };
//   if (totp.length === 6) {
//     payload.totp = totp;
//   } else if (totp.length === 8) {
//     payload.backupCode = totp;
//   }

//   let result;
//   if (provider === "magic") {
//     result = await signIn("nodemailer", {
//       email: data.email,
//       callbackUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
//       redirect: false,
//     });
//   } else {
//     if (totp.length === 6 || totp.length === 8) {
//       result = await signIn("two-factor", {
//         ...payload,
//         remember: String(remember),
//         redirect: false,
//       });
//     } else {
//       result = await signIn("credentials", {
//         ...payload,
//         remember: String(remember),
//         redirect: false,
//       });
//     }
//   }

//   if (!result) {
//     toast.error("Unable to sign in.");
//     return;
//   }

//   if (result.error) {
//     if (result.error === "AccessDenied") {
//       toast.error(
//         "Your account is banned. If you think there is a mistake, please contact us.",
//       );
//       return;
//     }
//     const errorCode = result.code as InvalidLoginReason | (string & {});
//     if (errorCode === "account-banned") {
//       toast.error(
//         "Your account is banned. If you think there is a mistake, please contact us.",
//       );
//       return;
//     }
//     if (errorCode.startsWith("account-banned")) {
//       const banReason = errorCode.replace("account-banned-", "");
//       toast.error(
//         `Your account is banned. If you think there is a mistake, please contact us. Reason: ${banReason}`,
//       );
//       return;
//     }
//     if (errorCode === "enter-2fa") {
//       setTwoFactorOpen(true);
//       return;
//     }
//     if (errorCode === "invalid-2fa") {
//       toast.error("Invalid 2FA code!");
//       return;
//     }
//     if (errorCode === "invalid-backup-code") {
//       toast.error("Invalid backup code!");
//       return;
//     }
//     if (errorCode === "internal-error") {
//       toast.error("Internal server error! Please try again later.");
//       return;
//     }
//     if (errorCode === "blocked-ip-address") {
//       toast.error(
//         "Your IP address is blocked. If you believe this is a mistake, please contact support.",
//       );
//       return;
//     }
//     toast.error(authErrors[result.error] ?? "Unable to sign in.");
//     setValue("password", "");
//     return;
//   }
//   if (result.ok) {
//     if (provider === "magic") {
//       router.push(`/verify-request?email=${data.email}` as Route);
//       return;
//     }
//     try {
//       const userConfig = await refetchUserConfig();
//       if (userConfig.data?.requiresPasswordChange) {
//         setTwoFactorOpen(false);
//         await delay(500);

//         toast.success("Successfully logged in! Redirecting...", {
//           duration: 1000,
//         });

//         await delay(1000);
//         toastSonner("Change password!", {
//           description:
//             "Your password needs to be updated for security reasons.",
//           duration: 3000,
//           icon: <CircleAlert className="size-4 text-yellow-500" />,
//         });
//         router.push(
//           "/settings/security?requires-password-change=true" as Route,
//         );
//         return;
//       }

//       setTwoFactorOpen(false);
//       // const session = await mutation.mutateAsync();
//       toast.success("Successfuly logged in! Redirecting...");
//       // posthog.identify(session.id);

//       socket.io.engine.close();
//       socket.connect();

//       router.push((nextUrl ?? "/dashboard") as Route);
//       return;
//     } catch (error) {
//       toast.error("An unexpected error happened! Please try again later");
//     }
//   }
//   toast.error("Unable to sign in.");
// };

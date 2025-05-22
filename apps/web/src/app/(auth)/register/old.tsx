// const toastId = toast.loading("Registering...");
// try {
//   const result = await mutation.mutateAsync({
//     firstName: data.firstName,
//     lastName: data.lastName,
//     email: data.email,
//     password: data.password,
//     token: invite,
//   });
//   if (result.success) {
//     toast.success("Successfully registered! Redirecting...", {
//       id: toastId,
//     });
//     const signInResult = await signIn("credentials", {
//       email: data.email,
//       password: data.password,
//       redirect: false,
//     });
//     if (!signInResult) {
//       router.push("/login");
//       return;
//     }
//     if (signInResult.error) {
//       toast.error(authErrors[signInResult.error] ?? "Unable to sign in.");
//       router.push("/login");
//       return;
//     }
//     if (signInResult.ok) {
//       // posthog.identify(result.data!.user.id);
//       router.push("/dashboard");
//       return;
//     }

//     socket.io.engine.close();
//     socket.connect();

//     router.push("/login");
//     return;
//   }
//   toast.error(`Error: ${result.msg}`, { id: toastId });
// } catch (error) {
//   toast.error("An unexpected error happened! Please try again later", {
//     id: toastId,
//   });
// }

// /* eslint-disable */

// import type { FileRouter } from "uploadthing/next";
// import { createUploadthing } from "uploadthing/next";
// import { UploadThingError } from "uploadthing/server";

// import { auth } from "~/server/auth";

// const f = createUploadthing();

// // FileRouter for your app, can contain multiple FileRoutes
// export const fileRouter = {
//   // Define as many FileRoutes as you like, each with a unique routeSlug
//   resourceUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
//     // Set permissions and file types for this FileRoute
//     .middleware(async ({}) => {
//       // This code runs on your server before upload
//       const session = await auth();

//       // If you throw, the user will not be able to upload
//       if (!session) throw new UploadThingError("Unauthorized");

//       // Whatever is returned here is accessible in onUploadComplete as `metadata`
//       return { userId: session.user.id };
//     })
//     .onUploadComplete(({ metadata, file }) => {
//       // This code RUNS ON YOUR SERVER after upload
//       console.log("Upload complete for userId:", metadata.userId);

//       console.log("file url", file.url);

//       // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
//       return { uploadedBy: metadata.userId };
//     }),
// } satisfies FileRouter;

// export type FullTemplateFileRouter = typeof fileRouter;

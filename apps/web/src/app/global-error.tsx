"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Something went very wrong global!</h2>
        <h3>{JSON.stringify(error)}</h3>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}

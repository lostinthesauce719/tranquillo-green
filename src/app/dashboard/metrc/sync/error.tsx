// Next.js error boundaries must be Client Components — they receive an error
// object and a reset callback, which cannot cross the server/client boundary.
"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error">
      <h2>Something went wrong</h2>
      <p>Unable to load METRC sync status.</p>
      {error?.digest ? (
        <p className="text-sm text-gray-500">Reference: {error.digest}</p>
      ) : null}
      <button type="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDbQuery } from "../useDbQuery";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("useDbQuery", () => {
  it("keeps the newest run when an older one resolves last", async () => {
    const runs = [deferred<string>(), deferred<string>(), deferred<string>()];
    let call = 0;
    const { result } = renderHook(() =>
      useDbQuery(() => (runs[call++] as (typeof runs)[number]).promise, "initial", () => false, []),
    );

    // Run 0 is the mount run; start run 1 and 2 on top of it.
    let second!: Promise<void>;
    let third!: Promise<void>;
    act(() => {
      second = result.current.reload();
      third = result.current.reload();
    });

    await act(async () => {
      runs[2]?.resolve("newest");
      await third;
    });
    expect(result.current.data).toBe("newest");

    await act(async () => {
      runs[0]?.resolve("stale-0");
      runs[1]?.resolve("stale-1");
      await second;
    });
    expect(result.current.data).toBe("newest");
    expect(result.current.loading).toBe(false);
  });

  it("ends loading and exposes the error when the query throws", async () => {
    const { result } = renderHook(() =>
      useDbQuery(
        () => Promise.reject(new Error("boom")),
        [] as string[],
        () => false,
        [],
      ),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe("boom");
    expect(result.current.data).toEqual([]);
  });
});

"use client";

import { useActionState } from "react";
import { adminLoginAction } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, null as null | { error: string });
  return (
    <form action={action} className="field">
      <label htmlFor="pin">Admin PIN</label>
      <input id="pin" name="pin" className="input pin" inputMode="numeric" autoFocus autoComplete="off" />
      {state?.error && <p className="err">{state.error}</p>}
      <button className="btn" disabled={pending}>{pending ? "…" : "Open dashboard"}</button>
    </form>
  );
}

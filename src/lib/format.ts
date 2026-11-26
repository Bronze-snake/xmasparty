export function time(iso: string) {
  return new Date(iso)
    .toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", timeZone: "Australia/Melbourne" })
    .replace(" ", "");
}
export function initials(first: string, last: string) {
  return `${first} ${last.slice(0, 1)}.`;
}

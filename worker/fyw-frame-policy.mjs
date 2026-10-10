// Only the frozen chapter frame may be embedded by the same-origin app page.
export function fywFrameAncestors(pathname) {
  return /^\/apps\/finding-your-way\/play\/bundles\/v0\.8-[a-f0-9]{16}\/frame(?:\.html)?$/.test(pathname)
    ? "'self'" : "'none'";
}

// Same-origin framing is limited to content-addressed chapter and SNES frames.
export function fywFrameAncestors(pathname) {
  const chapter = /^\/apps\/finding-your-way\/play\/bundles\/(?:v0\.8-[a-f0-9]{16}|bgp1-[a-f0-9]{24})\/frame(?:\.html)?$/.test(pathname);
  const snes = /^\/apps\/llvm-mos-65816\/play\/component\/bundles\/bgp1-[a-f0-9]{24}\/frame(?:\.html)?$/.test(pathname);
  return chapter || snes ? "'self'" : "'none'";
}

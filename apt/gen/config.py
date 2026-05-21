"""
config.py — repository metadata for gen-index.py.

KEY_ID and FINGERPRINT are patched automatically by bootstrap-apt.sh on a fresh
bootstrap (post-GPG-gen). On 2026-05-21 they were filled in by hand because the
file didn't exist yet when bootstrap ran — added as a follow-up after the
skill flagged config.py as missing.
"""

# ── identity ──────────────────────────────────────────────────────────
HOST            = "apt.indri.studio"
PORT            = 443
SCHEME          = "https"
SERVER_BANNER   = "Cloudflare R2 (aptly + GitHub Actions)"
CONTACT_EMAIL   = "packages@indri.studio"

WORDMARK        = "Indri"
HOME_URL        = "https://indri.studio"
HOME_LABEL      = "indri.studio"

# ── signing key ───────────────────────────────────────────────────────
KEY_ID          = "0x8F046591F49BBB63"
FINGERPRINT     = "E3F22BD4EC31DA982ED7B43F8F046591F49BBB63"
KEYRING_PATH    = "/etc/apt/keyrings/indri.gpg"

# ── repo shape ────────────────────────────────────────────────────────
COMPONENTS      = ["main"]
ARCHITECTURES   = ["amd64", "arm64"]

# Auto-flatten the /pool/<component>/ user-facing listing when the total
# .deb count is below this threshold (presentation only — on-disk layout
# stays Debian Policy §2.4 sharded). Set 0 to always shard; set very large
# to always flatten. Default 30 catches most small/medium project repos.
FLAT_POOL_THRESHOLD = 30
CODENAMES       = {
    "stable":       "stable",
    "testing":      "testing",
    "experimental": "experimental",
}
DEFAULT_SUITE   = "stable"

# ── render flags ──────────────────────────────────────────────────────
SHOW_ARCH       = True

# ── copy ──────────────────────────────────────────────────────────────
PAGE_DESCRIPTION = (
    "Official Debian/Ubuntu package archive for Indri Studio. "
    "Signed builds for amd64 and arm64."
)

LEDE_HTML = """
The Debian/Ubuntu package archive for <strong>Indri Studio</strong> —
the small studio that makes apps for phones, tablets, consoles, TVs, and
the desktop. Signed builds for <code>amd64</code> and <code>arm64</code>.
"""

README_HTML = """
<p>
  This is the official Debian/Ubuntu package archive for <strong>Indri Studio</strong>.
  The repository follows the classic Debian layout: per-suite metadata under
  <code>/dists</code>, per-component pools under <code>/pool</code>. Suites are
  signed by the key listed above — do not skip <code>Signed-By</code>.
</p>
"""

# ── install snippet ───────────────────────────────────────────────────
INSTALL_SLUG    = "indri"    # used in keyring filename and sources.list

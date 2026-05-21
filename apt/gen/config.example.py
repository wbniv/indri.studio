"""
config.example.py — repository metadata for gen-index.py.

Copy to gen/config.py in your apt repo and fill in real values.
bootstrap-apt.sh patches KEY_ID and FINGERPRINT automatically after GPG generation.
"""

# ── identity ──────────────────────────────────────────────────────────
HOST            = "apt.example.org"
PORT            = 443
SCHEME          = "https"
SERVER_BANNER   = "Apache/2.4.62 (Debian)"
CONTACT_EMAIL   = "apt@example.org"

WORDMARK        = "Your Project"
HOME_URL        = "https://example.org"
HOME_LABEL      = "example.org"

# ── signing key ───────────────────────────────────────────────────────
# Patched automatically by bootstrap-apt.sh after GPG key generation.
KEY_ID          = "YOUR_KEY_ID_HERE"
FINGERPRINT     = "YOUR_FINGERPRINT_HERE"
KEYRING_PATH    = "/usr/share/keyrings/your-project-archive-keyring.gpg"

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
    "Official Debian/Ubuntu package archive for Your Project. "
    "Signed builds for amd64 and arm64."
)

LEDE_HTML = """
The Debian/Ubuntu package archive for Your Project. Signed builds for
<code>amd64</code> and <code>arm64</code>.
"""

README_HTML = """
<p>
  This is the official Debian/Ubuntu package archive for <strong>Your Project</strong>.
  The repository follows the classic Debian layout: per-suite metadata under
  <code>/dists</code>, per-component pools under <code>/pool</code>. Suites are
  signed by the key listed above — do not skip <code>Signed-By</code>.
</p>
"""

# ── install snippet ───────────────────────────────────────────────────
INSTALL_SLUG    = "your-project"    # used in keyring filename and sources.list

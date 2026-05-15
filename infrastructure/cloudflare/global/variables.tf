variable "project" {
  description = "Project slug. Used in tags and SSM paths."
  type        = string
  default     = "indri-studio"
}

variable "domain" {
  description = "Apex domain (canonical host). www gets redirected here."
  type        = string
  default     = "indri.studio"
}

variable "account_id" {
  description = "Cloudflare account ID hosting the indri.studio zone. Source-of-truth value lives in SSM at /indri-studio/cloudflare/account_id; supplied at apply-time via TF_VAR_account_id (see Taskfile.yml tf-apply)."
  type        = string
}

variable "worker_name" {
  description = "Wrangler Worker name (matches `name` in wrangler.toml)."
  type        = string
  default     = "indri-studio"
}

terraform {
  backend "s3" {
    bucket         = "indri-studio-terraform-state"
    key            = "global/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "indri-studio-terraform-locks"
    encrypt        = true
    profile        = "is-terraform"
  }
}

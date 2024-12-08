provider "aws" {
	region = "us-east-1"

    default_tags {
        tags = {
            Name = "portfolio-v2"
            git_url = "https://github.com/jhayashi1/berry-bot-js"
        }
    }
}

data "aws_caller_identity" "current" {}
provider "aws" {
	region = "us-east-1"

    default_tags {
        tags = {
            Name = "berry-bot-js"
            git_url = "https://github.com/jhayashi1/berry-bot-js"
        }
    }
}

data "aws_caller_identity" "current" {}

data "aws_vpc" "ipv6_only" {
    id = "vpc-0b5b0e62c550b9f83"
}

data "aws_subnets" "ipv6_subnets" {
    filter {
      name = "vpc-id"
      values = [data.aws_vpc.ipv6_only.id]
    }
    tags = {
        Name = "ipv6-only-*"
    }
}
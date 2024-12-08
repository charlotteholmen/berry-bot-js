resource "aws_ecr_repository" "berry_bot_repo" {
  name = "berry-bot"

  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "bery_bot_lifecycle" {
  repository = aws_ecr_repository.berry_bot_repo.name

  policy = <<EOF
{
    "rules": [
        {
            "rulePriority": 1,
            "description": "expire images older than 10 days",
            "selection" = {
              "tagStatus" = "any"
              "countType" = "imageCountMoreThan"
              "count"     = 10
            }
            "action": {
                "type": "expire"
            }
        }
    ]
}
EOF
}
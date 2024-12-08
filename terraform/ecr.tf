resource "aws_ecr_repository" "berry_bot_repo" {
  name = "berry-bot"

  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }

  lifecycle_policy {
    policy = jsonencode({
      rules = [
        {
          rulePriority = 1
          description  = "retain last 10 images"
          selection    = {
            tagStatus = "any"
            countType = "imageCountMoreThan"
            count     = 10
          }
          action = {
            type = "expire"
          }
        }
      ]
    })
  }
}
resource "aws_ecs_cluster" "berry_bot_cluster" {
  name = "berry-bot-cluster"
}

resource "aws_security_group" "ecs_sg" {
  vpc_id = data.aws_vpc.ipv6_only.id

  ingress {
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = {
    Name = "berry-bot-ecs-sg"
  }
}

resource "aws_iam_role" "ecs_task_execution_role" {
  name = "berryBotEcsTaskExecution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# resource "aws_launch_template" "ecs_instance" {
#   image_id      = "ami-0c55b159cbfafe1f0"
#   instance_type = "t2.nano"
#   network_interfaces {
#     subnet_id                   = data.aws_subnets.ipv6_subnets.ids[0]
#     associate_public_ip_address = true
#     ipv6_address_count          = 1
#     security_groups             = [aws_security_group.berry_bot_ecs_sg.name]
#   }

#   block_device_mappings {
#     device_name = "/dev/xvda"
#     ebs {
#       volume_size = 4
#       volume_type = "gp3"
#     }
#   }

#   user_data = <<-EOF
#               #!/bin/bash
#               echo ECS_CLUSTER=${aws_ecs_cluster.berry_bot_cluster.name} >> /etc/ecs/ecs.config
#               EOF

#   tags = {
#     Name = "berry-bot-ecs-instance"
#   }
# }

# resource "aws_autoscaling_group" "ecs_asg" {
#   vpc_zone_identifier = data.aws_subnets.ipv6_subnets.ids
#   desired_capacity    = 1
#   max_size            = 1
#   min_size            = 1

#   launch_template {
#     id      = aws_launch_template.ecs_instance.id
#     version = "$Latest"
#   }
# }

resource "aws_ecs_task_definition" "main" {
  family                   = "my-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["EC2"]
  execution_role_arn       = aws_iam_role.berry_bot_ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name      = "berry-bot-container",
      image     = "${var.aws_account_id}.dkr.ecr.us-east-1.amazonaws.com/berry-bot:latest",
      essential = true,
      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
        }
      ],
    }
  ])
}

# resource "aws_ecs_service" "main" {
#   name            = "my-service"
#   cluster         = aws_ecs_cluster.berry_bot_cluster.id
#   task_definition = aws_ecs_task_definition.main.arn
#   desired_count   = 1
#   launch_type     = "EC2"
#   network_configuration {
#     subnets          = data.aws_subnets.ipv6_subnets.ids
#     security_groups  = [aws_security_group.berry_bot_ecs_sg.id]
#     assign_public_ip = false
#   }
# }

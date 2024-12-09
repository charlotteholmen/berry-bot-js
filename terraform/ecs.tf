resource "aws_ecs_cluster" "berry_bot_cluster" {
  name = "berry-bot-cluster"
}

resource "aws_security_group" "berry_bot_ecs_sg" {
  vpc_id = data.aws_vpc.ipv6_only.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = {
    Name = "berry-bot-ecs-sg"
  }
}

resource "aws_iam_role" "berry_bot_ecs_task_execution" {
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

resource "aws_instance" "ecs_instance" {
  ami                    = "ami-0c55b159cbfafe1f0" 
  instance_type          = "t2.nano"
  subnet_id              = tolist(data.aws_subnets.ipv6_subnets)[0]
  associate_public_ip_address = true
  security_groups        = [aws_security_group.berry_bot_ecs_sg.name]

  ipv6_address_count = 1

  user_data = <<-EOF
              #!/bin/bash
              echo ECS_CLUSTER=${aws_ecs_cluster.berry_bot_cluster.name} >> /etc/ecs/ecs.config
              EOF

  tags = {
    Name = "berry-bot-ecs-instance"
  }
}

resource "aws_ecs_task_definition" "main" {
  family                   = "my-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["EC2"]
  execution_role_arn       = aws_iam_role.berry_bot_ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name  = "berry-bot-container",
      image = "<aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/berry-bot:latest",
      essential = true,
      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
        }
      ],
      memory = 128,
      cpu    = 128
    }
  ])
}

resource "aws_ecs_service" "main" {
  name            = "my-service"
  cluster         = aws_ecs_cluster.berry_bot_cluster.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = 1
  launch_type     = "EC2"
  network_configuration {
    subnets          = data.aws_subnets.ipv6_subnets
    security_groups  = [aws_security_group.berry_bot_ecs_sg.id]
    assign_public_ip = false
  }
}

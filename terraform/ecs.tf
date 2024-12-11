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
  name = "berry-bot-ecs-task-execution"

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

resource "aws_ecs_task_definition" "ecs_task_definition" {
  family                   = "berry-bot"
  network_mode             = "awsvpc"
  requires_compatibilities = ["EC2"]
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  cpu                      = "256"
  memory                   = "512"

  container_definitions = jsonencode([
    {
      name      = "berry-bot-container",
      image     = "${var.aws_account_id}.dkr.ecr.us-east-1.amazonaws.com/berry-bot:latest",
      essential = true,
      cpu       = 256,
      memory    = 512,
      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
        }
      ],
    }
  ])
}

resource "aws_ecs_service" "ecs_service" {
  name            = "berry-bot-service"
  cluster         = aws_ecs_cluster.berry_bot_cluster.id
  task_definition = aws_ecs_task_definition.ecs_task_definition.arn
  desired_count   = 1
  launch_type     = "EC2"
  network_configuration {
    subnets          = data.aws_subnets.ipv6_subnets.ids
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = false
  }
}

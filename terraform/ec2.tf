resource "aws_launch_template" "ecs_instance" {
  name          = "berry-bot-launch-template"
  image_id      = "ami-08eec49a05b603ba3"
  instance_type = "t4g.nano"
  network_interfaces {
    subnet_id                   = data.aws_subnets.ipv6_subnets.ids[0]
    associate_public_ip_address = true
    ipv6_address_count          = 1
    security_groups             = [aws_security_group.ecs_sg.id]
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size = 30
      volume_type = "gp3"
    }
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              echo ECS_CLUSTER=${aws_ecs_cluster.berry_bot_cluster.name} >> /etc/ecs/ecs.config
              EOF
  )

  tags = {
    Name = "berry-bot-ecs-instance"
  }
}

resource "aws_autoscaling_group" "ecs_asg" {
  name                = "berry-bot-asg"
  vpc_zone_identifier = data.aws_subnets.ipv6_subnets.ids
  desired_capacity    = 1
  max_size            = 1
  min_size            = 1

  launch_template {
    id      = aws_launch_template.ecs_instance.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "berry-bot"
    propagate_at_launch = true
  }
}

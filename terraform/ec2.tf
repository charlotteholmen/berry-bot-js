resource "aws_launch_template" "ecs_instance" {
  image_id      = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.nano"
  network_interfaces {
    subnet_id                   = data.aws_subnets.ipv6_subnets.ids[0]
    associate_public_ip_address = true
    ipv6_address_count          = 1
    security_groups             = [aws_security_group.ecs_sg.name]
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size = 4
      volume_type = "gp3"
    }
  }

  user_data = <<-EOF
              #!/bin/bash
              echo ECS_CLUSTER=${aws_ecs_cluster.berry_bot_cluster.name} >> /etc/ecs/ecs.config
              EOF

  tags = {
    Name = "berry-bot-ecs-instance"
  }
}

resource "aws_autoscaling_group" "ecs_asg" {
  vpc_zone_identifier = data.aws_subnets.ipv6_subnets.ids
  desired_capacity    = 1
  max_size            = 1
  min_size            = 1

  launch_template {
    id      = aws_launch_template.ecs_instance.id
    version = "$Latest"
  }
}
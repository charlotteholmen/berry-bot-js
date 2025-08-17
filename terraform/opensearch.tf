resource "aws_opensearch_index" "messages" {
	domain_name = aws_opensearch_domain.discord_test.domain_name
	name        = "messages"
	body        = <<JSON
{
	"settings": {
		"number_of_shards": 1,
		"number_of_replicas": 0
	},
	"mappings": {
		"properties": {
			"timestamp": { "type": "date" },
			"username": { "type": "keyword" },
			"content": { "type": "text" },
			"guild": { "type": "keyword" }
		}
	}
}
JSON
}
resource "aws_opensearch_domain" "discord_test" {
	domain_name           = "discord-test"
	engine_version        = "OpenSearch_2.19"
	cluster_config {
		instance_type          = "t2.micro.search"
		instance_count         = 1
		zone_awareness_enabled = false
	}
	ebs_options {
		ebs_enabled = true
		volume_size = 10
		volume_type = "gp3"
	}
	access_policies = <<POLICY
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/main"
        },
        "Action": "es:*",
        "Resource": "*"
      }
    ]
  }
  POLICY
	domain_endpoint_options {
		enforce_https = true
		tls_security_policy = "Policy-Min-TLS-1-2-2019-07"
		custom_endpoint_enabled = false
	}
	node_to_node_encryption {
		enabled = true
	}
	encrypt_at_rest {
		enabled = true
	}
	advanced_security_options {
		enabled = false
	}
}

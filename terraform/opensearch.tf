resource "aws_opensearchserverless_collection" "discord" {
  name        = "discord-message-test"
  type        = "VECTOR_SEARCH"
  description = "Test collection for Discord logs"
}

resource "aws_opensearchserverless_access_policy" "discord_access" {
  name = "discord-access-policy"
  type = "data"
  policy = jsonencode({
    Rules = [
      {
        Resource = ["collection/${aws_opensearchserverless_collection.discord.name}"]
        Permission = ["aoss:APIAccessAll"]
        Principal = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/main"]
      }
    ]
  })
}

resource "null_resource" "create_index" {
  depends_on = [
    aws_opensearchserverless_collection.discord,
    aws_opensearchserverless_security_config.discord_access
  ]

  provisioner "local-exec" {
    command = <<EOT
curl -X PUT "https://YOUR_SERVERLESS_COLLECTION_ENDPOINT/discord-message-test/messages" \
  -H 'Content-Type: application/json' \
  -u YOUR_USER:YOUR_PASSWORD \
  -d '{
    "mappings": {
      "properties": {
        "timestamp": { "type": "date" },
        "username":  { "type": "keyword" },
        "content":   { "type": "text", "analyzer": "standard" },
        "embedding": {
          "type": "knn_vector",
          "dimension": 1536,
          "method": {
            "name": "hnsw",
            "space_type": "cosinesimil",
            "engine": "nmslib"
          }
        }
      }
    }
  }'
EOT
  }
}

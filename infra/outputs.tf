output "website_url" {
  description = "URL of the static website"
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}

output "api_url" {
  description = "URL of the API Gateway endpoint"
  value       = "${aws_apigatewayv2_api.main.api_endpoint}/profile"
}

output "ec2_url" {
  description = "URL to access the EC2 web server"
  value       = "http://${aws_instance.hello_world.public_ip}"
}


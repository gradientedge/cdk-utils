# @gradientedge/cdk-utils-aws

AWS CDK utilities for provisioning and managing AWS infrastructure using the [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/home.html).

## Overview

This package provides high-level constructs and service managers that simplify common AWS CDK patterns:

- **Constructs** — ready-to-use patterns like REST API with Lambda, EventBridge targets, static sites, and ECS backends
- **Services** — manager classes for AWS services including Lambda, API Gateway, CloudFront, DynamoDB, ECS, S3, SQS, SNS, and more
- **Common** — base constructs and stack classes that all higher-level constructs extend

## Installation

```bash
pnpm add @gradientedge/cdk-utils-aws
```

## Usage

```typescript
import { CommonConstruct } from '@gradientedge/cdk-utils-aws'
import { Construct } from 'constructs'

class MyStack extends CommonConstruct {
  constructor(parent: Construct, id: string, props: CommonStackProps) {
    super(parent, id, props)
    this.initResources()
  }
}
```

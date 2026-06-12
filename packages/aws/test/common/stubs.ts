/* Stub ARNs for use in unit tests that exercise IAM helper statements without
   wiring up a real CDK resource. Each ARN matches the resource-type format that
   the corresponding AWS action expects, so tests read like production usage. */

const ACCOUNT = '123456789012'
const REGION = 'eu-west-1'

export const STUB_LAMBDA_FN_ARN = `arn:aws:lambda:${REGION}:${ACCOUNT}:function:test-fn`
export const STUB_EVENT_BUS_ARN = `arn:aws:events:${REGION}:${ACCOUNT}:event-bus/test-bus`
export const STUB_STATE_MACHINE_ARN = `arn:aws:states:${REGION}:${ACCOUNT}:stateMachine:test-sm`
export const STUB_SQS_QUEUE_ARN = `arn:aws:sqs:${REGION}:${ACCOUNT}:test-queue`
export const STUB_SECRET_ARN = `arn:aws:secretsmanager:${REGION}:${ACCOUNT}:secret:test-secret-AbCd12`
export const STUB_KMS_KEY_ARN = `arn:aws:kms:${REGION}:${ACCOUNT}:key/00000000-0000-0000-0000-000000000000`
export const STUB_DDB_TABLE_ARN = `arn:aws:dynamodb:${REGION}:${ACCOUNT}:table/test-table`
export const STUB_DDB_STREAM_ARN = `${STUB_DDB_TABLE_ARN}/stream/2024-01-01T00:00:00.000`
export const STUB_S3_BUCKET_ARN = `arn:aws:s3:::test-bucket`
export const STUB_APP_CONFIG_ARN = `arn:aws:appconfig:${REGION}:${ACCOUNT}:application/abcdef0`
export const STUB_LOG_GROUP_ARN = `arn:aws:logs:${REGION}:${ACCOUNT}:log-group:test-log-group:*`
export const STUB_CLOUDFRONT_DISTRIBUTION_ARN = `arn:aws:cloudfront::${ACCOUNT}:distribution/E1ABCDEFGHIJK0`
export const STUB_IAM_ROLE_ARN = `arn:aws:iam::${ACCOUNT}:role/test-role`
export const STUB_EFS_FS_ARN = `arn:aws:elasticfilesystem:${REGION}:${ACCOUNT}:file-system/fs-00000000`

import * as logs from '@aws-cdk/aws-logs'
import { CommonConstruct } from './commonConstruct'
import { CommonStackProps } from './commonStack'
import { createCfnOutput } from './genericUtils'

export interface LogProps extends logs.CfnLogGroupProps {
  key: string
}

export class LogManager {
  public createCfnLogGroup(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps
  ) {
    if (!props.logs || props.logs.length == 0) throw `Logs props undefined`

    const logProps = props.logs.find((log: LogProps) => log.key === key)
    if (!logProps) throw `Could not find log props for key:${key}`

    const logGroup = new logs.CfnLogGroup(scope, `${id}`, {
      logGroupName: `${logProps.logGroupName}-${props.stage}`,
      retentionInDays: logProps.retentionInDays,
    })

    createCfnOutput(`${id}Arn`, scope, logGroup.attrArn)

    return logGroup
  }

  public createLogGroup(id: string, key: string, scope: CommonConstruct, props: CommonStackProps) {
    if (!props.logs || props.logs.length == 0) throw `Logs props undefined`

    const logProps = props.logs.find((log: LogProps) => log.key === key)
    if (!logProps) throw `Could not find log props for key:${key}`

    const logGroup = new logs.LogGroup(scope, `${id}`, {
      logGroupName: `${logProps.logGroupName}-${props.stage}`,
      retention: logProps.retentionInDays,
    })

    createCfnOutput(`${id}Arn`, scope, logGroup.logGroupArn)

    return logGroup
  }
}

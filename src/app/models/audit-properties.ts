import { Property }                 from './properties'

export enum AuditType {
    ISCoreAudit = 'jdbcfunc.ISCoreAudit.connPoolAlias',
    TN = 'jdbcfunc.TN.connPoolAlias',
    CentralUsers = 'jdbcfunc.CentralUsers.connPoolAlias',
    Adapters = 'jdbcfunc.Adapters.connPoolAlias',
    Xref = 'jdbcfunc.Xref.connPoolAlias'
}

export enum ServiceQueueDestType {
    ServiceDBDest = 'ServiceDBDest',
    ServiceFileDest = 'ServiceFileDest'
}

export class AuditProperties {

    public static SERVICE_QUEUE_DEST = 'auditing.ServiceQueue.destination'

    public type: AuditType
    public jdbcAlias: string

    public static make(type: AuditType, jdbcAlias: string) {

        let a: AuditProperties = new AuditProperties()
        a.type = type
        a.jdbcAlias = jdbcAlias
        return a
    }

    public toProperties(): Property[] {

        let props: Property[] = []

        props.push(new Property(this.type, this.jdbcAlias))
        props.push(new Property(AuditProperties.SERVICE_QUEUE_DEST, ServiceQueueDestType.ServiceDBDest))

        return props
    }
}

export class JdbcConnection {

    public static JDBC_PREFIX = 'jdbc.'
    public static DRIVER_ALIAS = 'driverAlias'
    public static DB_URL = 'dbURL'
    public static DB_USER = 'userid'
    public static DB_PASSWORD = 'password'

    public static JDBC_FUNC_ISCOREAUDIT = "jdbcfunc.ISCoreAudit.connPoolAlias"
    public static JDBC_FUNC_ISINTERNAL = "jdbcfunc.ISInternal.connPoolAlias"
    public static JDBC_FUNC_CENTRALUSERS = "jdbcfunc.CentralUsers.connPoolAlias"
    public static JDBC_FUNC_ADAPTERS = "jdbcfunc.Adapters.connPoolAlias"
    public static JDBC_FUNC_XREF = "jdbcfunc.Xref.connPoolAlias"

    public static JDBC_SERVICEQUEUE_DEST = "auditing.ServiceQueue.destination"

    public jdbcDriver: string
    public jdbcAlias: string
    public dbUrl: string
    public user: string
    public password: string

    private _props: Property[]

    public toProperties(includeEmptyValues?: boolean): Property[] {

        if (!this._props) {

            this._props = []

            if (includeEmptyValues || this.jdbcDriver)
                this._props.push(new Property(JdbcConnection.JDBC_PREFIX + this.jdbcAlias + '.' + JdbcConnection.DRIVER_ALIAS, this.jdbcDriver))

            if (includeEmptyValues || this.dbUrl)
                this._props.push(new Property(JdbcConnection.JDBC_PREFIX + this.jdbcAlias + '.' + JdbcConnection.DB_URL, this.dbUrl))

            if (includeEmptyValues || this.user)
                this._props.push(new Property(JdbcConnection.JDBC_PREFIX + this.jdbcAlias + '.' + JdbcConnection.DB_USER, this.user))

            if (includeEmptyValues || this.password)
                this._props.push(new Property(JdbcConnection.JDBC_PREFIX + this.jdbcAlias + '.' + JdbcConnection.DB_PASSWORD, this.password))
        }

        return this._props
    }

    public static make(properties: Property[]): Map<string, JdbcConnection> {

        let out: Map<string, JdbcConnection> = new Map<string, JdbcConnection>()

        properties.forEach((kv) => {

            if (kv.key.startsWith(JdbcConnection.JDBC_PREFIX)) {

                let alias: string = kv.key.substring(JdbcConnection.JDBC_PREFIX.length, kv.key.lastIndexOf('.'))

                let jdbc: JdbcConnection = out.get(alias)

                if (!jdbc) {
                    jdbc = new JdbcConnection()
                    jdbc.jdbcAlias = alias
                    out.set(alias, jdbc)
                }

                let key: string = kv.key.substr(kv.key.lastIndexOf('.')+1)

                if (key == JdbcConnection.DRIVER_ALIAS) {
                    jdbc.jdbcDriver = kv.value
                } else if (key == JdbcConnection.DB_URL) {
                    jdbc.dbUrl = kv.value
                } else if (key == JdbcConnection.DB_USER) {
                    jdbc.user = kv.value
                } else if (key == JdbcConnection.DB_PASSWORD) {
                    jdbc.password = kv.value
                }
            }
        })

        return out
    }
}

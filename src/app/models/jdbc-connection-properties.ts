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

export class JdbcConnectionProperties {

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

    public static make(properties: Property[]): Map<string, JdbcConnectionProperties> {

        let out: Map<string, JdbcConnectionProperties> = new Map<string, JdbcConnectionProperties>()

        properties.forEach((kv) => {

            if (kv.key.startsWith(JdbcConnectionProperties.JDBC_PREFIX)) {

                let alias: string = kv.key.substring(JdbcConnectionProperties.JDBC_PREFIX.length, kv.key.lastIndexOf('.'))

                let jdbc: JdbcConnectionProperties = out.get(alias)

                if (!jdbc) {
                    jdbc = new JdbcConnectionProperties()
                    jdbc.jdbcAlias = alias
                    out.set(alias, jdbc)
                }

                let key: string = kv.key.substr(kv.key.lastIndexOf('.')+1)

                if (key == JdbcConnectionProperties.DRIVER_ALIAS) {
                    jdbc.jdbcDriver = kv.valueWithType()
                } else if (key == JdbcConnectionProperties.DB_URL) {
                    jdbc.dbUrl = kv.valueWithType()
                } else if (key == JdbcConnectionProperties.DB_USER) {
                    jdbc.user = kv.valueWithType()
                } else if (key == JdbcConnectionProperties.DB_PASSWORD) {
                    jdbc.password = kv.valueWithType()
                }
            }
        })

        return out
    }

    public toProperties(includeEmptyValues?: boolean): Property[] {

        let props: Property[] = []

        if (!this._props || this._props.length == 0) {

            if (includeEmptyValues || this.jdbcDriver)
                props.push(new Property(JdbcConnectionProperties.JDBC_PREFIX + this.jdbcAlias + '.' + JdbcConnectionProperties.DRIVER_ALIAS, this.jdbcDriver))

            if (includeEmptyValues || this.dbUrl)
                props.push(new Property(JdbcConnectionProperties.JDBC_PREFIX + this.jdbcAlias + '.' + JdbcConnectionProperties.DB_URL, this.dbUrl))

            if (includeEmptyValues || this.user)
                props.push(new Property(JdbcConnectionProperties.JDBC_PREFIX + this.jdbcAlias + '.' + JdbcConnectionProperties.DB_USER, this.user))

            if (includeEmptyValues || this.password)
                props.push(new Property(JdbcConnectionProperties.JDBC_PREFIX + this.jdbcAlias + '.' + JdbcConnectionProperties.DB_PASSWORD, this.password))

            if (includeEmptyValues) {
                this._props = props
            }
        } else {
            props = this._props
        }

        return props
    }
}

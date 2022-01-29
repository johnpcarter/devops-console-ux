import {Property} from './properties';

export class ARTConnectionProperties {

    public static PREFIX = 'artConnection.'

    public static DATA_SOURCE_CLASS = 'DataSourceClass'
    public static TRANSACTION_TYPE = 'TransactionType'
    public static DATABASE_NAME = 'databaseName'
    public static SERVER_NAME = 'serverName'
    public static PORT = 'portNumber'
    public static USER = 'user'
    public static PASSWORD = 'password'
    public static NETWORK_PROTOCOL = 'NetworkProtocol'
    public static OTHER_PROPERTIES = 'OtherProperties'
    public static CONNECTION_MANAGER_SETTINGS = 'connectionManagerSettings'
    public static ENABLE_CONNECTION_POOLING = 'EnableConnectionPooling'
    public static HEARTBEAT_INTERVAL = 'heartBeatInterval'
    public static MIN_CONNS = 'minimumPoolSize'
    public static MAX_CONNS = 'maximumPoolSize'

    public name: string
    public dataSourceClass: string
    public transactionType: string
    public databaseName: string
    public server: string
    public port: string
    public user: string
    public password: string

    public networkProtocol: string
    public otherProperties: string

    public enableConnectionPooling: string
    public heartbeat: string
    public minConns: string
    public maxConns: string

    private _props: Property[]

    public static make(properties: Property[]): Map<string, ARTConnectionProperties> {

        let out: Map<string, ARTConnectionProperties> = new Map<string, ARTConnectionProperties>()

        properties.forEach((kv) => {

            if (kv.key.startsWith(ARTConnectionProperties.PREFIX)) {

                let alias: string = kv.key.substring(ARTConnectionProperties.PREFIX.length, kv.key.lastIndexOf('.'))

                if (alias.endsWith(ARTConnectionProperties.CONNECTION_MANAGER_SETTINGS))
                    alias = alias.substring(0, alias.lastIndexOf('.'))

                let conn: ARTConnectionProperties = out.get(alias)

                if (!conn) {
                    conn = new ARTConnectionProperties()
                    conn.name = alias
                    out.set(alias, conn)
                }

                let key: string = kv.key.substr(kv.key.lastIndexOf('.')+1)

                if (key == ARTConnectionProperties.DATA_SOURCE_CLASS) {
                    conn.dataSourceClass = kv.valueWithType()
                } else if (key == ARTConnectionProperties.TRANSACTION_TYPE) {
                    conn.transactionType = kv.valueWithType()
                } else if (key == ARTConnectionProperties.DATABASE_NAME) {
                    conn.databaseName = kv.valueWithType()
                } else if (key == ARTConnectionProperties.SERVER_NAME) {
                    conn.server = kv.valueWithType()
                } else if (key == ARTConnectionProperties.USER) {
                    conn.user = kv.valueWithType()
                } else if (key == ARTConnectionProperties.PASSWORD) {
                    conn.password = kv.valueWithType()
                } else if (key == ARTConnectionProperties.NETWORK_PROTOCOL) {
                    conn.networkProtocol = kv.valueWithType()
                } else if (key == ARTConnectionProperties.OTHER_PROPERTIES) {
                    conn.otherProperties = kv.valueWithType()
                } else if (key == ARTConnectionProperties.ENABLE_CONNECTION_POOLING) {
                    conn.enableConnectionPooling = kv.valueWithType()
                } else if (key == ARTConnectionProperties.HEARTBEAT_INTERVAL) {
                    conn.heartbeat = kv.valueWithType()
                } else if (key == ARTConnectionProperties.MIN_CONNS) {
                    conn.minConns = kv.valueWithType()
                } else if (key == ARTConnectionProperties.MAX_CONNS) {
                    conn.maxConns = kv.valueWithType()
                }
            }
        })

        return out
    }

    public toProperties(): Property[] {

        let props: Property[] = []

        if (!this._props || this._props.length == 0) {

            props.push(new Property(ARTConnectionProperties.PREFIX + this.name + '.' + ARTConnectionProperties.DATA_SOURCE_CLASS, this.dataSourceClass))
            props.push(new Property(ARTConnectionProperties.PREFIX + this.name + '.' + ARTConnectionProperties.TRANSACTION_TYPE, this.transactionType))
            props.push(new Property(ARTConnectionProperties.PREFIX + this.name + '.' + ARTConnectionProperties.DATABASE_NAME, this.databaseName))
            props.push(new Property(ARTConnectionProperties.PREFIX + this.name + '.' + ARTConnectionProperties.SERVER_NAME, this.server))
            props.push(new Property(ARTConnectionProperties.PREFIX + this.name + '.' + ARTConnectionProperties.USER, this.user))
            props.push(new Property(ARTConnectionProperties.PREFIX + this.name + '.' + ARTConnectionProperties.PASSWORD, this.password))
            props.push(new Property(ARTConnectionProperties.PREFIX + this.name + '.' + ARTConnectionProperties.NETWORK_PROTOCOL, this.networkProtocol))
            props.push(new Property(ARTConnectionProperties.PREFIX + this.name + '.' + ARTConnectionProperties.OTHER_PROPERTIES, this.otherProperties))

            props.push(new Property(ARTConnectionProperties.PREFIX + this.name + '.' + ARTConnectionProperties.CONNECTION_MANAGER_SETTINGS + '.' + ARTConnectionProperties.ENABLE_CONNECTION_POOLING,  this.enableConnectionPooling))
            props.push(new Property(ARTConnectionProperties.PREFIX + this.name + '.' + ARTConnectionProperties.CONNECTION_MANAGER_SETTINGS + '.' + ARTConnectionProperties.MIN_CONNS, this.minConns))
            props.push(new Property(ARTConnectionProperties.PREFIX + this.name + '.' + ARTConnectionProperties.CONNECTION_MANAGER_SETTINGS + '.' + ARTConnectionProperties.MAX_CONNS,  this.maxConns))
            props.push(new Property(ARTConnectionProperties.PREFIX + this.name + '.' + ARTConnectionProperties.CONNECTION_MANAGER_SETTINGS + '.' + ARTConnectionProperties.HEARTBEAT_INTERVAL, this.heartbeat))

            this._props = props
        } else {
            props = this._props
        }

        return props
    }
}

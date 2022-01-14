import {Property} from './properties';

export class ARTProperties {

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

    public static make(properties: Property[]): Map<string, ARTProperties> {

        let out: Map<string, ARTProperties> = new Map<string, ARTProperties>()

        properties.forEach((kv) => {

            if (kv.key.startsWith(ARTProperties.PREFIX)) {

                let alias: string = kv.key.substring(ARTProperties.PREFIX.length, kv.key.lastIndexOf('.'))

                if (alias.endsWith(ARTProperties.CONNECTION_MANAGER_SETTINGS))
                    alias = alias.substring(0, alias.lastIndexOf('.'))

                let conn: ARTProperties = out.get(alias)

                if (!conn) {
                    conn = new ARTProperties()
                    conn.name = alias
                    out.set(alias, conn)
                }

                let key: string = kv.key.substr(kv.key.lastIndexOf('.')+1)

                if (key == ARTProperties.DATA_SOURCE_CLASS) {
                    conn.dataSourceClass = kv.value
                } else if (key == ARTProperties.TRANSACTION_TYPE) {
                    conn.transactionType = kv.value
                } else if (key == ARTProperties.DATABASE_NAME) {
                    conn.databaseName = kv.value
                } else if (key == ARTProperties.SERVER_NAME) {
                    conn.server = kv.value
                } else if (key == ARTProperties.USER) {
                    conn.user = kv.value
                } else if (key == ARTProperties.PASSWORD) {
                    conn.password = kv.value
                } else if (key == ARTProperties.NETWORK_PROTOCOL) {
                    conn.networkProtocol = kv.value
                } else if (key == ARTProperties.OTHER_PROPERTIES) {
                    conn.otherProperties = kv.value
                } else if (key == ARTProperties.ENABLE_CONNECTION_POOLING) {
                    conn.enableConnectionPooling = kv.value
                } else if (key == ARTProperties.HEARTBEAT_INTERVAL) {
                    conn.heartbeat = kv.value
                } else if (key == ARTProperties.MIN_CONNS) {
                    conn.minConns = kv.value
                } else if (key == ARTProperties.MAX_CONNS) {
                    conn.maxConns = kv.value
                }
            }
        })

        return out
    }

    public toProperties(): Property[] {

        if (!this._props) {

            this._props = []

            this._props.push(new Property(ARTProperties.DATA_SOURCE_CLASS, this.dataSourceClass))
            this._props.push(new Property(ARTProperties.TRANSACTION_TYPE, this.transactionType))
            this._props.push(new Property(ARTProperties.DATABASE_NAME, this.databaseName))
            this._props.push(new Property(ARTProperties.SERVER_NAME, this.server))
            this._props.push(new Property(ARTProperties.USER, this.user))
            this._props.push(new Property(ARTProperties.PASSWORD, this.password))
            this._props.push(new Property(ARTProperties.NETWORK_PROTOCOL, this.networkProtocol))
            this._props.push(new Property(ARTProperties.OTHER_PROPERTIES, this.otherProperties))

            this._props.push(new Property(ARTProperties.CONNECTION_MANAGER_SETTINGS + '.' + ARTProperties.ENABLE_CONNECTION_POOLING,  this.enableConnectionPooling))
            this._props.push(new Property(ARTProperties.CONNECTION_MANAGER_SETTINGS + '.' + ARTProperties.MIN_CONNS, this.minConns))
            this._props.push(new Property(ARTProperties.CONNECTION_MANAGER_SETTINGS + '.' + ARTProperties.MAX_CONNS,  this.maxConns))
            this._props.push(new Property(ARTProperties.CONNECTION_MANAGER_SETTINGS + '.' + ARTProperties.HEARTBEAT_INTERVAL, this.heartbeat))
        }

        return this._props
    }
}

import {Property} from './properties';

export class WmCloudProperties {

    public static PREFIX_SETTINGS = 'wmcloudsettings'
    public static PREFIX_ACCOUNT = 'wmcloudaccount.'

    public static ACCOUNT_STAGE = 'stage'

    public static SETTINGS_URL = 'wmcloudsettings.default.iLiveURL'
    public static SETTINGS_USER = 'username'
    public static SETTINGS_PASSWORD = 'password'

    public name: string
    public url: string
    public user: string
    public password: string

    public stage: string

    private _props: Property[]

    public static make(properties: Property[]): Map<string, WmCloudProperties> {

        let out: Map<string, WmCloudProperties> = new Map<string, WmCloudProperties>()

        properties.forEach((kv) => {

            if (kv.key.startsWith(WmCloudProperties.PREFIX_SETTINGS)) {

                let alias: string = kv.key.substring(WmCloudProperties.PREFIX_SETTINGS.length, kv.key.lastIndexOf('.'))
                let conn = WmCloudProperties.getConn(alias, out)
                let key: string = kv.key.substr(kv.key.lastIndexOf('.')+1)

                if (key == WmCloudProperties.SETTINGS_URL) {
                    conn.url = kv.value
                } else if (key == WmCloudProperties.SETTINGS_USER) {
                    conn.user = kv.value
                } else if (key == WmCloudProperties.SETTINGS_PASSWORD) {
                    conn.password = kv.value
                }
            } else if (kv.key.startsWith(WmCloudProperties.PREFIX_ACCOUNT)) {

                let alias: string = kv.key.substring(WmCloudProperties.PREFIX_SETTINGS.length, kv.key.lastIndexOf('.'))
                let conn = WmCloudProperties.getConn(alias, out)
                let key: string = kv.key.substr(kv.key.lastIndexOf('.')+1)

                if (key == WmCloudProperties.ACCOUNT_STAGE) {
                    conn.stage = kv.value
                }
            }
        })

        return out
    }

    public toProperties(includeEmptyValues?: boolean): Property[] {

        if (!this._props || this._props.length == 0) {

            this._props = []

            if (includeEmptyValues || this.url) {
                this._props.push(new Property(WmCloudProperties.SETTINGS_URL, this.url))
            }

            if (includeEmptyValues || this.user) {
                this._props.push(new Property(WmCloudProperties.SETTINGS_USER, this.user))
            }

            if (includeEmptyValues || this.password) {
                this._props.push(new Property(WmCloudProperties.SETTINGS_PASSWORD, this.password))
            }

            if (includeEmptyValues || this.stage) {
                this._props.push(new Property(WmCloudProperties.ACCOUNT_STAGE, this.stage))
            }
        }

        return this._props
    }

    public static getConn(alias: string, out: Map<string, WmCloudProperties>): WmCloudProperties {

        let conn: WmCloudProperties = out.get(alias)

        if (!conn) {
            conn = new WmCloudProperties()
            conn.name = alias
            out.set(alias, conn)
        }

        return conn
    }
}


export enum PropertyValueType {
    constant,
    environment,
    secret
}

export class Property {

    public static ENV = "$env{"
    public static SECRET = "$secret{"

    key: string
    description: string

    type: PropertyValueType = PropertyValueType.constant
    public value: string

    public constructor(key: string, value: string, description?: string) {

        this.key = key
        this.description = description

        if (value) {
            if (value.startsWith(Property.SECRET)) {
                this.value = value.substring(Property.SECRET.length, value.length-1)
                this.type = PropertyValueType.secret
            } else if (value.startsWith(Property.ENV)) {
                this.value = value.substring(Property.ENV.length, value.length-1)
                this.type = PropertyValueType.environment
            } else {
                this.value = value
                this.type = PropertyValueType.constant
            }
        }
    }

    public displayName(prefix: string): string {

        if (this.key && prefix && typeof this.key == 'string' && this.key.startsWith(prefix)) {
            return this.key.substring(prefix.length)
        } else {
            return this.key
        }
    }

    public keyValuePair(prefix?: string): Property {

        if (prefix && this.key && !this.key.startsWith(prefix)) {
            return Property.makeSimple(prefix + this.key, this.valueWithType())
        } else {
            return Property.makeSimple(this.key, this.valueWithType())
        }
    }

    public static makes(data: any[]): Property[] {

        const out: Property[] = []

        data.forEach((x) => {
            out.push(Property.make(x))
        })

        return out
    }

    public static make(data: any, description?: string): Property {

        return new Property(data.key, data.value, description || data.description)
    }

    public static makeSimple(key: string, value: string): Property {

        let p = new Property(key, value)
        p.value = value
        p.type = PropertyValueType.constant

        return p
    }

    public valueWithType(includeType?: boolean): string {

        if (this.type == PropertyValueType.environment) {
            return Property.ENV + this.value + "}"
        } else if (this.type == PropertyValueType.secret) {
            return Property.SECRET + this.value + "}"
        } else {
            return this.value
        }
    }
}
